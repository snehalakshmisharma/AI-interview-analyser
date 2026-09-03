"use client";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award, Brain, MessageSquare, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from "recharts";

export default function PerformancePage() {
  const [user, setUser] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setUser(meData.user);
      else { window.location.href = "/login"; return; }

      const res = await fetch("/api/performance/me");
      if (res.ok) {
        const data = await res.json();
        setPerf(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1A365D] border-t-transparent" />
      </div>
    );
  }

  const hasData = perf && perf.completedInterviews > 0;

  const radarData = hasData ? [
    { subject: "Technical", A: perf.averageScores.technical, fullMark: 100 },
    { subject: "Communication", A: perf.averageScores.communication, fullMark: 100 },
    { subject: "Fluency", A: perf.averageScores.fluency, fullMark: 100 },
    { subject: "Overall", A: perf.averageScores.overall, fullMark: 100 },
    { subject: "Readiness", A: perf.readiness.overallReadiness, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Performance Analytics</h1>
          <p className="text-slate-600 mt-1">Track your progress and identify improvement areas</p>
        </div>

        {!hasData ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900">Complete more interviews to unlock performance trends</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Your analytics will show score over time, communication progress, technical growth, and placement readiness once you have at least 1 completed interview.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-[#1A365D]">{perf.averageScores.overall}</div>
                  <div className="text-sm text-slate-500 mt-1">Overall Average</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">{perf.averageScores.technical}</div>
                  <div className="text-sm text-slate-500 mt-1">Technical</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-emerald-600">{perf.averageScores.communication}</div>
                  <div className="text-sm text-slate-500 mt-1">Communication</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-amber-600">{perf.readiness.overallReadiness}</div>
                  <div className="text-sm text-slate-500 mt-1">Readiness • {perf.readiness.level}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Score Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perf.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="overall" stroke="#1A365D" strokeWidth={2} name="Overall" />
                        <Line type="monotone" dataKey="technical" stroke="#2563EB" strokeWidth={2} name="Technical" />
                        <Line type="monotone" dataKey="communication" stroke="#059669" strokeWidth={2} name="Communication" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar dataKey="A" stroke="#1A365D" fill="#1A365D" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perf.categoryPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="avgScore" fill="#1A365D" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Placement Readiness Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-[#1A365D]">{perf.readiness.overallReadiness}</div>
                    <div className="text-lg font-medium mt-2">{perf.readiness.level}</div>
                    <p className="text-sm text-slate-500 mt-2">Your placement readiness indicator is based on your recent interview performance across technical knowledge, communication, relevance and answer structure.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-2"><Brain className="h-4 w-4" />Technical Readiness</span>
                        <span className="font-bold">{perf.readiness.technicalReadiness}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#1A365D] transition-all" style={{ width: `${perf.readiness.technicalReadiness}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Communication Readiness</span>
                        <span className="font-bold">{perf.readiness.communicationReadiness}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${perf.readiness.communicationReadiness}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                    <strong>Note:</strong> This is not a scientifically validated employment prediction. It reflects your interview performance in this platform.
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
