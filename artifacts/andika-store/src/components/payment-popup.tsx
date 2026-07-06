import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle2, Loader2, Copy } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";

interface PaymentPopupProps {
  open: boolean;
  onClose: () => void;
}

const WA_NUMBER = "62895328068023";

const BANK_ACCOUNTS = [
  { bank: "Aladin Bank", rekening: "50817272571", nama: "M ANDIKA SAPUTRA" },
];

const EWALLET_ACCOUNTS = [
  { bank: "Dana", rekening: "0895328068023", nama: "M ANDIKA SAPUTRA" },
  { bank: "ShopeePay", rekening: "0895328068023", nama: "MUHAMMADANDIKA87" },
];

type PaymentMethod = "QRIS" | "TRANSFER";

function formatRp(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

function generateOrderId(): string {
  const now = new Date();
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const date =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate());
  const time =
    pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RC-${date}-${time}-${rand}`;
}

function AccountRow({
  acc,
  copied,
  onCopy,
}: {
  acc: { bank: string; rekening: string; nama: string };
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">{acc.bank}</p>
        <p className="text-sm font-black text-white font-mono tracking-widest">{acc.rekening}</p>
        <p className="text-[10px] text-white/35 mt-0.5">{acc.nama}</p>
      </div>
      <button
        onClick={() => onCopy(acc.rekening, acc.bank)}
        className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center text-white/40 hover:text-violet-300 hover:bg-violet-500/15 transition-all"
        data-testid={`button-copy-${acc.bank.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {copied === acc.bank ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

export function PaymentPopup({ open, onClose }: PaymentPopupProps) {
  const [nama, setNama] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("QRIS");
  const [bukti, setBukti] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { items, clearCart } = useCart();
  const [, setLocation] = useLocation();

  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setBukti(f);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  async function handleConfirm() {
    if (!nama.trim()) { setError("Nama pemesan wajib diisi."); return; }
    if (!bukti) { setError("Silakan upload bukti pembayaran terlebih dahulu."); return; }
    setError("");
    setLoading(true);

    const orderId = generateOrderId();

    // Upload bukti ke ImgBB via backend
    let buktiUrl = "";
    try {
      const formData = new FormData();
      formData.append("bukti", bukti);
      const uploadRes = await fetch("/api/upload-bukti", {
        method: "POST",
        body: formData,
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json() as { url: string };
        buktiUrl = data.url;
      }
    } catch {
      // upload gagal, lanjut tanpa link
    }

    // Save order to database
    try {
      await fetch("/api/orders/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerName: nama.trim(),
          items: items.map(item => ({
            productName: item.productName,
            price: item.unitPrice,
            quantity: item.qty,
            kode: item.kode,
            pin: item.pin,
          })),
          paymentMethod: method,
          proofUrl: buktiUrl || undefined,
          total: grandTotal,
        }),
      });
    } catch {
      // silent — order still proceeds via WhatsApp even if DB save fails
    }

    // Build per-item lines
    const itemLines = items.map(item =>
      [
        `AKTIVASI#${item.kode}`,
        `PIN / TGL LAHIR : ${item.pin}`,
        `JUMLAH QTY MEMBER : ${item.qty}`,
        `TOTAL : ${formatRp(item.total)}`,
      ].join("\n")
    ).join("\n\n");

    const msg = [
      "HALLO, SAYA SUDAH MELAKUKAN KONFIRMASI PAYMENT",
      "",
      "TRANSAKSI SUKSES",
      "",
      `NO ORDER :`,
      orderId,
      `NAMA PEMESAN : ${nama.trim()}`,
      "",
      itemLines,
      "",
      "PAYMENT METODE :",
      method,
      "",
      "TERIMA KASIH.",
      "",
      `LINK BUKTI : ${buktiUrl || "(tidak tersedia)"}`,
    ].join("\n");

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

    setLoading(false);
    clearCart();
    onClose();
    setNama("");
    setBukti(null);
    setMethod("QRIS");

    window.location.assign(url);
    }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(4,4,16,0.92)", backdropFilter: "blur(10px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          data-testid="payment-popup-backdrop"
        >
          <motion.div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-violet-500/20 bg-[#0d0d1b] overflow-hidden"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            data-testid="payment-popup"
          >
            <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />

            {/* Mobile handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-4 flex items-start justify-between border-b border-white/5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-violet-400 font-bold mb-0.5">Pembayaran</p>
                <h2 className="text-base font-black text-white">Konfirmasi Order</h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all mt-0.5"
                data-testid="button-close-payment-popup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[72vh] overflow-y-auto">
              {/* Nama */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1.5">
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                  data-testid="input-nama-pemesan"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/45 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["QRIS", "TRANSFER"] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        method === m
                          ? "bg-violet-600/25 border-violet-500/60 text-violet-300"
                          : "bg-white/4 border-white/10 text-white/45 hover:border-white/20 hover:text-white/65"
                      }`}
                      data-testid={`button-method-${m.toLowerCase()}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* QRIS or Transfer info */}
              <AnimatePresence mode="wait">
                {method === "QRIS" ? (
                  <motion.div
                    key="qris"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex flex-col items-center"
                    data-testid="qris-section"
                  >
                    {/* QRIS placeholder */}
                    <div className="flex flex-col items-center">
                      <img
                        src="/qris.jpeg"
                        alt="QRIS ANDIKA STORE"
                        className="w-64 rounded-xl shadow-lg"
                      />

                      <p className="mt-4 text-xs font-bold text-white/70 uppercase tracking-widest">
                        Scan QRIS
                      </p>

                      <p className="text-[10px] text-white/40">
                        ANDIKATRD STORE
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="transfer"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="space-y-2"
                    data-testid="transfer-section"
                  >
                    {/* Bank */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Bank</p>
                    {BANK_ACCOUNTS.map(acc => (
                      <AccountRow key={acc.bank} acc={acc} copied={copied} onCopy={copyText} />
                    ))}

                    {/* E-Wallet */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-3 mb-1">E-Wallet</p>
                    {EWALLET_ACCOUNTS.map(acc => (
                      <AccountRow key={acc.bank} acc={acc} copied={copied} onCopy={copyText} />
                    ))}

                    <p className="text-[10px] text-white/30 text-center pt-2">
                      Total: <span className="text-violet-300 font-bold">{formatRp(grandTotal)}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload bukti */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1.5">
                  Bukti Pembayaran
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`w-full rounded-xl border border-dashed py-3.5 flex items-center justify-center gap-2 transition-all text-sm ${
                    bukti
                      ? "border-violet-500/50 bg-violet-500/8 text-violet-300"
                      : "border-white/15 bg-white/3 text-white/35 hover:border-white/25 hover:text-white/55"
                  }`}
                  data-testid="button-pilih-bukti"
                >
                  {bukti ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-semibold truncate max-w-[220px] text-sm">{bukti.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="font-medium">PILIH BUKTI</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                  data-testid="input-file-bukti"
                />
              </div>

              {error && <p className="text-xs text-pink-400 font-medium">{error}</p>}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-2">
              <button
                onClick={handleConfirm}
                disabled={loading || !bukti}
                className={`w-full h-12 rounded-xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                  bukti
                    ? "btn-primary text-white"
                    : "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
                }`}
                data-testid="button-konfirmasi-payment"
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
              {!bukti && (
                <p className="text-center text-[10px] text-white/20 mt-2">
                  Upload bukti pembayaran untuk mengaktifkan tombol
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

