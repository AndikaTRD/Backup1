import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productName: string;
  kode: string;
  pin: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((s) => ({
          items: [
            ...s.items,
            { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
          ],
        })),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "andika-cart" }
  )
);
