import { useState, useEffect } from "react";
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  useEffect(() => { fetch("/api/reviews").then(r => r.ok ? r.json() : []).then(setReviews).catch(() => setReviews([])); }, []);
  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reviewSubmitting) return;
    setReviewSubmitting(true); setReviewMessage("");
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: reviewName, rating: reviewRating, comment: reviewComment }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ulasan gagal dikirim.");
      setReviewMessage(data.message || "Terima kasih! Ulasan menunggu pemeriksaan admin.");
      setReviewName(""); setReviewComment(""); setReviewRating(5);
    } catch (error) { setReviewMessage(error instanceof Error ? error.message : "Ulasan gagal dikirim."); }
    finally { setReviewSubmitting(false); }
  }

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
      {/* Ulasan Pelanggan */}
      <section className="mx-auto w-full max-w-xl px-4 pb-20">
        <div className="mb-6 text-center"><div className="mb-2 flex items-center justify-center gap-2"><Star className="h-5 w-5 text-violet-300" /><h2 className="text-2xl font-black text-white">Ulasan Pelanggan</h2></div><p className="text-sm text-white/50">Ceritakan pengalamanmu menggunakan layanan ANDIKA STORE.</p></div>
        <form onSubmit={submitReview} className="space-y-4 rounded-3xl border border-white/10 bg-[#10101c] p-5">
          <label className="block text-xs font-semibold text-white/70">Nama atau nama panggilan<input value={reviewName} onChange={e=>setReviewName(e.target.value)} required minLength={2} maxLength={60} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-violet-400" placeholder="Contoh: Andi R." /></label>
          <div><p className="mb-2 text-xs font-semibold text-white/70">Rating layanan</p><div className="flex gap-2">{[1,2,3,4,5].map(star=><button key={star} type="button" onClick={()=>setReviewRating(star)} aria-label={star+" bintang"} className="rounded-lg p-1"><Star className={"h-7 w-7 "+(star<=reviewRating?"fill-yellow-400 text-yellow-400":"text-white/20")} /></button>)}</div></div>
          <label className="block text-xs font-semibold text-white/70">Komentar<textarea value={reviewComment} onChange={e=>setReviewComment(e.target.value)} required minLength={8} maxLength={600} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-violet-400" placeholder="Bagaimana pengalamanmu? (8–600 karakter)" /><span className="mt-1 block text-right text-[10px] text-white/35">{reviewComment.length}/600</span></label>
          <button disabled={reviewSubmitting} type="submit" className="btn-primary min-h-11 w-full rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50">{reviewSubmitting?"Mengirim...":"Kirim Komentar"}</button>
          {reviewMessage && <p role="status" className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-xs text-violet-200">{reviewMessage}</p>}
          <p className="text-[10px] leading-relaxed text-white/35">Komentar diperiksa admin sebelum ditampilkan. Jangan cantumkan PIN, OTP, atau informasi rahasia.</p>
        </form>
        <div className="mt-6 space-y-3">{reviews.map((review:any)=><article key={review.id} className="rounded-2xl border border-white/10 bg-[#0c0c16] p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-white">{review.customerName}</p><div className="flex">{[1,2,3,4,5].map(star=><Star key={star} className={"h-3.5 w-3.5 "+(star<=review.rating?"fill-yellow-400 text-yellow-400":"text-white/15")}/>)}</div></div><p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/65">{review.comment}</p><p className="mt-3 text-[10px] text-white/30">{new Date(review.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</p></article>)}{reviews.length===0 && <p className="py-4 text-center text-xs text-white/35">Belum ada ulasan yang dipublikasikan.</p>}</div>
      </section>
      </Layout>
  );
}
