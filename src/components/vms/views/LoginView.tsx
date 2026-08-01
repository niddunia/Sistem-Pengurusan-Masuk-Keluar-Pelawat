"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import {
  LogIn,
  Loader2,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  User,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "admin",
    label: "Admin / Penyelia",
    labelEn: "Admin / Supervisor",
    email: "rohana@pltbintulu.gov.my",
    color: "from-purple-500 to-purple-700",
  },
  {
    role: "security",
    label: "Pengawal Keselamatan",
    labelEn: "Security Guard",
    email: "siti@pltbintulu.gov.my",
    color: "from-cyan-500 to-blue-700",
  },
  {
    role: "staff",
    label: "Staf JTM",
    labelEn: "JTM Staff",
    email: "faizal@pltbintulu.gov.my",
    color: "from-teal-500 to-emerald-700",
  },
];

export function LoginView() {
  const { language } = useUIStore();
  const { navigate, back } = useRouterStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error(language === "bm" ? "Sila isi e-mel dan kata laluan." : "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (!result || result.error) {
        toast.error(
          language === "bm"
            ? "Log masuk gagal. Sila semak e-mel dan kata laluan anda."
            : "Login failed. Please check your email and password."
        );
        setLoading(false);
        return;
      }
      toast.success(language === "bm" ? "Log masuk berjaya!" : "Login successful!");
      // Refresh to reload session & route to role dashboard
      window.location.reload();
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    toast.info(language === "bm" ? "Kredensial demo diisi." : "Demo credentials filled.");
  };

  return (
    <div className="max-w-md mx-auto">
      <button
        onClick={() => navigate("landing")}
        className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors mb-3 min-h-[44px] px-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {language === "bm" ? "Kembali ke Laman Utama" : "Back to Home"}
      </button>

      <GlassCard className="p-6 sm:p-8">
        {/* Logo / Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t("login", language)}</h1>
          <p className="text-sm text-white/70 mt-1">
            {language === "bm"
              ? "Log masuk ke portal pegawai ADTEC Bintulu"
              : "Sign in to the ADTEC Bintulu officer portal"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {t("email", language)}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@pltbintulu.gov.my"
              className="glass-input h-12 text-base"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {language === "bm" ? "Kata Laluan" : "Password"}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input h-12 text-base pr-12"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <GlassButton
            type="submit"
            variant="primary"
            className="min-h-[48px] w-full text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {language === "bm" ? "Sedang Log Masuk..." : "Signing in..."}
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {t("login", language)}
              </>
            )}
          </GlassButton>
        </form>

        {/* Demo credentials */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowDemo((s) => !s)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-cyan-200 hover:text-cyan-100 font-semibold transition-colors py-2"
          >
            <Info className="w-3.5 h-3.5" />
            {language === "bm" ? "Kredensial Demo" : "Demo Credentials"}
            {showDemo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDemo && (
            <div className="mt-2 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">
                      {language === "en" ? acc.labelEn : acc.label}
                    </div>
                    <div className="text-xs text-white/60 font-mono truncate">{acc.email}</div>
                  </div>
                </button>
              ))}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/30">
                <Lock className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                <span className="text-xs text-amber-100">
                  {language === "bm" ? "Kata Laluan" : "Password"}:{" "}
                  <span className="font-mono font-bold">password123</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <p className="text-center text-xs text-white/60 mt-4">
        {language === "bm"
          ? "Hanya untuk pegawai ADTEC Bintulu yang berdaftar."
          : "For registered ADTEC Bintulu officers only."}
      </p>
    </div>
  );
}
