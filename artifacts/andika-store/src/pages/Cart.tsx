import { useState } from "react";
import { Layout } from "@/components/layout";
import { PaymentPopup } from "@/components/payment-popup";
import { useCart } from "@/hooks/use-cart";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "wouter";

function formatRp(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

export default function Cart() {
  const { items, removeItem } = useCart();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const grandTotal = items.reduce((s, i) => s + i.total, 0);
  const isEmpty = items.length === 0;

  return (
    <Layout>
      <PaymentPopup open={paymentOpen} onClose={() => setPaymentOpen(false)} />

      <div className="max-w-md mx-auto w-full px-4 py-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors mb-6"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali belanja
        </Link>

        <div className="flex items-center gap-2 mb-5">
          <ShoppingCart className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-black text-white">Keranjang</h1>
          {!isEmpty && (
            <span className="ml-auto text-xs text-white/35">{items.length} item</span>
          )}
        </div>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/6 bg-[#0c0c1a] p-10 flex flex-col items-center text-center"
            data-testid="cart-empty"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6 text-violet-500/50" />
            </div>
            <p className="text-sm font-semibold text-white/40">Keranjang masih kosong</p>
            <p className="text-xs text-white/20 mt-1">Tambahkan produk untuk memulai</p>
            <Link
              href="/"
              className="mt-5 px-5 py-2 rounded-xl btn-primary text-white text-xs font-bold uppercase tracking-wider inline-block"
              data-testid="link-shop-now"
            >
              Belanja Sekarang
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Items */}
            <div className="space-y-3 mb-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-violet-500/15 bg-[#0c0c1a] overflow-hidden"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className="h-0.5 bg-gradient-to-r from-violet-600/60 to-pink-500/60" />
                    <div className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-sm font-black text-white">{item.productName}</p>
                          <p className="text-[10px] font-bold text-violet-400 tracking-widest mt-0.5 font-mono">
                            AKTIVASI#{item.kode}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/25 hover:text-pink-400 hover:bg-pink-500/10 transition-all shrink-0"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-white/4 px-2.5 py-2 text-center">
                          <p className="text-white/35 text-[9px] uppercase tracking-wider mb-0.5">Qty</p>
                          <p className="text-white font-bold">{item.qty}</p>
                        </div>
                        <div className="rounded-lg bg-white/4 px-2.5 py-2 text-center">
                          <p className="text-white/35 text-[9px] uppercase tracking-wider mb-0.5">Harga</p>
                          <p className="text-white font-bold">{formatRp(item.unitPrice)}</p>
                        </div>
                        <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-2 text-center">
                          <p className="text-violet-400/70 text-[9px] uppercase tracking-wider mb-0.5">Total</p>
                          <p className="text-violet-300 font-black">{formatRp(item.total)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Grand total */}
            <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3.5 flex items-center justify-between mb-4">
              <span className="text-sm text-white/50 font-semibold">Grand Total</span>
              <span className="text-xl font-black text-violet-300">{formatRp(grandTotal)}</span>
            </div>

            {/* Checkout */}
            <button
              onClick={() => setPaymentOpen(true)}
              className="w-full h-12 rounded-xl btn-primary text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2"
              data-testid="button-checkout"
            >
              <CreditCard className="w-4 h-4" />
              Checkout
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
