"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouterStore, useUIStore } from "@/stores/router";
import { GlassCard, GlassButton } from "@/components/vms/GlassCard";
import { StatusBadge } from "@/components/vms/StatusBadge";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  CalendarDays,
  Users,
  Clock,
  UserCheck,
  Star,
  TrendingUp,
  RefreshCw,
  Loader2,
  Activity,
  Building2,
  ChevronRight,
  Eye,
  BarChart3,
  PieChart as PieIcon,
  Gauge,
} from "lucide-react";
import { VISIT_STATUS } from "@/components/vms/StatusBadge";

// ===== Types =====
interface AdminCounts {
  totalVisits: number;
  totalVisitors: number;
  totalUsers: number;
  activeVisitors: number;
  pendingApproval: number;
}
interface AdminFeedback {
  averageRating: number;
  totalFeedback: number;
}
interface StatusBreak {
  status: string;
  count: number;
}
interface DailyTrendItem {
  date: string;
  count: number;
  completed: number;
}
interface DeptBreak {
  name: string;
  visitCount: number;
}
interface RecentVisit {
  id: string;
  referenceCode: string;
  purpose: string;
  status: string;
  createdAt: string;
  visitor: { fullName: string; company?: string | null };
  hostStaff: { fullName: string; department?: { name: string } | null };
  feedback?: { rating: number } | null;
}
interface AdminDashboardData {
  counts: AdminCounts;
  feedback: AdminFeedback;
  statusBreakdown: StatusBreak[];
  dailyTrend: DailyTrendItem[];
  departmentBreakdown: DeptBreak[];
  recentVisits: RecentVisit[];
}

const REFRESH_INTERVAL = 30_000;

// Status color map for charts (matching design palette)
const STATUS_COLORS: Record<string, string> = {
  pending_approval: "#d97706",
  approved: "#06b6d4",
  rejected: "#dc2626",
  checked_in: "#1e3a8a",
  in_progress: "#0891b2",
  staff_verified: "#0ea5e9",
  pending_feedback: "#f59e0b",
  feedback_submitted: "#10b981",
  ready_for_exit: "#059669",
  checked_out: "#64748b",
  cancelled: "#94a3b8",
};

const DAY_OPTIONS = [7, 30, 90];

