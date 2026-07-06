import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_KEY = "andika_store_visited";

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    if (!hasVisited) {
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleDismiss() {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="welcome-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(4,4,16,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
        >
          <motion.div
            key="welcome-modal"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-violet-500/25 bg-[#0d0d1b] shadow-2xl shadow-violet-900/30"
          >
            {/* Top gradient bar */}
            <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />

            {/* Glow backdrop */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)",
              }}
            />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-all"
              aria-label="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            <div className="relative px-6 pt-8 pb-7 flex flex-col items-center text-center">
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
              {/* Logo */}
              <img
                src="/logo.png"
                alt="Andika Store"
                className="w-20 h-20 object-contain mb-5"
              />
              <div className="mb-3 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300">
                  MEMBER ALFAMART
                </span>
              </div>

              {/* Store name */}
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400 mb-2">
                ANDIKA STORE
              </p>

              {/* Title */}
              <h2 className="text-3xl font-black leading-tight mb-3">
                <span className="text-white">
                  TARGET MEMBER
                </span>

                <br />

                <span className="bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
                  BELUM TERCAPAI?
                </span>
              </h2>

              {/* Subtitle */}
              <p className="text-sm text-white/60 leading-relaxed mb-7">
                Solusi aktivasi <b className="text-white">New Member Fresh</b>
                untuk membantu target member tokomu tercapai.
              </p>

              {/* Feature points */}
              <div className="w-full space-y-2.5 mb-7">
                {[
                  {
                    icon:"🔥",
                    label:"Member Fresh",
                    desc:"100% member baru"
                  },
                  {
                    icon:"⚡",
                    label:"Proses Cepat",
                    desc:"Update progress berkala"
                  },
                  {
                    icon:"🛡️",
                    label:"Terpercaya",
                    desc:"Support admin setiap hari"
                  }
                ].map(({ icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl bg-white/4 border border-white/6 px-4 py-2.5 text-left"
                  >
                    <span className="text-lg leading-none">{icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{label}</p>
                      <p className="text-[10px] text-white/35">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <button
                onClick={handleDismiss}
                className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-violet-900/40"
              >
                LIHAT HARGA MEMBER
              </button>
              <p className="mt-3 text-[10px] text-white/30">
              Admin akan menghubungi melalui WhatsApp setelah order.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
