import asyncio
import json
import unittest
import wave
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import WebSocketDisconnect

from app import MAX_FRAME_BYTES, _merge_caption, _transcribe_pcm, live_transcribe


class FakeWebSocket:
    def __init__(self, messages: list[dict[str, object]], origin: str = "http://localhost:3000"):
        self.headers = {"origin": origin}
        self.messages = iter(messages)
        self.sent: list[dict[str, object]] = []
        self.accepted = False
        self.close_code: int | None = None

    async def accept(self) -> None:
        self.accepted = True

    async def receive(self) -> dict[str, object]:
        try:
            return next(self.messages)
        except StopIteration:
            raise WebSocketDisconnect(code=1000)

    async def send_json(self, message: dict[str, object]) -> None:
        self.sent.append(message)

    async def close(self, code: int) -> None:
        self.close_code = code


class SpeechServiceTests(unittest.TestCase):
    def test_pcm_window_is_wrapped_as_mono_wav(self) -> None:
        class FakeModel:
            def transcribe(self, source, vad_filter: bool):
                with wave.open(source, "rb") as wav:
                    self.parameters = (wav.getnchannels(), wav.getsampwidth(), wav.getframerate())
                    self.frames = wav.readframes(wav.getnframes())
                return iter([SimpleNamespace(text="local"), SimpleNamespace(text="speech")]), None

        model = FakeModel()
        with patch("app.get_model", return_value=model):
            result = _transcribe_pcm(b"\x00\x00" * 8, 16000)

        self.assertEqual(result, "local speech")
        self.assertEqual(model.parameters, (1, 2, 16000))
        self.assertEqual(model.frames, b"\x00\x00" * 8)

    def test_caption_merge_removes_overlapping_window_words(self) -> None:
        self.assertEqual(
            _merge_caption("A quick brown fox", "brown fox jumps."),
            "A quick brown fox jumps.",
        )

    def test_live_endpoint_rejects_unapproved_origin(self) -> None:
        websocket = FakeWebSocket([], origin="https://example.com")
        asyncio.run(live_transcribe(websocket))

        self.assertFalse(websocket.accepted)
        self.assertEqual(websocket.close_code, 1008)

    def test_live_endpoint_rejects_oversized_audio_frame(self) -> None:
        websocket = FakeWebSocket([
            {"text": json.dumps({"type": "start", "sampleRate": 16000})},
            {"bytes": b"\x00\x00" * (MAX_FRAME_BYTES // 2 + 1)},
        ])
        asyncio.run(live_transcribe(websocket))

        self.assertEqual(websocket.close_code, 1003)

    def test_live_endpoint_transcribes_bounded_pcm_windows(self) -> None:
        websocket = FakeWebSocket([
            {"text": json.dumps({"type": "start", "sampleRate": 16000})},
            {"bytes": b"\x00\x00" * (MAX_FRAME_BYTES // 2)},
            {"bytes": b"\x00\x00" * (MAX_FRAME_BYTES // 2)},
            {"bytes": b"\x00\x00" * (MAX_FRAME_BYTES // 2)},
            {"text": json.dumps({"type": "stop"})},
        ])
        with patch("app.asyncio.to_thread", new=AsyncMock(return_value="hello there")) as transcribe_window:
            asyncio.run(live_transcribe(websocket))

        transcribe_window.assert_awaited_once()
        self.assertIn({"type": "caption", "text": "hello there"}, websocket.sent)
        self.assertEqual(websocket.close_code, 1000)


if __name__ == "__main__":
    unittest.main()