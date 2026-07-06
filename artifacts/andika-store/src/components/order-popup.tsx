import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";

interface OrderPopupProps {
  open: boolean;
  onClose: () => void;
}

const PRICE_REGULAR = 6500;
const PRICE_BULK = 6000;
const BULK_MIN = 10;

function formatRp(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

export function OrderPopup({ open, onClose }: OrderPopupProps) {
  const [qty, setQty] = useState<string>("");
  const [kode, setKode] = useState("");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addItem } = useCart();
  const [, setLocation] = useLocation();

  const qtyNum = parseInt(qty, 10) || 0;
  const unitPrice = qtyNum >= BULK_MIN ? PRICE_BULK : PRICE_REGULAR;
  const total = qtyNum > 0 ? unitPrice * qtyNum : 0;
  const hasCalc = qtyNum >= 1 && kode.trim() && pin.trim();

  function validate() {
    const e: Record<string, string> = {};
    if (!qty || qtyNum < 1) e.qty = "Jumlah member minimal 1.";
    if (!kode.trim()) e.kode = "Kode toko wajib diisi.";
    if (!pin.trim()) e.pin = "PIN / Tanggal lahir wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAddToCart() {
    if (!validate()) return;
    addItem({
      productName: "NEW MEMBER FRESH",
      kode: kode.trim().toUpperCase(),
      pin: pin.trim(),
      qty: qtyNum,
      unitPrice,
      total,
    });
    onClose();
    setQty("");
    setKode("");
    setPin("");
    setErrors({});
    setLocation("/cart");
  }

  function handleClose() {
    onClose();
    setErrors({});
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(4,4,16,0.90)", backdropFilter: "blur(10px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          data-testid="order-popup-backdrop"
        >
          <motion.div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-violet-500/20 bg-[#0d0d1b] overflow-hidden"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            data-testid="order-popup"
          >
            {/* Top bar */}
            <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />

            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-4 flex items-start justify-between border-b border-white/5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-violet-400 font-bold mb-0.5">
                  Order Produk
                </p>
                <h2 className="text-base font-black text-white">NEW MEMBER FRESH</h2>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all mt-0.5"
                data-testid="button-close-order-popup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
              {/* Jumlah Member */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1.5">
                  Jumlah Member
                </label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
                  placeholder="Contoh: 12"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                  data-testid="input-qty"
                />
                {errors.qty && <p className="text-xs text-pink-400 mt-1">{errors.qty}</p>}
              </div>

              {/* Kode Toko */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1.5">
                  Kode Toko
                </label>
                <input
                  type="text"
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  placeholder="Contoh: 1AN3"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all tracking-widest font-mono"
                  data-testid="input-kode"
                />
                {errors.kode && <p className="text-xs text-pink-400 mt-1">{errors.kode}</p>}
              </div>

              {/* PIN */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1.5">
                  PIN / Tanggal Lahir
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    // Cap at 8 digits max
                    if (val.length > 8) val = val.slice(0, 8);
                    // Auto-convert 8-digit DDMMYYYY → 6-digit DDMMYY
                    if (val.length === 8) {
                      val = val.slice(0, 4) + val.slice(6, 8);
                    }
                    // Jangan izinkan 7 digit — potong ke 6
                    if (val.length > 6) val = val.slice(0, 6);
                    setPin(val);
                  }}
                  placeholder="Contoh: 041275"
                  maxLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all font-mono tracking-widest"
                  data-testid="input-pin"
                />
                {pin.length > 0 && pin.length < 6 && (
                  <p className="text-[10px] text-white/30 mt-1">{6 - pin.length} digit lagi</p>
                )}
                {pin.length === 6 && (
                  <p className="text-[10px] text-violet-400 mt-1 font-semibold">PIN: {pin}</p>
                )}
                {errors.pin && <p className="text-xs text-pink-400 mt-1">{errors.pin}</p>}
              </div>

              {/* Summary */}
              <AnimatePresence>
                {hasCalc && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-violet-500/8 border border-violet-500/20 overflow-hidden"
                  >
                    <div className="px-4 py-3.5 space-y-2">
                      <p className="text-xs font-black text-white tracking-widest mb-3">
                        AKTIVASI#{kode.trim().toUpperCase()}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <span className="text-white/40 font-medium">PIN / TGL LAHIR</span>
                        <span className="text-white font-bold text-right font-mono">{pin}</span>
                        <span className="text-white/40 font-medium">JUMLAH MEMBER</span>
                        <span className="text-white font-bold text-right">{qtyNum}</span>
                        <span className="text-white/40 font-medium">HARGA/MEMBER</span>
                        <span className="text-white font-bold text-right">{formatRp(unitPrice)}</span>
                        {qtyNum >= BULK_MIN && (
                          <>
                            <span className="col-span-2 text-[10px] text-violet-400 font-semibold -mt-0.5">
                              ✓ Harga bulk aktif (≥10 member)
                            </span>
                          </>
                        )}
                      </div>
                      <div className="h-px bg-white/8 my-1" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/50 font-semibold">TOTAL</span>
                        <span className="text-base font-black text-violet-300">{formatRp(total)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-2">
              <button
                onClick={handleAddToCart}
                className="w-full h-12 rounded-xl btn-primary text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2"
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="w-4 h-4" />
                Tambah ke Keranjang
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
