import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { LockKeyhole, LogIn, LogOut, ShieldCheck, Store, UserPlus } from "lucide-react";

type User = { id: number; email: string };

async function readError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return body.error ?? "Terjadi kesalahan. Coba lagi.";
}

export default function ProductSaya() {
  const [user, setUser] = useState<User | null>(null);
  const [ownsAbsensi, setOwnsAbsensi] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadAccount() {
    setLoading(true);
    const me = await fetch("/api/customer/me", { credentials: "include" });
    const data = (await me.json()) as { authenticated: boolean; user?: User };
    if (!data.authenticated || !data.user) {
      setUser(null);
      setOwnsAbsensi(false);
      setLoading(false);
      return;
    }
    setUser(data.user);
    const products = await fetch("/api/customer/products", { credentials: "include" });
    const productData = (await products.json()) as { ownsAbsensi?: boolean };
    setOwnsAbsensi(Boolean(productData.ownsAbsensi));
    setLoading(false);
  }

  useEffect(() => {
    void loadAccount();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const response = await fetch(`/api/customer/${mode}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setError(await readError(response));
      setSubmitting(false);
      return;
    }
    setEmail("");
    setPassword("");
    await loadAccount();
    setSubmitting(false);
  }

  async function handleLogout() {
    await fetch("/api/customer/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setOwnsAbsensi(false);
  }

  return (
    <Layout>
      <main className="w-full max-w-lg mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-violet-400 font-bold">
            Area Customer
          </p>
          <h1 className="text-3xl font-black text-white mt-2">Produk Saya</h1>
          <p className="text-sm text-white/45 mt-2">
            Kelola akses digital yang kamu beli dari ANDIKA STORE.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-8 text-center text-sm text-white/40">
            Memuat akun...
          </div>
        ) : !user ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-violet-500/20 bg-[#0c0c1a] p-5 space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              {mode === "login" ? (
                <LogIn className="w-5 h-5 text-violet-400" />
              ) : (
                <UserPlus className="w-5 h-5 text-violet-400" />
              )}
              <h2 className="text-lg font-black text-white">
                {mode === "login" ? "Login Customer" : "Buat Akun Customer"}
              </h2>
            </div>
            <p className="text-xs text-white/40">
              Akun customer terpisah dari akun admin dan digunakan untuk menjaga data
              Absensi Toko milikmu.
            </p>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-bold">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-bold">
                Password
              </span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </label>
            {error && <p className="text-xs text-pink-400">{error}</p>}
            <button
              disabled={submitting}
              className="w-full h-11 rounded-xl btn-primary text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {submitting ? "Memproses..." : mode === "login" ? "Login" : "Daftar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="w-full text-xs text-violet-300 hover:text-violet-200"
            >
              {mode === "login"
                ? "Belum punya akun? Daftar di sini"
                : "Sudah punya akun? Login di sini"}
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0c0c1a] px-4 py-3 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/35">Login sebagai</p>
                <p className="text-sm font-bold text-white mt-1">{user.email}</p>
              </div>
              <button
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-pink-300"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar
              </button>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-[#0c0c1a] overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/12 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-violet-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">ABSENSI TOKO</h2>
                    <p className="text-xs text-white/40 mt-1">
                      Aplikasi absensi karyawan untuk toko kamu.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs">
                  {ownsAbsensi ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 font-semibold">Produk aktif</span>
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 font-semibold">Belum aktif</span>
                    </>
                  )}
                </div>
                {ownsAbsensi ? (
                  <Link
                    href="/absensi"
                    className="mt-5 flex items-center justify-center h-11 rounded-xl btn-primary text-white font-bold text-sm uppercase tracking-wider"
                  >
                    Buka Absensi Toko
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="mt-5 flex items-center justify-center h-11 rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-200 font-bold text-sm uppercase tracking-wider"
                  >
                    Lihat Produk
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </Layout>
  );
}