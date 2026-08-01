"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { Stepper } from "@/components/vms/Stepper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Check,
  Copy,
  ShieldCheck,
  User,
  Building2,
  Calendar,
  Phone,
  Mail,
  IdCard,
  Loader2,
  Sparkles,
  Home,
  Search,
  AlertCircle,
} from "lucide-react";

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  department: { id: string; name: string };
}

interface UploadedDoc {
  docType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  previewUrl?: string;
}

interface FormData {
  fullName: string;
  icPassportNo: string;
  phone: string;
  email: string;
  company: string;
  purpose: string;
  hostStaffId: string;
  expectedVisitDate: string;
  pdpaConsent: boolean;
}

const STEPS = [
  { id: 1, label: "Maklumat", labelEn: "Information" },
  { id: 2, label: "Muat Naik ID", labelEn: "Upload ID" },
  { id: 3, label: "Semak & Hantar", labelEn: "Review & Submit" },
];

const DOC_TYPES = [
  { value: "mykad", label: "MyKad", labelEn: "MyKad" },
  { value: "passport", label: "Pasport", labelEn: "Passport" },
  { value: "license", label: "Lesen Memandu", labelEn: "Driving License" },
  { value: "other", label: "Lain-lain", labelEn: "Other" },
];

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit (Vercel serverless)

const EMPTY_FORM: FormData = {
  fullName: "",
  icPassportNo: "",
  phone: "",
  email: "",
  company: "",
  purpose: "",
  hostStaffId: "",
  expectedVisitDate: "",
  pdpaConsent: false,
};

