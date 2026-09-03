import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Mic, 
  BarChart3, 
  Target, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Zap,
  Volume2,
  Award,
  TrendingUp,
  ShieldCheck,
  Code2,
  Briefcase,
  Layers,
  GraduationCap,
  Cpu,
  Activity,
  Compass,
  Check
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Enterprise Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A365D] text-white shadow-sm">
                <Brain className="h-5 w-5" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900 tracking-tight">PlacementPro</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  AI Placement Platform
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-semibold text-slate-700 hover:text-slate-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[#1A365D] hover:bg-[#122742] text-white font-semibold shadow-sm px-4">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero: Clean, Direct & Focused */}
      <section className="pt-14 pb-16 sm:pt-20 sm:pb-22 border-b border-slate-200/90">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-semibold text-blue-900">
            <Cpu className="h-3.5 w-3.5 text-blue-700" />
            AI-Driven Placement Interview & Assessment Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Master Campus Placements. <br />
            <span className="text-[#1A365D]">Ace Technical & HR Rounds</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Real-time interactive mock interviews with live speech-to-text, spoken AI audio feedback, and rigorous concept-level evaluation across 9 analytical dimensions.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-2">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-[#1A365D] hover:bg-[#122742] text-white font-semibold px-7 py-5 shadow-sm group text-base">
                Start Practicing Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-7 py-5 text-base">
                Sign In to Portal
              </Button>
            </Link>
          </div>

          {/* Quick Track Chips */}
          <div className="pt-6 border-t border-slate-200/70 max-w-3xl mx-auto">
            <div className="flex flex-wrap justify-center items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Practice Tracks:</span>
              <span className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1 rounded-md font-medium shadow-2xs">
                💻 Core CS (DSA & OS)
              </span>
              <span className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1 rounded-md font-medium shadow-2xs">
                ⚙️ Software Engineering
              </span>
              <span className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1 rounded-md font-medium shadow-2xs">
                💼 HR & Situational
              </span>
              <span className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1 rounded-md font-medium shadow-2xs">
                🎯 Behavioral (STAR)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Architecture Pillars (Google Cloud / AWS Style) */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Platform Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Built on three intelligent evaluation pillars
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Combining real-time speech processing, strict concept matching, and cohort performance analytics.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1 */}
            <Card className="p-6 sm:p-7 border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
                <Mic className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Real-Time Speech Engine</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Streaming Web Speech STT transcribes spoken answers live without duplication or timeout dropouts. Built-in TTS speaks questions and turns aloud.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> Live transcript streaming
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> AI voice question & feedback audio
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> Speaking rate (WPM) & pause metrics
                </li>
              </ul>
            </Card>

            {/* Pillar 2 */}
            <Card className="p-6 sm:p-7 border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Strict Evaluation Engine</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Question-aware evaluation grades against expected technical concepts. Non-answers and refusal responses receive strict failing grades.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> Expected concept coverage check
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> 0-15% score for &quot;I don&apos;t know&quot; or off-topic
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> Instant turn-by-turn critique note
                </li>
              </ul>
            </Card>

            {/* Pillar 3 */}
            <Card className="p-6 sm:p-7 border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-5">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Placement Readiness Analytics</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Full 9-dimension radar scores, historical trend tracking, and cohort reporting for training and placement departments.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> 9-dimension skill radar breakdown
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> Missing concepts and action recommendations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> Faculty student roster & review tools
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* 9 Evaluation Dimensions Matrix */}
      <section className="py-14 sm:py-16 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Evaluation Criteria</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              9-Dimension Scoring Rubric
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Every mock answer is evaluated across 9 distinct industry-aligned criteria.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Technical Depth", desc: "Coverage of core architectural principles, algorithms, and domain accuracy." },
              { title: "Relevance", desc: "Focus and directness in answering the specific problem posed." },
              { title: "Communication", desc: "Clarity, coherence, and professional presentation of complex thoughts." },
              { title: "Fluency", desc: "Speech cadence, WPM tempo, and minimization of excessive hesitations." },
              { title: "Grammar & Structure", desc: "Sentence mechanics and logical organization (Situation, Task, Action, Result)." },
              { title: "Vocabulary", desc: "Correct utilization of industry-standard technical and domain terminology." },
              { title: "Problem Solving", desc: "Methodical breakdown, trade-off analysis, and logical deduction." },
              { title: "Structure & Flow", desc: "Clear separation of definition, mechanism, and real-world application." },
              { title: "Confidence Indicator", desc: "Poise, delivery assurance, and assertiveness in domain knowledge." },
            ].map((dim, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-xs font-bold text-[#1A365D] block mb-1">0{idx + 1}. {dim.title}</span>
                <p className="text-xs text-slate-600 leading-normal">{dim.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student & Faculty Modules */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="p-7 sm:p-8 border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">For Students & Candidates</h3>
                  <p className="text-xs text-slate-500">Autonomous interview practice</p>
                </div>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 pt-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Practice across beginner, intermediate, and advanced difficulties with configurable question counts.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Receive instant spoken feedback from the AI interviewer after each turn.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Review full diagnostic reports highlighting exact missing concepts and recommendations.</span>
                </li>
              </ul>
            </Card>

            <Card className="p-7 sm:p-8 border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">For Faculty & Placement Officers</h3>
                  <p className="text-xs text-slate-500">Cohort performance monitoring</p>
                </div>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 pt-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Access cohort rosters with aggregate technical and communication scores.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Inspect individual student attempt transcripts and AI evaluation notes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Identify students requiring targeted placement interventions before company visits.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Enterprise Pre-Footer Call to Action (AWS / Google Cloud Style) */}
      <section className="py-12 sm:py-16 bg-slate-100/90 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Start your placement preparation today
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Free for campus students and faculty. Experience realistic AI mock coaching with real-time feedback.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-[#1A365D] hover:bg-[#122742] text-white font-semibold px-6 py-5 shadow-sm">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-300 bg-white text-slate-800 hover:bg-slate-50 font-semibold px-6 py-5">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Navy Enterprise Footer */}
      <footer className="border-t border-blue-950 bg-[#0B192C] text-slate-300 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                  <Brain className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">PlacementPro</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                Campus placement interview training and assessment platform. Providing live speech evaluation, dimension-wise scoring, and actionable career readiness insights.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-xs mb-3 uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link href="/interview/setup" className="hover:text-white transition-colors">Mock Interviews</Link></li>
                <li><Link href="/performance" className="hover:text-white transition-colors">Performance Analytics</Link></li>
                <li><Link href="/history" className="hover:text-white transition-colors">Interview History</Link></li>
                <li><Link href="/faculty" className="hover:text-white transition-colors">Faculty Portal</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-xs mb-3 uppercase tracking-wider">Enterprise Security</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>Google OAuth 2.0</li>
                <li>Institutional SSO / OIDC</li>
                <li>Role-Based Authorization</li>
                <li>Encrypted Sessions</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} PlacementPro. All rights reserved.</p>
            <p>Placement & Training Assessment System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
