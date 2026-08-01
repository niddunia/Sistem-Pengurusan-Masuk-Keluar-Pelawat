"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { StatusBadge } from "@/components/vms/StatusBadge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import {
  Clock,
  Users,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  RefreshCw,
  Phone,
  Building2,
  User,
  Calendar,
  ShieldCheck,
  MessageSquare,
  Star,
  Loader2,
  Activity,
  Eye,
  Ban,
} from "lucide-react";
import type { SecurityDashboardData, VisitList, DocLite } from "./_types";

const REFRESH_INTERVAL = 15_000;

export function SecurityDashboard() {
  const { language } = useUIStore();
  const { navigate } = useRouterStore();

  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");

  // Action state
  const [rejecting, setRejecting] = useState<VisitList | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [detailVisit, setDetailVisit] = useState<VisitList | null>(null);
  const [docViewer, setDocViewer] = useState<{ docs: DocLite[]; idx: number } | null>(null);

  const mounted = useRef(true);
  const inFlight = useRef(false);

  const fetchData = useCallback(
    async (silent = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (!silent) setRefreshing(true);
      try {
        const res = await fetch("/api/dashboard/security", { cache: "no-store" });
        const json = await res.json();
        if (!mounted.current) return;
        if (json.success) {
          setData(json.data);
          setLastUpdated(new Date());
        } else {
          toast.error(json.error || json.message || (language === "bm" ? "Gagal memuatkan dashboard." : "Failed to load dashboard."));
        }
      } catch {
        if (mounted.current) {
          toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
        }
      } finally {
        if (mounted.current) {
          setRefreshing(false);
          setLoading(false);
        }
        inFlight.current = false;
      }
    },
    [language]
  );

  useEffect(() => {
    mounted.current = true;
    fetchData();
    const id = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [fetchData]);

  // ===== Actions =====
  const handleApprove = async (visit: VisitList) => {
    setApprovingId(visit.id);
    try {
      const res = await fetch(`/api/visits/${visit.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          language === "bm"
            ? `${visit.visitor.fullName} diluluskan. Pelawat kini boleh check-in.`
            : `${visit.visitor.fullName} approved. Visitor can now check in.`
        );
        fetchData(true);
      } else {
        toast.error(json.error || json.message || (language === "bm" ? "Kelulusan gagal." : "Approval failed."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setApprovingId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    const reason = rejectReason.trim();
    if (reason.length < 5) {
      toast.error(language === "bm" ? "Sebab penolakan min 5 aksara." : "Reason min 5 chars.");
      return;
    }
    setRejectingId(rejecting.id);
    try {
      const res = await fetch(`/api/visits/${rejecting.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(language === "bm" ? "Permohonan ditolak." : "Application rejected.");
        setRejecting(null);
        setRejectReason("");
        fetchData(true);
      } else {
        toast.error(json.error || json.message || (language === "bm" ? "Penolakan gagal." : "Rejection failed."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setRejectingId(null);
    }
  };

  const handleExit = async (visit: VisitList) => {
    setExitingId(visit.id);
    try {
      const res = await fetch(`/api/visits/${visit.id}/exit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          language === "bm"
            ? `${visit.visitor.fullName} berjaya didaftarkan keluar.`
            : `${visit.visitor.fullName} successfully checked out.`
        );
        fetchData(true);
      } else if (res.status === 403) {
        toast.error(
          json.error || json.message ||
            (language === "bm" ? "Syarat keluar belum dipenuhi." : "Exit requirements not met.")
        );
      } else {
        toast.error(json.error || json.message || (language === "bm" ? "Pendaftaran keluar gagal." : "Exit failed."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setExitingId(null);
    }
  };

  // ===== Filtering =====
  const matchSearch = (v: VisitList) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      v.referenceCode.toLowerCase().includes(q) ||
      v.visitor.fullName.toLowerCase().includes(q) ||
      (v.visitor.company || "").toLowerCase().includes(q) ||
      (v.visitor.phone || "").toLowerCase().includes(q) ||
      (v.visitor.icPassportNo || "").toLowerCase().includes(q)
    );
  };

  const pending = data?.pendingApproval.filter(matchSearch) ?? [];
  const active = data?.activeVisitors.filter(matchSearch) ?? [];
  const readyExit = data?.readyForExit.filter(matchSearch) ?? [];
  const overstay = data?.overstayVisits.filter(matchSearch) ?? [];

  // ===== Render helpers =====
  const KpiCard = ({
    icon: Icon,
    label,
    value,
    color,
    pulse,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
    pulse?: boolean;
    onClick?: () => void;
  }) => (
    <GlassCard
      hover={!!onClick}
      onClick={onClick}
      className={cn("p-4 sm:p-5 relative overflow-hidden", onClick && "cursor-pointer")}
    >
      <div className={cn("absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-40", color)} />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-medium text-white/70 uppercase tracking-wide truncate">
            {label}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{value}</div>
        </div>
        <div
          className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
            color,
            pulse && value > 0 && "pulse-live"
          )}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </GlassCard>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 glass-card animate-pulse" />
          ))}
        </div>
        <div className="h-72 glass-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 view-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-300" />
            {t("secDashboard", language)}
          </h1>
          <p className="text-sm text-white/70 mt-1">
            {language === "bm"
              ? "Pusat kawalan pengawal keselamatan ADTEC Bintulu"
              : "Security guard control centre - ADTEC Bintulu"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-live" />
            <span className="text-xs font-semibold text-emerald-200">
              {language === "bm" ? "Langsung" : "Live"}
            </span>
            <span className="text-[10px] text-emerald-300/70">
              {lastUpdated ? format(lastUpdated, "HH:mm:ss") : "--"}
            </span>
          </div>
          <GlassButton
            variant="ghost"
            onClick={() => fetchData()}
            disabled={refreshing}
            className="min-h-[44px]"
            aria-label={t("refresh", language)}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">{t("refresh", language)}</span>
          </GlassButton>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          icon={Clock}
          label={t("pendingApprovals", language)}
          value={data?.counts.pendingApproval ?? 0}
          color="bg-amber-500/30 border border-amber-400/30"
          onClick={() => setTab("pending")}
        />
        <KpiCard
          icon={Users}
          label={t("activeVisitors", language)}
          value={data?.counts.activeVisitors ?? 0}
          color="bg-cyan-500/30 border border-cyan-400/30"
          onClick={() => setTab("active")}
        />
        <KpiCard
          icon={LogOut}
          label={t("readyExit", language)}
          value={data?.counts.readyForExit ?? 0}
          color="bg-emerald-500/30 border border-emerald-400/30"
          onClick={() => setTab("ready")}
        />
        <KpiCard
          icon={AlertTriangle}
          label={t("overstayAlert", language)}
          value={data?.counts.overstay ?? 0}
          color="bg-red-500/30 border border-red-400/30"
          pulse
          onClick={() => setTab("overstay")}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <GlassButton variant="primary" onClick={() => navigate("security-walkin")} className="min-h-[44px]">
          <User className="w-4 h-4" />
          {t("walkInReg", language)}
        </GlassButton>
        <GlassButton variant="success" onClick={() => navigate("security-exit")} className="min-h-[44px]">
          <LogOut className="w-4 h-4" />
          {t("allowExit", language)}
        </GlassButton>
        <GlassButton variant="outline" onClick={() => navigate("security-history")} className="min-h-[44px]">
          <Activity className="w-4 h-4" />
          {t("visitHistory", language)}
        </GlassButton>
      </div>

      {/* Search */}
      <GlassCard className="p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === "bm"
                ? "Cari nama / kod rujukan / syarikat / telefon..."
                : "Search name / reference / company / phone..."
            }
            className="pl-10 glass-input min-h-[44px]"
          />
        </div>
      </GlassCard>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex flex-wrap gap-1">
          <TabsTrigger value="pending" className="min-h-[40px] data-[state=active]:bg-amber-500/30 data-[state=active]:text-amber-100">
            <Clock className="w-4 h-4" />
            {t("pendingApprovals", language)}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px]">
              {pending.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="active" className="min-h-[40px] data-[state=active]:bg-cyan-500/30 data-[state=active]:text-cyan-100">
            <Users className="w-4 h-4" />
            {t("activeVisitors", language)}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 text-[10px]">
              {active.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="ready" className="min-h-[40px] data-[state=active]:bg-emerald-500/30 data-[state=active]:text-emerald-100">
            <LogOut className="w-4 h-4" />
            {t("readyExit", language)}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px]">
              {readyExit.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="overstay" className="min-h-[40px] data-[state=active]:bg-red-500/30 data-[state=active]:text-red-100">
            <AlertTriangle className="w-4 h-4" />
            {t("overstayAlert", language)}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-200 text-[10px]">
              {overstay.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Pending Approval */}
        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={language === "bm" ? "Tiada permohonan menunggu" : "No pending applications"}
              desc={
                language === "bm"
                  ? "Semua permohonan telah diproses."
                  : "All applications have been processed."
              }
            />
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {pending.map((v) => (
                <PendingCard
                  key={v.id}
                  visit={v}
                  language={language}
                  onApprove={() => handleApprove(v)}
                  onReject={() => {
                    setRejecting(v);
                    setRejectReason("");
                  }}
                  onViewDocs={(docs) => setDocViewer({ docs, idx: 0 })}
                  onViewDetail={() => setDetailVisit(v)}
                  approving={approvingId === v.id}
                  rejecting={rejectingId === v.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Visitors */}
        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <EmptyState
              icon={Users}
              title={language === "bm" ? "Tiada pelawat aktif" : "No active visitors"}
              desc={
                language === "bm"
                  ? "Tiada pelawat berada di dalam premis sekarang."
                  : "No visitors currently inside the premises."
              }
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {active.map((v) => (
                <ActiveCard
                  key={v.id}
                  visit={v}
                  language={language}
                  onViewDetail={() => setDetailVisit(v)}
                  onExit={() => handleExit(v)}
                  exiting={exitingId === v.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Ready For Exit */}
        <TabsContent value="ready" className="mt-4">
          {readyExit.length === 0 ? (
            <EmptyState
              icon={LogOut}
              title={language === "bm" ? "Tiada pelawat sedia keluar" : "No visitors ready for exit"}
              desc={
                language === "bm"
                  ? "Pelawat yang telah disahkan staf & memberi maklum balas akan muncul di sini."
                  : "Visitors verified by staff and who submitted feedback will appear here."
              }
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {readyExit.map((v) => (
                <ReadyExitCard
                  key={v.id}
                  visit={v}
                  language={language}
                  onExit={() => handleExit(v)}
                  exiting={exitingId === v.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Overstay */}
        <TabsContent value="overstay" className="mt-4">
          {overstay.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={language === "bm" ? "Tiada amaran overstay" : "No overstay alerts"}
              desc={
                language === "bm"
                  ? "Semua pelawat berada dalam tempoh masa yang sah."
                  : "All visitors are within their valid visit duration."
              }
              success
            />
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {overstay.map((v) => (
                <OverstayCard key={v.id} visit={v} language={language} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="glass-panel max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              {language === "bm" ? "Tolak Permohonan" : "Reject Application"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {rejecting && (
                <>
                  {rejecting.visitor.fullName} ·{" "}
                  <span className="font-mono text-xs">{rejecting.referenceCode}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reject-reason" className="text-white/80">
              {language === "bm" ? "Sebab Penolakan" : "Rejection Reason"}
              <span className="text-red-400"> *</span>
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={
                language === "bm"
                  ? "Nyatakan sebab penolakan (min 5 aksara)..."
                  : "State the reason for rejection (min 5 chars)..."
              }
              className="glass-input min-h-[100px] resize-none"
            />
            <div className="text-xs text-white/50 text-right">{rejectReason.length}/500</div>
          </div>
          <DialogFooter className="gap-2">
            <GlassButton variant="ghost" onClick={() => setRejecting(null)} className="min-h-[44px]">
              {t("cancel", language)}
            </GlassButton>
            <GlassButton
              variant="danger"
              onClick={confirmReject}
              disabled={rejectingId === rejecting?.id || rejectReason.trim().length < 5}
              className="min-h-[44px]"
            >
              {rejectingId === rejecting?.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {t("reject", language)}
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      <Dialog open={!!docViewer} onOpenChange={(o) => !o && setDocViewer(null)}>
        <DialogContent className="glass-panel max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-300" />
              {language === "bm" ? "Pralihat Dokumen" : "Document Preview"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {docViewer && docViewer.docs[docViewer.idx]?.fileName}
            </DialogDescription>
          </DialogHeader>
          {docViewer && docViewer.docs.length > 0 && (
            <DocumentPreview
              doc={docViewer.docs[docViewer.idx]}
              hasMultiple={docViewer.docs.length > 1}
              onPrev={() =>
                setDocViewer((d) =>
                  d ? { ...d, idx: (d.idx - 1 + d.docs.length) % d.docs.length } : d
                )
              }
              onNext={() =>
                setDocViewer((d) => (d ? { ...d, idx: (d.idx + 1) % d.docs.length } : d))
              }
              language={language}
            />
          )}
          <DialogFooter>
            {docViewer && docViewer.docs[docViewer.idx]?.filePath && (
              <a
                href={docViewer.docs[docViewer.idx].filePath}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-foreground border border-white/20 transition min-h-[44px]"
              >
                <FileText className="w-4 h-4" />
                {language === "bm" ? "Muat Turun" : "Download"}
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

function PendingCard({
  visit,
  language,
  onApprove,
  onReject,
  onViewDocs,
  onViewDetail,
  approving,
  rejecting,
}: {
  visit: VisitList;
  language: "bm" | "en";
  onApprove: () => void;
  onReject: () => void;
  onViewDocs: (docs: DocLite[]) => void;
  onViewDetail: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const docs = visit.documents || [];
  const firstDoc = docs[0];
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Document thumbnail */}
        <button
          onClick={() => docs.length > 0 && onViewDocs(docs)}
          disabled={docs.length === 0}
          className={cn(
            "shrink-0 w-full lg:w-32 h-24 lg:h-32 rounded-xl border border-white/20 flex flex-col items-center justify-center text-white/80 bg-white/5 hover:bg-white/10 transition",
            docs.length === 0 && "opacity-40 cursor-not-allowed"
          )}
          aria-label={language === "bm" ? "Lihat dokumen" : "View documents"}
        >
          {firstDoc?.mimeType?.startsWith("image/") && firstDoc.filePath ? (
            <img
              src={firstDoc.filePath}
              alt={firstDoc.fileName}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <>
              <FileText className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-medium">{docs.length} dokumen</span>
            </>
          )}
        </button>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <StatusBadge status={visit.status} language={language} />
            <span className="text-xs font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded">
              {visit.referenceCode}
            </span>
            {visit.pdpaConsent && (
              <span className="text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                PDPA ✓
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white">{visit.visitor.fullName}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-white/75 mt-2">
            <InfoLine icon={Building2} text={visit.visitor.company || "-"} />
            <InfoLine icon={User} text={visit.visitor.icPassportNo || "-"} />
            <InfoLine icon={Phone} text={visit.visitor.phone || "-"} />
            <InfoLine
              icon={User}
              text={`${visit.hostStaff.fullName}${
                visit.hostStaff.department ? ` · ${visit.hostStaff.department.name}` : ""
              }`}
            />
            <InfoLine icon={Calendar} text={format(new Date(visit.expectedVisitDate || visit.createdAt), "dd MMM yyyy, HH:mm")} />
            <InfoLine
              icon={Clock}
              text={formatDistanceToNow(new Date(visit.createdAt), { addSuffix: true })}
            />
          </div>
          <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] uppercase tracking-wide text-white/50 mb-0.5">
              {t("purpose", language)}
            </div>
            <div className="text-sm text-white/90 line-clamp-2">{visit.purpose}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex lg:flex-col gap-2 lg:w-40 shrink-0">
          <GlassButton variant="success" onClick={onApprove} disabled={approving || rejecting} className="flex-1 lg:flex-none min-h-[44px]">
            {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {t("approve", language)}
          </GlassButton>
          <GlassButton variant="danger" onClick={onReject} disabled={approving || rejecting} className="flex-1 lg:flex-none min-h-[44px]">
            <XCircle className="w-4 h-4" />
            {t("reject", language)}
          </GlassButton>
          <GlassButton variant="ghost" onClick={onViewDetail} className="flex-1 lg:flex-none min-h-[44px]">
            <Eye className="w-4 h-4" />
            <span className="hidden lg:inline">{t("viewDetails", language)}</span>
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}

function ActiveCard({
  visit,
  language,
  onViewDetail,
  onExit,
  exiting,
}: {
  visit: VisitList;
  language: "bm" | "en";
  onViewDetail: () => void;
  onExit: () => void;
  exiting: boolean;
}) {
  const staffVerified = !!visit.staffVerifiedAt;
  const feedbackSubmitted = !!visit.feedbackSubmittedAt;
  const checkedIn = visit.checkedInAt ? new Date(visit.checkedInAt) : null;
  const durationMin = checkedIn ? differenceInMinutes(new Date(), checkedIn) : 0;
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  const isOverstay = durationMin > 180; // >3h
  const canExit = staffVerified && feedbackSubmitted;

  return (
    <GlassCard className={cn("p-4 sm:p-5", isOverstay && "overstay-alert border-red-500/50")} hover>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={visit.status} language={language} />
          {isOverstay && (
            <span className="text-[10px] font-bold text-red-200 bg-red-600/40 border border-red-400/40 px-2 py-0.5 rounded-full animate-pulse">
              {t("overstayAlert", language)}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded">
          {visit.referenceCode}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white">{visit.visitor.fullName}</h3>
      <p className="text-sm text-white/70 mb-3">
        {visit.visitor.company || "-"} · {visit.hostStaff.fullName}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] uppercase tracking-wide text-white/50 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {language === "bm" ? "Daftar Masuk" : "Checked In"}
          </div>
          <div className="text-sm font-semibold text-white mt-0.5">
            {checkedIn ? format(checkedIn, "HH:mm") : "--"}
          </div>
          <div className="text-[10px] text-white/60">
            {hours > 0 ? `${hours}j ` : ""}
            {mins}m {language === "bm" ? "berjalan" : "elapsed"}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] uppercase tracking-wide text-white/50">
            {language === "bm" ? "Syarat Keluar" : "Exit Conditions"}
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <ConditionChip ok={staffVerified} label={t("staffVerified", language)} />
            <ConditionChip ok={feedbackSubmitted} label={t("feedbackCompleted", language)} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <GlassButton variant="ghost" onClick={onViewDetail} className="flex-1 min-h-[44px]">
          <Eye className="w-4 h-4" />
          {t("viewDetails", language)}
        </GlassButton>
        <GlassButton
          variant={canExit ? "success" : "ghost"}
          onClick={onExit}
          disabled={!canExit || exiting}
          className="flex-1 min-h-[44px]"
        >
          {exiting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {t("allowExit", language)}
        </GlassButton>
      </div>
    </GlassCard>
  );
}

function ReadyExitCard({
  visit,
  language,
  onExit,
  exiting,
}: {
  visit: VisitList;
  language: "bm" | "en";
  onExit: () => void;
  exiting: boolean;
}) {
  const rating = visit.feedback?.rating;
  return (
    <GlassCard className="p-4 sm:p-5 border-emerald-400/30" hover>
      <div className="flex items-start justify-between gap-2 mb-3">
        <StatusBadge status="ready_for_exit" language={language} />
        {rating != null && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "w-3.5 h-3.5",
                  s <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-white/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-white">{visit.visitor.fullName}</h3>
      <p className="text-sm text-white/70 mb-2">
        {visit.visitor.company || "-"} · {visit.hostStaff.fullName}
      </p>
      <div className="text-xs font-mono text-white/60 bg-white/10 px-2 py-1 rounded inline-block mb-3">
        {visit.referenceCode}
      </div>
      <div className="flex items-center gap-2 text-xs text-emerald-200 mb-3">
        <CheckCircle2 className="w-4 h-4" />
        <span>
          {language === "bm"
            ? "Semua syarat keluar dipenuhi"
            : "All exit conditions are met"}
        </span>
      </div>
      <GlassButton variant="success" onClick={onExit} disabled={exiting} className="w-full min-h-[48px] text-base">
        {exiting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
        {t("allowExit", language)}
      </GlassButton>
    </GlassCard>
  );
}

function OverstayCard({
  visit,
  language,
}: {
  visit: VisitList;
  language: "bm" | "en";
}) {
  const checkedIn = visit.checkedInAt ? new Date(visit.checkedInAt) : null;
  const durationMin = checkedIn ? differenceInMinutes(new Date(), checkedIn) : 0;
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  return (
    <GlassCard className="p-4 sm:p-5 overstay-alert border-red-500/50">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-red-500/30 border border-red-400/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-200" />
          </div>
          <div>
            <div className="font-bold text-red-100">{t("overstayAlert", language)}</div>
            <div className="text-xs text-red-300/70 font-mono">{visit.referenceCode}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-red-100">
            {hours}<span className="text-sm font-normal">j </span>
            {mins}<span className="text-sm font-normal">m</span>
          </div>
          <div className="text-[10px] text-red-300/70 uppercase">{language === "bm" ? "di dalam premis" : "in premises"}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <InfoLine icon={User} text={visit.visitor.fullName} />
        <InfoLine icon={Phone} text={visit.visitor.phone || "-"} />
        <InfoLine
          icon={Building2}
          text={visit.hostStaff?.fullName || "-"}
          label={language === "bm" ? "Staf Tuan Rumah" : "Host Staff"}
        />
        <InfoLine
          icon={Clock}
          text={checkedIn ? format(checkedIn, "dd MMM, HH:mm") : "-"}
          label={language === "bm" ? "Masa Masuk" : "Check-In Time"}
        />
      </div>
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
        <Phone className="w-4 h-4 text-red-200" />
        <span className="text-sm text-red-100">
          {language === "bm"
            ? "Hubungi staf tuan rumah untuk pengesahan keluar segera."
            : "Contact host staff for immediate exit verification."}
        </span>
      </div>
    </GlassCard>
  );
}

function VisitDetail({ visit, language }: { visit: VisitList; language: "bm" | "en" }) {
  return (
    <div className="space-y-4 text-white/90">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailField label={t("name", language)} value={visit.visitor.fullName} />
        <DetailField label={t("reference", language)} value={visit.referenceCode} mono />
        <DetailField label={t("company", language)} value={visit.visitor.company || "-"} />
        <DetailField label={t("icPassport", language)} value={visit.visitor.icPassportNo || "-"} />
        <DetailField label={t("phone", language)} value={visit.visitor.phone || "-"} />
        <DetailField
          label={t("hostStaff", language)}
          value={`${visit.hostStaff.fullName}${
            visit.hostStaff.department ? ` (${visit.hostStaff.department.name})` : ""
          }`}
        />
        <DetailField label={t("purpose", language)} value={visit.purpose} full />
        <DetailField
          label={t("expectedDate", language)}
          value={format(new Date(visit.expectedVisitDate || visit.createdAt), "dd MMM yyyy, HH:mm")}
        />
        <DetailField
          label={language === "bm" ? "Didaftarkan" : "Created"}
          value={format(new Date(visit.createdAt), "dd MMM yyyy, HH:mm")}
        />
        {visit.checkedInAt && (
          <DetailField
            label={language === "bm" ? "Daftar Masuk" : "Checked In"}
            value={format(new Date(visit.checkedInAt), "dd MMM yyyy, HH:mm")}
          />
        )}
        {visit.checkedOutAt && (
          <DetailField
            label={language === "bm" ? "Daftar Keluar" : "Checked Out"}
            value={format(new Date(visit.checkedOutAt), "dd MMM yyyy, HH:mm")}
          />
        )}
        {visit.rejectionReason && (
          <DetailField
            label={language === "bm" ? "Sebab Ditolak" : "Rejection Reason"}
            value={visit.rejectionReason}
            full
            danger
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

function DocumentPreview({
  doc,
  hasMultiple,
  onPrev,
  onNext,
  language,
}: {
  doc: DocLite;
  hasMultiple: boolean;
  onPrev: () => void;
  onNext: () => void;
  language: "bm" | "en";
}) {
  const isImage = doc.mimeType?.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf" || doc.filePath?.toLowerCase().endsWith(".pdf");

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden bg-black/30 border border-white/10 flex items-center justify-center min-h-[300px] max-h-[60vh]">
        {isImage && doc.filePath ? (
          <img src={doc.filePath} alt={doc.fileName} className="max-w-full max-h-[60vh] object-contain" />
        ) : isPdf && doc.filePath ? (
          <iframe src={doc.filePath} title={doc.fileName} className="w-full h-[60vh]" />
        ) : (
          <div className="p-8 text-center text-white/70">
            <FileText className="w-12 h-12 mx-auto mb-2 text-white/50" />
            <p className="text-sm text-white/80">{language === "bm" ? "Pratonton tidak tersedia" : "Preview not available"}</p>
            <a
              href={doc.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-cyan-300 hover:underline text-sm"
            >
              {language === "bm" ? "Buka fail" : "Open file"}
            </a>
          </div>
        )}
      </div>
      {hasMultiple && (
        <div className="flex items-center justify-between mt-3">
          <GlassButton variant="ghost" onClick={onPrev} className="min-h-[40px]">
            <span>←</span> {language === "bm" ? "Sebelum" : "Previous"}
          </GlassButton>
          <GlassButton variant="ghost" onClick={onNext} className="min-h-[40px]">
            {language === "bm" ? "Seterus" : "Next"} <span>→</span>
          </GlassButton>
        </div>
      )}
    </div>
  );
}

// ============== Tiny helpers ==============

function InfoLine({
  icon: Icon,
  text,
  label,
}: {
  icon: React.ElementType;
  text: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="w-3.5 h-3.5 text-white/60 shrink-0" />
      <span className="truncate text-white/90">
        {label && <span className="text-white/50 mr-1">{label}:</span>}
        {text}
      </span>
    </div>
  );
}

function ConditionChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cn("flex items-center gap-1 text-xs", ok ? "text-emerald-300" : "text-white/40")}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      <span className="truncate text-white/90">{label}</span>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono,
  full,
  danger,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={cn("p-2.5 rounded-lg bg-white/5 border border-white/10", full && "sm:col-span-2")}>
      <div className="text-[10px] uppercase tracking-wide text-white/50 mb-0.5">{label}</div>
      <div
        className={cn(
          "text-sm text-white",
          mono && "font-mono",
          danger && "text-red-300"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
  success,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  success?: boolean;
}) {
  return (
    <GlassCard className="p-8 sm:p-12 text-center">
      <div
        className={cn(
          "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
          success
            ? "bg-emerald-500/20 border border-emerald-400/30"
            : "bg-white/5 border border-white/10"
        )}
      >
        <Icon className={cn("w-8 h-8", success ? "text-emerald-300" : "text-white/50")} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-white/60 max-w-sm mx-auto">{desc}</p>
    </GlassCard>
  );
}
