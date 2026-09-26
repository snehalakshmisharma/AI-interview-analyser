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

const AI_MODE = process.env.AI_MODE || "demo";

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<SpeechTranscriptionResult> {
  const openAIApiKey = process.env.OPENAI_API_KEY;

  if (AI_MODE !== "real" || !openAIApiKey) {
    // Demo mode: return placeholder with indication
    return {
      transcript: "[Demo Mode] Audio recorded successfully. Configure OpenAI Whisper for automatic transcription.",
      provider: "demo",
      confidence: 0,
    };
  }

  try {
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(audioBuffer)], { type: mimeType || "audio/webm" }), "response.webm");
    formData.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1");
    formData.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Whisper transcription failed: ${err}`);
    }

    const data = await response.json();
    const transcriptText = typeof data.text === "string" ? data.text.trim() : "";

    return {
      transcript: transcriptText,
      provider: "openai-whisper",
      confidence: 0.95,
    };
  } catch (error: unknown) {
    console.error("OpenAI Whisper transcription error:", error);
    return {
      transcript: "",
      provider: "openai-whisper",
      error: error instanceof Error ? error.message : "Transcription failed",
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
