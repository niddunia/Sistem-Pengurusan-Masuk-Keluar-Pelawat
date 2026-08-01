"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { StatusBadge } from "@/components/vms/StatusBadge";
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
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, subDays } from "date-fns";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  FileText,
  Download,
  Filter,
  Calendar,
  User,
  Building2,
  Phone,
  Star,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  DoorOpen,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import type { VisitList } from "./_types";

type StatusFilter = "all" | "checked_out" | "rejected" | "cancelled";
type RangeFilter = "today" | "7d" | "30d" | "all";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: StatusFilter; labelBm: string; labelEn: string }[] = [
  { value: "all", labelBm: "Semua", labelEn: "All" },
  { value: "checked_out", labelBm: "Telah Keluar", labelEn: "Checked Out" },
  { value: "rejected", labelBm: "Ditolak", labelEn: "Rejected" },
  { value: "cancelled", labelBm: "Dibatalkan", labelEn: "Cancelled" },
];

const RANGE_OPTIONS: { value: RangeFilter; labelBm: string; labelEn: string }[] = [
  { value: "today", labelBm: "Hari Ini", labelEn: "Today" },
  { value: "7d", labelBm: "7 Hari", labelEn: "7 Days" },
  { value: "30d", labelBm: "30 Hari", labelEn: "30 Days" },
  { value: "all", labelBm: "Semua Masa", labelEn: "All Time" },
];

