"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
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
  UserPlus,
  Zap,
  AlertCircle,
} from "lucide-react";
import type { StaffMember } from "./_types";

const DOC_TYPES = [
  { value: "mykad", label: "MyKad", labelEn: "MyKad" },
  { value: "passport", label: "Pasport", labelEn: "Passport" },
  { value: "license", label: "Lesen Memandu", labelEn: "Driving License" },
  { value: "other", label: "Lain-lain", labelEn: "Other" },
];

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit (Vercel serverless)

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

// Local datetime helper: returns yyyy-MM-ddTHH:mm in local time
function nowLocalDateTime(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function SecurityWalkIn() {
  const { language } = useUIStore();
  const { navigate, back } = useRouterStore();

  const [form, setForm] = useState<FormData>({
    ...EMPTY_FORM,
    expectedVisitDate: nowLocalDateTime(),
  });
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState<"none" | "register" | "full">("none");
  const [selectedDocType, setSelectedDocType] = useState("mykad");
  const [success, setSuccess] = useState<{
    referenceCode: string;
    visitId: string;
    checkedIn?: boolean;
  } | null>(null);
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

  const staffByDept = staff.reduce((acc, s) => {
    const deptName = s.department?.name || (language === "bm" ? "Tiada Jabatan" : "No Department");
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(s);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  // ===== Validation =====
  const validate = (): string[] => {
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
    if (documents.length === 0)
      errs.push(language === "bm" ? "Sekurang-kurangnya satu dokumen pengenalan wajib dimuat naik." : "At least one identity document is required.");
    if (!form.pdpaConsent)
      errs.push(language === "bm" ? "Kebenaran PDPA wajib ditandakan." : "PDPA consent is required.");
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
          toast.error(json.error || json.message || (language === "bm" ? "Muat naik gagal." : "Upload failed."));
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
    e.target.value = "";
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

  // ===== Submit (two modes) =====
  const buildPayload = () => ({
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
  });

  const registerVisit = async (): Promise<{ visitId: string; referenceCode: string } | null> => {
    const res = await fetch("/api/visits/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error || json.message || (language === "bm" ? "Pendaftaran gagal." : "Registration failed."));
      return null;
    }
    // visit payload structure: { visit: { id }, referenceCode }
    const visitId = json.data?.visit?.id || json.data?.id;
    const referenceCode = json.data?.referenceCode || json.data?.visit?.referenceCode;
    if (!visitId || !referenceCode) {
      toast.error(language === "bm" ? "Respons pendaftaran tidak lengkap." : "Incomplete registration response.");
      return null;
    }
    return { visitId, referenceCode };
  };

  const approveVisit = async (visitId: string): Promise<boolean> => {
    const res = await fetch(`/api/visits/${visitId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Walk-in approval by security counter" }),
    });
    const json = await res.json();
    return !!json.success;
  };

  const checkInVisit = async (visitId: string): Promise<boolean> => {
    const res = await fetch(`/api/visits/${visitId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    return !!json.success;
  };

  const submit = async (mode: "register" | "full") => {
    const errs = validate();
    if (errs.length > 0) {
      errs.forEach((e) => toast.error(e));
      return;
    }
    setSubmitting(mode);
    try {
      const reg = await registerVisit();
      if (!reg) return;

      if (mode === "register") {
        setSuccess({ referenceCode: reg.referenceCode, visitId: reg.visitId });
        toast.success(language === "bm" ? "Pendaftaran berjaya!" : "Registration successful!");
        return;
      }

      // Full mode: approve + check-in
      toast.loading(language === "bm" ? "Meluluskan..." : "Approving...", { id: "approve" });
      const okApprove = await approveVisit(reg.visitId);
      if (!okApprove) {
        toast.dismiss("approve");
        toast.error(
          language === "bm"
            ? "Pendaftaran berjaya tetapi kelulusan gagal. Sila luluskan secara manual di dashboard."
            : "Registered but approval failed. Please approve manually in the dashboard."
        );
        setSuccess({ referenceCode: reg.referenceCode, visitId: reg.visitId });
        return;
      }
      toast.dismiss("approve");

      toast.loading(language === "bm" ? "Daftar masuk..." : "Checking in...", { id: "checkin" });
      const okCheckin = await checkInVisit(reg.visitId);
      toast.dismiss("checkin");
      if (!okCheckin) {
        toast.error(
          language === "bm"
            ? "Diluluskan tetapi daftar masuk gagal. Sila daftar masuk secara manual di dashboard."
            : "Approved but check-in failed. Please check in manually in the dashboard."
        );
        setSuccess({ referenceCode: reg.referenceCode, visitId: reg.visitId });
        return;
      }

      setSuccess({
        referenceCode: reg.referenceCode,
        visitId: reg.visitId,
        checkedIn: true,
      });
      toast.success(
        language === "bm"
          ? "Walk-in berjaya: didaftarkan, diluluskan & daftar masuk!"
          : "Walk-in complete: registered, approved & checked in!"
      );
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting("none");
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
    setForm({ ...EMPTY_FORM, expectedVisitDate: nowLocalDateTime() });
    setSelectedDocType("mykad");
    setSuccess(null);
  };

  // ===== SUCCESS SCREEN =====
  if (success) {
    return (
      <div className="max-w-2xl mx-auto view-enter">
        <GlassCard className="p-6 sm:p-10 text-center">
          <div className="flex justify-center mb-5">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center shadow-lg pulse-live",
                success.checkedIn
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-emerald-600/40"
                  : "bg-gradient-to-br from-cyan-400 to-blue-700 shadow-cyan-600/40"
              )}
            >
              {success.checkedIn ? (
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              ) : (
                <Sparkles className="w-10 h-10 text-white" />
              )}
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {success.checkedIn
              ? language === "bm"
                ? "Walk-In Selesai!"
                : "Walk-In Complete!"
              : t("registrationSuccess", language)}
          </h2>
          <p className="text-white/75 text-sm sm:text-base mb-6">
            {success.checkedIn
              ? language === "bm"
                ? "Pelawat telah didaftarkan, diluluskan dan berjaya daftar masuk."
                : "Visitor has been registered, approved and checked in."
              : language === "bm"
              ? "Lawatan walk-in telah didaftarkan. Sila luluskan & daftar masuk di dashboard."
              : "Walk-in visit registered. Please approve & check-in from the dashboard."}
          </p>

          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 sm:p-6 mb-6">
            <div className="text-xs uppercase tracking-wide text-white/50 mb-2">
              {t("yourReference", language)}
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-cyan-300 tracking-wider break-all">
              {success.referenceCode}
            </div>
            <button
              onClick={copyReference}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition min-h-[40px] px-3"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied
                ? language === "bm"
                  ? "Disalin!"
                  : "Copied!"
                : language === "bm"
                ? "Salin kod"
                : "Copy code"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <GlassButton variant="primary" onClick={resetForm} className="min-h-[44px]">
              <UserPlus className="w-4 h-4" />
              {language === "bm" ? "Daftar Lagi" : "Register Another"}
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => navigate("security-dashboard")} className="min-h-[44px]">
              <Home className="w-4 h-4" />
              {language === "bm" ? "Dashboard" : "Dashboard"}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ===== FORM =====
  return (
    <div className="max-w-4xl mx-auto view-enter">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={back}
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition min-h-[40px] px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back", language)}
        </button>
      </div>

      <GlassCard className="p-5 sm:p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shrink-0 shadow-lg">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {t("walkInReg", language)}
            </h1>
            <p className="text-sm text-white/70 mt-1">
              {language === "bm"
                ? "Pendaftaran walk-in di kaunter pengawal keselamatan"
                : "Counter walk-in registration by security guard"}
            </p>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label={t("fullName", language)}
            icon={User}
            required
            full
          >
            <Input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder={language === "bm" ? "Cth: Ahmad bin Ali" : "Eg: Ahmad bin Ali"}
              className="glass-input min-h-[44px]"
            />
          </Field>

          <Field label={t("icPassport", language)} icon={IdCard} required>
            <Input
              value={form.icPassportNo}
              onChange={(e) => set("icPassportNo", e.target.value)}
              placeholder="XXXXXX-XX-XXXX"
              className="glass-input min-h-[44px]"
            />
          </Field>

          <Field label={t("visitorPhone", language)} icon={Phone} required>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="01X-XXX XXXX"
              className="glass-input min-h-[44px]"
              inputMode="tel"
            />
          </Field>

          <Field label={t("visitorEmail", language)} icon={Mail}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="nama@email.com"
              className="glass-input min-h-[44px]"
            />
          </Field>

          <Field label={t("visitorCompany", language)} icon={Building2}>
            <Input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder={language === "bm" ? "Nama syarikat (opsyenal)" : "Company name (optional)"}
              className="glass-input min-h-[44px]"
            />
          </Field>

          <Field label={t("expectedDate", language)} icon={Calendar} required>
            <Input
              type="datetime-local"
              value={form.expectedVisitDate}
              onChange={(e) => set("expectedVisitDate", e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="glass-input min-h-[44px]"
            />
          </Field>

          <Field label={t("hostStaff", language)} icon={User} required full>
            {staffLoading ? (
              <div className="flex items-center gap-2 text-sm text-white/60 min-h-[44px]">
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === "bm" ? "Memuatkan staf..." : "Loading staff..."}
              </div>
            ) : (
              <Select value={form.hostStaffId} onValueChange={(v) => set("hostStaffId", v)}>
                <SelectTrigger className="glass-input min-h-[44px] w-full">
                  <SelectValue
                    placeholder={
                      language === "bm"
                        ? "Pilih staf / jabatan"
                        : "Select staff / department"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(staffByDept).map(([dept, members]) => (
                    <SelectGroup key={dept}>
                      <SelectLabel className="text-xs uppercase text-white/50">{dept}</SelectLabel>
                      {members.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.fullName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field label={t("visitPurpose", language)} icon={FileText} required full>
            <Textarea
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={
                language === "bm"
                  ? "Nyatakan tujuan urusan dengan staf..."
                  : "State the purpose of meeting the staff..."
              }
              className="glass-input min-h-[80px] resize-none"
            />
          </Field>
        </div>

        {/* Document upload */}
        <div className="mt-6">
          <Label className="text-white/80 text-sm font-medium mb-2 block">
            {t("uploadIdTitle", language)}
            <span className="text-red-400 ml-1">*</span>
          </Label>
          <p className="text-xs text-white/60 mb-3">{t("uploadIdDesc", language)}</p>

          {/* Doc type chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {DOC_TYPES.map((dt) => (
              <button
                key={dt.value}
                type="button"
                onClick={() => setSelectedDocType(dt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition min-h-[36px]",
                  selectedDocType === dt.value
                    ? "bg-cyan-500/30 border-cyan-400/50 text-cyan-100"
                    : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
                )}
              >
                {language === "en" ? dt.labelEn : dt.label}
              </button>
            ))}
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition",
              dragActive
                ? "border-cyan-400 bg-cyan-500/10"
                : "border-white/20 bg-white/5 hover:bg-white/10"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={onInputChange}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-white/80">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm text-white/80">{language === "bm" ? "Memuat naik..." : "Uploading..."}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/70">
                <Upload className="w-8 h-8" />
                <p className="text-sm font-medium">{t("dragDrop", language)}</p>
                <p className="text-xs text-white/50">JPG / PNG / PDF · Maks 5MB</p>
              </div>
            )}
          </div>

          {/* Uploaded list */}
          {documents.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documents.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10"
                >
                  {d.previewUrl ? (
                    <img
                      src={d.previewUrl}
                      alt={d.fileName}
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-white/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{d.fileName}</div>
                    <div className="text-[10px] text-white/50">
                      {DOC_TYPES.find((dt) => dt.value === d.docType)?.label || d.docType} ·{" "}
                      {(d.fileSize / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDoc(idx);
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-300 transition"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PDPA */}
        <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-100 mb-1">
                {t("pdpaNotice", language)}
              </div>
              <p className="text-xs text-amber-200/80 mb-2">
                {language === "bm"
                  ? "Pastikan pelawat telah membaca dan bersetuju sebelum menandakan kebenaran di bawah. Tandatangan fizikal di kaunter digalakkan."
                  : "Ensure the visitor has read and agreed before checking the consent below. Physical signature at counter is encouraged."}
              </p>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="walkin-pdpa"
                  checked={form.pdpaConsent}
                  onCheckedChange={(v) => set("pdpaConsent", v === true)}
                  className="mt-1"
                />
                <Label htmlFor="walkin-pdpa" className="text-xs text-amber-100/90 cursor-pointer leading-relaxed">
                  {t("pdpaConsent", language)}
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <GlassButton
            variant="ghost"
            onClick={() => submit("register")}
            disabled={submitting !== "none"}
            className="min-h-[52px] w-full"
          >
            {submitting === "register" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
            <span className="font-semibold">
              {language === "bm" ? "Daftar Sahaja" : "Register Only"}
            </span>
            <span className="text-[10px] opacity-70">
              {language === "bm" ? "(lulus di dashboard)" : "(approve in dashboard)"}
            </span>
          </GlassButton>

          <GlassButton
            variant="success"
            onClick={() => submit("full")}
            disabled={submitting !== "none"}
            className="min-h-[52px] w-full"
          >
            {submitting === "full" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            <span className="font-semibold">
              {language === "bm" ? "Daftar & Lulus + Check-In" : "Register & Approve + Check-In"}
            </span>
          </GlassButton>
        </div>
        <p className="text-xs text-white/50 mt-3 text-center">
          {language === "bm"
            ? "Butang hijau akan: daftar → lulus → daftar masuk secara automatik."
            : "Green button will: register → approve → check-in automatically."}
        </p>
      </GlassCard>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  required,
  full,
  children,
}: {
  label: string;
  icon: React.ElementType;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <Label className="text-white/80 text-sm font-medium mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-white/50" />
        {label}
        {required && <span className="text-red-400">*</span>}
      </Label>
      {children}
    </div>
  );
}
