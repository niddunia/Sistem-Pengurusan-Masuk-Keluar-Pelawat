"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { useTheme } from "next-themes";
import { Moon, Sun, Globe, Shield, LogOut, Menu, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/vms/GlassCard";
import { t } from "@/lib/i18n";
import { useState } from "react";

export function AppHeader() {
  const { data: session } = useSession();
  const { language, toggleLanguage } = useUIStore();
  const { view, navigate } = useRouterStore();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthed = !!session?.user;
  const role = session?.user?.role;

  const handleLogout = () => {
    // Use redirect: false to prevent NextAuth from redirecting to localhost
    // (which causes ERR_CONNECTION_REFUSED behind the gateway/preview panel).
    // Instead, clear the session client-side and navigate to landing page.
    signOut({ redirect: false }).then(() => {
      navigate("landing", {});
    });
  };

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-4 pt-3">
      <GlassCard variant="panel" className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(isAuthed ? `${role}-dashboard` as never : "landing")}
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {t("appShortName", language)}
              </div>
              <div className="text-[10px] text-cyan-200/80 truncate">
                {t("organization", language)}
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleLanguage}
            className="text-white hover:bg-white/10 h-9 px-2.5"
            title="Switch language"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">{language}</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-white hover:bg-white/10 h-9 w-9 p-0"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {isAuthed && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-red-500/20 h-9 px-2.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">{t("logout", language)}</span>
            </Button>
          )}
        </div>
      </GlassCard>
    </header>
  );
}

export function AppFooter() {
  const { language } = useUIStore();
  return (
    <footer className="mt-auto px-3 sm:px-4 pb-4 pt-2 relative z-10">
      <GlassCard variant="soft" className="px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Building2 className="w-3.5 h-3.5" />
            <span>
              {t("organization", language)} &middot; {t("agency", language)}
            </span>
          </div>
          <div className="text-[10px] text-white/60">
            &copy; {new Date().getFullYear()} {t("organization", language)}. {t("allRightsReserved", language)}.
            <span className="mx-2 text-amber-300/80 font-semibold">{t("confidential", language)}</span>
          </div>
        </div>
      </GlassCard>
    </footer>
  );
}
