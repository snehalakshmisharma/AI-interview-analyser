"use client";
import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, Clock, Eye } from "lucide-react";

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Compute filtered list reactively — no need for separate state or effect
  const filtered = useMemo(() => {
    let result = interviews;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.type.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.difficulty.toLowerCase().includes(q)
      );
    }
    if (filterType !== "ALL") {
      result = result.filter(i => i.type === filterType);
    }
    return result;
  }, [search, filterType, interviews]);

  useEffect(() => {
    const fetchData = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setUser(meData.user);
      else { window.location.href = "/login"; return; }

      const res = await fetch("/api/interviews");
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews);
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

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Interview History</h1>
          <p className="text-slate-600 mt-1">Review your past interviews and reports</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  placeholder="Search by type, category, difficulty..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                />
              </div>
              <div className="flex gap-2">
                {["ALL", "HR", "TECHNICAL", "BEHAVIORAL", "MIXED"].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === type ? "bg-[#1A365D] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Interviews ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium">No interviews found</p>
                <p className="text-sm text-slate-500 mt-1">Start your first interview to see history here</p>
                <Link href="/interview/setup" className="mt-4 inline-block">
                  <Button size="sm">Start Interview</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((interview) => (
                  <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={interview.status === "ANALYZED" ? "success" : "default"}>{interview.status}</Badge>
                        <span className="text-sm font-medium">{interview.type}</span>
                        <span className="text-sm text-slate-500">• {interview.category.replace(/_/g, " ")}</span>
                        <span className="text-sm text-slate-500">• {interview.difficulty}</span>
                        <span className="text-sm text-slate-500">• {interview.mode}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(interview.createdAt).toLocaleDateString()}</span>
                        <span>{interview.totalQuestions} questions</span>
                        {interview.completedAt && <span>Completed {new Date(interview.completedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{interview.overallScore ?? "-"}</div>
                        <div className="text-xs text-slate-500">Score</div>
                      </div>
                      <Link href={`/interview/${interview.id}/report`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />View Report
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
