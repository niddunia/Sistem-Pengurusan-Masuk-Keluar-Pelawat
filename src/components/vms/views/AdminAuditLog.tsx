"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ScrollText,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  User,
  FileText,
  Globe,
  Activity,
  Lock,
  Download,
  Eye,
} from "lucide-react";

interface AuditLog {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  visitId: string | null;
  details: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor?: { fullName: string; email: string; role: string } | null;
  visit?: { referenceCode: string; visitor: { fullName: string } } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Helper: details may come back as a JSON string or already-parsed object
function parseDetails(details: unknown): unknown {
  if (typeof details === "string") {
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  }
  return details;
}

// Action color map
const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  visit_create: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
  visit_approve: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  visit_reject: { bg: "bg-red-500/20", text: "text-red-300", border: "border-red-500/30" },
  visit_checkin: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  visit_verify: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  visit_feedback: { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  visit_exit: { bg: "bg-teal-500/20", text: "text-teal-300", border: "border-teal-500/30" },
  user_create: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
  user_update: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" },
  user_deactivate: { bg: "bg-red-500/20", text: "text-red-300", border: "border-red-500/30" },
  department_create: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
  department_delete: { bg: "bg-red-500/20", text: "text-red-300", border: "border-red-500/30" },
  login: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  settings_update: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" },
};

const ACTION_LABELS: Record<string, { bm: string; en: string }> = {
  visit_create: { bm: "Cipta Lawatan", en: "Visit Create" },
  visit_approve: { bm: "Lulus Lawatan", en: "Visit Approve" },
  visit_reject: { bm: "Tolak Lawatan", en: "Visit Reject" },
  visit_checkin: { bm: "Daftar Masuk", en: "Visit Check-In" },
  visit_verify: { bm: "Sahkan Staf", en: "Visit Verify" },
  visit_feedback: { bm: "Maklum Balas", en: "Visit Feedback" },
  visit_exit: { bm: "Daftar Keluar", en: "Visit Exit" },
  user_create: { bm: "Cipta Pengguna", en: "User Create" },
  user_update: { bm: "Kemas Kini Pengguna", en: "User Update" },
  user_deactivate: { bm: "Nyahaktif Pengguna", en: "User Deactivate" },
  department_create: { bm: "Cipta Jabatan", en: "Dept Create" },
  department_delete: { bm: "Padam Jabatan", en: "Dept Delete" },
  login: { bm: "Log Masuk", en: "Login" },
  settings_update: { bm: "Kemas Tetapan", en: "Settings Update" },
};

const ACTION_OPTIONS = [
  "visit_create",
  "visit_approve",
  "visit_reject",
  "visit_checkin",
  "visit_verify",
  "visit_feedback",
  "visit_exit",
  "user_create",
  "user_update",
  "user_deactivate",
  "department_create",
  "department_delete",
  "login",
  "settings_update",
];

const PAGE_SIZE = 50;

export function AdminAuditLog() {
  const { language } = useUIStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [action, setAction] = useState<string>("all");
  const [actorQuery, setActorQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  // Detail
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const mounted = useRef(true);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (action !== "all") params.set("action", action);
        if (actorQuery.trim()) params.set("actorId", actorQuery.trim()); // server filters by exact id; we'll also client-filter by name/email below
        if (from) params.set("from", new Date(from).toISOString());
        if (to) params.set("to", new Date(`${to}T23:59:59`).toISOString());
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        const res = await fetch(`/api/admin/audit?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!mounted.current) return;
        if (json.success) {
          // Client-side filter by actor name/email if actorId is not a real id (user typed name/email)
          let filtered = json.data.logs as AuditLog[];
          const q = actorQuery.trim().toLowerCase();
          if (q) {
            filtered = filtered.filter(
              (l) =>
                l.actor?.fullName?.toLowerCase().includes(q) ||
                l.actor?.email?.toLowerCase().includes(q) ||
                l.actorId?.toLowerCase().includes(q)
            );
          }
          setLogs(filtered);
          setPagination(json.data.pagination);
        } else {
          toast.error(
            json.error || (language === "bm" ? "Gagal memuatkan log." : "Failed to load logs.")
          );
        }
      } catch {
        if (mounted.current)
          toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [action, actorQuery, from, to, page, language]
  );

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  const handleReset = () => {
    setAction("all");
    setActorQuery("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const handleExport = () => {
    // Build CSV from current logs
    const headers = ["Timestamp", "Actor", "Email", "Role", "Action", "Visit Ref", "IP", "Details"];
    const rows = logs.map((l) =>
      [
        format(new Date(l.createdAt), "yyyy-MM-dd HH:mm:ss"),
        l.actor?.fullName || "—",
        l.actor?.email || "—",
        l.actor?.role || l.actorRole || "—",
        l.action,
        l.visit?.referenceCode || "—",
        l.ipAddress || "—",
        JSON.stringify(parseDetails(l.details) || {}),
      ]
        .map((v) => {
          const s = String(v);
          if (s.includes(",") || s.includes('"') || s.includes("\n"))
            return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vms-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(language === "bm" ? "Log audit dieksport." : "Audit log exported.");
  };

  const isLoading = loading && logs.length === 0;

  return (
    <div className="flex flex-col gap-5 pb-6 view-enter">
      {/* Header */}
      <GlassCard variant="panel" className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {language === "bm" ? "Log Audit Sistem" : "System Audit Log"}
            </h1>
            <p className="text-xs text-cyan-200/80 flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              {language === "bm"
                ? "Rekod tidak boleh diubah (immutable). Jejak semua tindakan sistem."
                : "Immutable record of all system actions."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" className="h-9 px-3" onClick={() => fetchData()} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">{language === "bm" ? "Muat Semula" : "Refresh"}</span>
          </GlassButton>
          <GlassButton variant="outline" className="h-9 px-3" onClick={handleExport} disabled={logs.length === 0}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{language === "bm" ? "Eksport CSV" : "Export CSV"}</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3 text-cyan-200/80 text-xs font-semibold uppercase tracking-wide">
          <Filter className="w-3.5 h-3.5" />
          {language === "bm" ? "Penapis" : "Filters"}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] text-cyan-200/70 font-medium mb-1 block">
              {language === "bm" ? "Tindakan" : "Action"}
            </label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-9 bg-white/10 border-white/20 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "bm" ? "Semua Tindakan" : "All Actions"}</SelectItem>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {language === "bm" ? ACTION_LABELS[a]?.bm || a : ACTION_LABELS[a]?.en || a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-cyan-200/70 font-medium mb-1 block">
              {language === "bm" ? "Pelaku (Nama/E-mel/ID)" : "Actor (Name/Email/ID)"}
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
              <Input
                placeholder={language === "bm" ? "Cari pelaku..." : "Search actor..."}
                value={actorQuery}
                onChange={(e) => {
                  setActorQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-cyan-200/70 font-medium mb-1 block">
              {language === "bm" ? "Dari Tarikh" : "From Date"}
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
              <Input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 bg-white/10 border-white/20 text-white text-xs [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-cyan-200/70 font-medium mb-1 block">
              {language === "bm" ? "Hingga Tarikh" : "To Date"}
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 bg-white/10 border-white/20 text-white text-xs [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
        {(action !== "all" || actorQuery || from || to) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleReset}
              className="text-xs text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline"
            >
              {language === "bm" ? "↺ Set Semula Penapis" : "↺ Reset Filters"}
            </button>
          </div>
        )}
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <ScrollText className="w-10 h-10 text-white/30 mb-2" />
            <div className="text-sm text-white/60">
              {language === "bm" ? "Tiada log audit dijumpai." : "No audit logs found."}
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              {language === "bm" ? "Cuba ubah penapis anda." : "Try adjusting your filters."}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Cap Masa" : "Timestamp"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Pelaku" : "Actor"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Tindakan" : "Action"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Lawatan" : "Visit"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Butiran" : "Details"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Alamat IP" : "IP Address"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => {
                    const colors =
                      ACTION_COLORS[l.action] ||
                      { bg: "bg-white/10", text: "text-white/70", border: "border-white/20" };
                    const label =
                      language === "bm"
                        ? ACTION_LABELS[l.action]?.bm || l.action
                        : ACTION_LABELS[l.action]?.en || l.action;
                    return (
                      <TableRow
                        key={l.id}
                        onClick={() => setDetailLog(l)}
                        className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <TableCell className="text-xs text-white/70 whitespace-nowrap font-mono">
                          {format(new Date(l.createdAt), "dd MMM yyyy, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-white font-medium">
                            {l.actor?.fullName || (language === "bm" ? "Sistem" : "System")}
                          </div>
                          {l.actor?.email && (
                            <div className="text-[10px] text-white/40">{l.actor.email}</div>
                          )}
                          {l.actor?.role && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded-full text-[9px] font-semibold border",
                                l.actor.role === "admin"
                                  ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                  : l.actor.role === "security"
                                  ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                  : "bg-teal-500/15 text-teal-300 border-teal-500/30"
                              )}
                            >
                              {l.actor.role}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                              colors.bg,
                              colors.text,
                              colors.border
                            )}
                          >
                            {label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-white/90">
                          {l.visit ? (
                            <div>
                              <div className="font-mono text-cyan-300 text-[11px]">
                                {l.visit.referenceCode}
                              </div>
                              <div className="text-[10px] text-white/50">
                                {l.visit.visitor.fullName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-white/60 max-w-[280px]">
                          <span className="line-clamp-1 font-mono text-[10px]">
                            {JSON.stringify(parseDetails(l.details) || {}).slice(0, 80)}
                            {JSON.stringify(parseDetails(l.details) || {}).length > 80 ? "..." : ""}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-white/60 font-mono">
                          {l.ipAddress || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {logs.map((l) => {
                const colors =
                  ACTION_COLORS[l.action] ||
                  { bg: "bg-white/10", text: "text-white/70", border: "border-white/20" };
                const label =
                  language === "bm"
                    ? ACTION_LABELS[l.action]?.bm || l.action
                    : ACTION_LABELS[l.action]?.en || l.action;
                return (
                  <div
                    key={l.id}
                    onClick={() => setDetailLog(l)}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 active:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-white font-medium">
                          {l.actor?.fullName || (language === "bm" ? "Sistem" : "System")}
                        </div>
                        <div className="text-[10px] text-white/50 font-mono">
                          {format(new Date(l.createdAt), "dd MMM yyyy, HH:mm:ss")}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border flex-shrink-0",
                          colors.bg,
                          colors.text,
                          colors.border
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {l.visit && (
                      <div className="mt-1.5 text-[11px] text-cyan-300 font-mono">
                        {l.visit.referenceCode}
                      </div>
                    )}
                    {l.ipAddress && (
                      <div className="mt-1 text-[10px] text-white/40 font-mono">IP: {l.ipAddress}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10">
                <div className="text-xs text-cyan-200/70">
                  {language === "bm"
                    ? `Menunjukkan ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )} dari ${pagination.total} log`
                    : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )} of ${pagination.total} logs`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-white/70 px-2">
                    {pagination.page} / {Math.max(1, pagination.totalPages)}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* Detail Dialog */}
      <Dialog open={!!detailLog} onOpenChange={(open) => !open && setDetailLog(null)}>
        <DialogContent className="glass-panel border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-300" />
              {language === "bm" ? "Butiran Log Audit" : "Audit Log Details"}
            </DialogTitle>
            <DialogDescription className="text-cyan-200/70">
              {language === "bm"
                ? "Log audit adalah tidak boleh diubah (immutable)."
                : "Audit logs are immutable."}
            </DialogDescription>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-3 py-2">
              {/* Action badge */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                    (ACTION_COLORS[detailLog.action] || {}).bg,
                    (ACTION_COLORS[detailLog.action] || {}).text,
                    (ACTION_COLORS[detailLog.action] || {}).border
                  )}
                >
                  <Activity className="w-3 h-3" />
                  {language === "bm"
                    ? ACTION_LABELS[detailLog.action]?.bm || detailLog.action
                    : ACTION_LABELS[detailLog.action]?.en || detailLog.action}
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  {format(new Date(detailLog.createdAt), "dd MMM yyyy, HH:mm:ss")}
                </span>
              </div>

              <DetailRow
                icon={<User className="w-3.5 h-3.5" />}
                label={language === "bm" ? "Pelaku" : "Actor"}
                value={
                  detailLog.actor
                    ? `${detailLog.actor.fullName} (${detailLog.actor.email}) — ${detailLog.actor.role}`
                    : detailLog.actorId || (language === "bm" ? "Sistem" : "System")
                }
              />
              {detailLog.visit && (
                <DetailRow
                  icon={<FileText className="w-3.5 h-3.5" />}
                  label={language === "bm" ? "Lawatan Berkaitan" : "Related Visit"}
                  value={`${detailLog.visit.referenceCode} — ${detailLog.visit.visitor.fullName}`}
                />
              )}
              {detailLog.ipAddress && (
                <DetailRow
                  icon={<Globe className="w-3.5 h-3.5" />}
                  label={language === "bm" ? "Alamat IP" : "IP Address"}
                  value={detailLog.ipAddress}
                />
              )}
              {detailLog.userAgent && (
                <DetailRow
                  icon={<Globe className="w-3.5 h-3.5" />}
                  label={language === "bm" ? "User Agent" : "User Agent"}
                  value={detailLog.userAgent}
                />
              )}

              <div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-cyan-200/60 font-semibold mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {language === "bm" ? "Butiran (JSON)" : "Details (JSON)"}
                </div>
                <pre className="p-3 rounded-lg bg-black/30 border border-white/10 text-[11px] text-cyan-100 overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar font-mono">
                  {JSON.stringify(parseDetails(detailLog.details) || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-1 border-b border-white/5 last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-cyan-200/60 font-semibold flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-sm text-white break-words">{value}</span>
    </div>
  );
}
