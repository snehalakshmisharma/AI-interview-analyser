"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, LayoutDashboard, History, BarChart3, FileText, Users, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  user?: { name: string; email: string; role: string };
  mode?: string;
}

export function Navbar({ user, mode }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFaculty = user?.role === "FACULTY" || user?.role === "ADMIN";

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/interview/setup", label: "Practice", icon: Brain },
    { href: "/history", label: "History", icon: History },
    { href: "/performance", label: "Performance", icon: BarChart3 },
  ];

  const facultyLinks = [
    { href: "/faculty", label: "Dashboard", icon: LayoutDashboard },
    { href: "/faculty/students", label: "Students", icon: Users },
  ];

  const links = isFaculty ? facultyLinks : studentLinks;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={isFaculty ? "/faculty" : "/dashboard"} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A365D] text-white">
                <Brain className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 hidden sm:block">PlacementPro</span>
              {mode === "demo" && <Badge variant="warning" className="ml-2 text-[10px]">DEMO</Badge>}
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.role}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  pathname === link.href ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-200 mt-4">
              <div className="px-3 py-2">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
              <Button variant="ghost" className="w-full justify-start mt-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
