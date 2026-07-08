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
      <section className="w-full pt-14 pb-8 px-4 flex flex-col items-center text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(124,58,237,0.2) 0%, transparent 75%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(8,8,20,1), transparent)" }}
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 mb-6"
          >
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">
              Terpercaya & Profesional
            </span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-3">
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

          <p className="text-sm text-white/60 max-w-sm mx-auto leading-relaxed">
            Bantu Target Member Tokomu Tercapai
            <br />
            Dengan Layanan Aman,Terpercaya
            <br />
            Hingga Member Berhasil Aktif.
          </p>
        </motion.div>
      </section>

      {/* Product Card */}
      <section className="w-full max-w-sm mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          className="rounded-2xl border border-violet-500/20 bg-[#0c0c1a] overflow-hidden"
          style={{ boxShadow: "0 0 40px rgba(124,58,237,0.12), 0 4px 24px rgba(0,0,0,0.6)" }}
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
            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-emerald-300 text-center leading-relaxed">
                Hemat Rp500/member
                Berlaku untuk pembelian mulai 10 member.
              </p>
            </div>
            <div className="rounded-xl border border-white/6 bg-white/3 overflow-hidden mb-5">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <span className="text-xs text-white/45">1 – 9 Member</span>
                <span className="text-sm font-black text-white">Rp6.000<span className="text-xs font-normal text-white/40">/member</span></span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/8">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-violet-400 fill-violet-400" />
                  <span className="text-xs text-violet-300 font-semibold">≥ 10 Member</span>
                </div>
                <span className="text-sm font-black text-violet-300">Rp5.500<span className="text-xs font-normal text-violet-400/60">/member</span></span>
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
              className="w-full h-11 rounded-xl btn-primary text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 group"
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
          className="text-center text-[10px] text-white/18 mt-4 tracking-wider"
        >
          Admin akan konfirmasi via WhatsApp setelah pesanan dikirim.
        </motion.p>
      </section>
      {/* Ulasan Singkat */}
      <section className="w-full max-w-sm mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h2 className="text-2xl font-black text-white">
                  Ulasan Singkat
                </h2>
              </div>
            </div>

            <p className="text-sm text-white/50 mt-2">
              Ringkasan pengalaman pelanggan yang telah menggunakan layanan.
            </p>
          </div>

          <div className="space-y-4">

            {[
              {
                name: "R***",
                role: "Crew",
                text: "Target member toko akhirnya tercapai. Admin cepat merespons dan selalu update progress."
              },
              {
                name: "A***",
                role: "Assistant Chief of Store",
                text: "Sudah beberapa kali order. Proses cepat, aman, dan hasil sesuai harapan."
              },
              {
                name: "N***",
                role: "Chief of Store",
                text: "Harga terjangkau dan pelayanan profesional. Sangat membantu saat mengejar target member."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="rounded-2xl border border-violet-500/20 bg-[#0c0c1a] p-5 transition-all duration-300 hover:border-violet-400/40 hover:-translate-y-1"
                style={{
                  boxShadow:
                    "0 0 25px rgba(124,58,237,.08), inset 0 1px 0 rgba(255,255,255,.03)"
                }}
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>

                <div className="text-4xl text-violet-400/20 font-black leading-none mb-2">
                  "
                </div>
                <p className="text-sm text-white/70 leading-relaxed italic">
                  "{item.text}"
                </p>

                <div className="mt-5 pt-4 border-t border-white/5">
                  <h4 className="text-white font-semibold">
                    {item.name}
                  </h4>

                  <p className="text-xs text-violet-300 mt-1">
                    {item.role}
                  </p>
                </div>
              </motion.div>
            ))}

          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
