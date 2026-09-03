"use client";
import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search } from "lucide-react";

export default function FacultyStudentsPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Compute filtered list reactively — no useEffect needed
  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [search, students]);

  useEffect(() => {
    const fetchData = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setUser(meData.user);
      else { window.location.href = "/login"; return; }

      const res = await fetch("/api/faculty/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
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
        <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Students</h1>
            <p className="text-slate-600 mt-1">{students.length} total students</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-500">
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Dept / Year</th>
                    <th className="px-4 py-3 font-medium">Interviews</th>
                    <th className="px-4 py-3 font-medium">Avg</th>
                    <th className="px-4 py-3 font-medium">Technical</th>
                    <th className="px-4 py-3 font-medium">Communication</th>
                    <th className="px-4 py-3 font-medium">Readiness</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100 text-sm hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-slate-500">{student.email}</div>
                      </td>
                      <td className="px-4 py-3">{student.department || "-"} / {student.year || "-"}</td>
                      <td className="px-4 py-3">{student.totalInterviews}</td>
                      <td className="px-4 py-3 font-bold">{student.avgScore || "-"}</td>
                      <td className="px-4 py-3">{student.techAvg || "-"}</td>
                      <td className="px-4 py-3">{student.commAvg || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={student.placementReadiness >= 70 ? "success" : student.placementReadiness >= 50 ? "warning" : "default"}>
                          {student.placementReadiness}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/faculty/students/${student.id}`}>
                          <Button variant="outline" size="sm">View Profile</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