export function StaffHistory() {
  const { language } = useUIStore();
  const { back } = useRouterStore();

  const [visits, setVisits] = useState<VisitList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("30d");
  const [page, setPage] = useState(1);
  const [detailVisit, setDetailVisit] = useState<VisitList | null>(null);

  const mounted = useRef(true);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (search.trim()) params.set("search", search.trim());
        const url = `/api/visits/list?${params.toString()}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!mounted.current) return;
        if (json.success && Array.isArray(json.data)) {
          setVisits(json.data);
        } else {
          toast.error(
            json.error ||
              json.message ||
              (language === "bm" ? "Gagal memuatkan data." : "Failed to load data.")
          );
        }
      } catch {
        if (mounted.current) {
          toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [statusFilter, search, language]
  );

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => {
      mounted.current = false;
    };
  }, [statusFilter, search]);

  // Date range filter (client-side)
  const filteredByDate = useMemo(() => {
    if (rangeFilter === "all") return visits;
    if (rangeFilter === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return visits.filter((v) => new Date(v.createdAt) >= todayStart);
    }
    const days = rangeFilter === "7d" ? 7 : 30;
    const cutoff = subDays(new Date(), days);
    return visits.filter((v) => new Date(v.createdAt) >= cutoff);
  }, [visits, rangeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredByDate.length;
    const ratings = filteredByDate
      .map((v) => v.feedback?.rating)
      .filter((r): r is number => typeof r === "number");
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : "—";
    const withFeedback = ratings.length;
    return { total, avgRating, withFeedback };
  }, [filteredByDate]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredByDate.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredByDate.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, rangeFilter, search]);

  const exportCsv = () => {
    if (filteredByDate.length === 0) {
      toast.error(language === "bm" ? "Tiada data untuk dieksport." : "No data to export.");
      return;
    }
    const headers = [
      "Reference",
      "Visitor",
      "IC/Passport",
      "Phone",
      "Company",
      "Purpose",
      "Host Staff",
      "Department",
      "Status",
      "Created",
      "Checked In",
      "Verified",
      "Checked Out",
      "Rating",
    ];
    const rows = filteredByDate.map((v) => [
      v.referenceCode,
      v.visitor.fullName,
      v.visitor.icPassportNo || "",
      v.visitor.phone || "",
      v.visitor.company || "",
      v.purpose,
      v.hostStaff?.fullName || "",
      v.hostStaff?.department?.name || "",
      v.status,
      v.createdAt ? format(new Date(v.createdAt), "yyyy-MM-dd HH:mm") : "",
      v.checkedInAt ? format(new Date(v.checkedInAt), "yyyy-MM-dd HH:mm") : "",
      v.staffVerifiedAt ? format(new Date(v.staffVerifiedAt), "yyyy-MM-dd HH:mm") : "",
      v.checkedOutAt ? format(new Date(v.checkedOutAt), "yyyy-MM-dd HH:mm") : "",
      v.feedback?.rating != null ? String(v.feedback.rating) : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      language === "bm"
        ? `${filteredByDate.length} rekod dieksport.`
        : `${filteredByDate.length} records exported.`
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 view-enter">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={back}
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition min-h-[40px] px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back", language)}
        </button>
        <button
          onClick={() => fetchData()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition min-h-[40px] px-2"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          <span className="hidden sm:inline">{t("refresh", language)}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <History className="w-7 h-7 text-cyan-300" />
            {t("visitHistory", language)}
          </h1>
          <p className="text-sm text-white/70 mt-1">
            {language === "bm"
              ? "Semua rekod lawatan yang anda urus"
              : "All visit records you have handled"}
          </p>
        </div>
        <GlassButton variant="ghost" onClick={exportCsv} className="min-h-[44px]">
          <Download className="w-4 h-4" />
          {t("export", language)}
        </GlassButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-white/50">
              {language === "bm" ? "Jumlah Lawatan" : "Total Visits"}
            </div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-white/50">
              {language === "bm" ? "Purata Penilaian" : "Average Rating"}
            </div>
            <div className="text-2xl font-bold text-amber-200 flex items-center gap-1.5">
              {stats.avgRating}
              {stats.avgRating !== "—" && <span className="text-sm text-white/50">/ 5</span>}
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-white/50">
              {language === "bm" ? "Maklum Balas Diterima" : "Feedback Received"}
            </div>
            <div className="text-2xl font-bold text-emerald-200">{stats.withFeedback}</div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                language === "bm"
                  ? "Cari nama / kod rujukan / telefon..."
                  : "Search name / reference / phone..."
              }
              className="pl-10 glass-input min-h-[44px]"
            />
          </div>

          {/* Status filter */}
          <div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="glass-input min-h-[44px] w-full">
                <Filter className="w-4 h-4 mr-1.5 text-white/50" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {language === "en" ? o.labelEn : o.labelBm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div>
            <Select
              value={rangeFilter}
              onValueChange={(v) => setRangeFilter(v as RangeFilter)}
            >
              <SelectTrigger className="glass-input min-h-[44px] w-full">
                <Calendar className="w-4 h-4 mr-1.5 text-white/50" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {language === "en" ? o.labelEn : o.labelBm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-3 text-xs text-white/60 flex items-center gap-2">
          <span>
            {loading
              ? language === "bm"
                ? "Memuatkan..."
                : "Loading..."
              : language === "bm"
              ? `${filteredByDate.length} rekod dijumpai`
              : `${filteredByDate.length} records found`}
          </span>
          {refreshing && !loading && (
            <Loader2 className="w-3 h-3 animate-spin text-white/40" />
          )}
        </div>
      </GlassCard>

      {/* Results */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 glass-card animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <GlassCard className="p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 mx-auto mb-4 flex items-center justify-center">
            <History className="w-7 h-7 text-white/40" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {language === "bm" ? "Tiada rekod dijumpai" : "No records found"}
          </h3>
          <p className="text-sm text-white/60">
            {language === "bm"
              ? "Cuba ubah penapis atau kata carian."
              : "Try changing filters or search keywords."}
          </p>
        </GlassCard>
      ) : (
        <>
          {/* Desktop table */}
          <GlassCard className="p-0 overflow-hidden hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70 font-semibold">{t("reference", language)}</TableHead>
                  <TableHead className="text-white/70 font-semibold">{t("name", language)}</TableHead>
                  <TableHead className="text-white/70 font-semibold">{t("purpose", language)}</TableHead>
                  <TableHead className="text-white/70 font-semibold">{t("status", language)}</TableHead>
                  <TableHead className="text-white/70 font-semibold">
                    {language === "bm" ? "Dibuat" : "Created"}
                  </TableHead>
                  <TableHead className="text-white/70 font-semibold">
                    {language === "bm" ? "Keluar" : "Checked Out"}
                  </TableHead>
                  <TableHead className="text-white/70 font-semibold">{t("rating", language)}</TableHead>
                  <TableHead className="text-white/70 font-semibold text-right">
                    {t("actions", language)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((v) => (
                  <TableRow
                    key={v.id}
                    className="border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => setDetailVisit(v)}
                  >
                    <TableCell className="font-mono text-xs text-cyan-300">
                      {v.referenceCode}
                    </TableCell>
                    <TableCell className="text-xs text-white/90">
                      <div className="font-medium text-white">{v.visitor.fullName}</div>
                      <div className="text-xs text-white/50">{v.visitor.company || "-"}</div>
                    </TableCell>
                    <TableCell className="text-white/80 max-w-[200px] truncate" title={v.purpose}>
                      {v.purpose}
                    </TableCell>
                    <TableCell className="text-xs text-white/90">
                      <StatusBadge status={v.status} language={language} />
                    </TableCell>
                    <TableCell className="text-xs text-white/70">
                      {format(new Date(v.createdAt), "dd MMM yyyy")}
                      <div className="text-[10px] text-white/40">
                        {format(new Date(v.createdAt), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-white/70">
                      {v.checkedOutAt ? (
                        <>
                          {format(new Date(v.checkedOutAt), "dd MMM yyyy")}
                          <div className="text-[10px] text-white/40">
                            {format(new Date(v.checkedOutAt), "HH:mm")}
                          </div>
                        </>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-white/90">
                      {v.feedback?.rating != null ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm text-white">{v.feedback.rating}</span>
                        </div>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailVisit(v);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-xs text-white/80 transition min-h-[36px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("viewDetails", language)}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {paginated.map((v) => (
              <GlassCard
                key={v.id}
                className="p-3 sm:p-4"
                hover
                onClick={() => setDetailVisit(v)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{v.visitor.fullName}</div>
                    <div className="text-[10px] font-mono text-cyan-300">{v.referenceCode}</div>
                  </div>
                  <StatusBadge status={v.status} language={language} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/70 mb-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <Building2 className="w-3 h-3 text-white/40 shrink-0" />
                    <span className="truncate text-white/90">{v.visitor.company || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <User className="w-3 h-3 text-white/40 shrink-0" />
                    <span className="truncate text-white/90">{v.hostStaff?.fullName || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-white/40" />
                    {format(new Date(v.createdAt), "dd MMM, HH:mm")}
                  </div>
                  {v.checkedOutAt && (
                    <div className="flex items-center gap-1">
                      <DoorOpen className="w-3 h-3 text-white/40" />
                      {format(new Date(v.checkedOutAt), "dd MMM, HH:mm")}
                    </div>
                  )}
                  {v.feedback?.rating != null && (
                    <div className="flex items-center gap-1 text-amber-200">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {v.feedback.rating}/5
                    </div>
                  )}
                </div>
                <div className="text-xs text-white/60 line-clamp-2 italic">"{v.purpose}"</div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailVisit(v);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white/80 min-h-[36px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("viewDetails", language)}
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/60">
                {language === "bm"
                  ? `Halaman ${currentPage} / ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-sm text-white/80 transition disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("previous", language)}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-sm text-white/80 transition disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px]"
                >
                  {t("next", language)}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailVisit} onOpenChange={(o) => !o && setDetailVisit(null)}>
        <DialogContent className="glass-panel max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-300" />
              {language === "bm" ? "Butiran Lawatan" : "Visit Details"}
            </DialogTitle>
            <DialogDescription className="text-white/70 font-mono text-xs">
              {detailVisit?.referenceCode}
            </DialogDescription>
          </DialogHeader>
          {detailVisit && <VisitDetail visit={detailVisit} language={language} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== Sub-components ==============

function VisitDetail({ visit, language }: { visit: VisitList; language: "bm" | "en" }) {
  const timeline: { label: string; time?: string | null; icon: React.ElementType; color: string }[] = [
    {
      label: language === "bm" ? "Didaftarkan" : "Registered",
      time: visit.createdAt,
      icon: FileText,
      color: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
    },
    {
      label: language === "bm" ? "Diluluskan" : "Approved",
      time: visit.approvedAt,
      icon: CheckCircle2,
      color: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    },
    {
      label: language === "bm" ? "Daftar Masuk" : "Checked In",
      time: visit.checkedInAt,
      icon: DoorOpen,
      color: "text-blue-300 bg-blue-500/15 border-blue-500/30",
    },
    {
      label: language === "bm" ? "Disahkan Staf" : "Staff Verified",
      time: visit.staffVerifiedAt,
      icon: ClipboardCheck,
      color: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
    },
    {
      label: language === "bm" ? "Maklum Balas Diterima" : "Feedback Received",
      time: visit.feedbackSubmittedAt,
      icon: MessageSquare,
      color: "text-amber-300 bg-amber-500/15 border-amber-500/30",
    },
    {
      label: language === "bm" ? "Daftar Keluar" : "Checked Out",
      time: visit.checkedOutAt,
      icon: CheckCircle2,
      color: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    },
  ];

  return (
    <div className="space-y-4 text-white/90">
      {/* Status & rejection */}
      <div className="flex items-start gap-3 flex-wrap">
        <StatusBadge status={visit.status} language={language} />
        {visit.rejectionReason && (
          <div className="flex-1 min-w-[200px] p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-200">
            <div className="font-semibold mb-0.5 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              {language === "bm" ? "Sebab Ditolak:" : "Rejection Reason:"}
            </div>
            {visit.rejectionReason}
          </div>
        )}
      </div>

      {/* Visitor info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailField label={t("name", language)} value={visit.visitor.fullName} icon={User} />
        <DetailField label={t("reference", language)} value={visit.referenceCode} mono />
        <DetailField label={t("icPassport", language)} value={visit.visitor.icPassportNo || "-"} icon={User} />
        <DetailField label={t("phone", language)} value={visit.visitor.phone || "-"} icon={Phone} />
        <DetailField label={t("company", language)} value={visit.visitor.company || "-"} icon={Building2} />
        <DetailField
          label={t("hostStaff", language)}
          value={`${visit.hostStaff?.fullName || "-"}${
            visit.hostStaff?.department ? ` (${visit.hostStaff.department.name})` : ""
          }`}
          icon={User}
        />
        <DetailField
          label={t("expectedDate", language)}
          value={
            visit.expectedVisitDate
              ? format(new Date(visit.expectedVisitDate), "dd MMM yyyy, HH:mm")
              : "-"
          }
          icon={Calendar}
        />
        <DetailField
          label={language === "bm" ? "Didaftarkan" : "Created"}
          value={format(new Date(visit.createdAt), "dd MMM yyyy, HH:mm")}
          icon={Clock}
        />
        {visit.approvedBy?.fullName && (
          <DetailField
            label={language === "bm" ? "Diluluskan Oleh" : "Approved By"}
            value={visit.approvedBy.fullName}
            icon={CheckCircle2}
          />
        )}
        {visit.exitConfirmedBy?.fullName && visit.checkedOutAt && (
          <DetailField
            label={language === "bm" ? "Pengesah Keluar" : "Exit Confirmed By"}
            value={visit.exitConfirmedBy.fullName}
            icon={DoorOpen}
          />
        )}
        <DetailField label={t("purpose", language)} value={visit.purpose} icon={FileText} full />
        {visit.staffRemarks && (
          <DetailField
            label={language === "bm" ? "Catatan Urusan Anda" : "Your Verification Remarks"}
            value={visit.staffRemarks}
            icon={ClipboardCheck}
            full
          />
        )}
        {visit.exitNotes && (
          <DetailField
            label={language === "bm" ? "Nota Keluar" : "Exit Notes"}
            value={visit.exitNotes}
            full
          />
        )}
      </div>

      {/* Timeline */}
      <div>
        <div className="text-xs uppercase tracking-wide text-white/50 mb-2">
          {language === "bm" ? "Garis Masa Audit" : "Audit Timeline"}
        </div>
        <div className="space-y-2">
          {timeline.map((ev, idx) => {
            const Icon = ev.icon;
            const isDone = !!ev.time;
            return (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                    isDone ? ev.color : "bg-white/5 border-white/10 text-white/30"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm", isDone ? "text-white" : "text-white/40")}>
                    {ev.label}
                  </div>
                  {ev.time && (
                    <div className="text-xs text-white/50">
                      {format(new Date(ev.time), "dd MMM yyyy, HH:mm")} ·{" "}
                      <span className="text-white/40">
                        {formatDistanceToNow(new Date(ev.time), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-white/20 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {visit.feedback && (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs uppercase tracking-wide text-white/50 mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {t("rating", language)}
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "w-5 h-5",
                  s <= visit.feedback!.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-white/30"
                )}
              />
            ))}
            <span className="text-sm text-white/70 ml-2">{visit.feedback.rating}/5</span>
          </div>
          {visit.feedback.comments && (
            <p className="mt-2 text-sm text-white/80 italic">"{visit.feedback.comments}"</p>
          )}
        </div>
      )}

      {/* Documents */}
      {visit.documents && visit.documents.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50 mb-2">
            {language === "bm" ? "Dokumen" : "Documents"} ({visit.documents.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {visit.documents.map((d) => (
              <a
                key={d.id}
                href={d.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-white/80"
              >
                <FileText className="w-4 h-4 text-cyan-300" />
                <span className="truncate max-w-[180px]">{d.fileName}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  value,
  icon: Icon,
  mono,
  full,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-2.5 rounded-lg bg-white/5 border border-white/10",
        full && "sm:col-span-2"
      )}
    >
      <div className="text-[10px] uppercase tracking-wide text-white/50 mb-0.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className={cn("text-sm text-white break-words", mono && "font-mono")}>{value}</div>
    </div>
  );
}
