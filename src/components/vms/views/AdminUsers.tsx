"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { RoleBadge } from "@/components/vms/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Loader2,
  Edit2,
  Ban,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  department?: { id: string; name: string } | null;
}
interface Department {
  id: string;
  name: string;
  description?: string | null;
  _count?: { profiles: number };
}

type RoleFilter = "all" | "admin" | "security" | "staff";

export function AdminUsers() {
  const { language } = useUIStore();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [uRes, dRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/departments", { cache: "no-store" }),
      ]);
      const uJson = await uRes.json();
      const dJson = await dRes.json();
      if (!mounted.current) return;
      if (uJson.success && Array.isArray(uJson.data)) setUsers(uJson.data);
      else toast.error(uJson.error || (language === "bm" ? "Gagal memuatkan pengguna." : "Failed to load users."));
      if (dJson.success && Array.isArray(dJson.data)) setDepartments(dJson.data);
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

  // Filtered users
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  // Stats
  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === "admin").length,
      security: users.filter((u) => u.role === "security").length,
      staff: users.filter((u) => u.role === "staff").length,
    }),
    [users]
  );

  // Handlers
  const handleCreate = async (payload: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(language === "bm" ? "Pengguna berjaya dicipta." : "User created successfully.");
        setCreateOpen(false);
        fetchData();
      } else {
        toast.error(json.error || (language === "bm" ? "Gagal mencipta pengguna." : "Failed to create user."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(language === "bm" ? "Pengguna dikemas kini." : "User updated.");
        setEditUser(null);
        fetchData();
      } else {
        toast.error(json.error || (language === "bm" ? "Gagal mengemas kini." : "Failed to update."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    if (deactivateUser.id === currentUserId) {
      toast.error(language === "bm" ? "Anda tidak boleh menyahaktifkan akaun sendiri." : "You cannot deactivate your own account.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users?id=${deactivateUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(language === "bm" ? "Pengguna telah dinyahaktifkan." : "User deactivated.");
        setDeactivateUser(null);
        fetchData();
      } else {
        toast.error(json.error || (language === "bm" ? "Gagal menyahaktifkan." : "Failed to deactivate."));
      }
    } catch {
      toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading && users.length === 0;

  return (
    <div className="flex flex-col gap-5 pb-6 view-enter">
      {/* Header */}
      <GlassCard variant="panel" className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {language === "bm" ? "Pengurusan Pengguna" : "User Management"}
            </h1>
            <p className="text-xs text-cyan-200/80">
              {language === "bm"
                ? "Urus akaun pengguna sistem VMS (admin / pengawal / staf)."
                : "Manage VMS user accounts (admin / security / staff)."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" className="h-9 px-3" onClick={fetchData} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">{language === "bm" ? "Muat Semula" : "Refresh"}</span>
          </GlassButton>
          <GlassButton variant="primary" className="h-9 px-4" onClick={() => setCreateOpen(true)}>
            <UserPlus className="w-4 h-4" />
            {language === "bm" ? "Tambah Pengguna" : "Add User"}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatPill icon={<Users className="w-4 h-4" />} color="cyan" value={stats.total} label={language === "bm" ? "Jumlah" : "Total"} />
        <StatPill icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" value={stats.active} label={language === "bm" ? "Aktif" : "Active"} />
        <StatPill icon={<ShieldCheck className="w-4 h-4" />} color="purple" value={stats.admins} label={language === "bm" ? "Admin" : "Admins"} />
        <StatPill icon={<ShieldCheck className="w-4 h-4" />} color="blue" value={stats.security} label={language === "bm" ? "Pengawal" : "Security"} />
        <StatPill icon={<ShieldCheck className="w-4 h-4" />} color="teal" value={stats.staff} label={language === "bm" ? "Staf" : "Staff"} />
      </div>

      {/* Filters */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300" />
          <Input
            placeholder={language === "bm" ? "Cari nama / e-mel / telefon..." : "Search name / email / phone..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-300" />
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-[180px] h-10 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bm" ? "Semua Peranan" : "All Roles"}</SelectItem>
              <SelectItem value="admin">{language === "bm" ? "Admin" : "Admin"}</SelectItem>
              <SelectItem value="security">{language === "bm" ? "Pengawal" : "Security"}</SelectItem>
              <SelectItem value="staff">{language === "bm" ? "Staf" : "Staff"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Users Table / Cards */}
      <GlassCard className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Users className="w-8 h-8 text-white/30 mb-2" />
            <div className="text-sm text-white/60">
              {language === "bm" ? "Tiada pengguna dijumpai." : "No users found."}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Nama" : "Name"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "E-mel" : "Email"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Peranan" : "Role"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Jabatan" : "Department"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Telefon" : "Phone"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Status" : "Status"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Log Masuk Akhir" : "Last Login"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide text-right">
                      {language === "bm" ? "Tindakan" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                              u.role === "admin"
                                ? "bg-purple-500/30 text-purple-200"
                                : u.role === "security"
                                ? "bg-blue-500/30 text-blue-200"
                                : "bg-teal-500/30 text-teal-200"
                            )}
                          >
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-xs text-white font-medium">
                            {u.fullName}
                            {u.id === currentUserId && (
                              <span className="ml-1 text-[9px] text-cyan-300 font-semibold">(Anda)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-white/70">{u.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} language={language} />
                      </TableCell>
                      <TableCell className="text-xs text-white/70">
                        {u.department?.name || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-white/70">{u.phone || "—"}</TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {language === "bm" ? "Aktif" : "Active"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            {language === "bm" ? "Nyahaktif" : "Inactive"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-white/60 whitespace-nowrap">
                        {u.lastLoginAt
                          ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })
                          : (language === "bm" ? "Belum pernah" : "Never")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setEditUser(u)}
                            className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                            title={language === "bm" ? "Edit" : "Edit"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.isActive && u.id !== currentUserId && (
                            <button
                              onClick={() => setDeactivateUser(u)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors"
                              title={language === "bm" ? "Nyahaktifkan" : "Deactivate"}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden flex flex-col gap-2">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                          u.role === "admin"
                            ? "bg-purple-500/30 text-purple-200"
                            : u.role === "security"
                            ? "bg-blue-500/30 text-blue-200"
                            : "bg-teal-500/30 text-teal-200"
                        )}
                      >
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate">
                          {u.fullName}
                          {u.id === currentUserId && (
                            <span className="ml-1 text-[9px] text-cyan-300 font-semibold">(Anda)</span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/50 truncate">{u.email}</div>
                      </div>
                    </div>
                    <RoleBadge role={u.role} language={language} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Building2 className="w-3 h-3 text-cyan-300" />
                      <span className="truncate">{u.department?.name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Phone className="w-3 h-3 text-cyan-300" />
                      <span className="truncate">{u.phone || "—"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> {language === "bm" ? "Aktif" : "Active"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-semibold">
                          <XCircle className="w-3 h-3" /> {language === "bm" ? "Nyahaktif" : "Inactive"}
                        </span>
                      )}
                      <span className="text-[10px] text-white/40">
                        {u.lastLoginAt
                          ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })
                          : (language === "bm" ? "Belum pernah log masuk" : "Never logged in")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditUser(u)}
                        className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 active:bg-cyan-500/30 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.isActive && u.id !== currentUserId && (
                        <button
                          onClick={() => setDeactivateUser(u)}
                          className="p-1.5 rounded-lg bg-red-500/15 text-red-300 active:bg-red-500/30 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>

      {/* Create Dialog */}
      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={language === "bm" ? "Tambah Pengguna Baru" : "Add New User"}
        description={language === "bm" ? "Lengkapkan maklumat pengguna baru." : "Fill in new user details."}
        departments={departments}
        language={language}
        submitting={submitting}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit Dialog */}
      <UserFormDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        title={language === "bm" ? "Edit Pengguna" : "Edit User"}
        description={language === "bm" ? "Kemas kini maklumat pengguna." : "Update user details."}
        departments={departments}
        language={language}
        submitting={submitting}
        onSubmit={(payload) => editUser && handleUpdate(editUser.id, payload)}
        mode="edit"
        initialUser={editUser}
      />

      {/* Deactivate confirm */}
      <AlertDialog open={!!deactivateUser} onOpenChange={(open) => !open && setDeactivateUser(null)}>
        <AlertDialogContent className="glass-panel border-red-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-red-400" />
              {language === "bm" ? "Nyahaktifkan Pengguna" : "Deactivate User"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cyan-200/80">
              {language === "bm"
                ? `Pasti? Pengguna "${deactivateUser?.fullName}" akan dinyahaktifkan (soft-delete). Mereka tidak akan dapat log masuk lagi.`
                : `Are you sure? User "${deactivateUser?.fullName}" will be deactivated (soft-delete). They will no longer be able to log in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              {language === "bm" ? "Batal" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={submitting}
              className="bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-400/30 hover:from-red-700 hover:to-red-800"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {language === "bm" ? "Nyahaktifkan" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===== Sub-components =====

function StatPill({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ReactNode;
  color: "cyan" | "emerald" | "purple" | "blue" | "teal";
  value: number;
  label: string;
}) {
  const colors = {
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    purple: "text-purple-300",
    blue: "text-blue-300",
    teal: "text-teal-300",
  };
  return (
    <GlassCard className="p-3 flex items-center gap-3">
      <div className={cn("flex-shrink-0", colors[color])}>{icon}</div>
      <div>
        <div className={cn("text-xl font-bold tabular-nums", colors[color])}>
          {value.toLocaleString()}
        </div>
        <div className="text-[10px] text-white/60">{label}</div>
      </div>
    </GlassCard>
  );
}

function UserFormDialog({
  open,
  onOpenChange,
  title,
  description,
  departments,
  language,
  submitting,
  onSubmit,
  mode,
  initialUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  departments: Department[];
  language: "bm" | "en";
  submitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  mode: "create" | "edit";
  initialUser?: User | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/20 text-white max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-cyan-300" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-cyan-200/70">{description}</DialogDescription>
        </DialogHeader>
        {open && (
          <UserFormInner
            departments={departments}
            language={language}
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            mode={mode}
            initialUser={initialUser}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserFormInner({
  departments,
  language,
  submitting,
  onSubmit,
  onCancel,
  mode,
  initialUser,
}: {
  departments: Department[];
  language: "bm" | "en";
  submitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onCancel: () => void;
  mode: "create" | "edit";
  initialUser?: User | null;
}) {
  const [fullName, setFullName] = useState(initialUser?.fullName || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [role, setRole] = useState<string>(initialUser?.role || "staff");
  const [departmentId, setDepartmentId] = useState<string>(initialUser?.department?.id || "");
  const [phone, setPhone] = useState(initialUser?.phone || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(initialUser?.isActive ?? true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation
  const errors: Record<string, string> = {};
  if (!fullName.trim() || fullName.trim().length < 3)
    errors.fullName = language === "bm" ? "Nama minima 3 aksara." : "Name must be at least 3 chars.";
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = language === "bm" ? "E-mel tidak sah." : "Invalid email.";
  if (mode === "create" && (!password || password.length < 8))
    errors.password = language === "bm" ? "Kata laluan minima 8 aksara." : "Password min 8 chars.";
  if (mode === "edit" && password && password.length < 8)
    errors.password = language === "bm" ? "Kata laluan minima 8 aksara." : "Password min 8 chars.";

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
    });
    if (!isValid) return;
    const payload: Record<string, unknown> = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      phone: phone.trim() || null,
      departmentId: departmentId || null,
    };
    if (mode === "create") payload.password = password;
    else {
      if (password) payload.password = password;
      payload.isActive = isActive;
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      <Field label={language === "bm" ? "Nama Penuh" : "Full Name"} required error={touched.fullName ? errors.fullName : undefined}>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
          placeholder={language === "bm" ? "Cth: Ahmad bin Ali" : "Eg: Ahmad bin Ali"}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </Field>
      <Field label={language === "bm" ? "E-mel" : "Email"} required error={touched.email ? errors.email : undefined}>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="user@pltbintulu.gov.my"
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            disabled={mode === "edit"}
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={language === "bm" ? "Peranan" : "Role"} required>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{language === "bm" ? "Admin / Penyelia" : "Admin"}</SelectItem>
              <SelectItem value="security">{language === "bm" ? "Pengawal Keselamatan" : "Security"}</SelectItem>
              <SelectItem value="staff">{language === "bm" ? "Staf JTM" : "Staff"}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={language === "bm" ? "Jabatan" : "Department"}>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={language === "bm" ? "Pilih..." : "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label={language === "bm" ? "No. Telefon" : "Phone"}>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01X-XXXXXXX"
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
      </Field>
      <Field
        label={
          mode === "create"
            ? language === "bm"
              ? "Kata Laluan"
              : "Password"
            : language === "bm"
            ? "Kata Laluan Baru (opsyenal)"
            : "New Password (optional)"
        }
        required={mode === "create"}
        error={touched.password ? errors.password : undefined}
        hint={
          mode === "edit"
            ? language === "bm"
              ? "Biarkan kosong untuk kekalkan kata laluan semasa."
              : "Leave blank to keep current password."
            : undefined
        }
      >
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            placeholder="••••••••"
            className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      {mode === "edit" && (
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/10">
          <div>
            <Label className="text-xs text-white font-medium">
              {language === "bm" ? "Akaun Aktif" : "Account Active"}
            </Label>
            <p className="text-[10px] text-white/50">
              {language === "bm"
                ? "Pengguna aktif boleh log masuk."
                : "Active users can log in."}
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <GlassButton
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          {language === "bm" ? "Batal" : "Cancel"}
        </GlassButton>
        <GlassButton type="submit" variant="primary" disabled={submitting || !isValid}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "create"
            ? language === "bm"
              ? "Cipta Pengguna"
              : "Create User"
            : language === "bm"
            ? "Simpan"
            : "Save"}
        </GlassButton>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-cyan-100 font-medium">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-white/50">{hint}</p>}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
