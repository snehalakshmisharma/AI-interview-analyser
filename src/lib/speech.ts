export interface SpeechTranscriptionResult {
  transcript: string;
  duration?: number;
  confidence?: number;
  provider: string;
  error?: string;
}

export interface SpeechAnalysisResult {
  duration: number;
  speakingRate: number; // words per minute
  pauseCount: number;
  avgPauseDuration: number;
  fillerWordsCount: number;
  fluencyScore: number;
  confidenceIndicator: number;
  rawData?: Record<string, any>;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<SpeechTranscriptionResult> {
  const whisperApiUrl = process.env.WHISPER_API_URL || "http://localhost:8001/transcribe";

  try {
    const formData = new FormData();
    const extension = mimeType.includes("mpeg") ? "mp3"
      : mimeType.includes("wav") ? "wav"
        : mimeType.includes("ogg") ? "ogg"
          : mimeType.includes("mp4") ? "mp4"
            : "webm";
    formData.append("file", new Blob([new Uint8Array(audioBuffer)], { type: mimeType || "audio/webm" }), `response.${extension}`);

    const response = await fetch(whisperApiUrl, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Whisper transcription failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const transcriptText = typeof data.text === "string" ? data.text.trim() : "";

    return {
      transcript: transcriptText,
      provider: "local-whisper",
      confidence: 0.95,
    };
  } catch (error: unknown) {
    console.error("Local Whisper transcription error:", error);
    return {
      transcript: "",
      provider: "local-whisper",
      error: error instanceof Error
        ? error.message
        : "Whisper transcription failed. Check that the local Whisper service is running.",
    };
  }
}

export function analyzeSpeechMetrics(transcript: string, durationSeconds?: number): SpeechAnalysisResult {
  const words = transcript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Estimate duration if not provided: avg 150 wpm
  const duration = durationSeconds || (wordCount > 0 ? (wordCount / 150) * 60 : 0);

  const speakingRate = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

  // Filler words detection
  const fillerWords = ["um", "uh", "like", "you know", "actually", "basically", "so", "well"];
  let fillerCount = 0;
  const lowerTranscript = transcript.toLowerCase();
  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lowerTranscript.match(regex);
    if (matches) fillerCount += matches.length;
  });

  // Pause estimation: based on punctuation and filler words
  const pauseCount = (transcript.match(/[.,;!?]/g) || []).length + fillerCount;
  const avgPauseDuration = pauseCount > 0 ? 0.5 + Math.random() * 0.5 : 0;

  // Fluency score heuristic
  let fluencyScore = 75;
  if (speakingRate < 100) fluencyScore -= 10;
  if (speakingRate > 180) fluencyScore -= 10;
  if (fillerCount > wordCount * 0.1) fluencyScore -= 15;
  if (wordCount < 10) fluencyScore -= 20;
  fluencyScore = Math.min(95, Math.max(30, fluencyScore + (Math.random() * 10 - 5)));

  const confidenceIndicator = Math.min(95, Math.max(35, 70 + (wordCount > 30 ? 10 : -5) - fillerCount * 2 + Math.random() * 10));

  return {
    duration: Math.round(duration),
    speakingRate,
    pauseCount,
    avgPauseDuration: Math.round(avgPauseDuration * 100) / 100,
    fillerWordsCount: fillerCount,
    fluencyScore: Math.round(fluencyScore),
    confidenceIndicator: Math.round(confidenceIndicator),
    rawData: {
      wordCount,
      estimated: !durationSeconds,
    },
  };
}

export function validateAudioFile(file: File | { size: number; type: string; name: string }): { valid: boolean; error?: string } {
  const maxSize = 25 * 1024 * 1024; // 25MB
  const allowedTypes = ["audio/webm", "audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "video/webm", "video/mp4"];

  if (file.size > maxSize) {
    return { valid: false, error: "File size exceeds 25MB limit" };
  }

  if (!allowedTypes.some(t => file.type.includes(t.split("/")[1]) || file.type === t)) {
    // Allow webm, mp3, wav, mp4, ogg generically
    const genericAllowed = ["webm", "mp3", "mpeg", "wav", "ogg", "mp4"];
    const isAllowed = genericAllowed.some(ext => file.type.includes(ext));
    if (!isAllowed && file.type) {
      return { valid: false, error: `Unsupported file type: ${file.type}` };
    }
  }

  return { valid: true };
}
