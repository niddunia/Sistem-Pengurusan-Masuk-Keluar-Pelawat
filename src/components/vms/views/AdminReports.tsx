"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Loader2,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Star,
  AlertCircle,
  Info,
  FileSpreadsheet,
  ChevronRight,
} from "lucide-react";
import { VISIT_STATUS } from "@/components/vms/StatusBadge";

interface StatusBreak {
  status: string;
  count: number;
}
interface DashboardData {
  counts: {
    totalVisits: number;
    totalVisitors: number;
    totalUsers: number;
    activeVisitors: number;
    pendingApproval: number;
  };
  feedback: { averageRating: number; totalFeedback: number };
  statusBreakdown: StatusBreak[];
}

export function AdminReports() {
  const { language } = useUIStore();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const defaultFrom = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const defaultTo = format(new Date(), "yyyy-MM-dd");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [status, setStatus] = useState<string>("all");

  const [lastExport, setLastExport] = useState<{ at: Date; rows: number } | null>(null);

  const mounted = useRef(true);

  const fetchDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/admin?days=30", { cache: "no-store" });
      const json = await res.json();
      if (!mounted.current) return;
      if (json.success) {
        setDashboard(json.data);
      } else {
        toast.error(json.error || (language === "bm" ? "Gagal memuatkan data." : "Failed to load data."));
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
  }, [language]);

  useEffect(() => {
    mounted.current = true;
    fetchDashboard();
    return () => {
      mounted.current = false;
    };
  }, [fetchDashboard]);

  const handleExport = async () => {
    // Validate date range
    if (!from || !to) {
      toast.error(language === "bm" ? "Sila pilih julat tarikh." : "Please select date range.");
      return;
    }
    if (new Date(from) > new Date(to)) {
      toast.error(language === "bm" ? "Tarikh mula tidak boleh lewat dari tarikh akhir." : "From date cannot be after to date.");
      return;
    }
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("from", new Date(from).toISOString());
      params.set("to", new Date(`${to}T23:59:59`).toISOString());
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/admin/export?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vms-visits-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Estimate rows from blob
      const text = await blob.text();
      const lineCount = text.split("\n").filter((l) => l.trim()).length - 1; // minus header
      setLastExport({ at: new Date(), rows: Math.max(0, lineCount) });
      toast.success(
        language === "bm"
          ? `Eksport berjaya! ${Math.max(0, lineCount)} rekod dimuat turun.`
          : `Export successful! ${Math.max(0, lineCount)} records downloaded.`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const dateRangeLabel = useMemo(() => {
    if (!from || !to) return "";
    const f = new Date(from);
    const t = new Date(to);
    const days = Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} ${language === "bm" ? "hari" : "days"}`;
  }, [from, to, language]);

  const isLoading = loading && !dashboard;

  return (
    <div className="flex flex-col gap-5 pb-6 view-enter">
      {/* Header */}
      <GlassCard variant="panel" className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {language === "bm" ? "Laporan & Eksport" : "Reports & Export"}
            </h1>
            <p className="text-xs text-cyan-200/80">
              {language === "bm"
                ? "Eksport data lawatan dalam format CSV (serasi Excel)."
                : "Export visit data in CSV format (Excel-compatible)."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" className="h-9 px-3" onClick={fetchDashboard} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">{language === "bm" ? "Muat Semula" : "Refresh"}</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Database className="w-5 h-5" />}
          color="cyan"
          value={dashboard?.counts.totalVisits ?? 0}
          label={language === "bm" ? "Jumlah Lawatan (30 hari)" : "Total Visits (30 days)"}
          loading={isLoading}
        />
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          color="emerald"
          value={dashboard?.counts.activeVisitors ?? 0}
          label={language === "bm" ? "Pelawat Aktif" : "Active Visitors"}
          loading={isLoading}
          pulse
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          value={dashboard?.counts.pendingApproval ?? 0}
          label={language === "bm" ? "Menunggu Kelulusan" : "Pending Approval"}
          loading={isLoading}
        />
        <SummaryCard
          icon={<Star className="w-5 h-5" />}
          color="purple"
          value={dashboard?.feedback.averageRating ?? 0}
          label={language === "bm" ? "Kepuasan Purata" : "Avg Satisfaction"}
          loading={isLoading}
          isRating
          sub={`${dashboard?.feedback.totalFeedback ?? 0} ${language === "bm" ? "ulasan" : "reviews"}`}
        />
      </div>

      {/* Export section */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {language === "bm" ? "Eksport Data Lawatan" : "Export Visit Data"}
            </h3>
            <p className="text-[11px] text-cyan-200/70">
              {language === "bm"
                ? "Pilih julat tarikh dan status untuk eksport data lawatan."
                : "Select date range and status to export visit data."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Date from */}
          <div className="space-y-1">
            <Label className="text-xs text-cyan-100 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-300" />
              {language === "bm" ? "Dari Tarikh" : "From Date"}
              <span className="text-red-400">*</span>
            </Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to}
              className="bg-white/10 border-white/20 text-white h-10 [color-scheme:dark]"
            />
          </div>
          {/* Date to */}
          <div className="space-y-1">
            <Label className="text-xs text-cyan-100 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-300" />
              {language === "bm" ? "Hingga Tarikh" : "To Date"}
              <span className="text-red-400">*</span>
            </Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from}
              max={format(new Date(), "yyyy-MM-dd")}
              className="bg-white/10 border-white/20 text-white h-10 [color-scheme:dark]"
            />
          </div>
          {/* Status filter */}
          <div className="space-y-1">
            <Label className="text-xs text-cyan-100 font-medium flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-300" />
              {language === "bm" ? "Status Lawatan" : "Visit Status"}
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "bm" ? "Semua Status" : "All Statuses"}</SelectItem>
                {Object.entries(VISIT_STATUS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {language === "bm" ? val.bm : val.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick date range buttons */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] text-cyan-200/60 uppercase tracking-wide font-semibold">
            {language === "bm" ? "Julat pantas:" : "Quick range:"}
          </span>
          {[
            { label: language === "bm" ? "Hari Ini" : "Today", days: 0 },
            { label: language === "bm" ? "7 Hari" : "7 Days", days: 7 },
            { label: language === "bm" ? "30 Hari" : "30 Days", days: 30 },
            { label: language === "bm" ? "90 Hari" : "90 Days", days: 90 },
            { label: language === "bm" ? "1 Tahun" : "1 Year", days: 365 },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                const today = format(new Date(), "yyyy-MM-dd");
                const start =
                  opt.days === 0
                    ? today
                    : format(subDays(new Date(), opt.days), "yyyy-MM-dd");
                setFrom(start);
                setTo(today);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs text-white hover:bg-white/20 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Selected range summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-cyan-300" />
            <div className="text-xs text-white">
              <span className="text-cyan-200/70">
                {language === "bm" ? "Julat terpilih: " : "Selected range: "}
              </span>
              <span className="font-semibold">
                {from ? format(new Date(from), "dd MMM yyyy") : "—"}
                {" → "}
                {to ? format(new Date(to), "dd MMM yyyy") : "—"}
              </span>
              {dateRangeLabel && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold">
                  {dateRangeLabel}
                </span>
              )}
            </div>
          </div>
          {status !== "all" && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
              {language === "bm"
                ? VISIT_STATUS[status as keyof typeof VISIT_STATUS]?.bm || status
                : VISIT_STATUS[status as keyof typeof VISIT_STATUS]?.en || status}
            </span>
          )}
        </div>

        {/* Export button + info */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-xs text-cyan-200/70">
            <Info className="w-3.5 h-3.5 text-cyan-300 mt-0.5 flex-shrink-0" />
            <span>
              {language === "bm"
                ? "Data akan dieksport dalam format CSV (serasi Excel). Fail akan dimuat turun automatik ke peranti anda. Termasuk maklumat pelawat, hos, status, dan maklum balas."
                : "Data will be exported in CSV format (Excel-compatible). File will download automatically to your device. Includes visitor, host, status, and feedback details."}
            </span>
          </div>
          <GlassButton
            variant="success"
            className="h-11 px-6 min-w-[180px]"
            onClick={handleExport}
            disabled={exporting || !from || !to}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting
              ? language === "bm"
                ? "Mengeksport..."
                : "Exporting..."
              : language === "bm"
              ? "Eksport CSV"
              : "Export CSV"}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Recent exports log */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {language === "bm" ? "Eksport Terkini" : "Recent Export"}
            </h3>
            <p className="text-[10px] text-cyan-200/60">
              {language === "bm"
                ? "Jejak eksport terbaru anda."
                : "Track your latest export."}
            </p>
          </div>
        </div>
        {lastExport ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium">
                {language === "bm" ? "Eksport berjaya" : "Export successful"}
              </div>
              <div className="text-[11px] text-cyan-200/70">
                {lastExport.rows.toLocaleString()}{" "}
                {language === "bm" ? "rekod" : "records"} ·{" "}
                {format(lastExport.at, "dd MMM yyyy, HH:mm:ss")}
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
            >
              {language === "bm" ? "Ulang" : "Repeat"}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3 text-cyan-200/60">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">
              {language === "bm"
                ? "Belum ada eksport dibuat dalam sesi ini."
                : "No exports made in this session yet."}
            </span>
          </div>
        )}
      </GlassCard>

      {/* CSV column reference */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {language === "bm" ? "Kandungan Fail CSV" : "CSV File Contents"}
            </h3>
            <p className="text-[10px] text-cyan-200/60">
              {language === "bm"
                ? "Lajur-lajur yang disertakan dalam eksport."
                : "Columns included in the export."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            "Reference Code",
            "Visitor Name",
            "IC/Passport",
            "Phone",
            "Email",
            "Company",
            "Purpose",
            "Host Staff",
            "Department",
            "Status",
            "Created At",
            "Approved At",
            "Checked In At",
            "Staff Verified At",
            "Staff Remarks",
            "Feedback Submitted At",
            "Rating",
            "Feedback Comments",
            "Checked Out At",
            "Exit Notes",
            "Rejection Reason",
          ].map((col) => (
            <div
              key={col}
              className="px-2 py-1.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/70 font-mono flex items-center gap-1.5"
            >
              <FileText className="w-3 h-3 text-cyan-300 flex-shrink-0" />
              <span className="truncate">{col}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ===== Sub-components =====

function SummaryCard({
  icon,
  color,
  value,
  label,
  loading,
  pulse,
  isRating,
  sub,
}: {
  icon: React.ReactNode;
  color: "cyan" | "emerald" | "amber" | "purple";
  value: number;
  label: string;
  loading: boolean;
  pulse?: boolean;
  isRating?: boolean;
  sub?: string;
}) {
  const colors = {
    cyan: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
    emerald: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    amber: "text-amber-300 bg-amber-500/15 border-amber-500/30",
    purple: "text-purple-300 bg-purple-500/15 border-purple-500/30",
  };
  return (
    <GlassCard hover className="p-4">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-9 h-9 rounded-lg border flex items-center justify-center relative",
            colors[color]
          )}
        >
          {icon}
          {pulse && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-7 w-16 rounded bg-white/10 animate-pulse" />
        ) : (
          <div className={cn("text-2xl font-bold tabular-nums", colors[color].split(" ")[0])}>
            {isRating ? value.toFixed(1) : value.toLocaleString()}
            {isRating && <span className="text-xs text-white/50"> / 5.0</span>}
          </div>
        )}
        <div className="text-[11px] text-white/70 mt-0.5 font-medium leading-tight">{label}</div>
        {sub && <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>}
      </div>
    </GlassCard>
  );
}
