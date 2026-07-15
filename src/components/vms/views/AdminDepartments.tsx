"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Building2,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Users,
  AlertTriangle,
  Pencil,
  Search,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  description?: string | null;
  _count?: { profiles: number };
}

export function AdminDepartments() {
  const { language } = useUIStore();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/departments", { cache: "no-store" });
      const json = await res.json();
      if (!mounted.current) return;
      if (json.success && Array.isArray(json.data)) setDepartments(json.data);
      else
        toast.error(
          json.error || (language === "bm" ? "Gagal memuatkan jabatan." : "Failed to load departments.")
        );
    } catch {
      if (mounted.current)
        toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [language]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  const filtered = departments.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q);
  });

  const totalMembers = departments.reduce((a, d) => a + (d._count?.profiles || 0), 0);

  const handleCreate = async (name: string, description: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(language === "bm" ? "Jabatan berjaya dicipta." : "Department created.");
        setCreateOpen(false);
        fetchData();
      } else {
        toast.error(json.error || (language === "bm" ? "Gagal mencipta." : "Failed to create."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Note: edit uses local update only since no PATCH endpoint exists in API.
  // Edit will fall back to delete + create if name is changed.
  const handleEdit = async (dept: Department, name: string, description: string) => {
    // The API contract has no PATCH endpoint for departments.
    // We'll do delete + create only if user wants to make changes (and dept has no users).
    if (dept._count?.profiles && dept._count.profiles > 0) {
      toast.error(
        language === "bm"
          ? "Tidak boleh mengedit jabatan yang mempunyai pengguna. Alihkan pengguna terlebih dahulu."
          : "Cannot edit department with users. Reassign users first."
      );
      return;
    }
    setSubmitting(true);
    try {
      // delete then create
      const delRes = await fetch(`/api/admin/departments?id=${dept.id}`, { method: "DELETE" });
      const delJson = await delRes.json();
      if (!delJson.success) {
        toast.error(delJson.error || (language === "bm" ? "Gagal mengemas kini." : "Failed to update."));
        return;
      }
      const createRes = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      const createJson = await createRes.json();
      if (createJson.success) {
        toast.success(language === "bm" ? "Jabatan dikemas kini." : "Department updated.");
        setEditDept(null);
        fetchData();
      } else {
        toast.error(createJson.error || (language === "bm" ? "Gagal mengemas kini." : "Failed to update."));
        fetchData(); // re-sync
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDept) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/departments?id=${deleteDept.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(language === "bm" ? "Jabatan berjaya dipadam." : "Department deleted.");
        setDeleteDept(null);
        fetchData();
      } else {
        toast.error(json.error || (language === "bm" ? "Gagal memadam." : "Failed to delete."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading && departments.length === 0;

  return (
    <div className="flex flex-col gap-5 pb-6 view-enter">
      {/* Header */}
      <GlassCard variant="panel" className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {language === "bm" ? "Pengurusan Jabatan" : "Department Management"}
            </h1>
            <p className="text-xs text-cyan-200/80">
              {language === "bm"
                ? "Urus jabatan di PLTT Bintulu untuk pengagihan lawatan."
                : "Manage departments at PLTT Bintulu for visit routing."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" className="h-9 px-3" onClick={fetchData} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">{language === "bm" ? "Muat Semula" : "Refresh"}</span>
          </GlassButton>
          <GlassButton variant="primary" className="h-9 px-4" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            {language === "bm" ? "Tambah Jabatan" : "Add Department"}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Building2 className="w-4 h-4" />}
          color="cyan"
          value={departments.length}
          label={language === "bm" ? "Jumlah Jabatan" : "Total Departments"}
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          color="emerald"
          value={totalMembers}
          label={language === "bm" ? "Jumlah Ahli" : "Total Members"}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          color="amber"
          value={departments.filter((d) => (d._count?.profiles || 0) === 0).length}
          label={language === "bm" ? "Tiada Ahli" : "No Members"}
        />
      </div>

      {/* Search */}
      <GlassCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300" />
          <Input
            placeholder={language === "bm" ? "Cari jabatan..." : "Search departments..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10"
          />
        </div>
      </GlassCard>

      {/* Department grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 flex flex-col items-center text-center">
          <Building2 className="w-10 h-10 text-white/30 mb-2" />
          <div className="text-sm text-white/60">
            {language === "bm" ? "Tiada jabatan dijumpai." : "No departments found."}
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((dept) => {
            const count = dept._count?.profiles || 0;
            return (
              <GlassCard
                key={dept.id}
                hover
                className="p-5 flex flex-col gap-3 relative overflow-hidden group"
              >
                {/* decorative accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none" />

                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditDept(dept)}
                      className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                      title={language === "bm" ? "Edit" : "Edit"}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteDept(dept)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors"
                      title={language === "bm" ? "Padam" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{dept.name}</h3>
                  <p className="text-xs text-cyan-200/70 mt-1 line-clamp-2 min-h-[2rem]">
                    {dept.description || (language === "bm" ? "Tiada deskripsi." : "No description.")}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-auto border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        count > 0
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/50"
                      )}
                    >
                      {count}
                    </div>
                    <span className="text-[11px] text-white/60">
                      {count === 1
                        ? language === "bm"
                          ? "1 ahli"
                          : "1 member"
                        : language === "bm"
                        ? `${count} ahli`
                        : `${count} members`}
                    </span>
                  </div>
                  {count === 0 ? (
                    <span className="text-[10px] text-amber-300/80 font-medium">
                      {language === "bm" ? "Boleh dipadam" : "Deletable"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/40 font-medium">
                      {language === "bm" ? "Ada pengguna" : "Has users"}
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <DeptFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={language === "bm" ? "Tambah Jabatan Baru" : "Add New Department"}
        description={language === "bm" ? "Cipta jabatan baru untuk VMS." : "Create a new department for VMS."}
        language={language}
        submitting={submitting}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <DeptFormDialog
        open={!!editDept}
        onOpenChange={(open) => !open && setEditDept(null)}
        title={language === "bm" ? "Edit Jabatan" : "Edit Department"}
        description={
          editDept && (editDept._count?.profiles || 0) > 0
            ? language === "bm"
              ? "Jabatan ini mempunyai pengguna — alihkan pengguna dahulu sebelum edit."
              : "This department has users — reassign them before editing."
            : language === "bm"
            ? "Kemas kini maklumat jabatan."
            : "Update department details."
        }
        language={language}
        submitting={submitting}
        onSubmit={(name, description) => editDept && handleEdit(editDept, name, description)}
        initialName={editDept?.name}
        initialDescription={editDept?.description || ""}
        disabled={!!editDept && (editDept._count?.profiles || 0) > 0}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDept} onOpenChange={(open) => !open && setDeleteDept(null)}>
        <AlertDialogContent className="glass-panel border-red-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              {language === "bm" ? "Padam Jabatan" : "Delete Department"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cyan-200/80">
              {(deleteDept?._count?.profiles || 0) > 0 ? (
                <span className="flex items-start gap-2 text-amber-300 mt-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {language === "bm"
                      ? `Jabatan ini mempunyai ${deleteDept?._count?.profiles} pengguna. Alihkan pengguna ke jabatan lain sebelum memadam.`
                      : `This department has ${deleteDept?._count?.profiles} users. Reassign users before deleting.`}
                  </span>
                </span>
              ) : (
                language === "bm"
                  ? `Pasti ingin memadam jabatan "${deleteDept?.name}"? Tindakan ini tidak boleh diundur.`
                  : `Are you sure you want to delete department "${deleteDept?.name}"? This action cannot be undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              {language === "bm" ? "Batal" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting || (deleteDept?._count?.profiles || 0) > 0}
              className="bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-400/30 hover:from-red-700 hover:to-red-800 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {language === "bm" ? "Padam" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===== Sub-components =====

function StatCard({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ReactNode;
  color: "cyan" | "emerald" | "amber";
  value: number;
  label: string;
}) {
  const colors = {
    cyan: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
    emerald: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    amber: "text-amber-300 bg-amber-500/15 border-amber-500/30",
  };
  return (
    <GlassCard className="p-4 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0", colors[color])}>
        {icon}
      </div>
      <div>
        <div className={cn("text-xl font-bold tabular-nums", colors[color].split(" ")[0])}>
          {value.toLocaleString()}
        </div>
        <div className="text-[10px] text-white/60 leading-tight">{label}</div>
      </div>
    </GlassCard>
  );
}

function DeptFormDialog({
  open,
  onOpenChange,
  title,
  description,
  language,
  submitting,
  onSubmit,
  initialName,
  initialDescription,
  disabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  language: "bm" | "en";
  submitting: boolean;
  onSubmit: (name: string, description: string) => void;
  initialName?: string;
  initialDescription?: string;
  disabled?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-300" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-cyan-200/70">{description}</DialogDescription>
        </DialogHeader>
        {open && (
          <DeptFormInner
            language={language}
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            initialName={initialName || ""}
            initialDescription={initialDescription || ""}
            disabled={disabled}
            isEdit={!!initialName}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeptFormInner({
  language,
  submitting,
  onSubmit,
  onCancel,
  initialName,
  initialDescription,
  disabled,
  isEdit,
}: {
  language: "bm" | "en";
  submitting: boolean;
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
  initialName: string;
  initialDescription: string;
  disabled?: boolean;
  isEdit: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDescription);
  const [touched, setTouched] = useState({ name: false });

  const nameError =
    !name.trim() || name.trim().length < 2
      ? language === "bm"
        ? "Nama minima 2 aksara."
        : "Name must be at least 2 chars."
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true });
    if (nameError || disabled) return;
    onSubmit(name.trim(), desc.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      <div className="space-y-1">
        <Label className="text-xs text-cyan-100 font-medium">
          {language === "bm" ? "Nama Jabatan" : "Department Name"}
          <span className="text-red-400 ml-0.5">*</span>
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched({ name: true })}
          placeholder={language === "bm" ? "Cth: Pentadbiran" : "Eg: Administration"}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          disabled={disabled}
        />
        {touched.name && nameError && <p className="text-[10px] text-red-400">{nameError}</p>}
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-cyan-100 font-medium">
          {language === "bm" ? "Deskripsi (opsyenal)" : "Description (optional)"}
        </Label>
        <Textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={language === "bm" ? "Penerangan ringkas jabatan..." : "Brief department description..."}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[80px]"
          maxLength={500}
          disabled={disabled}
        />
        <div className="text-right text-[10px] text-white/40">{desc.length}/500</div>
      </div>
      <DialogFooter className="gap-2 pt-2">
        <GlassButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {language === "bm" ? "Batal" : "Cancel"}
        </GlassButton>
        <GlassButton type="submit" variant="primary" disabled={submitting || !!nameError || disabled}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? (language === "bm" ? "Simpan" : "Save") : language === "bm" ? "Cipta" : "Create"}
        </GlassButton>
      </DialogFooter>
    </form>
  );
}
