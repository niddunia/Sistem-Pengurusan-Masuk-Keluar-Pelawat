"use client";

import { cn } from "@/lib/utils";

export const VISIT_STATUS = {
  pending_approval: { bm: "Menunggu Kelulusan", en: "Pending Approval", color: "status-pending_approval" },
  approved: { bm: "Diluluskan", en: "Approved", color: "status-approved" },
  rejected: { bm: "Ditolak", en: "Rejected", color: "status-rejected" },
  checked_in: { bm: "Telah Masuk", en: "Checked In", color: "status-checked_in" },
  in_progress: { bm: "Urusan Berjalan", en: "In Progress", color: "status-in_progress" },
  staff_verified: { bm: "Disahkan Staf", en: "Staff Verified", color: "status-staff_verified" },
  pending_feedback: { bm: "Menunggu Maklum Balas", en: "Pending Feedback", color: "status-pending_feedback" },
  feedback_submitted: { bm: "Maklum Balas Diterima", en: "Feedback Submitted", color: "status-feedback_submitted" },
  ready_for_exit: { bm: "Sedia Keluar", en: "Ready For Exit", color: "status-ready_for_exit" },
  checked_out: { bm: "Telah Keluar", en: "Checked Out", color: "status-checked_out" },
  cancelled: { bm: "Dibatalkan", en: "Cancelled", color: "status-cancelled" },
} as const;

export type VisitStatus = keyof typeof VISIT_STATUS;

export function StatusBadge({
  status,
  language = "bm",
  className,
}: {
  status: string;
  language?: "bm" | "en";
  className?: string;
}) {
  const config = VISIT_STATUS[status as VisitStatus] || {
    bm: status,
    en: status,
    color: "status-checked_out",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.color,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {language === "en" ? config.en : config.bm}
    </span>
  );
}

export function RoleBadge({
  role,
  language = "bm",
}: {
  role: string;
  language?: "bm" | "en";
}) {
  const labels: Record<string, { bm: string; en: string; color: string }> = {
    admin: { bm: "Admin", en: "Admin", color: "bg-purple-500/20 text-purple-700 border-purple-500/30" },
    security: { bm: "Pengawal", en: "Security", color: "bg-blue-500/20 text-blue-700 border-blue-500/30" },
    staff: { bm: "Staf", en: "Staff", color: "bg-teal-500/20 text-teal-700 border-teal-500/30" },
    visitor: { bm: "Pelawat", en: "Visitor", color: "bg-slate-500/20 text-slate-700 border-slate-500/30" },
  };

  const config = labels[role] || labels.visitor;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.color
      )}
    >
      {language === "en" ? config.en : config.bm}
    </span>
  );
}
