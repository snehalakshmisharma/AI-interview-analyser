"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Award, BookOpen, Target, CheckCircle, AlertCircle, Lightbulb, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function ReportPage() {
  const params = useParams();
  const interviewId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.user) setUser(meData.user);

        const res = await fetch(`/api/interviews/${interviewId}`);
        if (!res.ok) throw new Error("Failed to load report");
        const json = await res.json();
        setData(json);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1A365D] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-slate-600 mb-4">{error || "Report not found"}</p>
          <Link href="/dashboard">
            <Button className="bg-[#1A365D] text-white">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { interview, questions, responses, evaluations } = data;

  const avgScore = (key: string) => {
    if (!evaluations.length) return 0;
    const vals = evaluations.map((e: any) => e[key] || 0);
    return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
  };

  const dimensionData = [
    { dimension: "Technical", score: avgScore("technicalScore"), fullMark: 100 },
    { dimension: "Relevance", score: avgScore("relevanceScore"), fullMark: 100 },
    { dimension: "Communication", score: avgScore("communicationScore"), fullMark: 100 },
    { dimension: "Fluency", score: avgScore("fluencyScore"), fullMark: 100 },
    { dimension: "Grammar", score: avgScore("grammarScore"), fullMark: 100 },
    { dimension: "Vocabulary", score: avgScore("vocabularyScore"), fullMark: 100 },
    { dimension: "Problem Solving", score: avgScore("problemSolvingScore"), fullMark: 100 },
    { dimension: "Structure", score: avgScore("structureScore"), fullMark: 100 },
    { dimension: "Confidence", score: avgScore("confidenceScore"), fullMark: 100 },
  ];

  const barData = dimensionData.map(d => ({ name: d.dimension.slice(0, 8), score: d.score }));

  // Aggregate feedback
  const allStrengths = evaluations.flatMap((e: any) => e.strengths || []).slice(0, 5);
  const allImprovements = evaluations.flatMap((e: any) => e.improvementAreas || []).slice(0, 5);
  const allMissing = evaluations.flatMap((e: any) => e.missingConcepts || []).slice(0, 8);
  const allRecommendations = evaluations.flatMap((e: any) => e.recommendations || []).slice(0, 6);

  const finalOverallScore = interview.overallScore ?? avgScore("overallScore");

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Interview Performance Report</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="info">{interview.type}</Badge>
                <Badge variant="default">{interview.category.replace(/_/g, " ")}</Badge>
                <Badge variant="default">{interview.difficulty}</Badge>
                <Badge variant="default">{interview.mode} Mode</Badge>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(interview.createdAt).toLocaleDateString()} • {interview.totalQuestions} Questions
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Score</div>
                <div className="text-3xl font-black text-[#1A365D]">{finalOverallScore}</div>
              </div>
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md ${
                finalOverallScore >= 70 ? "bg-emerald-600" : finalOverallScore >= 50 ? "bg-amber-500" : "bg-red-500"
              }`}>
                {finalOverallScore}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Dimension Scores Card */}
            <Card className="p-6 sm:p-7">
              <CardHeader className="p-0 pb-6">
                <CardTitle>Dimension-wise Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {dimensionData.map((dim) => (
                    <div key={dim.dimension} className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-semibold text-slate-700">{dim.dimension}</span>
                        <span className={`font-bold ${
                          dim.score >= 70 ? "text-emerald-700" : dim.score >= 50 ? "text-blue-700" : dim.score >= 35 ? "text-amber-700" : "text-red-700"
                        }`}>{dim.score}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className={`h-full transition-all ${
                          dim.score >= 70 ? "bg-emerald-500" : dim.score >= 50 ? "bg-blue-600" : dim.score >= 35 ? "bg-amber-500" : "bg-red-500"
                        }`} style={{ width: `${dim.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 grid gap-6 sm:grid-cols-2">
                  <div className="h-[280px]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">Skill Radar</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dimensionData}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} />
                        <Radar dataKey="score" stroke="#1A365D" fill="#1A365D" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[280px]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">Score Breakdown</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#1A365D" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback Sections */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="p-6 border-emerald-200/90 bg-emerald-50/20">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-emerald-800 text-base">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2">
                    {allStrengths.length ? allStrengths.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs sm:text-sm text-slate-700">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    )) : <li className="text-xs text-slate-500">None recorded</li>}
                  </ul>
                </CardContent>
              </Card>

              <Card className="p-6 border-amber-200/90 bg-amber-50/20">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
                    <Target className="h-5 w-5 text-amber-600" />Improvement Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2">
                    {allImprovements.length ? allImprovements.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs sm:text-sm text-slate-700">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    )) : <li className="text-xs text-slate-500">None identified</li>}
                  </ul>
                </CardContent>
              </Card>

              <Card className="p-6 border-blue-200/90 bg-blue-50/20">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
                    <BookOpen className="h-5 w-5 text-blue-600" />Missing Concepts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-wrap gap-1.5">
                    {allMissing.length ? allMissing.map((m: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-lg bg-white border border-blue-200 px-2.5 py-1 text-xs text-blue-800 font-medium">
                        {m}
                      </span>
                    )) : <span className="text-xs text-slate-500">All core concepts addressed</span>}
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 border-indigo-200/90 bg-indigo-50/20">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-indigo-800 text-base">
                    <Lightbulb className="h-5 w-5 text-indigo-600" />Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2">
                    {allRecommendations.length ? allRecommendations.map((r: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs sm:text-sm text-slate-700">
                        <span className="text-indigo-500 font-bold">→</span>
                        <span>{r}</span>
                      </li>
                    )) : <li className="text-xs text-slate-500">Keep practicing!</li>}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Question-wise Breakdown */}
            <Card className="p-6 sm:p-7">
              <CardHeader className="p-0 pb-4">
                <CardTitle>Question-wise Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-5">
                {questions.map((q: any, idx: number) => {
                  const resp = responses.find((r: any) => r.interviewQuestionId === q.id);
                  const evalData = evaluations.find((e: any) => e.responseId === resp?.id);
                  return (
                    <div key={q.id} className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="bg-[#1A365D] text-white text-xs font-bold px-2 py-0.5 rounded">Q{idx + 1}</span>
                            <Badge variant={evalData ? (evalData.overallScore >= 70 ? "success" : evalData.overallScore >= 50 ? "warning" : "error") : "default"}>
                              {evalData ? `${evalData.overallScore}/100` : "Not answered"}
                            </Badge>
                          </div>
                          <p className="font-semibold text-sm text-slate-900">{q.question.questionText}</p>
                        </div>
                      </div>

                      {resp && (
                        <div className="space-y-2 text-xs">
                          <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                            <span className="font-bold text-slate-700 block mb-1">Your Submitted Response:</span>
                            <p className="text-slate-800 leading-relaxed">{resp.textContent || resp.transcriptText}</p>
                          </div>

                          {evalData && (
                            <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 space-y-1.5">
                              <span className="font-bold text-blue-900 block">AI Evaluation Note:</span>
                              <p className="text-slate-700 leading-relaxed">{evalData.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Summary Column */}
          <div className="space-y-6">
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-5 w-5 text-blue-600" /> Session Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                    <div className="text-xl font-bold text-[#1A365D]">{finalOverallScore}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Overall</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 border border-blue-200/80">
                    <div className="text-xl font-bold text-blue-700">{avgScore("technicalScore")}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Technical</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200/80">
                    <div className="text-xl font-bold text-emerald-700">{avgScore("communicationScore")}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Communication</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 border border-amber-200/80">
                    <div className="text-xl font-bold text-amber-700">{interview.placementReadiness || avgScore("overallScore")}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Readiness</div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Interview Track</span>
                    <span className="font-semibold text-slate-800">{interview.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category</span>
                    <span className="font-semibold text-slate-800">{interview.category.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Difficulty</span>
                    <span className="font-semibold text-slate-800">{interview.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Response Mode</span>
                    <span className="font-semibold text-slate-800">{interview.mode}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0 space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Next Actions</h4>
                <div className="space-y-2">
                  <Link href="/interview/setup" className="block">
                    <Button className="w-full bg-[#1A365D] hover:bg-[#122742] text-white" size="sm">
                      Start Another Interview
                    </Button>
                  </Link>
                  <Link href="/performance" className="block">
                    <Button variant="outline" className="w-full text-xs" size="sm">
                      View Performance Trends
                    </Button>
                  </Link>
                  <Link href="/history" className="block">
                    <Button variant="outline" className="w-full text-xs" size="sm">
                      Interview History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
