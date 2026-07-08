import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle2, Loader2 } from "lucide-react";

interface PurchasePopupProps {
  open: boolean;
  onClose: () => void;
}

const PRICE_REGULAR = 6000;
const PRICE_BULK = 5500;
const BULK_MIN = 10;

function generateOrderId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(100 + Math.random() * 900);
  return `ANDK${rand}-${date}`;
}

function formatRupiah(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}

type PaymentMethod = "QRIS" | "TRANSFER";

export function PurchasePopup({ open, onClose }: PurchasePopupProps) {
  const [nama, setNama] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [payment, setPayment] = useState<PaymentMethod>("QRIS");
  const [bukti, setBukti] = useState<File | null>(null);
  const [buktiBase64, setBuktiBase64] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const unitPrice = jumlah >= BULK_MIN ? PRICE_BULK : PRICE_REGULAR;
  const total = unitPrice * jumlah;

  function handleJumlahChange(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1) setJumlah(n);
    else if (val === "") setJumlah(1);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBukti(file);
    const reader = new FileReader();
    reader.onload = () => {
      setBuktiBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirm() {
    if (!nama.trim()) {
      setError("Nama pemesan wajib diisi.");
      return;
    }
    if (!bukti) {
      setError("Silakan upload bukti pembayaran.");
      return;
    }

    setError("");
    setLoading(true);

    const orderId = generateOrderId();

    // Upload bukti ke ImgBB via backend
    let proofUrl = "";
    try {
      const formData = new FormData();
      formData.append("bukti", bukti);
      const uploadRes = await fetch("/api/upload-bukti", {
        method: "POST",
        body: formData,
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json() as { url: string };
        proofUrl = data.url;
      }
    } catch {
      // silent — lanjut tanpa link
    }

    // Save order to database
    try {
      await fetch("/api/orders/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerName: nama.trim(),
          items: [{
            productName: "NEW MEMBER FRESH",
            price: unitPrice,
            quantity: jumlah,
            kode: "",
            pin: "",
          }],
          paymentMethod: payment,
          proofUrl: proofUrl || undefined,
          total,
        }),
      });
    } catch {
      // silent — WhatsApp still goes through even if DB save fails
    }

    // Build WhatsApp message
    const waMsg = [
      "HALLO, SAYA SUDAH MELAKUKAN KONFIRMASI PAYMENT.",
      "",
      `NO ORDER : ${orderId}`,
      "",
      "NAMA PEMESAN :",
      nama.trim(),
      "",
      "PRODUK :",
      "NEW MEMBER FRESH",
      "",
      "JUMLAH MEMBER :",
      `${jumlah} Member`,
      "",
      "HARGA / MEMBER :",
      formatRupiah(unitPrice),
      "",
      "TOTAL :",
      formatRupiah(total),
      "",
      "PAYMENT :",
      payment === "QRIS" ? "QRIS" : "TRANSFER",
      "",
      "Terima kasih.",
    ].join("\n");

    const waNumber = "6285156930931";
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;

    setLoading(false);
    onClose();

    // Reset form
    setNama("");
    setJumlah(1);
    setPayment("QRIS");
    setBukti(null);
    setBuktiBase64("");

    window.open(waUrl, "_blank");
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(4,4,16,0.88)", backdropFilter: "blur(8px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdrop}
          data-testid="purchase-popup-backdrop"
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-violet-500/20 bg-[#0e0e1c] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            data-testid="purchase-popup"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/5">
              <div>
                <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-0.5">Pembelian</p>
                <h2 className="text-lg font-bold text-white">NEW MEMBER FRESH</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all"
                data-testid="button-close-popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-1.5">
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                  data-testid="input-nama"
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-1.5">
                  Jumlah Member
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setJumlah(j => Math.max(1, j - 1))}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-violet-600/20 hover:border-violet-500/30 transition-all flex items-center justify-center text-lg"
                    data-testid="button-decrease"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={jumlah}
                    onChange={e => handleJumlahChange(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white text-center focus:outline-none focus:border-violet-500/50 transition-all"
                    data-testid="input-jumlah"
                  />
                  <button
                    onClick={() => setJumlah(j => j + 1)}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-violet-600/20 hover:border-violet-500/30 transition-all flex items-center justify-center text-lg"
                    data-testid="button-increase"
                  >
                    +
                  </button>
                </div>
                {jumlah >= BULK_MIN && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-violet-400 mt-1.5 font-medium"
                  >
                    Harga bulk aktif: {formatRupiah(PRICE_BULK)}/member
                  </motion.p>
                )}
              </div>

              {/* Price summary */}
              <div className="rounded-xl bg-white/3 border border-white/6 px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Harga / Member</span>
                  <span className="text-white font-semibold">{formatRupiah(unitPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Jumlah</span>
                  <span className="text-white">{jumlah} Member</span>
                </div>
                <div className="h-px bg-white/8 my-1" />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-white/70">Total</span>
                  <span className="text-base font-bold text-violet-300">{formatRupiah(total)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["QRIS", "TRANSFER"] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setPayment(m)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        payment === m
                          ? "bg-violet-600/25 border-violet-500/60 text-violet-300"
                          : "bg-white/4 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                      }`}
                      data-testid={`button-payment-${m.toLowerCase()}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload bukti */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-1.5">
                  Bukti Pembayaran
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`w-full rounded-xl border border-dashed py-3.5 flex items-center justify-center gap-2.5 transition-all text-sm ${
                    bukti
                      ? "border-violet-500/50 bg-violet-500/8 text-violet-300"
                      : "border-white/15 bg-white/3 text-white/40 hover:border-white/25 hover:text-white/60"
                  }`}
                  data-testid="button-upload-bukti"
                >
                  {bukti ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium truncate max-w-[200px]">{bukti.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload screenshot bukti</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-bukti-file"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 font-medium">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full h-12 rounded-xl btn-primary text-white font-bold text-sm tracking-wider uppercase disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-konfirmasi"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "KONFIRMASI PAYMENT"
                )}
              </button>
              <p className="text-center text-xs text-white/25 mt-2.5">
                Setelah konfirmasi, WhatsApp akan terbuka otomatis
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
