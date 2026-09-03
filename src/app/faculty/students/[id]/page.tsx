"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Clock, Award } from "lucide-react";

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setUser(meData.user);
      else { window.location.href = "/login"; return; }

      const res = await fetch(`/api/faculty/students/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        setInterviews(data.interviews);
      }
      setLoading(false);
    };
    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1A365D] border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p>Student not found</p>
      </div>
    );
  }

  const completed = interviews.filter(i => i.overallScore !== null);
  const avgScore = completed.length ? Math.round(completed.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completed.length) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/faculty/students" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" />Back to Students
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-20 w-20 rounded-full bg-[#1A365D] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {student.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">{student.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{student.email}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Badge variant="default">{student.department || "No dept"}</Badge>
                  <Badge variant="default">{student.year || "No year"}</Badge>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-2xl font-bold">{interviews.length}</div>
                    <div className="text-xs text-slate-500">Interviews</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="text-2xl font-bold text-blue-600">{avgScore}</div>
                    <div className="text-xs text-slate-500">Avg Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills & Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium">{student.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department</span>
                  <span className="font-medium">{student.department || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Year</span>
                  <span className="font-medium">{student.year || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Joined</span>
                  <span className="font-medium">{new Date(student.createdAt).toLocaleDateString()}</span>
                </div>
                {student.skills && (
                  <div>
                    <span className="text-slate-500">Skills</span>
                    <p className="font-medium mt-1">{student.skills}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interview History ({interviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {interviews.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500">No interviews yet</div>
                ) : (
                  <div className="space-y-3">
                    {interviews.map((interview) => (
                      <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={interview.status === "ANALYZED" ? "success" : "default"}>{interview.status}</Badge>
                            <span className="text-sm font-medium">{interview.type} • {interview.category.replace(/_/g, " ")}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(interview.createdAt).toLocaleDateString()}</span>
                            <span>{interview.totalQuestions} Qs</span>
                            <span>{interview.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold">{interview.overallScore ?? "-"}</div>
                            <div className="text-xs text-slate-500">Score</div>
                          </div>
                          <Link href={`/interview/${interview.id}/report`}>
                            <Button variant="outline" size="sm">View Report</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
