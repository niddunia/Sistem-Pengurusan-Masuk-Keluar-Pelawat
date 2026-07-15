"use client";

import { useState, useEffect } from "react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Star,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Home,
  Search,
  AlertCircle,
  User,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";

interface VisitInfo {
  id: string;
  referenceCode: string;
  status: string;
  visitorName: string;
  purpose: string;
  hostStaff: string | null;
  hostDepartment: string | null;
  hasFeedback: boolean;
}

const RATING_LABELS: Record<number, { bm: string; en: string }> = {
  1: { bm: "Sangat Tidak Puas", en: "Very Dissatisfied" },
  2: { bm: "Tidak Puas", en: "Dissatisfied" },
  3: { bm: "Biasa", en: "Neutral" },
  4: { bm: "Puas", en: "Satisfied" },
  5: { bm: "Sangat Puas", en: "Very Satisfied" },
};

export function VisitorFeedbackView() {
  const { language } = useUIStore();
  const { navigate, back, params } = useRouterStore();

  const [lookupCode, setLookupCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [visitInfo, setVisitInfo] = useState<VisitInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If visitId + referenceCode passed (from status view), auto-load
  useEffect(() => {
    if (params.referenceCode) {
      setLookupCode(params.referenceCode);
      loadVisit(params.referenceCode);
    }
     
  }, [params.referenceCode]);

  const loadVisit = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error(language === "bm" ? "Sila masukkan kod rujukan." : "Please enter reference code.");
      return;
    }
    setLookingUp(true);
    setVisitInfo(null);
    try {
      const res = await fetch(`/api/visits/by-reference/${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message || (language === "bm" ? "Kod rujukan tidak dijumpai." : "Reference code not found."));
        return;
      }
      const v = json.data as VisitInfo;
      // Validate status
      if (v.status !== "pending_feedback" && v.status !== "staff_verified") {
        toast.error(
          language === "bm"
            ? `Status semasa (${v.status}) tidak membenarkan maklum balas.`
            : `Current status (${v.status}) does not allow feedback.`
        );
        return;
      }
      if (v.hasFeedback) {
        toast.info(
          language === "bm"
            ? "Maklum balas untuk lawatan ini telah dihantar."
            : "Feedback for this visit has already been submitted."
        );
      }
      setVisitInfo(v);
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setLookingUp(false);
    }
  };

  const onLookup = (e: React.FormEvent) => {
    e.preventDefault();
    loadVisit(lookupCode);
  };

  const submit = async () => {
    if (!visitInfo) return;
    if (rating < 1 || rating > 5) {
      toast.error(language === "bm" ? "Sila pilih penilaian bintang." : "Please select a star rating.");
      return;
    }
    if (visitInfo.hasFeedback) {
      toast.error(
        language === "bm"
          ? "Maklum balas telah dihantar sebelum ini."
          : "Feedback has already been submitted."
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/visits/${visitInfo.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comments: comments.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message || (language === "bm" ? "Gagal menghantar maklum balas." : "Failed to submit feedback."));
        return;
      }
      setSubmitted(true);
      toast.success(language === "bm" ? "Terima kasih atas maklum balas anda!" : "Thank you for your feedback!");
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setVisitInfo(null);
    setRating(0);
    setHoverRating(0);
    setComments("");
    setLookupCode("");
  };

  // ===== THANK YOU SCREEN =====
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-6 sm:p-10 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/40 pulse-live">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {language === "bm" ? "Terima Kasih!" : "Thank You!"}
          </h2>
          <p className="text-white/75 text-sm sm:text-base mb-6 max-w-md mx-auto">
            {language === "bm"
              ? "Maklum balas anda telah dihantar dengan jaya. Kami menghargai masa anda untuk berkongsi pengalaman."
              : "Your feedback has been submitted successfully. We appreciate your time sharing your experience."}
          </p>
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 mb-6 inline-block">
            <div className="text-xs uppercase tracking-wide text-cyan-200 font-semibold mb-1">
              {language === "bm" ? "Penilaian Anda" : "Your Rating"}
            </div>
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-6 h-6",
                    i < rating ? "fill-amber-400 text-amber-400" : "text-white/30"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GlassButton variant="outline" className="text-white min-h-[48px]" onClick={() => navigate("landing")}>
              <Home className="w-4 h-4" />
              {language === "bm" ? "Laman Utama" : "Back to Home"}
            </GlassButton>
            <GlassButton
              variant="ghost"
              className="min-h-[48px]"
              onClick={() => navigate("visitor-status", visitInfo ? { code: visitInfo.referenceCode } : undefined)}
            >
              <Search className="w-4 h-4" />
              {t("checkStatus", language)}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <GlassCard variant="soft" className="p-5 sm:p-6">
        <button
          onClick={() => navigate("landing")}
          className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors mb-3 min-h-[44px] px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back", language)}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/30">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{t("feedbackTitle", language)}</h1>
            <p className="text-sm text-white/70">{t("feedbackDesc", language)}</p>
          </div>
        </div>
      </GlassCard>

      {/* Lookup (if no visit loaded) */}
      {!visitInfo && (
        <GlassCard className="p-5 sm:p-6">
          <form onSubmit={onLookup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="refCode" className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                {t("enterReference", language)}
              </Label>
              <Input
                id="refCode"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                placeholder="VMS-YYYYMMDD-XXXX"
                className="glass-input h-12 text-base font-mono uppercase"
                autoCapitalize="characters"
                autoCorrect="off"
              />
              <p className="text-xs text-white/60">
                {language === "bm"
                  ? "Masukkan kod rujukan lawatan anda. Maklum balas hanya tersedia selepas urusan disahkan staf."
                  : "Enter your visit reference code. Feedback is only available after staff verifies your visit."}
              </p>
            </div>
            <GlassButton
              type="submit"
              variant="primary"
              className="min-h-[48px] w-full sm:w-auto"
              disabled={lookingUp}
            >
              {lookingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === "bm" ? "Mencari..." : "Searching..."}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  {language === "bm" ? "Cari Lawatan" : "Find Visit"}
                </>
              )}
            </GlassButton>
          </form>
        </GlassCard>
      )}

      {/* Visit info + form */}
      {visitInfo && (
        <>
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-cyan-200" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-white/80">
                {language === "bm" ? "Butiran Lawatan" : "Visit Info"}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem icon={User} label={t("name", language)} value={visitInfo.visitorName} />
              <InfoItem
                icon={Search}
                label={t("reference", language)}
                value={visitInfo.referenceCode}
                mono
              />
              <InfoItem icon={ShieldCheck} label={t("hostStaff", language)} value={visitInfo.hostStaff || "—"} />
              <InfoItem
                icon={Sparkles}
                label={t("purpose", language)}
                value={visitInfo.purpose}
                full
              />
            </div>
            {visitInfo.hasFeedback && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-100">
                  {language === "bm"
                    ? "Maklum balas untuk lawatan ini telah dihantar sebelum ini. Anda tidak boleh menghantar lagi."
                    : "Feedback has already been submitted for this visit. You cannot submit again."}
                </p>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5 sm:p-6 space-y-5">
            {/* Star rating */}
            <div>
              <Label className="text-white/80 text-xs font-semibold flex items-center gap-1.5 mb-3">
                <Star className="w-3.5 h-3.5" />
                {t("rating", language)} <span className="text-red-400">*</span>
              </Label>
              <div className="flex flex-col items-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (hoverRating || rating) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={cn(
                            "w-9 h-9 sm:w-10 sm:h-10 transition-all duration-200",
                            active
                              ? "fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                              : "text-white/30 hover:text-white/60"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-sm font-semibold text-white h-5">
                  {(hoverRating || rating) > 0
                    ? RATING_LABELS[hoverRating || rating][language]
                    : language === "bm"
                    ? "Klik bintang untuk menilai"
                    : "Click a star to rate"}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <Label htmlFor="comments" className="text-white/80 text-xs font-semibold flex items-center gap-1.5 mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                {t("comments", language)}
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  language === "bm"
                    ? "Kongsikan komen atau cadangan anda (opsyenal)..."
                    : "Share your comments or suggestions (optional)..."
                }
                className="glass-input min-h-[110px] resize-y"
                rows={4}
                maxLength={1000}
              />
              <div className="text-right text-[10px] text-white/50 mt-1">{comments.length}/1000</div>
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <GlassButton
                variant="ghost"
                className="min-h-[48px] sm:flex-1"
                onClick={() => {
                  setVisitInfo(null);
                  setLookupCode("");
                  setRating(0);
                  setHoverRating(0);
                  setComments("");
                  back();
                }}
              >
                {t("cancel", language)}
              </GlassButton>
              <GlassButton
                variant="success"
                className="min-h-[48px] sm:flex-[2]"
                onClick={submit}
                disabled={submitting || rating < 1 || visitInfo.hasFeedback}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === "bm" ? "Menghantar..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    {t("submitFeedback", language)}
                  </>
                )}
              </GlassButton>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  full,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  full?: boolean;
  mono?: boolean;
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
        <div className={cn("text-sm text-white font-medium break-words", mono && "font-mono")}>{value}</div>
      </div>
    </div>
  );
}
