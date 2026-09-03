"use client";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Brain, Clock, Target, Mic, Video, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    type: "TECHNICAL",
    category: "CS",
    difficulty: "INTERMEDIATE",
    mode: "TEXT",
    totalQuestions: "5",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setUser(d.user);
      else window.location.href = "/login";
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create interview");
      router.push(`/interview/${data.interview.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar user={user} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Setup Your Interview</h1>
          <p className="text-slate-600 mt-1">Configure your practice session for optimal preparation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Interview Configuration
            </CardTitle>
            <CardDescription>Choose your interview type, difficulty, and mode</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Select label="Interview Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="HR">HR Interview</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="BEHAVIORAL">Behavioral</option>
                  <option value="MIXED">Mixed (All Types)</option>
                </Select>

                <Select label="Difficulty" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </Select>

                <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="GENERAL">General Placement</option>
                  <option value="CS">Computer Science</option>
                  <option value="DATA_SCIENCE_AI">Data Science / AI</option>
                  <option value="SOFTWARE_DEV">Software Development</option>
                  <option value="HR">HR</option>
                  <option value="BEHAVIORAL">Behavioral</option>
                  <option value="CUSTOM">Custom / Mixed</option>
                </Select>

                <Select label="Number of Questions" value={form.totalQuestions} onChange={e => setForm({ ...form, totalQuestions: e.target.value })}>
                  <option value="5">5 Questions (Quick Practice)</option>
                  <option value="10">10 Questions (Standard)</option>
                  <option value="15">15 Questions (Intensive)</option>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">Response Mode</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "TEXT", label: "Text", desc: "Type your answers", icon: FileText, priority: "Priority 1 - Recommended" },
                    { value: "AUDIO", label: "Audio", desc: "Record voice answers", icon: Mic, priority: "Priority 2" },
                    { value: "VIDEO", label: "Video", desc: "Record video answers", icon: Video, priority: "Priority 3" },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setForm({ ...form, mode: mode.value })}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        form.mode === mode.value ? "border-[#1A365D] bg-[#1A365D]/5" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${form.mode === mode.value ? "bg-[#1A365D] text-white" : "bg-slate-100 text-slate-600"}`}>
                          <mode.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{mode.label}</span>
                      </div>
                      <p className="text-xs text-slate-600">{mode.desc}</p>
                      <p className="text-[10px] text-slate-500 mt-2">{mode.priority}</p>
                      {form.mode === mode.value && (
                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#1A365D]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Text mode: Type answers, get instant AI evaluation across 9 dimensions</li>
                  <li>Audio mode: Record voice, speech-to-text converts to transcript for analysis</li>
                  <li>Video mode: Camera + mic recording (transcript-based analysis, no fake emotion detection)</li>
                  <li>Each question includes expected concepts for question-aware evaluation</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                <Brain className="mr-2 h-4 w-4" />
                Start Interview ({form.totalQuestions} Questions)
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-900 mb-1">Estimated Time</p>
                <p>{parseInt(form.totalQuestions) * 2}-{parseInt(form.totalQuestions) * 3} minutes depending on response mode and depth. You can take breaks between questions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
