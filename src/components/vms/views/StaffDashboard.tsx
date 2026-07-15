"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { StatusBadge } from "@/components/vms/StatusBadge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  ClipboardCheck,
  Users,
  Star,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  History,
  Loader2,
  RefreshCw,
  Building2,
  Mail,
  CalendarClock,
  ChevronRight,
  Bell,
  Inbox,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import type {
  StaffDashboardData,
  StaffWaitingVisit,
  DocLite,
} from "./_types";

const REFRESH_INTERVAL = 20_000;
const REMARKS_MIN = 5;

export function StaffDashboard() {
  const { language } = useUIStore();
  const { navigate } = useRouterStore();
  const { data: session } = useSession();

  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Action state
  const [verifying, setVerifying] = useState<StaffWaitingVisit | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [docViewer, setDocViewer] = useState<{ docs: DocLite[]; idx: number } | null>(null);

  const mounted = useRef(true);
  const inFlight = useRef(false);

  const fetchData = useCallback(
    async (silent = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (!silent) setRefreshing(true);
      try {
        const res = await fetch("/api/dashboard/staff", { cache: "no-store" });
        const json = await res.json();
        if (!mounted.current) return;
        if (json.success) {
          setData(json.data);
          setLastUpdated(new Date());
        } else {
          toast.error(
            json.error ||
              json.message ||
              (language === "bm" ? "Gagal memuatkan dashboard." : "Failed to load dashboard.")
          );
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

  // ===== Verify action =====
  const openVerifyDialog = (visit: StaffWaitingVisit) => {
    setVerifying(visit);
    setRemarks("");
  };

  const closeVerifyDialog = () => {
    if (submitting) return;
    setVerifying(null);
    setRemarks("");
  };

  const submitVerify = async () => {
    if (!verifying) return;
    const trimmed = remarks.trim();
    if (trimmed.length < REMARKS_MIN) {
      toast.error(
        language === "bm"
          ? `Catatan urusan wajib (minimum ${REMARKS_MIN} aksara).`
          : `Remarks required (min ${REMARKS_MIN} characters).`
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/visits/${verifying.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          language === "bm"
            ? "Urusan disahkan selesai. Pelawat diminta mengisi maklum balas."
            : "Visit verified. Visitor asked to submit feedback."
        );
        setVerifying(null);
        setRemarks("");
        fetchData(true);
      } else {
        toast.error(json.error || json.message || (language === "bm" ? "Gagal mengesahkan." : "Verification failed."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const remarksValid = remarks.trim().length >= REMARKS_MIN;
  const staffName = session?.user?.name || "";

  return (
    <div className="space-y-4 sm:space-y-6 view-enter">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-cyan-300" />
            {language === "bm" ? "Dashboard Staf" : "Staff Dashboard"}
          </h1>
          <p className="text-sm text-white/70 mt-1">
            {language === "bm"
              ? "Urus pengesahan urusan pelawat yang menemui anda"
              : "Manage verifications for visitors assigned to you"}
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition min-h-[40px] px-2"
          aria-label={t("refresh", language)}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          <span className="hidden sm:inline">{t("refresh", language)}</span>
        </button>
      </div>

      {/* ===== Welcome banner + stats ===== */}
      <GlassCard className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-300/80 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("staff", language)}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
              {t("welcome", language)}
              {staffName ? `, ${staffName}` : ""}
            </h2>
            <p className="text-sm text-white/70 mt-1">
              {lastUpdated ? (
                <>
                  <Clock className="w-3.5 h-3.5 inline mr-1.5 text-white/50" />
                  {language === "bm" ? "Dikemas kini" : "Last updated"}{" "}
                  {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {language === "bm" ? "Memuatkan..." : "Loading..."}
                </span>
              )}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard
              label={language === "bm" ? "Menunggu Saya" : "Waiting For Me"}
              value={data?.counts.waiting ?? 0}
              icon={Clock}
              tone="amber"
              language={language}
            />
            <StatCard
              label={language === "bm" ? "Baru Disahkan" : "Recently Verified"}
              value={data?.counts.inProgress ?? 0}
              icon={CheckCircle2}
              tone="emerald"
              language={language}
            />
            <StatCard
              label={language === "bm" ? "Jumlah Lawatan" : "Total Visits"}
              value={data?.counts.history ?? 0}
              icon={History}
              tone="cyan"
              language={language}
            />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <GlassButton
            variant="ghost"
            onClick={() => navigate("staff-history")}
            className="min-h-[44px] text-sm"
          >
            <History className="w-4 h-4" />
            {t("visitHistory", language)}
          </GlassButton>
          {data && data.counts.unreadNotifications > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold">
              <Bell className="w-3.5 h-3.5" />
              {data.counts.unreadNotifications}{" "}
              {language === "bm" ? "notifikasi belum dibaca" : "unread notifications"}
            </span>
          )}
        </div>
      </GlassCard>

      {/* ===== Section 1: Waiting ===== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-300" />
            {language === "bm" ? "Pelawat Menunggu Pengesahan" : "Visitors Awaiting Verification"}
            {data && data.waiting.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
                {data.waiting.length}
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 glass-card animate-pulse" />
            ))}
          </div>
        ) : !data || data.waiting.length === 0 ? (
          <GlassCard className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/20 mx-auto mb-4 flex items-center justify-center">
              <Inbox className="w-7 h-7 text-emerald-300" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-1">
              {language === "bm" ? "Tiada pelawat menunggu pengesahan" : "No visitors awaiting verification"}
            </h4>
            <p className="text-sm text-white/60">
              {language === "bm"
                ? "Semua urusan pelawat anda telah disahkan. Semak semula nanti."
                : "All your visitor matters are verified. Check again later."}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            {data.waiting.map((visit) => (
              <WaitingCard
                key={visit.id}
                visit={visit}
                language={language}
                onVerify={() => openVerifyDialog(visit)}
                onOpenDocs={(docs, idx) => setDocViewer({ docs, idx })}
              />
            ))}
          </div>
        )}
      </section>

      {/* ===== Section 2: Recently verified ===== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            {language === "bm" ? "Baru Disahkan" : "Recently Verified"}
            {data && data.inProgress.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                {data.inProgress.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => navigate("staff-history")}
            className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200 transition min-h-[40px] px-2"
          >
            {language === "bm" ? "Lihat semua" : "View all"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 glass-card animate-pulse" />
            ))}
          </div>
        ) : !data || data.inProgress.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-white/60">
              {language === "bm"
                ? "Belum ada lawatan yang anda sahahkan baru-baru ini."
                : "No visits verified by you recently."}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {data.inProgress.map((visit) => (
              <VerifiedRow key={visit.id} visit={visit} language={language} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Verification Dialog ===== */}
      <Dialog open={!!verifying} onOpenChange={(o) => !o && closeVerifyDialog()}>
        <DialogContent className="glass-panel max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-cyan-300" />
              {language === "bm" ? "Sahkan Urusan Selesai" : "Verify Visit Completion"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {language === "bm"
                ? "Sahkan urusan pelawat telah selesai. Catatan wajib untuk jejak audit."
                : "Confirm visitor's matter is complete. Remarks are mandatory for audit trail."}
            </DialogDescription>
          </DialogHeader>

          {verifying && (
            <div className="space-y-4">
              {/* Visitor summary */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{verifying.visitor.fullName}</div>
                    <div className="text-xs font-mono text-cyan-300">{verifying.referenceCode}</div>
                  </div>
                  <StatusBadge status={verifying.status} language={language} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-white/70">
                  {verifying.visitor.company && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="truncate">{verifying.visitor.company}</span>
                    </div>
                  )}
                  {verifying.visitor.phone && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="truncate">{verifying.visitor.phone}</span>
                    </div>
                  )}
                  {verifying.checkedInAt && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CalendarClock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="truncate">
                        {language === "bm" ? "Masuk" : "In"}: {format(new Date(verifying.checkedInAt), "dd MMM, HH:mm")}
                      </span>
                    </div>
                  )}
                  {verifying.visitor.email && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="truncate">{verifying.visitor.email}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-wide text-white/50 mb-0.5">
                    {t("purpose", language)}
                  </div>
                  <div className="text-sm text-white/90 italic">"{verifying.purpose}"</div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-white/90 text-sm flex items-center gap-1.5">
                  {language === "bm" ? "Catatan Urusan (wajib)" : "Remarks (mandatory)"}
                  <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    language === "bm"
                      ? "Cth: Mesyuarat perbincangan kontrak pembekal telah selesai. Dokumen diserahkan dan akan ditindak lanjut."
                      : "E.g.: Meeting on supplier contract concluded. Documents handed over for follow-up."
                  }
                  rows={4}
                  maxLength={1000}
                  className="glass-input min-h-[120px] resize-y"
                  disabled={submitting}
                />
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      remarks.trim().length >= REMARKS_MIN ? "text-emerald-300" : "text-white/50"
                    )}
                  >
                    {remarks.trim().length >= REMARKS_MIN ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {language === "bm"
                      ? `Minimum ${REMARKS_MIN} aksara`
                      : `Minimum ${REMARKS_MIN} characters`}
                  </span>
                  <span className="text-white/40">{remarks.length}/1000</span>
                </div>
                <p className="text-xs text-amber-200/80 flex items-start gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    {language === "bm"
                      ? "Catatan ini akan direkodkan ke jejak audit (AuditLog) sebagai bukti pengesahan urusan dilakukan oleh anda."
                      : "These remarks will be recorded in the audit trail as proof of your verification."}
                  </span>
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <GlassButton variant="ghost" onClick={closeVerifyDialog} disabled={submitting} className="min-h-[44px]">
              {t("cancel", language)}
            </GlassButton>
            <GlassButton
              variant="success"
              onClick={submitVerify}
              disabled={!remarksValid || submitting}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === "bm" ? "Mengesahkan..." : "Verifying..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {language === "bm" ? "Sahkan" : "Verify"}
                </>
              )}
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Document Viewer Dialog ===== */}
      <Dialog open={!!docViewer} onOpenChange={(o) => !o && setDocViewer(null)}>
        <DialogContent className="glass-panel max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-300" />
              {language === "bm" ? "Pengasan Dokumen" : "Document Viewer"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {docViewer && (
                <span>
                  {docViewer.idx + 1} / {docViewer.docs.length}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {docViewer && (
            <div className="space-y-3">
              {docViewer.docs[docViewer.idx] && (
                <>
                  {docViewer.docs[docViewer.idx].mimeType.startsWith("image/") ? (
                    <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                      <img
                        src={docViewer.docs[docViewer.idx].filePath}
                        alt={docViewer.docs[docViewer.idx].fileName}
                        className="w-full h-auto max-h-[60vh] object-contain bg-white"
                      />
                    </div>
                  ) : (
                    <iframe
                      src={docViewer.docs[docViewer.idx].filePath}
                      title={docViewer.docs[docViewer.idx].fileName}
                      className="w-full h-[60vh] rounded-xl bg-white border border-white/10"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-white/70 truncate flex items-center gap-1.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      <span className="truncate">{docViewer.docs[docViewer.idx].fileName}</span>
                    </div>
                    <a
                      href={docViewer.docs[docViewer.idx].filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-300 hover:text-cyan-200 transition shrink-0 min-h-[36px] inline-flex items-center px-2"
                    >
                      {language === "bm" ? "Buka tab baharu" : "Open in new tab"}
                    </a>
                  </div>
                </>
              )}
              {docViewer.docs.length > 1 && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <GlassButton
                    variant="ghost"
                    onClick={() =>
                      setDocViewer({
                        docs: docViewer.docs,
                        idx: (docViewer.idx - 1 + docViewer.docs.length) % docViewer.docs.length,
                      })
                    }
                    className="min-h-[40px] text-sm"
                  >
                    {language === "bm" ? "Sebelumnya" : "Previous"}
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    onClick={() =>
                      setDocViewer({
                        docs: docViewer.docs,
                        idx: (docViewer.idx + 1) % docViewer.docs.length,
                      })
                    }
                    className="min-h-[40px] text-sm"
                  >
                    {language === "bm" ? "Seterusnya" : "Next"}
                  </GlassButton>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== Sub-components ==============

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  language,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: "amber" | "emerald" | "cyan";
  language: "bm" | "en";
}) {
  const toneClasses = {
    amber: {
      wrap: "bg-amber-500/10 border-amber-400/25",
      icon: "bg-amber-500/20 text-amber-300",
      value: "text-amber-200",
    },
    emerald: {
      wrap: "bg-emerald-500/10 border-emerald-400/25",
      icon: "bg-emerald-500/20 text-emerald-300",
      value: "text-emerald-200",
    },
    cyan: {
      wrap: "bg-cyan-500/10 border-cyan-400/25",
      icon: "bg-cyan-500/20 text-cyan-300",
      value: "text-cyan-200",
    },
  }[tone];

  return (
    <div className={cn("rounded-xl border p-3 sm:p-3.5", toneClasses.wrap)}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", toneClasses.icon)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-[10px] sm:text-xs uppercase tracking-wide text-white/60 font-medium leading-tight line-clamp-2">
          {label}
        </div>
      </div>
      <div className={cn("text-2xl sm:text-3xl font-bold leading-none", toneClasses.value)}>
        {value}
      </div>
      {language === "bm" && value === 1 && (
        <div className="text-[10px] text-white/40 mt-1">rekod</div>
      )}
    </div>
  );
}

function WaitingCard({
  visit,
  language,
  onVerify,
  onOpenDocs,
}: {
  visit: StaffWaitingVisit;
  language: "bm" | "en";
  onVerify: () => void;
  onOpenDocs: (docs: DocLite[], idx: number) => void;
}) {
  const docs = visit.documents || [];
  const checkedIn = visit.checkedInAt ? new Date(visit.checkedInAt) : null;
  const minutesAgo = checkedIn ? differenceInMinutes(new Date(), checkedIn) : 0;
  const isOverdue = minutesAgo > 120; // >2h waiting for verification

  return (
    <GlassCard
      className={cn(
        "p-4 sm:p-5",
        isOverdue && "ring-2 ring-amber-400/40 overstay-alert"
      )}
      hover
    >
      {/* Top: name + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-lg sm:text-xl font-bold text-white truncate">
            {visit.visitor.fullName}
          </h4>
          <div className="text-xs font-mono text-cyan-300">{visit.referenceCode}</div>
        </div>
        <StatusBadge status={visit.status} language={language} />
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {visit.visitor.company && (
          <div className="flex items-center gap-1.5 text-xs text-white/70 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <span className="truncate">{visit.visitor.company}</span>
          </div>
        )}
        {visit.visitor.phone && (
          <a
            href={`tel:${visit.visitor.phone}`}
            className="flex items-center gap-1.5 text-xs text-cyan-200 hover:text-cyan-100 transition min-w-0 min-h-[36px]"
          >
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate underline-offset-2 hover:underline">{visit.visitor.phone}</span>
          </a>
        )}
        {checkedIn && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs min-w-0",
              isOverdue ? "text-amber-200" : "text-white/70"
            )}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {language === "bm" ? "Masuk" : "In"} {format(checkedIn, "HH:mm")} ·{" "}
              {formatDistanceToNow(checkedIn, { addSuffix: true })}
            </span>
          </div>
        )}
        {visit.expectedVisitDate && !checkedIn && (
          <div className="flex items-center gap-1.5 text-xs text-white/70 min-w-0">
            <CalendarClock className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <span className="truncate">
              {language === "bm" ? "Dijangka" : "Expected"}: {format(new Date(visit.expectedVisitDate), "dd MMM, HH:mm")}
            </span>
          </div>
        )}
      </div>

      {/* Purpose */}
      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 mb-3">
        <div className="text-[10px] uppercase tracking-wide text-white/50 mb-0.5">
          {t("purpose", language)}
        </div>
        <div className="text-sm text-white/90 italic line-clamp-3">"{visit.purpose}"</div>
      </div>

      {/* Documents row */}
      {docs.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => onOpenDocs(docs, 0)}
            className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-xs text-white/80 min-h-[40px]"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="truncate">
                {docs.length === 1
                  ? docs[0].fileName
                  : language === "bm"
                  ? `${docs.length} dokumen pengenalan`
                  : `${docs.length} ID documents`}
              </span>
            </span>
            <span className="text-cyan-300 shrink-0">{language === "bm" ? "Lihat" : "View"}</span>
          </button>
        </div>
      )}

      {/* Action */}
      <GlassButton
        variant="primary"
        onClick={onVerify}
        className="w-full min-h-[48px] text-base"
      >
        <ClipboardCheck className="w-5 h-5" />
        {t("verifyComplete", language)}
      </GlassButton>

      {isOverdue && (
        <div className="mt-2 text-[11px] text-amber-200 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {language === "bm"
            ? `Menunggu pengesahan ${Math.floor(minutesAgo / 60)}j ${minutesAgo % 60}m`
            : `Awaiting verification for ${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m`}
        </div>
      )}
    </GlassCard>
  );
}

function VerifiedRow({
  visit,
  language,
}: {
  visit: StaffInProgressVisit;
  language: "bm" | "en";
}) {
  const verifiedAt = visit.staffVerifiedAt ? new Date(visit.staffVerifiedAt) : null;
  return (
    <GlassCard className="p-3 sm:p-4" hover>
      <div className="flex items-center gap-3">
        {/* Avatar circle */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-white truncate">{visit.visitor.fullName}</div>
            {visit.visitor.company && (
              <span className="text-xs text-white/50 truncate hidden sm:inline">· {visit.visitor.company}</span>
            )}
          </div>
          <div className="text-xs text-white/60 flex items-center gap-2 flex-wrap mt-0.5">
            <span className="font-mono text-cyan-300/80">{visit.referenceCode}</span>
            {verifiedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(verifiedAt, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Status + rating */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={visit.status} language={language} />
          {visit.feedback?.rating != null && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3 h-3",
                    s <= visit.feedback!.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-white/20"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remarks preview */}
      {visit.staffRemarks && (
        <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-start gap-1.5 text-xs text-white/60">
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" />
          <span className="italic line-clamp-2">"{visit.staffRemarks}"</span>
        </div>
      )}
    </GlassCard>
  );
}
