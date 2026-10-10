import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Search,
  Copy,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  Package,
  ShoppingBag,
  Settings,
  ChevronRight,
  TrendingUp,
  Users,
  DollarSign,
  CalendarDays,
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
  const [loading, setLoading] = useState(false);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);

  // ui
  const [activeView, setActiveView] = useState<"home" | "orders" | "products" | "settings" | "stats">("home");
  const [storeName, setStoreName] = useState(() => localStorage.getItem("andika_admin_store_name") || "ANDIKA STORE");
  const [storeDescription, setStoreDescription] = useState(() => localStorage.getItem("andika_admin_store_description") || "Layanan praktis untuk kebutuhan toko.");
  const [storeLogo, setStoreLogo] = useState(() => localStorage.getItem("andika_admin_store_logo") || "/logo.png");
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem("andika_admin_theme") || "purple");
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
      const oRes = await fetch(`${API}/api/admin/orders`, { credentials: "include" });
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
        const nextOrders = raw.map((o) => ({
          ...o,
          proofUrl: o.paymentProofUrl ?? null,
          notes: o.notes ?? null,
        }));
        const nextIds = new Set(nextOrders.map((order) => order.orderId));
        const previousIds = knownOrderIdsRef.current;
        if (previousIds) {
          const newlyCreated = nextOrders.filter((order) => !previousIds.has(order.orderId));
          if (newlyCreated.length > 0) {
            toast({
              title: "Pesanan baru masuk!",
              description: newlyCreated.length === 1
                ? `${newlyCreated[0].orderId} · ${newlyCreated[0].customerName}`
                : `${newlyCreated.length} pesanan baru menunggu diperiksa.`,
            });
          }
        }
        knownOrderIdsRef.current = nextIds;
        setOrders(nextOrders);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
    if (!isAdmin) return;
    void fetchData();
    void runCleanupIfDue();
    // Check for new orders while the admin dashboard is open.
    const intervalId = window.setInterval(() => void fetchData(), 30000);
    return () => window.clearInterval(intervalId);
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

  const todayKey = new Date().toLocaleDateString("en-CA");
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toLocaleDateString("en-CA") === todayKey);
  const confirmedOrders = orders.filter((order) => order.status === "confirmed");
  const pendingOrders = orders.filter((order) => order.status === "pending" || order.status === "proof_uploaded");
  const cancelledOrders = orders.filter((order) => order.status === "cancelled");
  const confirmedRevenue = confirmedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const membersSold = confirmedOrders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => { if (item.productName.trim().toUpperCase() !== "NEW MEMBER FRESH") return itemSum; const lineAmount = Math.max(0, Number(item.price) || 0) * Math.max(0, Number(item.quantity) || 0); const unitPrice = lineAmount >= 60000 ? 6000 : 6500; return itemSum + Math.max(0, Math.round(lineAmount / unitPrice)); }, 0), 0);

  const monthlyStats = useMemo(() => {
    const map: Record<string, { key: string; label: string; orders: number; confirmed: number; cancelled: number; pending: number; revenue: number; members: number }> = {};
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = { key, label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }), orders: 0, confirmed: 0, cancelled: 0, pending: 0, revenue: 0, members: 0 };
      }
      const row = map[key];
      row.orders += 1;
      if (order.status === "confirmed") {
        row.confirmed += 1;
        row.revenue += Number(order.total || 0);
        row.members += (order.items || []).reduce((n, item) => {
          if (String(item.productName || "").trim().toUpperCase() !== "NEW MEMBER FRESH") return n;
          const amount = Math.max(0, Number(item.price) || 0) * Math.max(0, Number(item.quantity) || 0);
          const unitPrice = amount >= 60000 ? 6000 : 6500;
          return n + Math.max(0, Math.round(amount / unitPrice));
        }, 0);
      } else if (order.status === "cancelled") row.cancelled += 1;
      else row.pending += 1;
    }
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [orders]);

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
              <div className="relative p-6">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  title="Tutup"
                >
                  ✕
                </button>
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 flex items-center justify-center mb-3">
                  <img
                    src="/logo.png"
                    alt="ANDIKA STORE"
                    className="w-14 h-14 object-contain rounded-xl"
                  />
                </div>
                <h1 className="text-lg font-black text-white">Admin Login</h1>
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
    <div className="admin-page min-h-screen bg-[#080812] text-white">
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
        {activeView === "home" && (
          <section className="space-y-5 pb-8">
            <div className="relative overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-800 via-violet-600 to-fuchsia-600 p-5 shadow-xl shadow-violet-950/30 sm:p-7">
              <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-3xl" />
              <div className="relative flex items-center gap-3">
                <img src={storeLogo} alt="Logo toko" className="h-14 w-14 rounded-2xl border border-white/25 bg-white/10 object-contain p-1.5" />
                <div className="min-w-0"><p className="text-xs font-bold tracking-widest text-white/70">ADMIN DASHBOARD</p><h2 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">{storeName}</h2><p className="mt-1 text-xs text-white/75">Halo, Admin 👋 Senang melihat tokomu kembali.</p></div>
              </div>
              <div className="relative mt-5 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold text-white/70">Pendapatan terkonfirmasi</p><p className="mt-1 text-2xl font-black text-white sm:text-3xl">{formatRp(confirmedRevenue)}</p><p className="mt-1 text-[11px] text-white/65">Dihitung dari pesanan berstatus dikonfirmasi</p></div><button type="button" onClick={() => setActiveView("stats")} aria-label="Buka statistik bulanan dan pendapatan" className="rounded-2xl border border-white/20 bg-white/10 p-3 transition hover:bg-white/20 active:scale-95"><TrendingUp className="h-6 w-6 text-white"/><span className="mt-1 block text-[9px] font-bold text-white/80">STATISTIK</span></button></div>
            </div>
            <div className="flex items-center justify-between"><div><h3 className="text-base font-extrabold text-white">Ringkasan Toko</h3><p className="mt-1 text-xs text-white/40">Statistik berdasarkan data pesanan</p></div><button onClick={() => void fetchData()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5"/> Perbarui</button></div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:"Total Pesanan",value:String(orders.length),icon:Package,tone:"from-violet-500 to-fuchsia-500",action:"all" as const,clickable:true},
                {label:"Menunggu",value:String(pendingOrders.length),icon:Clock,tone:"from-amber-400 to-orange-500",action:"pending" as const,clickable:true},
                {label:"Dikonfirmasi",value:String(confirmedOrders.length),icon:CheckCircle2,tone:"from-emerald-400 to-teal-500",action:"confirmed" as const,clickable:true},
                {label:"Dibatalkan",value:String(cancelledOrders.length),icon:XCircle,tone:"from-rose-500 to-red-500",action:"cancelled" as const,clickable:true},
                {label:"Pesanan Hari Ini",value:String(todayOrders.length),icon:CalendarDays,tone:"from-blue-500 to-cyan-400",clickable:false},
                {label:"Member Terjual",value:String(membersSold),icon:Users,tone:"from-fuchsia-500 to-pink-500",clickable:false},
              ].map(({label,value,icon:Icon,tone,action,clickable})=><button key={label} type="button" onClick={clickable ? () => { setFilter(action!); setSearch(""); setActiveView("orders"); } : undefined} aria-label={clickable ? `Lihat pesanan: ${label}` : undefined} className={`w-full rounded-2xl border border-white/10 bg-[#111020] p-4 text-left shadow-lg shadow-black/10 ${clickable ? "cursor-pointer transition-all hover:border-violet-400/40 hover:bg-[#17132a] active:scale-[0.99]" : "cursor-default"}`}><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold text-white/55">{label}</span><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone}`}><Icon className="h-4 w-4 text-white"/></span></div><p className="mt-3 text-2xl font-black tracking-tight text-white">{value}</p>{clickable && <p className="mt-1 text-[10px] font-semibold text-violet-300/70">Ketuk untuk melihat →</p>}</button>)}
            </div>
            <div className="pt-1"><h3 className="text-base font-extrabold text-white">Menu Utama</h3><p className="mt-1 text-xs text-white/40">Pilih bagian yang ingin kamu kelola</p></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { key: "products" as const, title: "Kelola Produk", desc: "Lihat produk dan informasi harga", icon: ShoppingBag, tone: "from-blue-500 to-violet-500", count: "Daftar produk" },
                { key: "settings" as const, title: "Pengaturan Toko", desc: "Logo, nama toko, dan tampilan", icon: Settings, tone: "from-fuchsia-500 to-pink-500", count: "Preferensi toko" },
              ].map(({ key, title, desc, icon: Icon, tone, count }) => (
                <button key={key} onClick={() => setActiveView(key)} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-white/10 bg-[#111020] p-4 text-left transition-all hover:border-violet-400/40 hover:bg-[#17132a] active:scale-[0.99]">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-white">{title}</span><span className="mt-1 block text-xs leading-relaxed text-white/45">{desc}</span><span className="mt-2 block text-[10px] font-bold text-violet-300">{count}</span></span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-violet-300 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </section>
        )}

        {activeView === "stats" && (
          <section className="space-y-5 pb-24">
            <div className="flex items-center gap-3"><button onClick={() => setActiveView("home")} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70"><ArrowLeft className="h-4 w-4" /></button><div><h2 className="text-lg font-black">Statistik Bulanan</h2><p className="text-xs text-white/40">Ringkasan pesanan dan pendapatan setiap bulan</p></div></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#111020] p-4"><p className="text-xs font-semibold text-white/45">Total Pendapatan</p><p className="mt-2 text-lg font-black text-violet-300">{formatRp(monthlyStats.reduce((sum, row) => sum + row.revenue, 0))}</p><p className="mt-1 text-[10px] text-white/30">Dari pesanan dikonfirmasi</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#111020] p-4"><p className="text-xs font-semibold text-white/45">Pesanan Terkonfirmasi</p><p className="mt-2 text-lg font-black text-emerald-300">{monthlyStats.reduce((sum, row) => sum + row.confirmed, 0)}</p><p className="mt-1 text-[10px] text-white/30">Seluruh bulan yang tersedia</p></div>
            </div>
            {monthlyStats.length === 0 ? <div className="rounded-2xl border border-white/10 bg-[#111020] p-8 text-center text-sm text-white/40">Belum ada data pesanan.</div> : <div className="space-y-3">{monthlyStats.map((row) => { const maxRevenue = Math.max(1, ...monthlyStats.map((item) => item.revenue)); return <article key={row.key} className="rounded-2xl border border-white/10 bg-[#111020] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold capitalize text-white">{row.label}</h3><p className="mt-1 text-xs text-white/40">{row.orders} pesanan · {row.members} member terjual</p></div><div className="text-right"><p className="text-sm font-black text-violet-300">{formatRp(row.revenue)}</p><p className="mt-1 text-[10px] text-white/35">pendapatan</p></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.min(100, (row.revenue / maxRevenue) * 100)}%` }} /></div><div className="mt-3 grid grid-cols-3 gap-2 text-[10px]"><div className="rounded-lg bg-white/5 p-2"><span className="block text-white/35">Dikonfirmasi</span><strong className="mt-1 block text-emerald-300">{row.confirmed}</strong></div><div className="rounded-lg bg-white/5 p-2"><span className="block text-white/35">Menunggu</span><strong className="mt-1 block text-amber-300">{row.pending}</strong></div><div className="rounded-lg bg-white/5 p-2"><span className="block text-white/35">Dibatalkan</span><strong className="mt-1 block text-rose-300">{row.cancelled}</strong></div></div></article>; })}</div>}
            <p className="text-[10px] leading-relaxed text-white/30">Statistik dihitung dari pesanan yang masih memiliki data di database. Pendapatan hanya menghitung pesanan berstatus dikonfirmasi.</p>
          </section>
        )}

        {activeView === "settings" && (
          <section className="space-y-4 pb-24">
            <div className="flex items-center gap-3"><button onClick={() => setActiveView("home")} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70"><ArrowLeft className="h-4 w-4" /></button><div><h2 className="text-lg font-black">Pengaturan Toko</h2><p className="text-xs text-white/40">Atur identitas dan tampilan toko</p></div></div>
            <div className="space-y-5 rounded-2xl border border-white/10 bg-[#111020] p-4 sm:p-5">
              <div><label className="mb-2 block text-xs font-bold text-white/65">Logo toko</label><div className="flex items-center gap-4"><img src={storeLogo} alt="Pratinjau logo" className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 object-contain p-1" /><label className="cursor-pointer rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-xs font-bold text-violet-200 hover:bg-violet-500/20">Ganti Foto<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const file=e.target.files?.[0]; if (!file) return; if(file.size>2*1024*1024){toast({title:"Ukuran foto maksimal 2 MB",variant:"destructive"});return;} const reader=new FileReader(); reader.onload=()=>{ const value=String(reader.result); setStoreLogo(value); localStorage.setItem("andika_admin_store_logo",value); toast({title:"Foto logo diperbarui di perangkat ini"}); }; reader.readAsDataURL(file); }} /></label></div><p className="mt-2 text-[11px] text-amber-200/70">Catatan: foto saat ini tersimpan di browser/perangkat ini, belum disinkronkan ke semua pengunjung.</p></div>
              <div><label className="mb-2 block text-xs font-bold text-white/65">Nama toko</label><input value={storeName} onChange={(e)=>setStoreName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/50" /></div>
              <div><label className="mb-2 block text-xs font-bold text-white/65">Deskripsi toko</label><textarea value={storeDescription} onChange={(e)=>setStoreDescription(e.target.value)} rows={3} className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/50" /></div>
              <div><label className="mb-2 block text-xs font-bold text-white/65">Tema warna</label><div className="grid grid-cols-3 gap-2">{[{id:"purple",label:"Ungu",cls:"from-violet-600 to-fuchsia-500"},{id:"blue",label:"Biru",cls:"from-blue-600 to-cyan-400"},{id:"green",label:"Hijau",cls:"from-emerald-600 to-teal-400"}].map(t=><button key={t.id} onClick={()=>setThemeColor(t.id)} className={`rounded-xl border p-2 text-xs font-bold ${themeColor===t.id?"border-white/70 bg-white/10":"border-white/10 bg-black/10"}`}><span className={`mb-2 block h-6 rounded-lg bg-gradient-to-r ${t.cls}`}/>{t.label}{themeColor===t.id?" ✓":""}</button>)}</div><p className="mt-2 text-[11px] text-white/35">Pilihan tema disimpan untuk panel admin ini.</p></div>
              <button onClick={()=>{localStorage.setItem("andika_admin_store_name",storeName.trim()||"ANDIKA STORE");localStorage.setItem("andika_admin_store_description",storeDescription);localStorage.setItem("andika_admin_theme",themeColor);toast({title:"Pengaturan disimpan di perangkat ini"});}} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-950/30">Simpan Pengaturan</button>
            </div>
          </section>
        )}

        {activeView === "products" && (
          <section className="space-y-4 pb-24"><div className="flex items-center gap-3"><button onClick={()=>setActiveView("home")} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70"><ArrowLeft className="h-4 w-4"/></button><div><h2 className="text-lg font-black">Kelola Produk</h2><p className="text-xs text-white/40">Ringkasan produk toko</p></div></div><div className="rounded-2xl border border-white/10 bg-[#111020] p-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500"><Package className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="font-bold">NEW MEMBER FRESH</p><p className="mt-1 text-xs text-white/45">Member Fresh Alfamart</p></div><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">Aktif</span></div><div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm"><div className="flex justify-between gap-3"><span className="text-white/50">Harga 1–9 member</span><strong>Rp6.500/member</strong></div><div className="flex justify-between gap-3"><span className="text-white/50">Harga 10+ member</span><strong>Rp6.000/member</strong></div></div><p className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100/80">Pengubahan harga belum diaktifkan di halaman ini agar tidak mengubah harga checkout tanpa dukungan API penyimpanan yang sesuai.</p></div></section>
        )}

        {activeView === "orders" && (
        <section className="space-y-5 pb-24">
          <div className="flex items-center gap-3"><button onClick={() => setActiveView("home")} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70"><ArrowLeft className="h-4 w-4" /></button><div><h2 className="text-lg font-black">{filter === "all" ? "Total Pesanan" : filter === "pending" ? "Pesanan Menunggu" : filter === "confirmed" ? "Pesanan Dikonfirmasi" : "Pesanan Dibatalkan"}</h2><p className="text-xs text-white/40">{filtered.length} pesanan dalam kategori ini</p></div></div>
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
        </section>
        )}
      </div>

    </div>
  );
}
