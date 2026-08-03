"use client";

import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard } from "@/components/vms/GlassCard";
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
      featured: true,
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
      {/* Action cards - 4 column grid */}
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
                className="p-5 sm:p-6 flex flex-col gap-4 cursor-pointer min-h-[200px]"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      isFeatured
                        ? "bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/30"
                        : "bg-white/10 border border-white/15"
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
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    {action.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">{action.desc}</p>
                </div>
                <div className="mt-auto flex items-center gap-1.5 text-cyan-300 text-sm font-semibold">
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
                    <div className="text-[10px] uppercase tracking-wide text-white/50 font-semibold">
                      {info.label}
                    </div>
                    <div className="text-xs sm:text-sm text-white/90 font-medium truncate">
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
