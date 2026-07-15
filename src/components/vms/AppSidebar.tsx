"use client";

import { useSession } from "next-auth/react";
import { useRouterStore } from "@/stores/router";
import { useUIStore } from "@/stores/router";
import {
  LayoutDashboard,
  UserPlus,
  LogOut,
  ClipboardCheck,
  History,
  Users,
  Building2,
  ScrollText,
  Settings,
  BarChart3,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { GlassCard } from "@/components/vms/GlassCard";
import { RoleBadge } from "@/components/vms/StatusBadge";
import { signOut } from "next-auth/react";

interface NavItem {
  view: Parameters<ReturnType<typeof useRouterStore>["navigate"]>[0];
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  labelEn: string;
}

export function AppSidebar() {
  const { data: session } = useSession();
  const { view, navigate } = useRouterStore();
  const { language } = useUIStore();
  const role = session?.user?.role;

  if (!role) return null;

  const handleLogout = () => {
    // Use redirect: false to prevent NextAuth from redirecting to localhost
    // (which causes ERR_CONNECTION_REFUSED behind the gateway/preview panel).
    signOut({ redirect: false }).then(() => {
      navigate("landing", {});
    });
  };

  let navItems: NavItem[] = [];

  if (role === "security") {
    navItems = [
      { view: "security-dashboard", icon: LayoutDashboard, label: "Dashboard", labelEn: "Dashboard" },
      { view: "security-walkin", icon: UserPlus, label: "Pendaftaran Walk-In", labelEn: "Walk-In Registration" },
      { view: "security-exit", icon: LogOut, label: "Kelulusan Keluar", labelEn: "Exit Approval" },
      { view: "security-history", icon: History, label: "Sejarah Lawatan", labelEn: "Visit History" },
    ];
  } else if (role === "staff") {
    navItems = [
      { view: "staff-dashboard", icon: ClipboardCheck, label: "Pelawat Saya", labelEn: "My Visitors" },
      { view: "staff-history", icon: History, label: "Sejarah Lawatan", labelEn: "Visit History" },
    ];
  } else if (role === "admin") {
    navItems = [
      { view: "admin-dashboard", icon: LayoutDashboard, label: "Dashboard", labelEn: "Dashboard" },
      { view: "admin-users", icon: Users, label: "Pengurusan Pengguna", labelEn: "User Management" },
      { view: "admin-departments", icon: Building2, label: "Jabatan", labelEn: "Departments" },
      { view: "admin-audit", icon: ScrollText, label: "Log Audit", labelEn: "Audit Log" },
      { view: "admin-reports", icon: FileText, label: "Laporan & Eksport", labelEn: "Reports & Export" },
      { view: "admin-settings", icon: Settings, label: "Tetapan Sistem", labelEn: "System Settings" },
    ];
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 p-3 sticky top-[88px] self-start" style={{ maxHeight: "calc(100vh - 100px)" }}>
      <GlassCard variant="panel" className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
        {/* User info */}
        <div className="flex flex-col gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/30">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                {session?.user?.name}
              </div>
              <div className="text-[10px] text-cyan-200/70 truncate">
                {session?.user?.email}
              </div>
            </div>
          </div>
          <RoleBadge role={role} language={language} />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/30 to-blue-600/20 text-white border border-cyan-400/30 shadow-lg shadow-cyan-900/20"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{language === "en" ? item.labelEn : item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Security status badge */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-medium">Sesi Selamat (HTTPS)</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-300 hover:bg-red-500/15 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("logout", language)}
          </button>
        </div>
      </GlassCard>
    </aside>
  );
}

// Mobile bottom navigation for small screens
export function AppMobileNav() {
  const { data: session } = useSession();
  const { view, navigate } = useRouterStore();
  const { language } = useUIStore();
  const role = session?.user?.role;

  if (!role) return null;

  let navItems: NavItem[] = [];
  if (role === "security") {
    navItems = [
      { view: "security-dashboard", icon: LayoutDashboard, label: "Dashboard", labelEn: "Dashboard" },
      { view: "security-walkin", icon: UserPlus, label: "Walk-In", labelEn: "Walk-In" },
      { view: "security-exit", icon: LogOut, label: "Keluar", labelEn: "Exit" },
      { view: "security-history", icon: History, label: "Sejarah", labelEn: "History" },
    ];
  } else if (role === "staff") {
    navItems = [
      { view: "staff-dashboard", icon: ClipboardCheck, label: "Pelawat", labelEn: "Visitors" },
      { view: "staff-history", icon: History, label: "Sejarah", labelEn: "History" },
    ];
  } else if (role === "admin") {
    navItems = [
      { view: "admin-dashboard", icon: LayoutDashboard, label: "Dashboard", labelEn: "Dashboard" },
      { view: "admin-users", icon: Users, label: "Pengguna", labelEn: "Users" },
      { view: "admin-audit", icon: ScrollText, label: "Audit", labelEn: "Audit" },
      { view: "admin-settings", icon: Settings, label: "Tetapan", labelEn: "Settings" },
    ];
  }

  return (
    <div className="lg:hidden sticky bottom-0 z-40 px-3 pb-3">
      <GlassCard variant="panel" className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all flex-1",
                isActive ? "text-cyan-300 bg-white/10" : "text-white/60"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-medium">{language === "en" ? item.labelEn : item.label}</span>
            </button>
          );
        })}
      </GlassCard>
    </div>
  );
}