export function AdminDashboard() {
  const { language } = useUIStore();
  const { navigate } = useRouterStore();
  const { data: session } = useSession();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [days, setDays] = useState(30);
  const [detailVisit, setDetailVisit] = useState<RecentVisit | null>(null);

  const mounted = useRef(true);
  const inFlight = useRef(false);

  const fetchData = useCallback(
    async (silent = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (!silent) setRefreshing(true);
      try {
        const res = await fetch(`/api/dashboard/admin?days=${days}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!mounted.current) return;
        if (json.success) {
          setData(json.data);
          setLastUpdated(new Date());
        } else {
          toast.error(
            json.error ||
              (language === "bm"
                ? "Gagal memuatkan dashboard."
                : "Failed to load dashboard.")
          );
        }
      } catch {
        if (mounted.current) {
          toast.error(language === "bm" ? "Ralat rangkaian." : "Network error.");
        }
      } finally {
        if (mounted.current) {
          setRefreshing(false);
          setLoading(false);
        }
        inFlight.current = false;
      }
    },
    [days, language]
  );

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchData();
    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  // ===== Chart configs =====
  const trendConfig: ChartConfig = {
    count: { label: language === "bm" ? "Jumlah Lawatan" : "Total Visits", color: "#06b6d4" },
    completed: { label: language === "bm" ? "Selesai" : "Completed", color: "#059669" },
  };

  const statusConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    for (const s of data?.statusBreakdown || []) {
      cfg[s.status] = {
        label:
          language === "bm"
            ? VISIT_STATUS[s.status as keyof typeof VISIT_STATUS]?.bm || s.status
            : VISIT_STATUS[s.status as keyof typeof VISIT_STATUS]?.en || s.status,
        color: STATUS_COLORS[s.status] || "#64748b",
      };
    }
    return cfg;
  }, [data, language]);

  const deptConfig: ChartConfig = {
    visitCount: { label: language === "bm" ? "Lawatan" : "Visits", color: "#06b6d4" },
  };

  // Donut chart data with labels
  const donutData = useMemo(
    () =>
      (data?.statusBreakdown || [])
        .filter((s) => s.count > 0)
        .map((s) => ({
          name:
            language === "bm"
              ? VISIT_STATUS[s.status as keyof typeof VISIT_STATUS]?.bm || s.status
              : VISIT_STATUS[s.status as keyof typeof VISIT_STATUS]?.en || s.status,
          value: s.count,
          status: s.status,
          color: STATUS_COLORS[s.status] || "#64748b",
        })),
    [data, language]
  );

  const totalStatusCount = useMemo(
    () => donutData.reduce((a, b) => a + b.value, 0),
    [donutData]
  );

  // Skeleton helpers
  const isLoading = loading && !data;

  return (
    <div className="flex flex-col gap-5 pb-6 view-enter">
      {/* Header */}
      <GlassCard variant="panel" className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {language === "bm" ? "Dashboard Analitik" : "Analytics Dashboard"}
            </h1>
            <p className="text-xs text-cyan-200/80">
              {language === "bm"
                ? `Selamat datang, ${session?.user?.name || "Admin"} — pandangan keseluruhan sistem VMS.`
                : `Welcome, ${session?.user?.name || "Admin"} — VMS system overview.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-emerald-200">
              {language === "bm" ? "Langsung" : "Live"}
            </span>
          </div>
          {/* Date range selector */}
          <Select
            value={String(days)}
            onValueChange={(v) => setDays(Number(v))}
          >
            <SelectTrigger className="w-[140px] h-9 bg-white/10 border-white/20 text-white text-xs">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-cyan-300" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {language === "bm" ? `${d} hari terakhir` : `Last ${d} days`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Refresh button */}
          <GlassButton
            variant="ghost"
            className="h-9 px-3"
            onClick={() => fetchData()}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {language === "bm" ? "Muat Semula" : "Refresh"}
            </span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Last updated indicator */}
      {lastUpdated && (
        <div className="text-[11px] text-cyan-200/60 -mt-2 flex items-center gap-1.5 px-1">
          <Clock className="w-3 h-3" />
          {language === "bm" ? "Kemas kini terakhir: " : "Last updated: "}
          {format(lastUpdated, "dd MMM yyyy, HH:mm:ss")}
          <span className="text-cyan-200/40">·</span>
          <span>{language === "bm" ? "auto-muat setiap 30s" : "auto-refresh every 30s"}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          loading={isLoading}
          icon={<CalendarDays className="w-5 h-5" />}
          color="blue"
          value={data?.counts.totalVisits ?? 0}
          label={language === "bm" ? "Jumlah Lawatan" : "Total Visits"}
          labelEn="Total Visits"
          language={language}
          sub={`${days} ${language === "bm" ? "hari" : "days"}`}
        />
        <KpiCard
          loading={isLoading}
          icon={<Users className="w-5 h-5" />}
          color="cyan"
          value={data?.counts.activeVisitors ?? 0}
          label={language === "bm" ? "Pelawat Aktif" : "Active Visitors"}
          labelEn="Active Visitors"
          language={language}
          pulse
        />
        <KpiCard
          loading={isLoading}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          value={data?.counts.pendingApproval ?? 0}
          label={language === "bm" ? "Menunggu Kelulusan" : "Pending Approval"}
          labelEn="Pending Approval"
          language={language}
        />
        <KpiCard
          loading={isLoading}
          icon={<UserCheck className="w-5 h-5" />}
          color="purple"
          value={data?.counts.totalVisitors ?? 0}
          label={language === "bm" ? "Jumlah Pelawat" : "Total Visitors"}
          labelEn="Total Visitors"
          language={language}
          sub={`${language === "bm" ? "didaftar" : "registered"}`}
        />
        <KpiCard
          loading={isLoading}
          icon={<Star className="w-5 h-5" />}
          color="emerald"
          value={data?.feedback.averageRating ?? 0}
          label={language === "bm" ? "Kepuasan Purata" : "Avg Satisfaction"}
          labelEn="Avg Satisfaction"
          language={language}
          isRating
          sub={`${data?.feedback.totalFeedback ?? 0} ${language === "bm" ? "ulasan" : "reviews"}`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Visit Trend - spans 2 cols */}
        <GlassCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {language === "bm"
                    ? `Tren Lawatan Harian (${days} hari)`
                    : `Daily Visit Trend (${days} days)`}
                </h3>
                <p className="text-[10px] text-cyan-200/60">
                  {language === "bm"
                    ? "Jumlah vs Selesai (telah keluar)"
                    : "Total vs Completed (checked out)"}
                </p>
              </div>
            </div>
          </div>
          {isLoading ? (
            <ChartSkeleton height={260} />
          ) : (
            <ChartContainer config={trendConfig} className="h-[260px] w-full">
              <AreaChart data={data?.dailyTrend || []} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-count" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-completed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                  tickFormatter={(d: string) => format(new Date(d), "dd/MM")}
                  axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#grad-count)"
                  name={language === "bm" ? "Jumlah Lawatan" : "Total Visits"}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#grad-completed)"
                  name={language === "bm" ? "Selesai" : "Completed"}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}
                  iconType="circle"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </GlassCard>

        {/* Status Breakdown Donut */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <PieIcon className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {language === "bm" ? "Pengagihan Status" : "Status Distribution"}
              </h3>
              <p className="text-[10px] text-cyan-200/60">
                {language === "bm" ? "Mengikut status lawatan" : "By visit status"}
              </p>
            </div>
          </div>
          {isLoading ? (
            <ChartSkeleton height={260} />
          ) : donutData.length === 0 ? (
            <EmptyState language={language} />
          ) : (
            <div className="flex flex-col items-center">
              <ChartContainer config={statusConfig} className="h-[200px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                    cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  />
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* Center label overlay */}
              <div className="text-center -mt-[125px] pointer-events-none mb-[85px]">
                <div className="text-2xl font-bold text-white">{totalStatusCount}</div>
                <div className="text-[10px] text-cyan-200/70">
                  {language === "bm" ? "Jumlah Lawatan" : "Total Visits"}
                </div>
              </div>
              {/* Legend list */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 w-full max-h-[80px] overflow-y-auto custom-scrollbar">
                {donutData.slice(0, 8).map((entry) => (
                  <div
                    key={entry.status}
                    className="flex items-center gap-1.5 text-[10px] text-white/80"
                  >
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate text-white/90">{entry.name}</span>
                    <span className="ml-auto font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Department Breakdown - full width */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {language === "bm" ? "Lawatan mengikut Jabatan" : "Visits by Department"}
              </h3>
              <p className="text-[10px] text-cyan-200/60">
                {language === "bm"
                  ? "Bilangan lawatan dihost per jabatan (sepanjang masa)"
                  : "Hosted visit count per department (all-time)"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("admin-departments")}
            className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
          >
            {language === "bm" ? "Urus Jabatan" : "Manage Depts"}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {isLoading ? (
          <ChartSkeleton height={280} />
        ) : (data?.departmentBreakdown || []).length === 0 ? (
          <EmptyState language={language} />
        ) : (
          <ChartContainer config={deptConfig} className="h-[280px] w-full">
            <BarChart
              data={data?.departmentBreakdown || []}
              layout="vertical"
              margin={{ top: 5, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
              />
              <Bar
                dataKey="visitCount"
                fill="#06b6d4"
                radius={[0, 6, 6, 0]}
                name={language === "bm" ? "Lawatan" : "Visits"}
                barSize={18}
              />
            </BarChart>
          </ChartContainer>
        )}
      </GlassCard>

      {/* Recent Visits Table */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {language === "bm" ? "Lawatan Terkini" : "Recent Visits"}
              </h3>
              <p className="text-[10px] text-cyan-200/60">
                {language === "bm" ? "10 lawatan terakhir" : "Last 10 visits"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("admin-audit")}
            className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
          >
            {language === "bm" ? "Lihat Log Audit" : "View Audit Log"}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (data?.recentVisits || []).length === 0 ? (
          <EmptyState language={language} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Rujukan" : "Reference"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Pelawat" : "Visitor"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Tujuan" : "Purpose"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Hos" : "Host"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Status" : "Status"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Kadaran" : "Rating"}
                    </TableHead>
                    <TableHead className="text-cyan-200/80 text-[11px] font-semibold uppercase tracking-wide">
                      {language === "bm" ? "Dicipta" : "Created"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentVisits.map((v) => (
                    <TableRow
                      key={v.id}
                      onClick={() => setDetailVisit(v)}
                      className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-cyan-300">
                        {v.referenceCode}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-white font-medium">{v.visitor.fullName}</div>
                        {v.visitor.company && (
                          <div className="text-[10px] text-white/50">{v.visitor.company}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-white/70 max-w-[200px] truncate">
                        {v.purpose}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-white font-medium">{v.hostStaff?.fullName || "—"}</div>
                        {v.hostStaff?.department?.name && (
                          <div className="text-[10px] text-white/50">
                            {v.hostStaff.department.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={v.status} language={language} />
                      </TableCell>
                      <TableCell>
                        {v.feedback?.rating ? (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < v.feedback!.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-white/20"
                                )}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-white/60 whitespace-nowrap">
                        {format(new Date(v.createdAt), "dd MMM, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-2">
              {data?.recentVisits.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setDetailVisit(v)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 active:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[11px] text-cyan-300">{v.referenceCode}</div>
                      <div className="text-sm font-semibold text-white mt-0.5">
                        {v.visitor.fullName}
                      </div>
                      {v.visitor.company && (
                        <div className="text-[10px] text-white/50">{v.visitor.company}</div>
                      )}
                    </div>
                    <StatusBadge status={v.status} language={language} />
                  </div>
                  <div className="mt-2 text-[11px] text-white/70 line-clamp-2">{v.purpose}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
                    <span>{v.hostStaff?.fullName || "—"}</span>
                    <span>{format(new Date(v.createdAt), "dd MMM, HH:mm")}</span>
                  </div>
                  {v.feedback?.rating ? (
                    <div className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3",
                            i < v.feedback!.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-white/20"
                          )}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>

      {/* Detail dialog */}
      <Dialog open={!!detailVisit} onOpenChange={(open) => !open && setDetailVisit(null)}>
        <DialogContent className="glass-panel border-white/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-300" />
              {language === "bm" ? "Butiran Lawatan" : "Visit Details"}
            </DialogTitle>
            <DialogDescription className="text-cyan-200/70">
              {detailVisit?.referenceCode}
            </DialogDescription>
          </DialogHeader>
          {detailVisit && (
            <div className="space-y-3">
              <DetailRow
                label={language === "bm" ? "Pelawat" : "Visitor"}
                value={detailVisit.visitor.fullName}
              />
              {detailVisit.visitor.company && (
                <DetailRow
                  label={language === "bm" ? "Syarikat" : "Company"}
                  value={detailVisit.visitor.company}
                />
              )}
              <DetailRow
                label={language === "bm" ? "Tujuan" : "Purpose"}
                value={detailVisit.purpose}
              />
              <DetailRow
                label={language === "bm" ? "Hos" : "Host"}
                value={
                  detailVisit.hostStaff
                    ? `${detailVisit.hostStaff.fullName}${
                        detailVisit.hostStaff.department?.name
                          ? ` (${detailVisit.hostStaff.department.name})`
                          : ""
                      }`
                    : "—"
                }
              />
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-cyan-200/70">
                  {language === "bm" ? "Status" : "Status"}
                </span>
                <StatusBadge status={detailVisit.status} language={language} />
              </div>
              {detailVisit.feedback?.rating ? (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-cyan-200/70">
                    {language === "bm" ? "Kadaran" : "Rating"}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < detailVisit.feedback!.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-white/20"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              <DetailRow
                label={language === "bm" ? "Dicipta Pada" : "Created At"}
                value={`${format(new Date(detailVisit.createdAt), "dd MMM yyyy, HH:mm:ss")} (${formatDistanceToNow(
                  new Date(detailVisit.createdAt),
                  { addSuffix: true }
                )})`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Sub-components =====

const COLOR_STYLES: Record<
  string,
  { iconBg: string; iconColor: string; valueColor: string; ring: string }
> = {
  blue: {
    iconBg: "bg-blue-500/20 border-blue-400/30",
    iconColor: "text-blue-300",
    valueColor: "text-blue-200",
    ring: "hover:border-blue-400/40",
  },
  cyan: {
    iconBg: "bg-cyan-500/20 border-cyan-400/30",
    iconColor: "text-cyan-300",
    valueColor: "text-cyan-200",
    ring: "hover:border-cyan-400/40",
  },
  amber: {
    iconBg: "bg-amber-500/20 border-amber-400/30",
    iconColor: "text-amber-300",
    valueColor: "text-amber-200",
    ring: "hover:border-amber-400/40",
  },
  purple: {
    iconBg: "bg-purple-500/20 border-purple-400/30",
    iconColor: "text-purple-300",
    valueColor: "text-purple-200",
    ring: "hover:border-purple-400/40",
  },
  emerald: {
    iconBg: "bg-emerald-500/20 border-emerald-400/30",
    iconColor: "text-emerald-300",
    valueColor: "text-emerald-200",
    ring: "hover:border-emerald-400/40",
  },
};

function KpiCard({
  loading,
  icon,
  color,
  value,
  label,
  labelEn,
  language,
  pulse,
  isRating,
  sub,
}: {
  loading: boolean;
  icon: React.ReactNode;
  color: keyof typeof COLOR_STYLES;
  value: number;
  label: string;
  labelEn: string;
  language: "bm" | "en";
  pulse?: boolean;
  isRating?: boolean;
  sub?: string;
}) {
  const c = COLOR_STYLES[color];
  return (
    <GlassCard hover className={cn("p-4 transition-colors", c.ring)}>
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "w-9 h-9 rounded-lg border flex items-center justify-center relative",
            c.iconBg
          )}
        >
          {icon && <span className={c.iconColor}>{icon}</span>}
          {pulse && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-7 w-16 rounded bg-white/10 animate-pulse" />
        ) : (
          <div className={cn("text-2xl font-bold tabular-nums", c.valueColor)}>
            {isRating ? value.toFixed(1) : value.toLocaleString()}
            {isRating && <span className="text-xs text-white/50"> / 5.0</span>}
          </div>
        )}
        <div className="text-[11px] text-white/70 mt-0.5 font-medium leading-tight">
          {language === "en" ? labelEn : label}
        </div>
        {sub && <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>}
      </div>
    </GlassCard>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full rounded-lg bg-white/5 animate-pulse flex items-center justify-center"
      style={{ height }}
    >
      <Loader2 className="w-5 h-5 text-cyan-300/50 animate-spin" />
    </div>
  );
}

function EmptyState({ language }: { language: "bm" | "en" }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Gauge className="w-8 h-8 text-white/30 mb-2" />
      <div className="text-sm text-white/50">
        {language === "bm" ? "Tiada data tersedia" : "No data available"}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-1 border-b border-white/5 last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-cyan-200/60 font-semibold">
        {label}
      </span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
