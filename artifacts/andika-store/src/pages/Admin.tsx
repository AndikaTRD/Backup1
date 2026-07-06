import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  Search,
  Copy,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

// Use relative URL so requests stay on the same origin (works through
// Replit's proxy and Railway's unified deployment). The proxy routes
// /api/* to the API server without any CORS overhead.
const API = "";
const PAGE_SIZE = 20;

/* ─────────────────────── helpers ─────────────────────── */

function formatRp(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

function getDateKey(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function getDateLabel(key: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const d = new Date(key + "T00:00:00");

  if (d.toDateString() === today.toDateString()) return "Hari Ini";
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─────────────────────── types ─────────────────────── */

type OrderItem = {
  productName: string;
  price: number;
  quantity: number;
  kode?: string;
  pin?: string;
};

type Order = {
  id: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  paymentMethod: string;
  proofUrl: string | null;
  items: OrderItem[];
  createdAt: string;
  notes: string | null;
};

type Stats = {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
};

type FilterStatus = "all" | "pending" | "confirmed" | "cancelled";

/* ─────────────────────── sub-components ─────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Pending",
      color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
      icon: <Clock className="w-3 h-3" />,
    },
    proof_uploaded: {
      label: "Bukti Dikirim",
      color: "text-blue-400 bg-blue-500/15 border-blue-500/30",
      icon: <Clock className="w-3 h-3" />,
    },
    confirmed: {
      label: "Confirmed",
      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    cancelled: {
      label: "Cancelled",
      color: "text-red-400 bg-red-500/15 border-red-500/30",
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const s = map[status] ?? {
    label: status,
    color: "text-white/40 bg-white/5 border-white/10",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${s.color}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent?: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-white/8 bg-[#0d0d1b] px-4 py-4 overflow-hidden group"
    >
      {/* Glow */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${accent ?? "bg-violet-500/5"}`}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold leading-tight">
            {label}
          </p>
          <span className="text-white/20">{icon}</span>
        </div>
        <p
          className={`text-xl font-black ${typeof value === "string" && value.startsWith("Rp") ? "text-violet-300" : "text-white"}`}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (orderId: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const firstItem = order.items[0];
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

  async function copyAktivasi() {
    if (!firstItem?.kode) {
      toast({ title: "Kode tidak tersedia", variant: "destructive" });
      return;
    }
    const text = `AKTIVASI#${firstItem.kode}\nPIN / TGL LAHIR : ${firstItem.pin ?? "-"}\nQTY JUMLAH MEMBER : ${totalQty}`;
    await navigator.clipboard.writeText(text);
    toast({ title: "Format aktivasi berhasil disalin." });
  }

  async function copyDetail() {
    const lines = [
      `Order ID: ${order.orderId}`,
      `Nama: ${order.customerName}`,
      `WhatsApp: ${order.customerPhone ?? "-"}`,
      `Produk: ${order.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}`,
      `Jumlah: ${totalQty}`,
      `Harga: ${formatRp(order.total)}`,
      `Status: ${order.status}`,
      `Tanggal: ${formatDateTime(order.createdAt)}`,
    ].join("\n");
    await navigator.clipboard.writeText(lines);
    toast({ title: "Detail order berhasil disalin." });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-[#0d0d1b] overflow-hidden hover:border-violet-500/20 transition-all duration-200"
    >
      {/* Card header — always visible */}
      <button
        className="w-full px-4 pt-4 pb-3 flex items-start justify-between text-left hover:bg-white/2 transition-all"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {/* Top row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-white font-mono tracking-tight">
              {order.orderId}
            </span>
            <StatusBadge status={order.status} />
          </div>

          {/* Middle row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] text-white/60 font-semibold">
              {order.customerName}
            </span>
            {firstItem && (
              <span className="text-[11px] text-white/35 truncate max-w-[160px]">
                {firstItem.productName}
              </span>
            )}
            <span className="text-[11px] text-white/35">
              {totalQty} member
            </span>
          </div>

          {/* Bottom row */}
          <span className="text-[10px] text-white/25">
            {formatDateTime(order.createdAt)}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
          <span className="text-sm font-black text-violet-300">
            {formatRp(order.total)}
          </span>
          <span className="text-white/20">
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/6 px-4 py-4 space-y-4">
              {/* Items */}
              <div className="space-y-1.5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-white/55">
                      {item.productName} ×{item.quantity}
                    </span>
                    <span className="text-white font-semibold">
                      {formatRp(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
                    Metode:
                  </span>
                  <span className="text-[11px] text-white font-semibold">
                    {order.paymentMethod}
                  </span>
                </div>
                {firstItem?.kode && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
                      Kode:
                    </span>
                    <span className="text-[11px] text-violet-300 font-mono font-semibold">
                      {firstItem.kode}
                    </span>
                  </div>
                )}
                {firstItem?.pin && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
                      PIN:
                    </span>
                    <span className="text-[11px] text-fuchsia-300 font-mono font-semibold">
                      {firstItem.pin}
                    </span>
                  </div>
                )}
              </div>

              {/* Proof link */}
              {order.proofUrl && (
                <a
                  href={order.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-all"
                >
                  <ExternalLink className="w-3 h-3" /> Lihat Bukti Pembayaran
                </a>
              )}

              {/* Copy buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyAktivasi();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all text-[11px] font-bold"
                >
                  <Copy className="w-3 h-3" /> Copy Aktivasi
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyDetail();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/8 hover:text-white/70 transition-all text-[11px] font-bold"
                >
                  <FileText className="w-3 h-3" /> Copy Detail
                </button>
              </div>

              {/* Status buttons */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {(
                  ["pending", "confirmed", "cancelled"] as const
                ).map((s) => (
                  <button
                    key={s}
                    disabled={order.status === s}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(order.orderId, s);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      order.status === s
                        ? "border-violet-500/50 bg-violet-500/15 text-violet-300 cursor-default"
                        : "border-white/10 bg-white/4 text-white/40 hover:border-white/25 hover:text-white/70"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────── main component ─────────────────────── */

export default function Admin() {
  const { toast } = useToast();

  // auth state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // data
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  // ui
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);

  /* ── session check ── */
  async function checkSession() {
    try {
      const res = await fetch(`${API}/api/admin/me`, {
        credentials: "include",
      });
      const data = (await res.json()) as { isAdmin: boolean };
      setIsAdmin(data.isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }

  /* ── fetch data ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, sRes] = await Promise.all([
        fetch(`${API}/api/admin/orders`, { credentials: "include" }),
        fetch(`${API}/api/admin/stats`, { credentials: "include" }),
      ]);
      if (oRes.ok) {
        const raw = (await oRes.json()) as Array<{
          id: number;
          orderId: string;
          customerName: string;
          customerPhone: string;
          status: string;
          total: number;
          paymentMethod: string;
          paymentProofUrl?: string | null;
          items: OrderItem[];
          createdAt: string;
          notes?: string | null;
        }>;
        setOrders(
          raw.map((o) => ({
            ...o,
            proofUrl: o.paymentProofUrl ?? null,
            notes: o.notes ?? null,
          }))
        );
      }
      if (sRes.ok) setStats((await sRes.json()) as Stats);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── auto-clean (orders > 30 days) — at most once per 24 h ── */
  async function runCleanupIfDue() {
    const CLEANUP_KEY = "admin_last_cleanup";
    const last = localStorage.getItem(CLEANUP_KEY);
    const now = Date.now();
    if (last && now - Number(last) < 24 * 60 * 60 * 1000) return; // skip if < 24 h
    try {
      const res = await fetch(`${API}/api/admin/cleanup`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) localStorage.setItem(CLEANUP_KEY, String(now));
    } catch {
      // silent — cleanup is best-effort
    }
  }

  useEffect(() => {
    void checkSession();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void fetchData();
      void runCleanupIfDue();
    }
  }, [isAdmin, fetchData]);

  /* ── login ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const res = await fetch(`${API}/api/admin/login`, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoginLoading(false);
    if (res.ok) {
      setIsAdmin(true);
      setPassword("");
    } else {
      setLoginError("Password salah. Coba lagi.");
    }
  }

  /* ── logout ── */
  async function handleLogout() {
    await fetch(`${API}/api/admin/logout`, {
      credentials: "include",
      method: "POST",
    });
    setIsAdmin(false);
    setOrders([]);
    setStats(null);
  }

  /* ── status update ── */
  async function updateStatus(orderId: string, status: string) {
    await fetch(`${API}/api/admin/orders/${orderId}/status`, {
      credentials: "include",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void fetchData();
  }

  /* ── filtered + searched orders ── */
  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== "all") {
      list = list.filter((o) => {
        if (filter === "pending")
          return o.status === "pending" || o.status === "proof_uploaded";
        return o.status === filter;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  /* ── paginated slice ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── group by date ── */
  const groupedByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const o of paginated) {
      const key = getDateKey(o.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(o);
    }
    return map;
  }, [paginated]);

  const dateKeys = Object.keys(groupedByDate).sort((a, b) =>
    b.localeCompare(a)
  );

  // reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  /* ════════════════════════════════════════
     RENDER: loading session
  ════════════════════════════════════════ */
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#080812] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ════════════════════════════════════════
     RENDER: login form
  ════════════════════════════════════════ */
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#080812] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-violet-500/20 bg-[#0d0d1b] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6 text-violet-400" />
                </div>
                <h1 className="text-lg font-black text-white">Admin Panel</h1>
                <p className="text-xs text-white/35 mt-1">ANDIKA STORE</p>
              </div>
              <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password admin..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                      autoFocus
                    />
                  </div>
                  {loginError && (
                    <p className="text-xs text-pink-400 mt-1.5">{loginError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!password || loginLoading}
                  className="w-full h-11 rounded-xl font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:opacity-90"
                >
                  {loginLoading ? "Memeriksa..." : "MASUK"}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     RENDER: dashboard
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080812] text-white">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[#080812]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
              title="Kembali ke Homepage"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-violet-400 font-bold">
                Admin Panel
              </p>
              <h1 className="text-sm font-black text-white leading-tight">
                ANDIKA STORE
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchData()}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
              title="Refresh"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => void handleLogout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold"
            >
              <LogOut className="w-3 h-3" /> Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stats Grid ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total Order"
              value={stats.totalOrders}
              icon={<Package className="w-4 h-4" />}
              accent="bg-violet-500/5"
            />
            <StatCard
              label="Pending"
              value={stats.pendingOrders}
              icon={<Clock className="w-4 h-4" />}
              accent="bg-yellow-500/5"
            />
            <StatCard
              label="Confirmed"
              value={stats.confirmedOrders}
              icon={<CheckCircle2 className="w-4 h-4" />}
              accent="bg-emerald-500/5"
            />
            <StatCard
              label="Cancelled"
              value={stats.cancelledOrders}
              icon={<XCircle className="w-4 h-4" />}
              accent="bg-red-500/5"
            />
            <StatCard
              label="Order Hari Ini"
              value={stats.todayOrders}
              icon={<Calendar className="w-4 h-4" />}
              accent="bg-fuchsia-500/5"
            />
            <StatCard
              label="Revenue Hari Ini"
              value={formatRp(stats.todayRevenue)}
              icon={<TrendingUp className="w-4 h-4" />}
              accent="bg-fuchsia-500/5"
            />
            <StatCard
              label="Total Revenue"
              value={formatRp(stats.totalRevenue)}
              icon={<DollarSign className="w-4 h-4" />}
              accent="bg-violet-500/8"
            />
          </div>
        )}

        {/* ── Search + Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor order atau nama customer..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 focus:bg-violet-500/5 transition-all"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
            {(
              [
                { key: "all", label: "Semua" },
                { key: "pending", label: "Pending" },
                { key: "confirmed", label: "Confirmed" },
                { key: "cancelled", label: "Cancelled" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filter === key
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Orders section ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-widest text-white/35 font-bold">
              Riwayat Order{" "}
              <span className="text-violet-400">({filtered.length})</span>
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 text-xs font-bold transition-all"
                >
                  ‹
                </button>
                <span className="text-[11px] text-white/40 font-semibold">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 text-xs font-bold transition-all"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && !loading && (
            <div className="rounded-2xl border border-white/6 bg-[#0d0d1b] p-10 text-center">
              <Package className="w-8 h-8 text-white/15 mx-auto mb-3" />
              <p className="text-white/25 text-sm font-semibold">
                {search || filter !== "all"
                  ? "Tidak ada order yang cocok."
                  : "Belum ada order masuk."}
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && orders.length === 0 && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          )}

          {/* Accordion grouped by date */}
          {dateKeys.length > 0 && (
            <Accordion
              type="multiple"
              defaultValue={dateKeys.slice(0, 2)}
              className="space-y-3"
            >
              {dateKeys.map((dateKey) => {
                const dayOrders = groupedByDate[dateKey];
                const label = getDateLabel(dateKey);
                return (
                  <AccordionItem
                    key={dateKey}
                    value={dateKey}
                    className="rounded-2xl border border-white/8 bg-[#0d0d1b] overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/2 transition-all [&>svg]:text-white/30 [&>svg]:w-4 [&>svg]:h-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-sm font-bold text-white">
                          {label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                          {dayOrders.length} order
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <div className="space-y-2 pt-1">
                        {dayOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onStatusChange={(id, s) =>
                              void updateStatus(id, s)
                            }
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Pagination bottom */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 text-sm font-bold transition-all"
              >
                ← Sebelumnya
              </button>
              <span className="text-sm text-white/40 font-semibold">
                Hal {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 text-sm font-bold transition-all"
              >
                Berikutnya →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
