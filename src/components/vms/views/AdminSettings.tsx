"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Settings,
  Save,
  RefreshCw,
  Loader2,
  Clock,
  Database,
  Building2,
  FileText,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Timer,
  Upload,
} from "lucide-react";

interface Settings {
  staff_verification_sla_hours?: number;
  data_retention_months?: number;
  overstay_threshold_minutes?: number;
  max_upload_size_mb?: number;
  pdpa_notice_text?: string;
  organization_name?: string;
  organization_short?: string;
}

export function AdminSettings() {
  const { language } = useUIStore();

  const [settings, setSettings] = useState<Settings>({});
  const [original, setOriginal] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mounted = useRef(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = await res.json();
      if (!mounted.current) return;
      if (json.success) {
        const s = json.data as Settings;
        setSettings(s);
        setOriginal(s);
      } else {
        toast.error(json.error || (language === "bm" ? "Gagal memuatkan tetapan." : "Failed to load settings."));
      }
    } catch {
      if (mounted.current)
        toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    mounted.current = true;
    fetchSettings();
    return () => {
      mounted.current = false;
    };
  }, [fetchSettings]);

  // Detect changes
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);
  const changedKeys = Object.keys(settings).filter(
    (k) => JSON.stringify((settings as Record<string, unknown>)[k]) !== JSON.stringify((original as Record<string, unknown>)[k])
  );

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info(language === "bm" ? "Tiada perubahan untuk disimpan." : "No changes to save.");
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      for (const k of changedKeys) {
        updates[k] = (settings as Record<string, unknown>)[k];
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(language === "bm" ? "Tetapan berjaya disimpan." : "Settings saved successfully.");
        setSettings((s) => {
          setOriginal(s);
          return s;
        });
        setLastUpdated(new Date());
      } else {
        toast.error(json.error || (language === "bm" ? "Gagal menyimpan." : "Failed to save."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(original);
  };

  return (
    <div className="flex flex-col gap-5 pb-6 view-enter">
      {/* Header */}
      <GlassCard variant="panel" className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {language === "bm" ? "Tetapan Sistem" : "System Settings"}
            </h1>
            <p className="text-xs text-cyan-200/80 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {lastUpdated
                ? `${language === "bm" ? "Kemas kini terakhir: " : "Last updated: "}${lastUpdated.toLocaleString()}`
                : language === "bm"
                ? "Konfigurasi VMS ADTEC Bintulu"
                : "VMS ADTEC Bintulu configuration"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <GlassButton
              variant="ghost"
              className="h-9 px-3"
              onClick={handleReset}
              disabled={saving}
            >
              {language === "bm" ? "Batal" : "Reset"}
            </GlassButton>
          )}
          <GlassButton
            variant="primary"
            className="h-9 px-4"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {language === "bm" ? "Simpan Tetapan" : "Save Settings"}
          </GlassButton>
        </div>
      </GlassCard>

      {/* PDPA compliance banner */}
      <GlassCard variant="soft" className="p-4 border-cyan-400/30 bg-cyan-500/5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-100">
              {language === "bm"
                ? "Pematuhan Akta Perlindungan Data Peribadi (PDPA) 2010"
                : "Personal Data Protection Act (PDPA) 2010 Compliance"}
            </h3>
            <p className="text-xs text-cyan-200/80 mt-1">
              {language === "bm"
                ? "Tetapan di bawah mempengaruhi pemprosesan, penyimpanan, dan pelupusan data peribadi pelawat. Pastikan konfigurasi selaras dengan dasar PDPA organisasi."
                : "Settings below affect the processing, retention, and disposal of visitor personal data. Ensure configuration aligns with organizational PDPA policy."}
            </p>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Operational Settings */}
          <SettingsCard
            title={language === "bm" ? "Tetapan Operasi" : "Operational Settings"}
            description={
              language === "bm"
                ? "Konfigurasi parameter operasi harian VMS."
                : "Configure VMS daily operation parameters."
            }
            icon={<Timer className="w-4 h-4" />}
            color="cyan"
            changed={changedKeys.filter((k) =>
              ["staff_verification_sla_hours", "overstay_threshold_minutes", "max_upload_size_mb"].includes(k)
            ).length}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberField
                icon={<Clock className="w-3.5 h-3.5" />}
                label={language === "bm" ? "SLA Pengesahan Staf (jam)" : "Staff Verification SLA (hours)"}
                hint={
                  language === "bm"
                    ? "Tempoh maksimum staf perlu sahkan urusan."
                    : "Maximum time for staff to verify a visit."
                }
                value={settings.staff_verification_sla_hours ?? 2}
                onChange={(v) => handleChange("staff_verification_sla_hours", v)}
                min={1}
                max={168}
              />
              <NumberField
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                label={language === "bm" ? "Ambang Overstay (minit)" : "Overstay Threshold (minutes)"}
                hint={
                  language === "bm"
                    ? "Selepas tempoh ini, pelawat ditanda overstay."
                    : "After this duration, visitor is flagged as overstay."
                }
                value={settings.overstay_threshold_minutes ?? 180}
                onChange={(v) => handleChange("overstay_threshold_minutes", v)}
                min={15}
                max={1440}
              />
              <NumberField
                icon={<Upload className="w-3.5 h-3.5" />}
                label={language === "bm" ? "Saiz Muat Naik Maks (MB)" : "Max Upload Size (MB)"}
                hint={
                  language === "bm"
                    ? "Saiz fail maksimum untuk dokumen pengenalan."
                    : "Maximum file size for identification documents."
                }
                value={settings.max_upload_size_mb ?? 5}
                onChange={(v) => handleChange("max_upload_size_mb", v)}
                min={1}
                max={50}
              />
            </div>
          </SettingsCard>

          {/* Data Retention (PDPA) */}
          <SettingsCard
            title={language === "bm" ? "Pengekalan Data (PDPA)" : "Data Retention (PDPA)"}
            description={
              language === "bm"
                ? "Tempoh penyimpanan data pelawat sebelum dilupuskan secara automatik."
                : "Period to retain visitor data before automatic disposal."
            }
            icon={<Database className="w-4 h-4" />}
            color="emerald"
            changed={changedKeys.includes("data_retention_months") ? 1 : 0}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField
                icon={<Database className="w-3.5 h-3.5" />}
                label={language === "bm" ? "Tempoh Pengekalan (bulan)" : "Retention Period (months)"}
                hint={
                  language === "bm"
                    ? "Data dilupuskan selepas tempoh ini mengikut PDPA."
                    : "Data is disposed after this period per PDPA."
                }
                value={settings.data_retention_months ?? 24}
                onChange={(v) => handleChange("data_retention_months", v)}
                min={1}
                max={120}
              />
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-200/90">
                  {language === "bm"
                    ? "PDPA 2010 (Seksyen 12) memerlukan data peribadi tidak disimpan lebih lama dari yang perlu untuk tujuan pemprosesan."
                    : "PDPA 2010 (Section 12) requires personal data not be kept longer than necessary for processing purposes."}
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Organization */}
          <SettingsCard
            title={language === "bm" ? "Maklumat Organisasi" : "Organization Information"}
            description={
              language === "bm"
                ? "Butiran organisasi yang dipaparkan di seluruh sistem VMS."
                : "Organization details displayed throughout the VMS."
            }
            icon={<Building2 className="w-4 h-4" />}
            color="blue"
            changed={changedKeys.filter((k) =>
              ["organization_name", "organization_short"].includes(k)
            ).length}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                icon={<Building2 className="w-3.5 h-3.5" />}
                label={language === "bm" ? "Nama Organisasi" : "Organization Name"}
                value={settings.organization_name || ""}
                onChange={(v) => handleChange("organization_name", v)}
                placeholder="Kolej Teknologi Termaju Kampus Bintulu"
              />
              <TextField
                icon={<FileText className="w-3.5 h-3.5" />}
                label={language === "bm" ? "Nama Ringkas" : "Short Name"}
                value={settings.organization_short || ""}
                onChange={(v) => handleChange("organization_short", v)}
                placeholder="ADTEC Bintulu"
              />
            </div>
          </SettingsCard>

          {/* PDPA Notice */}
          <SettingsCard
            title={language === "bm" ? "Notis PDPA" : "PDPA Notice"}
            description={
              language === "bm"
                ? "Teks notis yang dipaparkan kepada pelawat semasa pendaftaran."
                : "Notice text shown to visitors during registration."
            }
            icon={<FileText className="w-4 h-4" />}
            color="amber"
            changed={changedKeys.includes("pdpa_notice_text") ? 1 : 0}
          >
            <Textarea
              value={settings.pdpa_notice_text || ""}
              onChange={(e) => handleChange("pdpa_notice_text", e.target.value)}
              placeholder={
                language === "bm"
                  ? "Saya bersetuju dengan pemprosesan data peribadi selaras dengan Akta Perlindungan Data Peribadi 2010 (PDPA)..."
                  : "I consent to the processing of personal data in accordance with the Personal Data Protection Act 2010 (PDPA)..."
              }
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[120px] text-sm"
              maxLength={2000}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-cyan-200/70 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {language === "bm"
                  ? "Teks ini dipaparkan dengan keizinan (checkbox) wajib dalam borang pendaftaran."
                  : "This text is shown with a mandatory consent checkbox in the registration form."}
              </p>
              <span className="text-[10px] text-white/40">
                {(settings.pdpa_notice_text || "").length}/2000
              </span>
            </div>
          </SettingsCard>

          {/* Save bar */}
          {hasChanges && (
            <div className="sticky bottom-4 z-30">
              <GlassCard
                variant="panel"
                className="p-3 flex items-center justify-between gap-3 border-cyan-400/40 shadow-lg shadow-cyan-900/30"
              >
                <div className="flex items-center gap-2 text-xs text-cyan-100">
                  <AlertCircle className="w-4 h-4 text-amber-300" />
                  <span>
                    {changedKeys.length}{" "}
                    {language === "bm" ? "perubahan belum disimpan" : "unsaved change(s)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GlassButton variant="ghost" className="h-9 px-3" onClick={handleReset} disabled={saving}>
                    {language === "bm" ? "Batal" : "Discard"}
                  </GlassButton>
                  <GlassButton variant="success" className="h-9 px-4" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {language === "bm" ? "Simpan" : "Save"}
                  </GlassButton>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Saved confirmation */}
          {!hasChanges && lastUpdated && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-300/80 py-2">
              <CheckCircle2 className="w-4 h-4" />
              {language === "bm"
                ? "Semua perubahan telah disimpan."
                : "All changes have been saved."}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ===== Sub-components =====

function SettingsCard({
  title,
  description,
  icon,
  color,
  changed,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "cyan" | "emerald" | "blue" | "amber";
  changed: number;
  children: React.ReactNode;
}) {
  const colorMap = {
    cyan: "from-cyan-500/20 border-cyan-400/30 text-cyan-300",
    emerald: "from-emerald-500/20 border-emerald-400/30 text-emerald-300",
    blue: "from-blue-500/20 border-blue-400/30 text-blue-300",
    amber: "from-amber-500/20 border-amber-400/30 text-amber-300",
  };
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-9 h-9 rounded-lg border flex items-center justify-center bg-gradient-to-br to-transparent",
              colorMap[color]
            )}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {title}
              {changed > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                  {changed} {changed === 1 ? "change" : "changes"}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-cyan-200/70">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </GlassCard>
  );
}

function NumberField({
  icon,
  label,
  hint,
  value,
  onChange,
  min,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-cyan-100 font-medium flex items-center gap-1.5">
        <span className="text-cyan-300">{icon}</span>
        {label}
      </Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        min={min}
        max={max}
        className="bg-white/10 border-white/20 text-white h-10"
      />
      {hint && <p className="text-[10px] text-white/50">{hint}</p>}
    </div>
  );
}

function TextField({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-cyan-100 font-medium flex items-center gap-1.5">
        <span className="text-cyan-300">{icon}</span>
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10"
      />
    </div>
  );
}
