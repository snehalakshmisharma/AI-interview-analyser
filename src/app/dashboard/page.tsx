"use client";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Brain, Target, TrendingUp, Award, Clock, BarChart3, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface PerformanceData {
  totalInterviews: number;
  completedInterviews: number;
  averageScores: { overall: number; technical: number; communication: number; fluency: number };
  readiness: { technicalReadiness: number; communicationReadiness: number; overallReadiness: number; level: string };
  trends: any[];
  categoryPerformance: any[];
  recentInterviews: any[];
}

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiMode, setAiMode] = useState("demo");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.user) setUser(meData.user);
        else window.location.href = "/login";

        const perfRes = await fetch("/api/performance/me");
        if (perfRes.ok) {
          const perfData = await perfRes.json();
          setPerf(perfData);
        }

        // Check AI mode via seed endpoint or env? We'll just assume demo unless configured
        setAiMode(process.env.NEXT_PUBLIC_AI_MODE || "demo");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1A365D] border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasData = perf && perf.completedInterviews > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar user={user} mode={aiMode} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(" ")[0] || "Student"} 👋</h1>
          <p className="text-slate-600 mt-1">Track your interview performance and improve your placement readiness</p>
          {aiMode === "demo" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              <Sparkles className="h-4 w-4" />
              Demo Mode: AI analysis uses heuristic evaluation. Configure GEMINI_API_KEY for real Google Gemini AI.
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Interviews Completed</p>
                  <p className="text-2xl font-bold mt-1">{perf?.completedInterviews || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">{perf?.totalInterviews || 0} total attempts</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Average Score</p>
                  <p className="text-2xl font-bold mt-1">{perf?.averageScores.overall || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">Overall performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Technical Score</p>
                  <p className="text-2xl font-bold mt-1">{perf?.averageScores.technical || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Brain className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">Technical knowledge</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Communication</p>
                  <p className="text-2xl font-bold mt-1">{perf?.averageScores.communication || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">Communication skills</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasData ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">No performance data yet</p>
                    <p className="text-sm text-slate-500 mt-1">Complete your first interview to start tracking your performance.</p>
                    <Link href="/interview/setup" className="mt-4 inline-block">
                      <Button size="sm">Start Interview</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perf.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="overall" stroke="#1A365D" strokeWidth={2} name="Overall" />
                        <Line type="monotone" dataKey="technical" stroke="#2563EB" strokeWidth={2} name="Technical" />
                        <Line type="monotone" dataKey="communication" stroke="#059669" strokeWidth={2} name="Communication" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Interviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Interviews</CardTitle>
                <Link href="/history">
                  <Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {!hasData ? (
                  <div className="py-8 text-center text-sm text-slate-500">No interviews yet. Start practicing!</div>
                ) : (
                  <div className="space-y-3">
                    {perf.recentInterviews.map((interview: any) => (
                      <div key={interview.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant={interview.status === "ANALYZED" ? "success" : "default"}>{interview.status}</Badge>
                            <span className="text-sm font-medium truncate">{interview.type} • {interview.category}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(interview.createdAt).toLocaleDateString()}</span>
                            <span>{interview.totalQuestions} questions</span>
                            <span className="hidden sm:inline">{interview.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">{interview.overallScore ?? "-"}</div>
                            <div className="text-xs text-slate-500">Score</div>
                          </div>
                          <Link href={`/interview/${interview.id}/report`}>
                            <Button variant="outline" size="sm">Report</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Placement Readiness */}
            <Card className="border-[#1A365D]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#1A365D]" />
                  Placement Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasData ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500">Complete more interviews to unlock readiness indicator</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center py-2">
                      <div className="text-4xl font-bold text-[#1A365D]">{perf.readiness.overallReadiness}</div>
                      <div className="text-sm font-medium mt-1">{perf.readiness.level}</div>
                      <p className="text-xs text-slate-500 mt-2">Based on recent performance across technical, communication, and structure</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Technical Readiness</span>
                          <span className="font-medium">{perf.readiness.technicalReadiness}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-[#1A365D]" style={{ width: `${perf.readiness.technicalReadiness}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Communication</span>
                          <span className="font-medium">{perf.readiness.communicationReadiness}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${perf.readiness.communicationReadiness}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      <p>Your placement readiness indicator is based on your recent interview performance across technical knowledge, communication, relevance and answer structure.</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/interview/setup" className="block">
                  <Button className="w-full justify-between">
                    <span className="flex items-center gap-2"><Brain className="h-4 w-4" />New Practice Interview</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/performance" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />View Performance Analytics
                  </Button>
                </Link>
                <Link href="/history" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />Interview History
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Category Performance */}
            {hasData && perf.categoryPerformance.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {perf.categoryPerformance.map((cat: any) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{cat.category.replace(/_/g, " ")}</div>
                        <div className="text-xs text-slate-500">{cat.count} interviews</div>
                      </div>
                      <div className="text-sm font-bold">{cat.avgScore}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
