"use client";

import { GlassCard } from "@/components/vms/GlassCard";
import { useUIStore } from "@/stores/router";
import { Construction } from "lucide-react";

export function PlaceholderView({ title, titleEn }: { title: string; titleEn: string }) {
  const { language } = useUIStore();
  return (
    <div className="max-w-2xl mx-auto">
      <GlassCard className="p-8 sm:p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
            <Construction className="w-8 h-8 text-amber-300" />
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          {language === "en" ? titleEn : title}
        </h1>
        <p className="text-sm text-white/70">
          {language === "bm"
            ? "Modul ini sedang dalam pembangunan oleh ejen berikutnya."
            : "This module is under development by the next agent."}
        </p>
      </GlassCard>
    </div>
  );
}
