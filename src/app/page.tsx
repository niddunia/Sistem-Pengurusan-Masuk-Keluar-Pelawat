"use client";

import { useSession } from "next-auth/react";
import { useRouterStore } from "@/stores/router";
import { AppHeader, AppFooter } from "@/components/vms/AppShell";
import { AppSidebar, AppMobileNav } from "@/components/vms/AppSidebar";
import { useEffect, useRef } from "react";

// Public views
import { LandingView } from "@/components/vms/views/LandingView";
import { VisitorRegisterView } from "@/components/vms/views/VisitorRegisterView";
import { VisitorStatusView } from "@/components/vms/views/VisitorStatusView";
import { VisitorFeedbackView } from "@/components/vms/views/VisitorFeedbackView";
import { LoginView } from "@/components/vms/views/LoginView";

// Security views
import { SecurityDashboard } from "@/components/vms/views/SecurityDashboard";
import { SecurityWalkIn } from "@/components/vms/views/SecurityWalkIn";
import { SecurityExit } from "@/components/vms/views/SecurityExit";
import { SecurityHistory } from "@/components/vms/views/SecurityHistory";

// Staff views
import { StaffDashboard } from "@/components/vms/views/StaffDashboard";
import { StaffHistory } from "@/components/vms/views/StaffHistory";

// Admin views
import { AdminDashboard } from "@/components/vms/views/AdminDashboard";
import { AdminUsers } from "@/components/vms/views/AdminUsers";
import { AdminDepartments } from "@/components/vms/views/AdminDepartments";
import { AdminAuditLog } from "@/components/vms/views/AdminAuditLog";
import { AdminSettings } from "@/components/vms/views/AdminSettings";
import { AdminReports } from "@/components/vms/views/AdminReports";

export default function Home() {
  const { data: session, status } = useSession();
  const { view, navigate } = useRouterStore();
  const hasAutoNavigated = useRef(false);

  const isAuthed = status === "authenticated" && session?.user;
  const role = session?.user?.role;

  // Auto-navigate authenticated users to their role dashboard on first load
  // (e.g. after login page reload). Only triggers once per session mount.
  useEffect(() => {
    if (isAuthed && role && !hasAutoNavigated.current && view === "landing") {
      hasAutoNavigated.current = true;
      const dashboardView =
        role === "security"
          ? "security-dashboard"
          : role === "staff"
          ? "staff-dashboard"
          : role === "admin"
          ? "admin-dashboard"
          : "landing";
      if (dashboardView !== "landing") {
        navigate(dashboardView);
      }
    }
    if (!isAuthed) {
      hasAutoNavigated.current = false;
    }
  }, [isAuthed, role, view, navigate]);

  // Determine if current view is a public (visitor) view
  const isPublicView = [
    "landing",
    "visitor-register",
    "visitor-status",
    "visitor-feedback",
    "login",
  ].includes(view);

  // Authenticated layout has sidebar
  const showSidebar = isAuthed && !isPublicView;

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <AppHeader />

      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        {showSidebar && <AppSidebar />}

        <main className="flex-1 min-w-0 px-3 sm:px-4 py-4 pb-20 lg:pb-4 relative z-10">
          <div key={view} className="view-enter">
            {renderView(view, isAuthed, role)}
          </div>
        </main>
      </div>

      {showSidebar && <AppMobileNav />}

      <AppFooter />
    </div>
  );
}

function renderView(view: string, isAuthed: boolean, role?: string) {
  // Public views - always accessible
  switch (view) {
    case "landing":
      return <LandingView />;
    case "visitor-register":
      return <VisitorRegisterView />;
    case "visitor-status":
      return <VisitorStatusView />;
    case "visitor-feedback":
      return <VisitorFeedbackView />;
    case "login":
      return <LoginView />;
  }

  // Authenticated views
  if (!isAuthed) {
    return <LoginView />;
  }

  // Security views
  if (role === "security") {
    switch (view) {
      case "security-dashboard":
        return <SecurityDashboard />;
      case "security-walkin":
        return <SecurityWalkIn />;
      case "security-exit":
        return <SecurityExit />;
      case "security-history":
        return <SecurityHistory />;
      default:
        return <SecurityDashboard />;
    }
  }

  // Staff views
  if (role === "staff") {
    switch (view) {
      case "staff-dashboard":
        return <StaffDashboard />;
      case "staff-history":
        return <StaffHistory />;
      default:
        return <StaffDashboard />;
    }
  }

  // Admin views
  if (role === "admin") {
    switch (view) {
      case "admin-dashboard":
        return <AdminDashboard />;
      case "admin-users":
        return <AdminUsers />;
      case "admin-departments":
        return <AdminDepartments />;
      case "admin-audit":
        return <AdminAuditLog />;
      case "admin-settings":
        return <AdminSettings />;
      case "admin-reports":
        return <AdminReports />;
      default:
        return <AdminDashboard />;
    }
  }

  return <LandingView />;
}