export function VisitorRegisterView() {
  const { language } = useUIStore();
  const { navigate, back } = useRouterStore();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("mykad");
  const [success, setSuccess] = useState<{ referenceCode: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/staff");
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          setStaff(json.data);
        }
      } catch {
        if (!cancelled) {
          toast.error(language === "bm" ? "Gagal memuatkan senarai staf." : "Failed to load staff list.");
        }
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      documents.forEach((d) => {
        if (d.previewUrl) URL.revokeObjectURL(d.previewUrl);
      });
    };
     
  }, []);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Group staff by department
  const staffByDept = staff.reduce((acc, s) => {
    const deptName = s.department?.name || (language === "bm" ? "Tiada Jabatan" : "No Department");
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(s);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  const selectedStaff = staff.find((s) => s.id === form.hostStaffId);

  // ===== Step 1 validation =====
  const step1Errors = (): string[] => {
    const errs: string[] = [];
    if (!form.fullName || form.fullName.trim().length < 3)
      errs.push(language === "bm" ? "Nama penuh diperlukan (minimum 3 aksara)." : "Full name is required (min 3 chars).");
    if (!form.icPassportNo || form.icPassportNo.trim().length < 5)
      errs.push(language === "bm" ? "No. MyKad/Pasport diperlukan." : "MyKad/Passport No. is required.");
    if (!form.phone || form.phone.replace(/\D/g, "").length < 9)
      errs.push(language === "bm" ? "No. telefon tidak sah." : "Invalid phone number.");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.push(language === "bm" ? "Format e-mel tidak sah." : "Invalid email format.");
    if (!form.purpose || form.purpose.trim().length < 5)
      errs.push(language === "bm" ? "Tujuan urusan diperlukan (minimum 5 aksara)." : "Purpose is required (min 5 chars).");
    if (!form.hostStaffId)
      errs.push(language === "bm" ? "Sila pilih staf yang hendak ditemui." : "Please select host staff.");
    if (!form.expectedVisitDate)
      errs.push(language === "bm" ? "Tarikh & masa lawatan diperlukan." : "Expected visit date is required.");
    return errs;
  };

  // ===== Upload handling =====
  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      if (!ALLOWED_MIME.includes(file.type)) {
        toast.error(
          language === "bm"
            ? `Format tidak disokong: ${file.type}. Hanya JPG, PNG, atau PDF.`
            : `Unsupported format: ${file.type}. Only JPG, PNG, or PDF.`
        );
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(
          language === "bm"
            ? `Saiz fail melebihi 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB).`
            : `File exceeds 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB).`
        );
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.success) {
          toast.error(json.message || (language === "bm" ? "Muat naik gagal." : "Upload failed."));
          return;
        }

        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

        setDocuments((prev) => [
          ...prev,
          {
            docType: selectedDocType,
            fileName: json.data.fileName,
            filePath: json.data.filePath,
            fileSize: json.data.fileSize,
            mimeType: json.data.mimeType,
            previewUrl,
          },
        ]);
        toast.success(language === "bm" ? "Fail berjaya dimuat naik." : "File uploaded successfully.");
      } catch {
        toast.error(language === "bm" ? "Ralat rangkaian semasa muat naik." : "Network error during upload.");
      } finally {
        setUploading(false);
      }
    },
    [language, selectedDocType]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeDoc = (idx: number) => {
    setDocuments((prev) => {
      const copy = [...prev];
      const removed = copy[idx];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      copy.splice(idx, 1);
      return copy;
    });
  };

  // ===== Step navigation =====
  const goNext = () => {
    if (step === 1) {
      const errs = step1Errors();
      if (errs.length > 0) {
        errs.forEach((e) => toast.error(e));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (documents.length === 0) {
        toast.error(
          language === "bm"
            ? "Sekurang-kurangnya satu dokumen pengenalan wajib dimuat naik."
            : "At least one identity document is required."
        );
        return;
      }
      setStep(3);
    }
  };

  const goPrev = () => {
    if (step === 1) {
      back();
    } else {
      setStep((s) => s - 1);
    }
  };

  // ===== Submit =====
  const submit = async () => {
    if (!form.pdpaConsent) {
      toast.error(language === "bm" ? "Sila tandakan kebenaran PDPA untuk meneruskan." : "Please accept PDPA consent to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        icPassportNo: form.icPassportNo.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        company: form.company.trim() || undefined,
        purpose: form.purpose.trim(),
        hostStaffId: form.hostStaffId,
        expectedVisitDate: form.expectedVisitDate,
        pdpaConsent: true,
        documents: documents.map((d) => ({
          docType: d.docType,
          fileName: d.fileName,
          filePath: d.filePath,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
        })),
      };
      const res = await fetch("/api/visits/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message || (language === "bm" ? "Pendaftaran gagal." : "Registration failed."));
        return;
      }
      setSuccess({ referenceCode: json.data.referenceCode });
      toast.success(language === "bm" ? "Pendaftaran berjaya!" : "Registration successful!");
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyReference = async () => {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.referenceCode);
      setCopied(true);
      toast.success(language === "bm" ? "Kod rujukan disalin." : "Reference code copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(language === "bm" ? "Gagal menyalin." : "Failed to copy.");
    }
  };

  const resetForm = () => {
    documents.forEach((d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl));
    setDocuments([]);
    setForm(EMPTY_FORM);
    setStep(1);
    setSuccess(null);
  };

  // ===== SUCCESS SCREEN =====
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-6 sm:p-10 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/40 pulse-live">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t("registrationSuccess", language)}
          </h2>
          <p className="text-white/75 text-sm sm:text-base mb-6">
            {language === "bm"
              ? "Permohonan anda telah dihantar. Sila catat kod rujukan di bawah untuk semakan status."
              : "Your application has been submitted. Please note your reference code below for status check."}
          </p>

          <div className="bg-white/5 border border-white/15 rounded-2xl p-5 sm:p-6 mb-6">
            <div className="text-xs uppercase tracking-wider text-cyan-200 font-semibold mb-2">
              {t("yourReference", language)}
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-wider break-all">
              {success.referenceCode}
            </div>
            <button
              onClick={copyReference}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-100 text-sm font-semibold transition-all min-h-[44px]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? (language === "bm" ? "Disalin!" : "Copied!") : (language === "bm" ? "Salin Kod" : "Copy Code")}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassButton
              variant="outline"
              className="text-white min-h-[48px]"
              onClick={() => navigate("visitor-status", { code: success.referenceCode })}
            >
              <Search className="w-4 h-4" />
              {t("checkStatus", language)}
            </GlassButton>
            <GlassButton
              variant="primary"
              className="min-h-[48px]"
              onClick={() => {
                resetForm();
                navigate("landing");
              }}
            >
              <Home className="w-4 h-4" />
              {language === "bm" ? "Laman Utama" : "Back to Home"}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <GlassCard variant="soft" className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={goPrev}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back", language)}
          </button>
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
            {language === "bm" ? "Langkah" : "Step"} {step} / 3
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-5">
          {t("visitorRegTitle", language)}
        </h1>
        <Stepper steps={STEPS} current={step} language={language} />
      </GlassCard>

      {/* Step 1: Information */}
      {step === 1 && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("fullName", language)} icon={User} required>
              <Input
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder={language === "bm" ? "Cth: Ahmad bin Ali" : "e.g. John Doe"}
                className="glass-input h-11"
              />
            </Field>
            <Field label={t("icPassport", language)} icon={IdCard} required>
              <Input
                value={form.icPassportNo}
                onChange={(e) => set("icPassportNo", e.target.value)}
                placeholder={language === "bm" ? "Cth: 901234-14-5678" : "e.g. 901234-14-5678"}
                className="glass-input h-11"
              />
            </Field>
            <Field label={t("visitorPhone", language)} icon={Phone} required>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="012-345 6789"
                inputMode="tel"
                className="glass-input h-11"
              />
            </Field>
            <Field label={t("visitorEmail", language)} icon={Mail}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="nama@email.com"
                className="glass-input h-11"
              />
            </Field>
            <Field label={t("visitorCompany", language)} icon={Building2}>
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder={language === "bm" ? "Cth: ABC Sdn Bhd" : "e.g. ABC Sdn Bhd"}
                className="glass-input h-11"
              />
            </Field>
            <Field label={t("expectedDate", language)} icon={Calendar} required>
              <Input
                type="datetime-local"
                value={form.expectedVisitDate}
                onChange={(e) => set("expectedVisitDate", e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="glass-input h-11"
              />
            </Field>
          </div>

          <Field label={t("visitPurpose", language)} icon={Sparkles} required>
            <Textarea
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder={
                language === "bm"
                  ? "Nyatakan tujuan lawatan secara ringkas..."
                  : "Briefly state the purpose of your visit..."
              }
              className="glass-input min-h-[90px]"
              rows={3}
            />
          </Field>

          <Field label={t("hostStaff", language)} icon={ShieldCheck} required>
            {staffLoading ? (
              <div className="flex items-center gap-2 text-white/70 text-sm h-11 px-3 rounded-lg bg-white/5 border border-white/10">
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === "bm" ? "Memuatkan staf..." : "Loading staff..."}
              </div>
            ) : (
              <Select value={form.hostStaffId} onValueChange={(v) => set("hostStaffId", v)}>
                <SelectTrigger className="glass-input h-11 w-full">
                  <SelectValue placeholder={language === "bm" ? "Pilih staf / jabatan" : "Select staff / department"} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {staff.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      {language === "bm" ? "Tiada staf aktif." : "No active staff."}
                    </SelectItem>
                  ) : (
                    Object.entries(staffByDept).map(([dept, members]) => (
                      <SelectGroup key={dept}>
                        <SelectLabel className="text-cyan-300 font-semibold">{dept}</SelectLabel>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.fullName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </Field>

          <div className="flex justify-end pt-2">
            <GlassButton variant="primary" className="min-h-[48px] px-6" onClick={goNext}>
              {t("next", language)}
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Upload ID */}
      {step === 2 && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">{t("uploadIdTitle", language)}</h2>
            <p className="text-sm text-white/70">{t("uploadIdDesc", language)}</p>
          </div>

          {/* Doc type selector */}
          <div>
            <Label className="text-white/80 text-xs font-semibold mb-2 block">
              {language === "bm" ? "Jenis Dokumen" : "Document Type"}
            </Label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  onClick={() => setSelectedDocType(dt.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold border transition-all min-h-[40px]",
                    selectedDocType === dt.value
                      ? "bg-cyan-500/25 border-cyan-400/40 text-white"
                      : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                  )}
                >
                  {language === "en" ? dt.labelEn : dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all",
              dragActive
                ? "border-cyan-400 bg-cyan-400/10"
                : "border-white/25 bg-white/5 hover:bg-white/10 hover:border-white/40"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={onInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                {uploading ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <Upload className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {uploading
                    ? language === "bm" ? "Sedang memuat naik..." : "Uploading..."
                    : t("dragDrop", language)}
                </p>
                <p className="text-xs text-white/60 mt-1">JPG / PNG / PDF · {language === "bm" ? "Maks" : "Max"} 5MB</p>
              </div>
            </div>
          </div>

          {/* Documents list */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white/80 text-xs font-semibold">
                {language === "bm" ? "Dokumen Dimuat Naik" : "Uploaded Documents"} ({documents.length})
              </Label>
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    {/* Preview */}
                    <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {doc.previewUrl ? (
                         
                        <img src={doc.previewUrl} alt={doc.fileName} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-red-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{doc.fileName}</div>
                      <div className="text-xs text-white/60 flex items-center gap-2">
                        <span className="uppercase">{doc.docType}</span>
                        <span>·</span>
                        <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDoc(idx)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors flex-shrink-0"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <GlassButton variant="ghost" className="min-h-[48px]" onClick={goPrev}>
              <ArrowLeft className="w-4 h-4" />
              {t("previous", language)}
            </GlassButton>
            <GlassButton variant="primary" className="min-h-[48px] px-6" onClick={goNext}>
              {t("next", language)}
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <GlassCard className="p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">{t("reviewTitle", language)}</h2>
            <p className="text-sm text-white/70">
              {language === "bm"
                ? "Sila semak maklumat di bawah sebelum menghantar."
                : "Please review the information below before submitting."}
            </p>
          </div>

          {/* Review grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ReviewItem icon={User} label={t("fullName", language)} value={form.fullName} />
            <ReviewItem icon={IdCard} label={t("icPassport", language)} value={form.icPassportNo} />
            <ReviewItem icon={Phone} label={t("visitorPhone", language)} value={form.phone} />
            <ReviewItem icon={Mail} label={t("visitorEmail", language)} value={form.email || "—"} />
            <ReviewItem icon={Building2} label={t("visitorCompany", language)} value={form.company || "—"} />
            <ReviewItem
              icon={Calendar}
              label={t("expectedDate", language)}
              value={form.expectedVisitDate ? new Date(form.expectedVisitDate).toLocaleString(language === "bm" ? "ms-MY" : "en-GB") : "—"}
            />
            <ReviewItem
              icon={ShieldCheck}
              label={t("hostStaff", language)}
              value={
                selectedStaff
                  ? `${selectedStaff.fullName} · ${selectedStaff.department?.name || ""}`
                  : "—"
              }
              full
            />
            <ReviewItem icon={Sparkles} label={t("visitPurpose", language)} value={form.purpose} full />
            <ReviewItem
              icon={ImageIcon}
              label={language === "bm" ? "Dokumen" : "Documents"}
              value={`${documents.length} ${language === "bm" ? "fail dimuat naik" : "file(s) uploaded"}`}
              full
            />
          </div>

          {/* PDPA */}
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-100 mb-1">{t("pdpaNotice", language)}</div>
                <p className="text-xs text-amber-100/80 leading-relaxed">
                  {language === "bm"
                    ? "Maklumat peribadi yang diberikan akan diproses selaras dengan Akta Perlindungan Data Peribadi 2010 (PDPA) untuk tujuan pengurusan lawatan di ADTEC Bintulu."
                    : "Personal data provided will be processed in accordance with the Personal Data Protection Act 2010 (PDPA) for visitor management purposes at ADTEC Bintulu."}
                </p>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Checkbox
                checked={form.pdpaConsent}
                onCheckedChange={(v) => set("pdpaConsent", v === true)}
                className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <span className="text-sm text-white/90 leading-snug">{t("pdpaConsent", language)}</span>
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <GlassButton variant="ghost" className="min-h-[48px]" onClick={goPrev}>
              <ArrowLeft className="w-4 h-4" />
              {t("previous", language)}
            </GlassButton>
            <GlassButton
              variant="success"
              className="min-h-[48px] px-6"
              onClick={submit}
              disabled={submitting || !form.pdpaConsent}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === "bm" ? "Menghantar..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t("submitApplication", language)}
                </>
              )}
            </GlassButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ===== Helper components =====

function Field({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
        {required && <span className="text-red-400">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ReviewItem({
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
