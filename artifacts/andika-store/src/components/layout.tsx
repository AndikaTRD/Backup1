import { APP_CONFIG } from "@/config/app";
import { Link, useLocation } from "wouter";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const [location] = useLocation();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const [headerMode, setHeaderMode] = useState<"top" | "scrolling-up" | "scrolling-down">("top");

  useEffect(() => {
    let previousY = window.scrollY;
    const updateHeader = () => {
      const currentY = window.scrollY;
      if (currentY <= 24) {
        setHeaderMode("top");
      } else if (Math.abs(currentY - previousY) > 2) {
        setHeaderMode(currentY < previousY ? "scrolling-up" : "scrolling-down");
      }
      previousY = currentY;
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <div className="andika-shell min-h-screen w-full flex flex-col">
      <header className={`site-header sticky top-0 z-50 w-full ${headerMode === "top" ? "site-header-top" : headerMode === "scrolling-up" ? "site-header-scrolling-up" : "site-header-scrolling-down"}`}>
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
              MEMBER
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

            <Link href="/admin" className="admin-link" data-testid="nav-admin">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="relative z-0 flex flex-1 flex-col">{children}</main>

      <footer className="site-footer mt-auto">
        <div className="mx-auto max-w-5xl px-4 py-7 text-center sm:px-6">
          <div className="mx-auto mb-3 h-px max-w-xs bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
          <p className="text-xs font-semibold text-white/55">
            © {APP_CONFIG.copyrightYear} {APP_CONFIG.name}
          </p>
          <p className="mt-1 text-[10px] font-medium tracking-wider text-violet-300/65">
            VERSION {APP_CONFIG.version}
          </p>
        </div>
      </footer>
    </div>
  );
    }
