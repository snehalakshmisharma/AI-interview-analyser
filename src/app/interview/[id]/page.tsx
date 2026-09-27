"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MediaTranscriptPanel } from "@/components/interview/media-transcript-panel";
import { 
  Brain, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  Bot,
  Trash2
} from "lucide-react";

interface QuestionData {
  id: string;
  sequence: number;
  question: {
    id: string;
    questionText: string;
    category: string;
    difficulty: string;
    expectedConcepts: string[];
    timeLimit: number;
  };
}

interface InstantFeedback {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  explanation: string;
  strengths: string[];
  improvementAreas: string[];
}

export default function LiveInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [interview, setInterview] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [interimText, setInterimText] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(120);

  // Live Speech-to-Text & AI Voice states
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const committedTextRef = useRef("");

  const [speechSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  // Instant Feedback State
  const [turnFeedback, setTurnFeedback] = useState<InstantFeedback | null>(null);

  // Video & Audio Stream states
  const [cameraActive, setCameraActive] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedTranscript, setRecordedTranscript] = useState("");
  const [recordedTranscriptStatus, setRecordedTranscriptStatus] = useState("READY");

  const transcribeRecording = async (blob: Blob) => {
    setRecordedTranscript("");
    setRecordedTranscriptStatus("TRANSCRIBING");
    const formData = new FormData();
    formData.append("file", blob, "response.webm");

    try {
      const response = await fetch("/api/transcribe", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Transcription failed");
      setRecordedTranscript(result.error || result.transcript || "");
      setRecordedTranscriptStatus(result.error ? "UNAVAILABLE" : result.transcript?.trim() ? "READY" : "NO_SPEECH");
    } catch (error) {
      setRecordedTranscript(error instanceof Error ? error.message : "Transcription failed.");
      setRecordedTranscriptStatus("UNAVAILABLE");
    }
  };

  // Text-to-Speech function for AI Interviewer Voice
  const speakAIText = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);
    utterance.onerror = () => setAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Load Interview Data
  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.user) setUser(meData.user);
        else { window.location.href = "/login"; return; }

        const res = await fetch(`/api/interviews/${interviewId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || `Unable to load interview (HTTP ${res.status})`);
        if (!data?.interview || !Array.isArray(data.questions)) throw new Error("Interview data is incomplete");
        setInterview(data.interview);
        setQuestions(data.questions);
        const initialLimit = data.questions[0]?.question.timeLimit || 120;
        setTimer(initialLimit);

        // Speak first question
        if (data.questions[0]?.question?.questionText) {
          setTimeout(() => {
            speakAIText(`Question 1: ${data.questions[0].question.questionText}`);
          }, 800);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load interview");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [interviewId, speakAIText]);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Web Speech Recognition (Accurate Real-time Speech-to-Text streaming)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentInterim = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              const cleaned = transcript.trim();
              if (cleaned) {
                const prefix = committedTextRef.current && !committedTextRef.current.endsWith(" ") ? " " : "";
                committedTextRef.current += prefix + cleaned;
                setTextAnswer(committedTextRef.current);
              }
            } else {
              currentInterim += transcript;
            }
          }

          setInterimText(currentInterim);
        };

        recognition.onerror = (event: any) => {
          if (event.error === "no-speech") {
            // Normal pause in speech, keep listening if user intended
            return;
          }
          console.warn("Speech recognition notice:", event.error);
        };

        recognition.onend = () => {
          // Auto-restart if user has not clicked stop (handles browser silence timeouts)
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
              isListeningRef.current = false;
            }
          } else {
            setIsListening(false);
            setInterimText("");
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Start / Stop Live Speech Recognition & Audio Recorder
  const startListening = async () => {
    setError("");
    isListeningRef.current = true;
    setIsListening(true);

    if (interview?.mode !== "TEXT") {
      setRecordedAudioBlob(null);
      setRecordedTranscript("");
      setRecordedTranscriptStatus("READY");
      try {
        let recordingStream = streamRef.current;
        if (interview?.mode === "AUDIO") {
          recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (!recordingStream) throw new Error("Turn on your camera before recording video");

        audioChunksRef.current = [];
        const recorder = new MediaRecorder(recordingStream);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          const mediaType = recorder.mimeType || (interview?.mode === "VIDEO" ? "video/webm" : "audio/webm");
          const recording = new Blob(audioChunksRef.current, { type: mediaType });
          setRecordedAudioBlob(recording);
          void transcribeRecording(recording);
          if (interview?.mode === "AUDIO") recordingStream?.getTracks().forEach(track => track.stop());
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch (recordError) {
        isListeningRef.current = false;
        setIsListening(false);
        setError(recordError instanceof Error ? recordError.message : "Unable to start recording");
      }
      return;
    }

    committedTextRef.current = textAnswer;

    // Start Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start notice:", err);
      }
    }

  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText("");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Video Camera Handling
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      console.warn("Camera access denied");
    }
  };

  useEffect(() => {
    if (interview?.mode === "VIDEO") {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
          setCameraActive(true);
        })
        .catch(() => {
          console.warn("Camera access denied");
        });
    }
    return () => {
      stopCamera();
    };
  }, [interview?.mode]);

  const currentQuestion = questions[currentIdx];
  const progress = questions.length ? ((currentIdx + 1) / questions.length) * 100 : 0;

  // Submit response & receive instant live turn feedback
  const handleLiveSubmit = async () => {
    if (!currentQuestion) return;
    const isMediaResponse = interview?.mode === "AUDIO" || interview?.mode === "VIDEO";
    const finalAnswer = (textAnswer + (interimText ? " " + interimText : "")).trim();

    if (isListening) {
      setError("Stop the recording before submitting your response.");
      return;
    }
    if (isMediaResponse && !recordedAudioBlob) {
      setError("Record your answer before submitting.");
      return;
    }
    if (!isMediaResponse && !finalAnswer) {
      setError("Please type or dictate your answer before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let requestBody: BodyInit;
      const headers: HeadersInit = {};
      if (isMediaResponse && recordedAudioBlob) {
        const formData = new FormData();
        formData.append("interviewQuestionId", currentQuestion.id);
        formData.append("responseType", interview.mode);
        formData.append("duration", String(Math.max(1, currentQuestion.question.timeLimit - timer)));
        formData.append("file", recordedAudioBlob, "response.webm");
        requestBody = formData;
      } else {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify({
          interviewQuestionId: currentQuestion.id,
          responseType: "TEXT",
          textContent: finalAnswer,
          duration: Math.max(5, currentQuestion.question.timeLimit - timer),
        });
      }

      const res = await fetch(`/api/interviews/${interviewId}/responses`, {
        method: "POST",
        headers,
        body: requestBody,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze response");

      setResponses(prev => ({ ...prev, [currentQuestion.id]: data }));

      // Extract evaluation data for immediate feedback
      const evalData = data.evaluation;
      if (evalData) {
        const feedbackObj: InstantFeedback = {
          overallScore: evalData.overallScore,
          technicalScore: evalData.technicalScore,
          communicationScore: evalData.communicationScore,
          explanation: evalData.explanation || "Response evaluated.",
          strengths: Array.isArray(evalData.strengths) ? evalData.strengths : [],
          improvementAreas: Array.isArray(evalData.improvementAreas) ? evalData.improvementAreas : [],
        };
        setTurnFeedback(feedbackObj);

        // Speak instant feedback summary aloud
        const speakText = `Your response score is ${evalData.overallScore} out of 100. ${evalData.explanation}`;
        speakAIText(speakText);
      } else {
        advanceToNextQuestion();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Move to next question or complete interview
  const advanceToNextQuestion = async () => {
    setTurnFeedback(null);
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setTextAnswer("");
      setInterimText("");
      committedTextRef.current = "";
      setRecordedAudioBlob(null);
      setRecordedTranscript("");
      setRecordedTranscriptStatus("READY");
      setTimer(questions[nextIdx]?.question.timeLimit ?? 120);

      // Read next question aloud
      const nextQText = questions[nextIdx]?.question.questionText;
      if (nextQText) {
        setTimeout(() => {
          speakAIText(`Question ${nextIdx + 1}: ${nextQText}`);
        }, 500);
      }
    } else {
      // Final question completed -> Finalize interview
      await fetch(`/api/interviews/${interviewId}/complete`, { method: "POST" });
      router.push(`/interview/${interviewId}/report`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1A365D] border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-slate-600">Connecting to Live AI Interviewer...</p>
        </div>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Failed to load interview</h3>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-[#1A365D] text-white">Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Status & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1A365D] text-white flex items-center justify-center">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Live AI Interview</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-emerald-700 font-medium">Session Active</span>
              </div>
              <p className="text-xs text-slate-500">
                {interview?.type} • {interview?.category?.replace(/_/g, " ")} • {interview?.mode} Mode
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Voice Toggle */}
            <button
              onClick={() => {
                if (voiceEnabled && typeof window !== "undefined") window.speechSynthesis?.cancel();
                setVoiceEnabled(!voiceEnabled);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                voiceEnabled ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4" />}
              AI Voice: {voiceEnabled ? "On" : "Muted"}
            </button>

            {/* Timer */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span className={timer < 30 ? "text-red-600" : "text-slate-800"}>{formatTime(timer)}</span>
            </div>

            {/* Progress Count */}
            <Badge variant="info" className="text-xs">
              Q{currentIdx + 1} of {questions.length}
            </Badge>
          </div>
        </div>

        {/* Question Progress Line */}
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-[#1A365D] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {currentQuestion && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: AI Interviewer Avatar & Live Question */}
            <div className="lg:col-span-6 space-y-6">
              {/* AI Interviewer Persona Card */}
              <Card className="overflow-hidden border-slate-200/90 shadow-sm">
                <div className="bg-gradient-to-r from-slate-900 via-[#1A365D] to-slate-900 p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`relative h-12 w-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center ${aiSpeaking ? "ring-2 ring-emerald-400 animate-pulse" : ""}`}>
                      <Bot className="h-7 w-7 text-white" />
                      {aiSpeaking && (
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-ping"></span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">AI Placement Interviewer</h3>
                      <p className="text-xs text-slate-300">
                        {aiSpeaking ? "Speaking question & feedback aloud..." : "Listening attentively"}
                      </p>
                    </div>
                  </div>

                  {aiSpeaking ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1 bg-emerald-400 wave-bar rounded-full"></span>
                      <span className="w-1 bg-emerald-400 wave-bar rounded-full" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-1 bg-emerald-400 wave-bar rounded-full" style={{ animationDelay: "0.4s" }}></span>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => speakAIText(currentQuestion.question.questionText)}
                      className="text-white hover:bg-white/10 text-xs gap-1.5"
                    >
                      <Volume2 className="h-3.5 w-3.5" /> Replay Question
                    </Button>
                  )}
                </div>

                <CardContent className="p-6 space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                      Question {currentIdx + 1}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-2 leading-relaxed">
                      {currentQuestion.question.questionText}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Expected Subject Concepts:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentQuestion.question.expectedConcepts.map((concept, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Video Camera Preview (If Video Mode) */}
              {interview?.mode === "VIDEO" && (
                <Card className="p-4 border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-blue-600" /> Candidate Camera Preview
                    </span>
                    {cameraActive ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Stream
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={startCamera} className="text-xs">
                        Turn On Camera
                      </Button>
                    )}
                  </div>
                  <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center">
                    <video ref={videoPreviewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                    {!cameraActive && (
                      <div className="text-center text-slate-400 p-4">
                        <VideoOff className="h-8 w-8 mx-auto mb-2 opacity-60" />
                        <p className="text-xs">Camera stream will appear here</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Live Speech/Text Response & Turn-by-turn Feedback */}
            <div className="lg:col-span-6 space-y-6">
              {/* If Instant Feedback is visible, show Turn Review */}
              {turnFeedback ? (
                <Card className="border-emerald-300 bg-emerald-50/30 p-6 space-y-6 shadow-md animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-4">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <span>Instant AI Evaluation</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900">{turnFeedback.overallScore}</span>
                      <span className="text-xs text-slate-500 font-medium">/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-xs text-slate-500 block">Technical Score</span>
                      <span className="text-lg font-bold text-blue-700">{turnFeedback.technicalScore}%</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-xs text-slate-500 block">Communication</span>
                      <span className="text-lg font-bold text-emerald-700">{turnFeedback.communicationScore}%</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">AI Feedback Summary:</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{turnFeedback.explanation}</p>
                  </div>

                  {(interview?.mode === "AUDIO" || interview?.mode === "VIDEO") && responses[currentQuestion.id]?.response && (
                    <MediaTranscriptPanel
                      status={responses[currentQuestion.id].response.transcriptStatus}
                      transcript={responses[currentQuestion.id].response.transcriptText}
                      onRerecord={() => {
                        setTurnFeedback(null);
                        setRecordedAudioBlob(null);
                        audioChunksRef.current = [];
                      }}
                    />
                  )}

                  <Button onClick={advanceToNextQuestion} className="w-full bg-[#1A365D] hover:bg-[#122742] text-white py-3.5 font-semibold text-base shadow-sm">
                    {currentIdx === questions.length - 1 ? (
                      <>View Complete Interview Report <ArrowRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Proceed to Next Question <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </Card>
              ) : (
                /* Live Interactive Response Input */
                <Card className="p-6 space-y-5 border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mic className="h-4 w-4 text-blue-600" /> Live Response
                    </CardTitle>

                    <div className="flex items-center gap-2">
                      {interview?.mode === "TEXT" && textAnswer && (
                        <button
                          onClick={() => {
                            setTextAnswer("");
                            setInterimText("");
                            committedTextRef.current = "";
                          }}
                          className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 px-2 py-1 rounded"
                          title="Clear text"
                        >
                          <Trash2 className="h-3 w-3" /> Clear
                        </button>
                      )}

                      {interview?.mode === "TEXT" && speechSupported && (
                        <Button
                          size="sm"
                          variant={isListening ? "danger" : "outline"}
                          onClick={toggleListening}
                          className={`text-xs gap-1.5 font-semibold ${isListening ? "animate-pulse" : ""}`}
                        >
                          {isListening ? (
                            <><MicOff className="h-3.5 w-3.5" /> Stop Speaking</>
                          ) : (
                            <><Mic className="h-3.5 w-3.5 text-emerald-600" /> Speak Answer (Live STT)</>
                          )}
                        </Button>
                      )}
                      {interview?.mode !== "TEXT" && (
                        <Button
                          size="sm"
                          variant={isListening ? "danger" : "outline"}
                          onClick={toggleListening}
                          disabled={interview?.mode === "VIDEO" && !cameraActive}
                          className={`text-xs gap-1.5 font-semibold ${isListening ? "animate-pulse" : ""}`}
                        >
                          {isListening
                            ? <><MicOff className="h-3.5 w-3.5" /> Stop Recording</>
                            : recordedAudioBlob
                              ? <><RotateCcw className="h-3.5 w-3.5" /> Re-record</>
                              : <><Mic className="h-3.5 w-3.5 text-emerald-600" /> Start Recording</>}
                        </Button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="flex gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {interview?.mode === "TEXT" ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Type your structured answer here, or use Speak Answer to dictate and edit it..."
                        value={textAnswer + (interimText ? (textAnswer ? " " : "") + interimText : "")}
                        onChange={(event) => {
                          setTextAnswer(event.target.value);
                          committedTextRef.current = event.target.value;
                          setInterimText("");
                        }}
                        className="min-h-[190px] text-sm leading-relaxed p-4"
                        rows={7}
                      />
                      <p className="text-xs text-slate-500">{textAnswer.split(/\s+/).filter(Boolean).length} words • {textAnswer.length} characters</p>
                    </div>
                  ) : recordedAudioBlob && !isListening ? (
                    <MediaTranscriptPanel
                      transcript={recordedTranscript}
                      status={recordedTranscriptStatus}
                      onRerecord={() => {
                        setRecordedAudioBlob(null);
                        setRecordedTranscript("");
                        setRecordedTranscriptStatus("READY");
                        audioChunksRef.current = [];
                      }}
                    />
                  ) : (
                    <div aria-live="polite" className="min-h-[190px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {isListening
                        ? "Recording in progress..."
                        : interview?.mode === "VIDEO" && !cameraActive
                          ? "Turn on the camera to record a video response."
                          : "Start recording. Your transcript will be generated automatically and cannot be edited."}
                    </div>
                  )}

                  {/* Submission Action */}
                  <div className="pt-2">
                    <Button 
                      onClick={handleLiveSubmit} 
                      disabled={submitting || isListening || (interview?.mode === "TEXT" ? (!textAnswer.trim() && !interimText.trim()) : !recordedAudioBlob)}
                      className="w-full bg-[#1A365D] hover:bg-[#122742] text-white py-3.5 text-base font-semibold shadow-sm"
                    >
                      {submitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          AI Evaluating Response...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Response & Get Instant AI Feedback
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Tips */}
              <Card className="p-5 border-slate-200/80 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">{interview?.mode === "TEXT" ? "Text Response" : "Recorded Response"}</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  {interview?.mode === "TEXT" ? (
                    <>
                      <li>Type your answer or dictate with the microphone control.</li>
                      <li>Text responses remain editable before and after submission.</li>
                    </>
                  ) : (
                    <>
                      <li>Record your answer, then submit it for automatic transcription.</li>
                      <li>Transcripts are read-only; re-record to replace the response.</li>
                    </>
                  )}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
