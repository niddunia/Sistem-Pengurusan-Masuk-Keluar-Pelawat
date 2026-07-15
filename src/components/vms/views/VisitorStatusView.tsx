"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { StatusBadge } from "@/components/vms/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Search,
  Loader2,
  ArrowLeft,
  SearchX,
  FileCheck2,
  User,
  Building2,
  Sparkles,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  Star,
  Info,
  AlertCircle,
  CalendarPlus,
} from "lucide-react";

interface VisitStatusData {
  id: string;
  referenceCode: string;
  status: string;
  visitorName: string;
  company: string | null;
  purpose: string;
  hostStaff: string | null;
  hostDepartment: string | null;
  createdAt: string;
  approvedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  rejectionReason: string | null;
  hasFeedback: boolean;
  feedbackSubmittedAt: string | null;
}

const fmtDate = (iso: string | null, language: "bm" | "en") => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(language === "bm" ? "ms-MY" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export function VisitorStatusView() {
  const { language } = useUIStore();
  const { navigate, back, params } = useRouterStore();

  const [code, setCode] = useState(params.code || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VisitStatusData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(
    async (refCode: string) => {
      const trimmed = refCode.trim();
      if (!trimmed) {
        toast.error(language === "bm" ? "Sila masukkan kod rujukan." : "Please enter reference code.");
        return;
      }
      setLoading(true);
      setNotFound(false);
      setData(null);
      setSearched(true);
      try {
        const res = await fetch(`/api/visits/by-reference/${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (!json.success) {
          setNotFound(true);
          if (res.status !== 404) {
            toast.error(json.message || (language === "bm" ? "Ralat semakan." : "Check failed."));
          }
          return;
        }
        setData(json.data);
      } catch {
        toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  // Auto-search if code passed via navigation (e.g. from register success)
  useEffect(() => {
    if (params.code) {
      setCode(params.code);
      doSearch(params.code);
    }
     
  }, [params.code]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(code);
  };

  // Info message based on status
  const infoMessage = (): { icon: React.ElementType; text: string; tone: "info" | "success" | "warning" } | null => {
    if (!data) return null;
    switch (data.status) {
      case "pending_approval":
        return {
          icon: Clock,
          text:
            language === "bm"
              ? "Permohonan anda sedang menunggu kelulusan pengawal keselamatan. Sila datang ke pintu masuk selepas diluluskan."
              : "Your application is awaiting security approval. Please arrive at the entrance after approval.",
          tone: "info",
        };
      case "approved":
        return {
          icon: LogIn,
          text:
            language === "bm"
              ? "Permohonan diluluskan. Sila daftar masuk di pintu masuk keselamatan."
              : "Application approved. Please check in at the security entrance.",
          tone: "success",
        };
      case "checked_in":
      case "in_progress":
        return {
          icon: LogIn,
          text:
            language === "bm"
              ? "Anda telah mendaftar masuk. Sila temui staf tuan rumah."
              : "You are checked in. Please proceed to meet the host staff.",
          tone: "info",
        };
      case "staff_verified":
        return {
          icon: CheckCircle2,
          text:
            language === "bm"
              ? "Urusan anda telah disahkan staf. Sila beri maklum balas dan daftar keluar."
              : "Your visit has been verified by staff. Please leave feedback and check out.",
          tone: "info",
        };
      case "pending_feedback":
        return {
          icon: Star,
          text:
            language === "bm"
              ? "Sila beri maklum balas tentang lawatan anda sebelum mendaftar keluar."
              : "Please provide feedback about your visit before checking out.",
          tone: "warning",
        };
      case "ready_for_exit":
        return {
          icon: LogOut,
          text:
            language === "bm"
              ? "Anda boleh mendaftar keluar di pintu keluar keselamatan."
              : "You may check out at the security exit.",
          tone: "success",
        };
      case "checked_out":
        return {
          icon: CheckCircle2,
          text:
            language === "bm"
              ? "Lawatan anda telah selesai. Terima kasih atas kunjungan anda."
              : "Your visit is complete. Thank you for visiting.",
          tone: "success",
        };
      default:
        return null;
    }
  };

  const info = infoMessage();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <GlassCard variant="soft" className="p-5 sm:p-6">
        <button
          onClick={() => navigate("landing")}
          className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors mb-3 min-h-[44px] px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back", language)}
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-white">{t("statusCheckTitle", language)}</h1>
        <p className="text-sm text-white/70 mt-1">
          {language === "bm"
            ? "Masukkan kod rujukan anda untuk melihat status semasa."
            : "Enter your reference code to view current status."}
        </p>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="refCode" className="sr-only">
              {t("enterReference", language)}
            </Label>
            <Input
              id="refCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VMS-YYYYMMDD-XXXX"
              className="glass-input h-12 text-base font-mono uppercase"
              autoCapitalize="characters"
              autoCorrect="off"
            />
          </div>
          <GlassButton type="submit" variant="primary" className="min-h-[48px] px-6" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === "bm" ? "Mencari..." : "Searching..."}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {t("checkStatusBtn", language)}
              </>
            )}
          </GlassButton>
        </form>

        <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
          <Info className="w-3.5 h-3.5" />
          <span>
            {language === "bm" ? "Cuba demo: " : "Try demo: "}
            <button
              type="button"
              onClick={() => {
                setCode("VMS-20260714-0001");
                doSearch("VMS-20260714-0001");
              }}
              className="font-mono font-semibold text-cyan-200 hover:text-cyan-100 underline underline-offset-2"
            >
              VMS-20260714-0001
            </button>
          </span>
        </div>
      </GlassCard>

      {/* Loading */}
      {loading && (
        <GlassCard className="p-10 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
          <p className="text-white/70 text-sm">{t("loading", language)}</p>
        </GlassCard>
      )}

      {/* Not found */}
      {!loading && notFound && (
        <GlassCard className="p-8 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center">
            <SearchX className="w-8 h-8 text-red-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {language === "bm" ? "Kod Tidak Dijumpai" : "Code Not Found"}
            </h3>
            <p className="text-sm text-white/70 max-w-sm">
              {language === "bm"
                ? "Kod rujukan yang anda masukkan tidak wujud. Sila semak dan cuba lagi."
                : "The reference code you entered does not exist. Please check and try again."}
            </p>
          </div>
          <GlassButton variant="outline" className="text-white min-h-[44px]" onClick={() => navigate("visitor-register")}>
            {language === "bm" ? "Daftar Lawatan Baharu" : "Register New Visit"}
          </GlassButton>
        </GlassCard>
      )}

      {/* Result */}
      {!loading && data && (
        <>
          {/* Status header card */}
          <GlassCard className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/60 font-semibold mb-1">
                  {t("reference", language)}
                </div>
                <div className="font-mono text-lg sm:text-xl font-bold text-white break-all">
                  {data.referenceCode}
                </div>
              </div>
              <StatusBadge status={data.status} language={language} className="text-sm px-3 py-1.5" />
            </div>

            {/* Info banner */}
            {info && (
              <div
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border",
                  info.tone === "info" && "bg-cyan-500/10 border-cyan-400/30 text-cyan-100",
                  info.tone === "success" && "bg-emerald-500/10 border-emerald-400/30 text-emerald-100",
                  info.tone === "warning" && "bg-amber-500/10 border-amber-400/30 text-amber-100"
                )}
              >
                <info.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{info.text}</p>
              </div>
            )}

            {/* Rejection reason */}
            {data.status === "rejected" && data.rejectionReason && (
              <div className="mt-3 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/40">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-red-200 mb-1">
                    {language === "bm" ? "Sebab Penolakan" : "Rejection Reason"}
                  </div>
                  <p className="text-sm text-red-100/90 leading-relaxed">{data.rejectionReason}</p>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Visit details */}
          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/80 mb-4 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan-200" />
              {language === "bm" ? "Butiran Lawatan" : "Visit Details"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailItem icon={User} label={t("name", language)} value={data.visitorName} />
              <DetailItem icon={Building2} label={t("company", language)} value={data.company || "—"} />
              <DetailItem icon={ShieldCheck} label={t("hostStaff", language)} value={data.hostStaff || "—"} />
              <DetailItem icon={Building2} label={t("department", language)} value={data.hostDepartment || "—"} />
              <DetailItem icon={Sparkles} label={t("purpose", language)} value={data.purpose} full />
            </div>
          </GlassCard>

          {/* Timeline */}
          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/80 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-200" />
              {language === "bm" ? "Garis Masa" : "Timeline"}
            </h3>
            <Timeline
              items={[
                {
                  icon: CalendarPlus,
                  label: language === "bm" ? "Permohonan Dihantar" : "Application Submitted",
                  time: fmtDate(data.createdAt, language),
                  done: true,
                },
                {
                  icon: data.status === "rejected" ? XCircle : CheckCircle2,
                  label:
                    data.status === "rejected"
                      ? language === "bm" ? "Ditolak" : "Rejected"
                      : language === "bm" ? "Diluluskan" : "Approved",
                  time: fmtDate(data.approvedAt, language),
                  done: !!data.approvedAt,
                  tone: data.status === "rejected" ? "danger" : "success",
                },
                {
                  icon: LogIn,
                  label: language === "bm" ? "Daftar Masuk" : "Checked In",
                  time: fmtDate(data.checkedInAt, language),
                  done: !!data.checkedInAt,
                },
                {
                  icon: LogOut,
                  label: language === "bm" ? "Daftar Keluar" : "Checked Out",
                  time: fmtDate(data.checkedOutAt, language),
                  done: !!data.checkedOutAt,
                },
              ]}
            />
          </GlassCard>

          {/* Actions */}
          {(data.status === "pending_feedback" || data.status === "staff_verified") && !data.hasFeedback && (
            <GlassCard variant="soft" className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {language === "bm" ? "Beri Maklum Balas" : "Give Feedback"}
                  </div>
                  <p className="text-xs text-white/70">
                    {language === "bm"
                      ? "Kongsikan pengalaman lawatan anda."
                      : "Share your visit experience."}
                  </p>
                </div>
              </div>
              <GlassButton
                variant="warning"
                className="min-h-[44px] w-full sm:w-auto"
                onClick={() =>
                  navigate("visitor-feedback", {
                    visitId: data.id,
                    referenceCode: data.referenceCode,
                  })
                }
              >
                <Star className="w-4 h-4" />
                {t("giveFeedback", language)}
              </GlassButton>
            </GlassCard>
          )}

          {data.hasFeedback && (
            <GlassCard variant="soft" className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
              <p className="text-sm text-white/85">
                {language === "bm"
                  ? "Maklum balas telah dihantar. Terima kasih!"
                  : "Feedback has been submitted. Thank you!"}
              </p>
            </GlassCard>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !data && !notFound && !searched && (
        <GlassCard className="p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
            <Search className="w-9 h-9 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {language === "bm" ? "Semak Status Lawatan" : "Check Visit Status"}
            </h3>
            <p className="text-sm text-white/70 max-w-sm">
              {language === "bm"
                ? "Masukkan kod rujukan yang anda terima semasa pendaftaran untuk melihat status semasa."
                : "Enter the reference code received during registration to view current status."}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10",
        full && "sm:col-span-2"
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-cyan-200" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-white/60 font-semibold">{label}</div>
        <div className="text-sm text-white font-medium break-words">{value}</div>
      </div>
    </div>
  );
}

function Timeline({
  items,
}: {
  items: {
    icon: React.ElementType;
    label: string;
    time: string | null;
    done: boolean;
    tone?: "success" | "danger" | "default";
  }[];
}) {
  return (
    <div className="relative">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const Icon = item.icon;
        const tone = item.tone || "default";
        return (
          <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[15px] top-8 bottom-0 w-0.5",
                  item.done ? "bg-cyan-400/40" : "bg-white/15"
                )}
              />
            )}
            <div
              className={cn(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                item.done
                  ? tone === "danger"
                    ? "bg-red-500 border-red-400 text-white"
                    : tone === "success"
                    ? "bg-emerald-500 border-emerald-400 text-white"
                    : "bg-cyan-500 border-cyan-400 text-white"
                  : "bg-white/10 border-white/25 text-white/50"
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 pt-0.5">
              <div
                className={cn(
                  "text-sm font-semibold",
                  item.done ? "text-white" : "text-white/60"
                )}
              >
                {item.label}
              </div>
              <div className="text-xs text-white/60 mt-0.5">
                {item.time || "—"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
