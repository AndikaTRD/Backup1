import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LockKeyhole, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";

const PRICE = 25_000;

function formatRp(value: number) {
  return "Rp" + value.toLocaleString("id-ID");
}

export function AbsensiOrderPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [checking, setChecking] = useState(false);

  async function handleBuy() {
    setChecking(true);
    const response = await fetch("/api/customer/me", { credentials: "include" });
    const data = (await response.json()) as { authenticated?: boolean };
    if (!data.authenticated) {
      onClose();
      setLocation("/product-saya");
      return;
    }
    addItem({
      productName: "ABSENSI TOKO",
      kode: "ABSENSI",
      pin: "-",
      qty: 1,
      unitPrice: PRICE,
      total: PRICE,
    });
    onClose();
    setLocation("/cart");
    setChecking(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-[#040410]/90 p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-violet-500/20 bg-[#0d0d1b] overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div><p className="text-[10px] uppercase tracking-widest text-violet-400 font-bold">Produk Digital</p><h2 className="text-xl font-black text-white mt-1">ABSENSI TOKO</h2></div>
                <button onClick={onClose} className="text-white/35 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mt-5">Akses aplikasi absensi karyawan untuk satu toko. Tidak ada file yang dikirim; akses aktif setelah order dikonfirmasi.</p>
              <div className="space-y-2 mt-5">
                {["Kalender absensi bulanan", "Kelola personil dan jabatan", "Atur status dan shift per tanggal"].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-xs text-white/65"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" />{feature}</div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-white/8 mt-6 pt-4"><span className="text-sm text-white/45">Harga sekali bayar</span><span className="text-xl font-black text-violet-300">{formatRp(PRICE)}</span></div>
              <button onClick={() => void handleBuy()} disabled={checking} className="w-full h-12 mt-5 rounded-xl btn-primary text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
                {checking ? "Memeriksa akun..." : <><LockKeyhole className="w-4 h-4" /> Beli ABSENSI TOKO</>}
              </button>
              <p className="text-[10px] text-center text-white/25 mt-3">Login customer diperlukan untuk mengikat produk ke akunmu.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}