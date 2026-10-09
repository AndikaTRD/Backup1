import { APP_CONFIG } from "@/config/app";
import { Link, useLocation } from "wouter";
import { ShoppingCart, CircleUserRound, MessageCircle, Mail, Clock3, ShieldCheck } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const [location] = useLocation();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const [isAtTop, setIsAtTop] = useState(() => typeof window !== "undefined" && window.scrollY <= 2);

  useEffect(() => {
    let ticking = false;
    const updateHeader = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const atTop = window.scrollY <= 2;
        setIsAtTop((current) => current === atTop ? current : atTop);
        ticking = false;
      });
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <div className="andika-shell min-h-screen w-full flex flex-col">
      <header className={`site-header sticky top-0 z-50 w-full ${isAtTop ? "site-header-top" : "site-header-scrolled"}`}>
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="group flex min-w-0 items-center gap-3" data-testid="link-logo">
            <span className="logo-frame flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              <img src="/logo.png" alt="Andika Store" className="h-8 w-8 rounded-xl bg-white p-1 object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-black tracking-[0.16em] text-white sm:text-sm">ANDIKA STORE</span>
              <span className="mt-0.5 hidden text-[10px] font-medium tracking-wide text-violet-200/60 sm:block">Solusi member fresh tokomu</span>
            </span>
          </Link>

          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link href="/" className={`nav-pill ${location === "/" ? "nav-pill-active" : ""}`} data-testid="nav-member">
              MENU
            </Link>

            <Link href="/cart" className={`cart-button relative ${location === "/cart" ? "cart-button-active" : ""}`} data-testid="nav-cart" aria-label="Keranjang belanja">
              <ShoppingCart className="h-[18px] w-[18px]" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="cart-count" data-testid="cart-badge">
                    {cartCount > 99 ? "99+" : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link href="/admin" className="admin-link login-icon-button" data-testid="nav-admin" aria-label="Login admin" title="Login admin">
              <CircleUserRound className="h-[20px] w-[20px]" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-0 flex flex-1 flex-col">{children}</main>

      <footer className="site-footer mt-auto">
        <div className="mx-auto max-w-5xl px-5 pb-5 pt-8 sm:px-6 sm:pt-10">
          <div className="grid gap-8 border-b border-violet-300/10 pb-7 sm:grid-cols-[1.15fr_1fr] sm:gap-12 sm:pb-8">
            <div>
              <Link href="/" className="inline-flex items-center gap-3" aria-label="ANDIKA STORE beranda">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10">
                  <img src="/logo.png" alt="" className="h-7 w-7 rounded-lg bg-white p-1 object-contain" />
                </span>
                <span className="text-sm font-black tracking-[0.16em] text-white">ANDIKA STORE</span>
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                Solusi praktis untuk kebutuhan member fresh tokomu. Pesan dengan mudah melalui website.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] font-medium text-emerald-200/80">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Pemesanan praktis dan mudah
              </div>
            </div>

            <div>
              <h2 className="text-xs font-extrabold tracking-[0.16em] text-white/85">HUBUNGI KAMI</h2>
              <p className="mt-2 text-xs leading-5 text-white/45">Butuh bantuan atau ingin bertanya tentang pesanan? Hubungi admin melalui kontak berikut.</p>
              <div className="mt-4 grid gap-3">
                <a
                  href={`https://wa.me/${APP_CONFIG.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-12 items-center gap-3 rounded-xl border border-emerald-400/15 bg-white/[0.025] px-3.5 py-3 transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/[0.06]"
                  aria-label="Hubungi admin melalui WhatsApp"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">WhatsApp Admin</span>
                    <span className="mt-0.5 block truncate text-sm font-semibold text-white/85">0895328068023</span>
                  </span>
                  <span className="text-xs text-emerald-300">Hubungi →</span>
                </a>
                <a
                  href={`mailto:${APP_CONFIG.email}`}
                  className="group flex min-h-12 items-center gap-3 rounded-xl border border-violet-300/10 bg-white/[0.025] px-3.5 py-3 transition-colors hover:border-violet-300/25 hover:bg-violet-400/[0.05]"
                  aria-label="Kirim email ke ANDIKA STORE"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Email</span>
                    <span className="mt-0.5 block break-all text-sm font-semibold text-white/85">{APP_CONFIG.email}</span>
                  </span>
                  <span className="text-xs text-violet-300">Email →</span>
                </a>
              </div>
              <p className="mt-3 flex items-center gap-2 text-[11px] text-white/40">
                <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Waktu respons admin dapat bervariasi.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 pt-5 text-center sm:flex-row sm:text-left">
            <p className="text-xs font-medium text-white/50">
              © {APP_CONFIG.copyrightYear} {APP_CONFIG.name}. Hak cipta dilindungi.
            </p>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-violet-300/60">
              {APP_CONFIG.version}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
