import asyncio
import io
import json
import os
import re
import threading
import wave
from contextlib import asynccontextmanager
from functools import lru_cache

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from faster_whisper import WhisperModel

SAMPLE_WIDTH = 2
WINDOW_SECONDS = 6
WINDOW_STEP_SECONDS = 4
MAX_BUFFER_SECONDS = 8
MAX_FRAME_BYTES = 64 * 1024
MAX_CAPTION_CHARACTERS = 20_000
MODEL_LOCK = threading.Lock()


@lru_cache(maxsize=1)
def get_model() -> WhisperModel:
    return WhisperModel(
        os.getenv("WHISPER_MODEL", "base"),
        device=os.getenv("WHISPER_DEVICE", "cpu"),
        compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"),
        download_root=os.getenv("WHISPER_DOWNLOAD_ROOT", "/models"),
    )


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_model()
    yield


app = FastAPI(lifespan=lifespan)


def _transcribe_pcm(audio: bytes, sample_rate: int) -> str:
    wav_file = io.BytesIO()
    with wave.open(wav_file, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(SAMPLE_WIDTH)
        wav.setframerate(sample_rate)
        wav.writeframes(audio)

    wav_file.seek(0)
    with MODEL_LOCK:
        segments, _ = get_model().transcribe(wav_file, vad_filter=True)
        return " ".join(segment.text.strip() for segment in segments).strip()


def _merge_caption(previous: str, current: str) -> str:
    previous_words = previous.split()
    current_words = current.split()
    max_overlap = min(len(previous_words), len(current_words))

    for overlap in range(max_overlap, 0, -1):
        previous_suffix = [re.sub(r"\W", "", word).casefold() for word in previous_words[-overlap:]]
        current_prefix = [re.sub(r"\W", "", word).casefold() for word in current_words[:overlap]]
        if previous_suffix == current_prefix:
            return " ".join(previous_words + current_words[overlap:])

    return " ".join(previous_words + current_words)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/transcribe")
def transcribe(file: UploadFile = File(...)) -> dict[str, str]:
    try:
        with MODEL_LOCK:
            segments, _ = get_model().transcribe(file.file, vad_filter=True)
            text = " ".join(segment.text.strip() for segment in segments).strip()
        return {"text": text}
    except Exception as error:
        raise HTTPException(status_code=500, detail="Audio transcription failed") from error
    finally:
        file.file.close()


@app.websocket("/live")
async def live_transcribe(websocket: WebSocket) -> None:
    allowed_origins = {
        origin.strip()
        for origin in os.getenv(
            "WHISPER_WS_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    }
    origin = websocket.headers.get("origin")
    if origin not in allowed_origins:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    sample_rate: int | None = None
    audio_buffer = bytearray()
    transcript = ""
    window_bytes = 0
    step_bytes = 0

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            if message.get("text") is not None:
                command = json.loads(message["text"])
                if command.get("type") == "stop":
                    await websocket.send_json({"type": "stopped"})
                    await websocket.close(code=1000)
                    break
                if command.get("type") != "start" or sample_rate is not None:
                    await websocket.close(code=1003)
                    break

                requested_rate = command.get("sampleRate")
                if not isinstance(requested_rate, int) or not 16000 <= requested_rate <= 96000:
                    await websocket.close(code=1008)
                    break

                sample_rate = requested_rate
                window_bytes = sample_rate * SAMPLE_WIDTH * WINDOW_SECONDS
                step_bytes = sample_rate * SAMPLE_WIDTH * WINDOW_STEP_SECONDS
                continue

            frame = message.get("bytes")
            if frame is None or sample_rate is None or len(frame) > MAX_FRAME_BYTES or len(frame) % SAMPLE_WIDTH:
                await websocket.close(code=1003)
                break

            audio_buffer.extend(frame)
            max_buffer_bytes = sample_rate * SAMPLE_WIDTH * MAX_BUFFER_SECONDS
            if len(audio_buffer) > max_buffer_bytes:
                del audio_buffer[:len(audio_buffer) - max_buffer_bytes]
                if len(audio_buffer) % SAMPLE_WIDTH:
                    del audio_buffer[0]

            while len(audio_buffer) >= window_bytes:
                audio_window = bytes(audio_buffer[:window_bytes])
                text = await asyncio.to_thread(_transcribe_pcm, audio_window, sample_rate)
                transcript = _merge_caption(transcript, text)[-MAX_CAPTION_CHARACTERS:]
                await websocket.send_json({"type": "caption", "text": transcript})
                del audio_buffer[:step_bytes]
    except WebSocketDisconnect:
        pass
    except (OSError, RuntimeError, ValueError, wave.Error):
        await websocket.send_json({"type": "error", "message": "Live transcription failed"})
        await websocket.close(code=1011)