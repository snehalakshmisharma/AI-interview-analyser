"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT", department: "", year: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(data.user.role === "FACULTY" ? "/faculty" : "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A365D] text-white">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">InterviewAnalyzer</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-sm text-slate-600 mt-2">Start your placement preparation journey</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create your student or faculty account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" placeholder="you@college.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty / Admin</option>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Department" placeholder="CSE" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                <Input label="Year" placeholder="Final Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-slate-600">Already have an account? </span>
              <Link href="/login" className="font-medium text-[#1A365D] hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
