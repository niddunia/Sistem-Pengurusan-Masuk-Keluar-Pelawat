"use client";

import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { t } from "@/lib/i18n";
import {
  UserPlus,
  Search,
  Star,
  LogIn,
  Shield,
  Building2,
  MapPin,
  Clock,
  QrCode,
  ArrowRight,
  Info,
} from "lucide-react";

export function LandingView() {
  const { language } = useUIStore();
  const { navigate } = useRouterStore();

  const actions = [
    {
      id: "register",
      icon: UserPlus,
      title: t("registerVisit", language),
      desc:
        language === "bm"
          ? "Daftar lawatan baharu untuk kelulusan masuk"
          : "Register a new visit for entry approval",
      onClick: () => navigate("visitor-register"),
      variant: "primary" as const,
      featured: true,
    },
    {
      id: "status",
      icon: Search,
      title: t("checkStatus", language),
      desc:
        language === "bm"
          ? "Semak status permohonan dengan kod rujukan"
          : "Check application status by reference code",
      onClick: () => navigate("visitor-status"),
      variant: "ghost" as const,
    },
    {
      id: "feedback",
      icon: Star,
      title: t("giveFeedback", language),
      desc:
        language === "bm"
          ? "Beri penilaian & maklum balas lawatan anda"
          : "Rate and review your visit experience",
      onClick: () => navigate("visitor-feedback"),
      variant: "ghost" as const,
    },
    {
      id: "login",
      icon: LogIn,
      title: t("staffLogin", language),
      desc:
        language === "bm"
          ? "Portal pengawal, staf & pentadbir"
          : "Portal for security, staff & administrators",
      onClick: () => navigate("login"),
      variant: "outline" as const,
    },
  ];

  const quickInfo = [
    {
      icon: Building2,
      label: language === "bm" ? "Organisasi" : "Organization",
      value: "ADTEC Bintulu",
    },
    {
      icon: MapPin,
      label: language === "bm" ? "Lokasi" : "Location",
      value: "Bintulu, Sarawak",
    },
    {
      icon: Clock,
      label: language === "bm" ? "Waktu Operasi" : "Operating Hours",
      value: language === "bm" ? "Isnin–Jumaat, 8pg–5ptg" : "Mon–Fri, 8AM–5PM",
    },
    {
      icon: Shield,
      label: language === "bm" ? "Pengendalian" : "Operated by",
      value: language === "bm" ? "Jabatan Tenaga Manusia" : "Manpower Department (JTM)",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero */}
      <section className="relative">
        <GlassCard className="overflow-hidden p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div className="space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-100 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                {language === "bm" ? "SISTEM RASMI" : "OFFICIAL SYSTEM"}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight text-readable">
                {t("landingTitle", language)}
              </h1>
              <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t("landingSubtitle", language)}
              </p>
              <p className="text-sm text-white/70">
                {t("organization", language)} &middot; {t("agency", language)}
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                <GlassButton
                  variant="primary"
                  className="px-6 py-3 text-base min-h-[48px]"
                  onClick={() => navigate("visitor-register")}
                >
                  <UserPlus className="w-5 h-5" />
                  {t("registerVisit", language)}
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
                <GlassButton
                  variant="outline"
                  className="px-6 py-3 text-base min-h-[48px] text-white"
                  onClick={() => navigate("visitor-status")}
                >
                  <Search className="w-5 h-5" />
                  {t("checkStatus", language)}
                </GlassButton>
              </div>
            </div>

            {/* QR placeholder */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-3xl blur-2xl" />
                <GlassCard variant="soft" className="relative p-6 sm:p-8 flex flex-col items-center gap-4">
                  <div className="qr-container">
                    <QrPlaceholder />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-cyan-100 uppercase tracking-wide">
                      {language === "bm" ? "Imbas untuk mula" : "Scan to begin"}
                    </div>
                    <div className="text-[10px] text-white/60 mt-1">
                      VMS-ADTEC-{new Date().getFullYear()}
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Action cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {actions.map((action) => {
            const Icon = action.icon;
            const isFeatured = action.featured;
            return (
              <GlassCard
                key={action.id}
                hover
                onClick={action.onClick}
                className={`p-5 sm:p-6 flex flex-col gap-4 cursor-pointer ${
                  isFeatured ? "sm:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      isFeatured
                        ? "bg-gradient-to-br from-cyan-400 to-blue-700 shadow-cyan-500/30"
                        : "bg-white/15 border border-white/20"
                    }`}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  {isFeatured && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
                      {language === "bm" ? "Utama" : "Primary"}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <h3
                    className={`font-bold text-white ${
                      isFeatured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
                    }`}
                  >
                    {action.title}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">{action.desc}</p>
                </div>
                <div className="mt-auto flex items-center gap-1.5 text-cyan-200 text-sm font-semibold">
                  <span>{language === "bm" ? "Mula" : "Start"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Quick info */}
      <section>
        <GlassCard variant="soft" className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-cyan-200" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-white/90">
              {language === "bm" ? "Maklumat Pantas" : "Quick Info"}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickInfo.map((info, i) => {
              const Icon = info.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-cyan-200" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-white/60 font-semibold">
                      {info.label}
                    </div>
                    <div className="text-xs sm:text-sm text-white font-medium truncate">
                      {info.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

// Decorative QR-like grid placeholder
function QrPlaceholder() {
  const cells = Array.from({ length: 144 }, (_, i) => {
    // pseudo-random but deterministic pattern
    const seed = (i * 73 + 17) % 100;
    return seed > 50;
  });

  return (
    <div className="grid grid-cols-12 gap-[2px] w-36 h-36 sm:w-40 sm:h-40">
      {cells.map((on, i) => (
        <div
          key={i}
          className={on ? "bg-slate-900 rounded-[1px]" : "bg-white rounded-[1px]"}
        />
      ))}
    </div>
  );
}
