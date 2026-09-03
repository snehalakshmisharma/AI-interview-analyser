"use client";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Target, BarChart3, Award, TrendingUp, Search } from "lucide-react";

export default function FacultyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) {
        if (meData.user.role !== "FACULTY" && meData.user.role !== "ADMIN") {
          window.location.href = "/dashboard";
          return;
        }
        setUser(meData.user);
      } else {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/faculty/students");
      if (res.ok) {
        const json = await res.json();
        setData(json);
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
          <h1 className="text-2xl font-bold text-slate-900">Faculty Dashboard</h1>
          <p className="text-slate-600 mt-1">Monitor student performance and placement readiness</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Students</p>
                  <p className="text-2xl font-bold mt-1">{data?.stats.totalStudents || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Interviews</p>
                  <p className="text-2xl font-bold mt-1">{data?.stats.totalInterviews || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Target className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Average Score</p>
                  <p className="text-2xl font-bold mt-1">{data?.stats.avgOverall || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Students</p>
                  <p className="text-2xl font-bold mt-1">{data?.students.filter((s: any) => s.totalInterviews > 0).length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Award className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Students Overview</CardTitle>
            <Link href="/faculty/students">
              <Button variant="outline" size="sm">View All Students</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Interviews</th>
                    <th className="pb-3 font-medium">Avg Score</th>
                    <th className="pb-3 font-medium">Tech / Comm</th>
                    <th className="pb-3 font-medium">Readiness</th>
                    <th className="pb-3 font-medium">Last Active</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.students.slice(0, 10).map((student: any) => (
                    <tr key={student.id} className="border-b border-slate-100 text-sm hover:bg-slate-50">
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.email}</div>
                        </div>
                      </td>
                      <td className="py-3">{student.department || "-"}</td>
                      <td className="py-3">{student.totalInterviews} ({student.completedInterviews} completed)</td>
                      <td className="py-3">
                        <span className={`font-bold ${student.avgScore >= 70 ? "text-emerald-600" : student.avgScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {student.avgScore || "-"}
                        </span>
                      </td>
                      <td className="py-3">{student.techAvg}/{student.commAvg}</td>
                      <td className="py-3">
                        <Badge variant={student.placementReadiness >= 70 ? "success" : student.placementReadiness >= 50 ? "warning" : "default"}>
                          {student.placementReadiness || 0}%
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-slate-500">{student.lastInterviewDate ? new Date(student.lastInterviewDate).toLocaleDateString() : "-"}</td>
                      <td className="py-3">
                        <Link href={`/faculty/students/${student.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.students || data.students.length === 0) && (
                <div className="py-12 text-center text-sm text-slate-500">No students yet. Share student registration link.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
