import { useState } from "react";
import { Layout } from "@/components/layout";
import { OrderPopup } from "@/components/order-popup";
import { motion } from "framer-motion";
import { Shield, Zap, Clock, Headphones, ChevronRight, Star, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Shield, label: "100% Member Baru" },
  { icon: Sparkles, label: "Target Member Tercapai" },
  { icon: Clock, label: "Update Progres Berkala" },
  { icon: Headphones, label: "Support Setiap Hari" },
];

export default function Home() {
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <Layout>
      <OrderPopup open={popupOpen} onClose={() => setPopupOpen(false)} />

      {/* Hero */}
      <section className="w-full pt-11 sm:pt-16 pb-8 sm:pb-10 px-4 flex flex-col items-center text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(124,58,237,0.2) 0%, transparent 75%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(8,6,16,1), transparent)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 max-w-lg"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-400/25 bg-violet-500/[0.08] mb-5 shadow-[0_4px_24px_rgba(124,58,237,0.08)]"
          >
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">
              Layanan Praktis untuk Kebutuhan Toko
            </span>
          </motion.div>

          <h1 className="text-[2.45rem] sm:text-6xl font-black tracking-[-0.055em] leading-[0.98] mb-4">
            <span
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              NEW MEMBER
            </span>
            <br />
            <span className="text-white">FRESH</span>
          </h1>

          <p className="text-sm sm:text-base text-white/65 max-w-sm mx-auto leading-relaxed">
            Solusi praktis membantu kebutuhan member toko.
            <br />
            Pesan dengan mudah, harga jelas, dan layanan responsif.
          </p>
        </motion.div>
      </section>

      {/* Store benefits */}
      <section className="relative z-10 mx-auto -mt-1 mb-10 grid w-full max-w-2xl grid-cols-3 gap-2 px-4 sm:gap-3">
        {[
          { value: "Rp6.500", label: "Harga 1–9 member", icon: Star },
          { value: "Rp6.000", label: "Mulai 10 member", icon: Zap },
          { value: "Responsif", label: "Bantuan admin", icon: Headphones },
        ].map(({ value, label, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-violet-300/15 bg-gradient-to-b from-white/[0.045] to-white/[0.015] px-2 py-4 text-center shadow-[0_8px_28px_rgba(0,0,0,0.16)] sm:px-4">
            <Icon className="mx-auto mb-2 h-4 w-4 text-violet-300" />
            <p className="text-xs font-black text-white sm:text-sm">{value}</p>
            <p className="mt-1 text-[9px] leading-tight text-white/45 sm:text-[10px]">{label}</p>
          </div>
        ))}
      </section>

      {/* Product Card */}
      <section className="w-full max-w-md mx-auto px-4 pb-14 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          className="rounded-[24px] border border-violet-300/20 bg-[#100c1b] overflow-hidden"
          style={{ boxShadow: "0 22px 60px rgba(0,0,0,0.34), 0 0 36px rgba(124,58,237,0.09)" }}
          data-testid="card-product-1"
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />

          <div className="p-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/12 border border-violet-500/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300">
                Available
              </span>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight mb-0.5">
              NEW MEMBER FRESH
            </h2>
            <p className="text-xs text-white/40 mb-5">Aktivasi Member Baru</p>

            {/* Pricing table */}
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
                <Zap className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed text-left">
                <span className="font-bold">Lebih hemat Rp500 per member.</span>
                <br />Harga Rp6.000/member untuk pembelian 10 member atau lebih.
              </p>
            </div>
            <div className="rounded-xl border border-white/6 bg-white/3 overflow-hidden mb-5">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <span className="text-xs text-white/45">1 – 9 Member</span>
                <span className="text-sm font-black text-white">Rp6.500<span className="text-xs font-normal text-white/40">/member</span></span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/8">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-violet-400 fill-violet-400" />
                  <span className="text-xs text-violet-300 font-semibold">≥ 10 Member</span>
                </div>
                <span className="text-sm font-black text-violet-300">Rp6.000<span className="text-xs font-normal text-violet-400/60">/member</span></span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-xs text-white/55 font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setPopupOpen(true)}
              className="w-full min-h-12 rounded-xl btn-primary text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 group shadow-[0_8px_22px_rgba(109,40,217,0.18)]"
              data-testid="button-beli"
            >
              BELI SEKARANG
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[11px] text-white/40 mt-4 leading-relaxed"
        >
          Admin akan konfirmasi via WhatsApp setelah pesanan dikirim.
        </motion.p>
      </section>
      {/* Ulasan pelanggan */}
      <section className="w-full max-w-sm mx-auto px-4 pb-20">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#121020] to-[#0b0a13] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-500/10">
            <Star className="h-5 w-5 text-violet-300" />
          </div>
          <h2 className="text-xl font-black text-white">Ulasan Pelanggan</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Sudah pernah memesan di ANDIKA STORE? Bagikan pengalamanmu kepada admin agar masukan pelanggan dapat kami kumpulkan dan ditampilkan dengan benar.
          </p>
          <a
            href="https://wa.me/62895328068023?text=Halo%20admin%20ANDIKA%20STORE%2C%20saya%20ingin%20memberikan%20ulasan%20pesanan."
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white"
          >
            Kirim Ulasan ke Admin
          </a>
          <p className="mt-3 text-[10px] leading-relaxed text-white/35">
            Ulasan publik terverifikasi akan ditampilkan setelah sistem verifikasi pesanan dan ulasan tersedia.
          </p>
        </div>
      </section>
      </Layout>
  );
}
