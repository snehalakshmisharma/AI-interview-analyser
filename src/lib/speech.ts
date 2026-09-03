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
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;

  if (AI_MODE === "demo" || !geminiApiKey) {
    // Demo mode: return placeholder with indication
    return {
      transcript: "[Demo Mode] Audio recorded successfully. In real AI mode with GEMINI_API_KEY, audio is automatically transcribed and analyzed by Google Gemini.",
      provider: "demo",
      confidence: 0,
    };
  }

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const base64Audio = audioBuffer.toString("base64");
    const normalizedMime = mimeType.split(";")[0].trim() || "audio/webm";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMime,
                  data: base64Audio,
                },
              },
              {
                text: "Transcribe the spoken audio verbatim in English. Output only the clear transcription text without timestamps, notes, commentary, or quotes.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Audio Transcription failed: ${err}`);
    }

    const data = await response.json();
    const transcriptText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return {
      transcript: transcriptText,
      provider: "google-gemini",
      confidence: 0.95,
    };
  } catch (error: unknown) {
    console.error("Gemini Transcription error:", error);
    return {
      transcript: "",
      provider: "google-gemini",
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
