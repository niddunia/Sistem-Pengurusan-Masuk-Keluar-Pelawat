"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { StatusBadge } from "@/components/vms/StatusBadge";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import {
  ArrowLeft,
  Search,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Phone,
  Building2,
  RefreshCw,
  Loader2,
  ShieldAlert,
  MessageSquare,
  Check,
  Star,
  DoorOpen,
  Ban,
} from "lucide-react";
import type { SecurityDashboardData, VisitList } from "./_types";

type ExitError = { visitId: string; message: string } | null;

export function SecurityExit() {
  const { language } = useUIStore();
  const { back } = useRouterStore();

  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Exit dialog state
  const [exitVisit, setExitVisit] = useState<VisitList | null>(null);
  const [exitNotes, setExitNotes] = useState("");
  const [override, setOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [exiting, setExiting] = useState(false);
  const [exitError, setExitError] = useState<ExitError>(null);

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
        } else {
          toast.error(json.error || json.message || (language === "bm" ? "Gagal memuatkan data." : "Failed to load data."));
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
    const id = setInterval(() => fetchData(true), 15_000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [fetchData]);

  // Categorize active visitors by exit-readiness
  const allActive = data?.activeVisitors ?? [];
  const matchSearch = (v: VisitList) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      v.referenceCode.toLowerCase().includes(q) ||
      v.visitor.fullName.toLowerCase().includes(q) ||
      (v.visitor.company || "").toLowerCase().includes(q) ||
      (v.visitor.phone || "").toLowerCase().includes(q)
    );
  };

  const readyToExit = allActive.filter(
    (v) => v.staffVerifiedAt && v.feedbackSubmittedAt && matchSearch(v)
  );
  const waitingFeedback = allActive.filter(
    (v) => v.staffVerifiedAt && !v.feedbackSubmittedAt && matchSearch(v)
  );
  const notVerified = allActive.filter(
    (v) => !v.staffVerifiedAt && matchSearch(v)
  );

  const openExitDialog = (visit: VisitList) => {
    setExitVisit(visit);
    setExitNotes("");
    setOverride(false);
    setOverrideReason("");
    setExitError(null);
  };

  const handleExit = async () => {
    if (!exitVisit) return;
    // If override selected, require reason
    if (override && overrideReason.trim().length < 10) {
      toast.error(
        language === "bm"
          ? "Sebab override min 10 aksara."
          : "Override reason min 10 chars."
      );
      return;
    }

    setExiting(true);
    setExitError(null);
    try {
      const res = await fetch(`/api/visits/${exitVisit.id}/exit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: exitNotes.trim() || undefined,
          override: override || undefined,
          overrideReason: override ? overrideReason.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          language === "bm"
            ? `${exitVisit.visitor.fullName} berjaya didaftarkan keluar.`
            : `${exitVisit.visitor.fullName} successfully checked out.`
        );
        setExitVisit(null);
        fetchData(true);
      } else if (res.status === 403) {
        // Show specific 403 error message
        setExitError({ visitId: exitVisit.id, message: json.error || json.message || "Syarat keluar belum dipenuhi." });
      } else {
        toast.error(json.error || json.message || (language === "bm" ? "Pendaftaran keluar gagal." : "Exit failed."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setExiting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 glass-card animate-pulse" />
        <div className="h-72 glass-card animate-pulse" />
      </div>
    );
  }

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
          {t("refresh", language)}
        </button>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <DoorOpen className="w-7 h-7 text-emerald-300" />
          {language === "bm" ? "Pintu Keluar" : "Exit Gate"}
        </h1>
        <p className="text-sm text-white/70 mt-1">
          {language === "bm"
            ? "Sahkan keluar pelawat — pastikan semua syarat dipenuhi"
            : "Confirm visitor exit — ensure all conditions are met"}
        </p>
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
            autoFocus
          />
        </div>
      </GlassCard>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryStat
          icon={CheckCircle2}
          label={language === "bm" ? "Sedia Keluar" : "Ready to Exit"}
          value={readyToExit.length}
          color="emerald"
        />
        <SummaryStat
          icon={MessageSquare}
          label={language === "bm" ? "Menunggu Maklum Balas" : "Waiting Feedback"}
          value={waitingFeedback.length}
          color="amber"
        />
        <SummaryStat
          icon={ShieldAlert}
          label={language === "bm" ? "Belum Disahkan Staf" : "Not Staff Verified"}
          value={notVerified.length}
          color="red"
        />
      </div>

      {/* READY TO EXIT LIST */}
      <section>
        <SectionHeader
          icon={CheckCircle2}
          color="emerald"
          title={
            language === "bm"
              ? "Sedia Keluar (semua syarat dipenuhi)"
              : "Ready to Exit (all conditions met)"
          }
          count={readyToExit.length}
        />
        {readyToExit.length === 0 ? (
          <EmptyRow
            text={
              language === "bm"
                ? "Tiada pelawat sedia keluar buat masa ini."
                : "No visitors ready to exit at this time."
            }
          />
        ) : (
          <div className="grid gap-2 sm:gap-3">
            {readyToExit.map((v) => (
              <ExitReadyRow
                key={v.id}
                visit={v}
                language={language}
                onExit={() => openExitDialog(v)}
              />
            ))}
          </div>
        )}
      </section>

      {/* WAITING FEEDBACK LIST */}
      <section>
        <SectionHeader
          icon={MessageSquare}
          color="amber"
          title={
            language === "bm"
              ? "Menunggu Maklum Balas Pelawat"
              : "Waiting for Visitor Feedback"
          }
          count={waitingFeedback.length}
        />
        {waitingFeedback.length === 0 ? (
          <EmptyRow
            text={
              language === "bm"
                ? "Tiada pelawat menunggu maklum balas."
                : "No visitors waiting for feedback."
            }
          />
        ) : (
          <div className="grid gap-2 sm:gap-3">
            {waitingFeedback.map((v) => (
              <ExitWaitingRow
                key={v.id}
                visit={v}
                language={language}
                onOverride={() => openExitDialog(v)}
              />
            ))}
          </div>
        )}
      </section>

      {/* NOT VERIFIED LIST */}
      <section>
        <SectionHeader
          icon={ShieldAlert}
          color="red"
          title={
            language === "bm"
              ? "Belum Disahkan Staf"
              : "Not Staff Verified"
          }
          count={notVerified.length}
        />
        {notVerified.length === 0 ? (
          <EmptyRow
            text={
              language === "bm"
                ? "Semua pelawat telah disahkan staf."
                : "All visitors have been staff verified."
            }
          />
        ) : (
          <div className="grid gap-2 sm:gap-3">
            {notVerified.map((v) => (
              <ExitBlockedRow key={v.id} visit={v} language={language} />
            ))}
          </div>
        )}
      </section>

      {/* Exit Confirmation Dialog */}
      <Dialog open={!!exitVisit} onOpenChange={(o) => !o && setExitVisit(null)}>
        <DialogContent className="glass-panel max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <LogOut className="w-5 h-5 text-emerald-400" />
              {language === "bm" ? "Sahkan Keluar" : "Confirm Exit"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {exitVisit && (
                <>
                  {exitVisit.visitor.fullName} ·{" "}
                  <span className="font-mono text-xs">{exitVisit.referenceCode}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {exitVisit && (
            <div className="space-y-4">
              {/* Visitor quick info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase text-white/50 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {t("company", language)}
                  </div>
                  <div className="text-white">{exitVisit.visitor.company || "-"}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase text-white/50 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {t("hostStaff", language)}
                  </div>
                  <div className="text-white truncate">{exitVisit.hostStaff.fullName}</div>
                </div>
              </div>

              {/* Conditions checklist */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs uppercase tracking-wide text-white/50 mb-2">
                  {t("exitRequirements", language)}
                </div>
                <div className="space-y-1.5">
                  <ConditionRow
                    ok={!!exitVisit.staffVerifiedAt}
                    label={t("staffVerified", language)}
                    sub={
                      exitVisit.staffVerifiedAt
                        ? format(new Date(exitVisit.staffVerifiedAt), "dd MMM, HH:mm")
                        : language === "bm"
                        ? "Belum disahkan"
                        : "Not verified"
                    }
                  />
                  <ConditionRow
                    ok={!!exitVisit.feedbackSubmittedAt}
                    label={t("feedbackCompleted", language)}
                    sub={
                      exitVisit.feedbackSubmittedAt
                        ? format(new Date(exitVisit.feedbackSubmittedAt), "dd MMM, HH:mm")
                        : language === "bm"
                        ? "Belum diisi"
                        : "Not submitted"
                    }
                  />
                  {exitVisit.feedback && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-200 pt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>
                        {t("rating", language)}: {exitVisit.feedback.rating}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 403 Error display */}
              {exitError && exitError.visitId === exitVisit.id && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-red-200">
                      {language === "bm" ? "Syarat Keluar Belum Dipenuhi" : "Exit Conditions Not Met"}
                    </div>
                    <p className="text-xs text-red-100/90 mt-0.5">{exitError.message}</p>
                    <p className="text-[11px] text-red-200/70 mt-1">
                      {language === "bm"
                        ? "Anda boleh menggunakan pilihan override di bawah jika perlu (akan direkodkan dalam log audit)."
                        : "You may use the override option below if necessary (will be recorded in audit log)."}
                    </p>
                  </div>
                </div>
              )}

              {/* Override section */}
              <div
                className={cn(
                  "p-3 rounded-xl border transition",
                  override
                    ? "bg-amber-500/10 border-amber-400/40"
                    : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="override-check"
                    checked={override}
                    onCheckedChange={(v) => setOverride(v === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="override-check"
                      className="text-sm font-medium text-amber-100 cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      {language === "bm"
                        ? "Override (dengan kebenaran)"
                        : "Override (with permission)"}
                    </Label>
                    <p className="text-[11px] text-amber-200/70 mt-0.5">
                      {language === "bm"
                        ? "Paksa keluar walaupun syarat belum dipenuhi. Sebab wajib (min 10 aksara)."
                        : "Force exit even if conditions not met. Reason required (min 10 chars)."}
                    </p>
                  </div>
                </div>
                {override && (
                  <div className="mt-3">
                    <Label className="text-xs text-amber-100 mb-1 block">
                      {language === "bm" ? "Sebab Override" : "Override Reason"}
                      <span className="text-red-400"> *</span>
                    </Label>
                    <Textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder={
                        language === "bm"
                          ? "Cth: Pelawat tergesa-gesa, kecemasan perubatan, diminta oleh staf..."
                          : "Eg: Visitor in rush, medical emergency, requested by staff..."
                      }
                      className="glass-input min-h-[80px] resize-none text-sm"
                    />
                    <div className="text-[10px] text-amber-200/70 text-right mt-1">
                      {overrideReason.trim().length}/10 min
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label className="text-sm text-white/80 mb-1.5 block flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-white/50" />
                  {t("notes", language)}{" "}
                  <span className="text-white/40 text-xs">({language === "bm" ? "opsyenal" : "optional"})</span>
                </Label>
                <Textarea
                  value={exitNotes}
                  onChange={(e) => setExitNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder={
                    language === "bm"
                      ? "Catatan tambahan (opsyenal)..."
                      : "Additional notes (optional)..."
                  }
                  className="glass-input min-h-[60px] resize-none text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <GlassButton variant="ghost" onClick={() => setExitVisit(null)} className="min-h-[44px]">
              {t("cancel", language)}
            </GlassButton>
            <GlassButton
              variant={override ? "warning" : "success"}
              onClick={handleExit}
              disabled={exiting || (override && overrideReason.trim().length < 10)}
              className="min-h-[44px]"
            >
              {exiting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : override ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {override
                ? language === "bm"
                  ? "Sahkan (Override)"
                  : "Confirm (Override)"
                : language === "bm"
                ? "Sahkan Keluar"
                : "Confirm Exit"}
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== Sub-components ==============

function SummaryStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "emerald" | "amber" | "red";
}) {
  const colorMap = {
    emerald: "bg-emerald-500/20 border-emerald-400/30 text-emerald-200",
    amber: "bg-amber-500/20 border-amber-400/30 text-amber-200",
    red: "bg-red-500/20 border-red-400/30 text-red-200",
  };
  return (
    <GlassCard className="p-3 sm:p-4">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", colorMap[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] sm:text-xs text-white/60 leading-tight">{label}</div>
    </GlassCard>
  );
}

function SectionHeader({
  icon: Icon,
  color,
  title,
  count,
}: {
  icon: React.ElementType;
  color: "emerald" | "amber" | "red";
  title: string;
  count: number;
}) {
  const colorMap = {
    emerald: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    amber: "text-amber-300 bg-amber-500/15 border-amber-500/30",
    red: "text-red-300 bg-red-500/15 border-red-500/30",
  };
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", colorMap[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-sm sm:text-base font-semibold text-white flex-1">{title}</h2>
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold border", colorMap[color])}>
        {count}
      </span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <GlassCard variant="soft" className="p-4 text-center text-sm text-white/50">
      {text}
    </GlassCard>
  );
}

function ExitReadyRow({
  visit,
  language,
  onExit,
}: {
  visit: VisitList;
  language: "bm" | "en";
  onExit: () => void;
}) {
  const checkedIn = visit.checkedInAt ? new Date(visit.checkedInAt) : null;
  const durationMin = checkedIn ? differenceInMinutes(new Date(), checkedIn) : 0;
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  return (
    <GlassCard className="p-3 sm:p-4 border-emerald-400/30" hover>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white truncate">{visit.visitor.fullName}</span>
            <span className="text-[10px] font-mono text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
              {visit.referenceCode}
            </span>
            {visit.feedback && (
              <span className="text-[10px] text-amber-200 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {visit.feedback.rating}
              </span>
            )}
          </div>
          <div className="text-xs text-white/60 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {visit.visitor.company || "-"}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {visit.hostStaff.fullName}
            </span>
            {checkedIn && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {hours > 0 ? `${hours}j ` : ""}
                {mins}m
              </span>
            )}
          </div>
        </div>
        <GlassButton variant="success" onClick={onExit} className="min-h-[44px] shrink-0">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t("allowExit", language)}</span>
        </GlassButton>
      </div>
    </GlassCard>
  );
}

function ExitWaitingRow({
  visit,
  language,
  onOverride,
}: {
  visit: VisitList;
  language: "bm" | "en";
  onOverride: () => void;
}) {
  const checkedIn = visit.checkedInAt ? new Date(visit.checkedInAt) : null;
  return (
    <GlassCard className="p-3 sm:p-4 border-amber-400/30" hover>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white truncate">{visit.visitor.fullName}</span>
            <span className="text-[10px] font-mono text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
              {visit.referenceCode}
            </span>
            <StatusBadge status={visit.status} language={language} />
          </div>
          <div className="text-xs text-white/60 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {visit.visitor.company || "-"}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {visit.hostStaff.fullName}
            </span>
            {checkedIn && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDistanceToNow(checkedIn, { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="text-[11px] text-amber-200 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {language === "bm"
              ? "Menunggu maklum balas pelawat sebelum boleh keluar."
              : "Waiting for visitor feedback before exit."}
          </div>
        </div>
        <GlassButton variant="ghost" onClick={onOverride} className="min-h-[44px] shrink-0 border-amber-500/30 text-amber-200">
          <ShieldAlert className="w-4 h-4" />
          <span className="hidden sm:inline">
            {language === "bm" ? "Override" : "Override"}
          </span>
        </GlassButton>
      </div>
    </GlassCard>
  );
}

function ExitBlockedRow({
  visit,
  language,
}: {
  visit: VisitList;
  language: "bm" | "en";
}) {
  const checkedIn = visit.checkedInAt ? new Date(visit.checkedInAt) : null;
  return (
    <GlassCard className="p-3 sm:p-4 border-red-400/30" hover>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center shrink-0">
          <Ban className="w-5 h-5 text-red-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white truncate">{visit.visitor.fullName}</span>
            <span className="text-[10px] font-mono text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
              {visit.referenceCode}
            </span>
            <StatusBadge status={visit.status} language={language} />
          </div>
          <div className="text-xs text-white/60 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {visit.visitor.company || "-"}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {visit.hostStaff.fullName}
            </span>
            {checkedIn && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDistanceToNow(checkedIn, { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="text-[11px] text-red-200 mt-1 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            {language === "bm"
              ? "Belum disahkan staf. Hubungi staf tuan rumah untuk pengesahan."
              : "Not yet staff verified. Contact host staff to verify."}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {visit.hostStaff.phone && (
            <a
              href={`tel:${visit.hostStaff.phone}`}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-xs text-white/80 hover:bg-white/10 transition min-h-[44px]"
            >
              <Phone className="w-3.5 h-3.5" />
              {language === "bm" ? "Hubungi" : "Call"}
            </a>
          )}
          <button
            disabled
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 cursor-not-allowed min-h-[44px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("allowExit", language)}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

function ConditionRow({
  ok,
  label,
  sub,
}: {
  ok: boolean;
  label: string;
  sub?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", ok ? "text-emerald-300" : "text-red-300")}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span className="flex-1">{label}</span>
      {sub && <span className="text-xs text-white/50">{sub}</span>}
    </div>
  );
}
