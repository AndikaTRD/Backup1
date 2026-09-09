import { APP_CONFIG } from "@/config/app";
import { Link, useLocation } from "wouter";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const [location] = useLocation();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-violet-500/10 bg-[#080812]/85 backdrop-blur-2xl">
          <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
            <img
              src="/logo.png"
              alt="Andika Store"
              className="w-9 h-9 rounded-xl bg-white p-1 object-contain border border-violet-500/20 shadow-lg shadow-violet-500/20"
            />

            <span className="font-black text-xs sm:text-sm tracking-wide uppercase text-white">
              ANDIKA STORE
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                location === "/"
                  ? "bg-violet-600/25 text-violet-300 border border-violet-500/40"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
              data-testid="nav-member"
            >
              MEMBER
            </Link>

            {/* Cart icon */}
            <Link href="/cart" className="relative" data-testid="nav-cart">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  location === "/cart"
                    ? "bg-violet-600/25 text-violet-300"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
              </div>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.div
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-4.5 h-4 min-w-[18px] rounded-full bg-pink-500 flex items-center justify-center text-[9px] font-black text-white px-1"
                    data-testid="cart-badge"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            <Link
              href="/admin"
              className="px-2 py-1.5 rounded-lg text-[10px] font-medium text-white/20 hover:text-white/40 transition-colors"
              data-testid="nav-admin"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

          <main className="flex-1 flex flex-col">{children}</main>

          <footer className="border-t border-white/5 py-5">
            <div className="max-w-lg mx-auto px-4 text-center space-y-1">
              <p className="text-xs text-white/60 font-medium">
                © {APP_CONFIG.copyrightYear} {APP_CONFIG.name}
              </p>

              <p className="text-[11px] text-violet-400 font-semibold">
                Version {APP_CONFIG.version}
              </p>
            </div>
          </footer>
        </div>
      );
    }
