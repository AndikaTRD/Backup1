import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, PointerEvent } from "react";
import { Bot, Send, Sparkles, X, LoaderCircle } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "Berapa harga member?",
  "Bagaimana cara memesan?",
  "Bagaimana cek pesanan?",
];

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Halo! 👋 Aku DAU AI, asisten ANDIKA STORE. Mau tanya harga, cara pesan, atau informasi pesanan? Aku siap bantu.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function getAutoReply(rawText: string): string {
    const text = rawText.toLocaleLowerCase("id-ID").replace(/[!?.,]/g, " ").replace(/\s+/g, " ").trim();

    const has = (...keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

    if (has("halo", "hai", "hallo", "hello", "assalamualaikum", "selamat pagi", "selamat siang", "selamat sore", "selamat malam")) {
      return "Halo! 👋 Aku DAU, asisten ANDIKA STORE. Aku bisa bantu menjelaskan harga member, cara memesan, pembayaran, dan cara mengecek pesanan. Mau tanya apa?";
    }

    if (has("harga", "berapa", "tarif", "biaya", "price", "murah")) {
      return "Harga NEW MEMBER FRESH di ANDIKA STORE:\n• 1–9 member: Rp6.500 per member.\n• 10 member atau lebih: Rp6.000 per member.\n\nContoh: 10 member = Rp60.000. Untuk memesan, tekan BELI SEKARANG lalu ikuti petunjuk di website.";
    }

    if (has("pesan", "order", "beli", "pemesanan", "checkout", "keranjang", "cara membeli", "cara order")) {
      return "Cara memesan di ANDIKA STORE:\n1. Pilih produk NEW MEMBER FRESH dan tekan BELI SEKARANG/tambahkan ke keranjang.\n2. Isi data yang diminta pada formulir website.\n3. Periksa kembali pesanan, lalu lanjutkan checkout.\n4. Ikuti instruksi pembayaran yang tampil di website.\n\nJangan kirim PIN atau data rahasia lewat chat.";
    }

    if (has("status", "cek pesanan", "lacak", "tracking", "pesanan saya", "order id", "nomor pesanan", "sudah bayar", "pembayaran saya")) {
      return "Untuk mengecek pesanan, buka bagian pesanan di website dan gunakan informasi atau ID pesanan yang ditampilkan. Aku tidak bisa melihat status pesanan pribadi dari chat ini, jadi jangan menganggap pesanan sudah diproses sebelum ada konfirmasi di website.";
    }

    if (has("bayar", "pembayaran", "qris", "transfer", "rekening", "metode pembayaran")) {
      return "Silakan ikuti metode dan instruksi pembayaran yang ditampilkan saat checkout di ANDIKA STORE. Metode yang tersedia dapat mengikuti informasi di halaman checkout. Jangan mengirim data rekening atau bukti rahasia melalui chat ini.";
    }

    if (has("pin", "otp", "kata sandi", "password", "tanggal lahir", "data pribadi", "privasi")) {
      return "Demi keamanan, jangan kirim PIN, OTP, kata sandi, tanggal lahir, atau data rahasia melalui chat. Jika formulir pemesanan resmi meminta data tertentu, masukkan hanya di formulir tersebut dan pastikan kamu berada di website ANDIKA STORE yang benar.";
    }

    if (has("admin", "whatsapp", "wa", "hubungi", "kontak", "bantuan", "komplain", "keluhan", "email", "cs", "customer service", "kontak admin", "bicara dengan orang")) {
      return "Perlu bantuan lebih lanjut dari admin ANDIKA STORE? 😊\n\nWhatsApp: https://wa.me/62895328068023\nEmail: mailto:andikaotakunimerz@gmail.com\n\nSilakan jelaskan kebutuhanmu kepada admin. Demi keamanan, jangan kirim PIN, OTP, kata sandi, atau data rahasia.";
    }

    if (has("produk", "jual", "menyediakan", "layanan", "member fresh", "new member")) {
      return "Produk yang informasinya tersedia untukku saat ini adalah NEW MEMBER FRESH. Harganya Rp6.500 per member untuk 1–9 member, atau Rp6.000 per member untuk pembelian 10 member atau lebih. Untuk informasi produk terbaru, periksa katalog di website.";
    }

    if (has("jam operasional", "buka jam", "jam buka", "operasional")) {
      return "Untuk jam layanan dan ketersediaan admin terbaru, silakan hubungi admin melalui WhatsApp.\n\nWhatsApp: https://wa.me/62895328068023";
    }

    if (has("diskon", "promo", "voucher", "potongan")) {
      return "Harga yang tersedia saat ini:\n• 1–9 member: Rp6.500/member.\n• Minimal 10 member: Rp6.000/member.\n\nJika ada promo khusus, konfirmasikan langsung kepada admin melalui WhatsApp: https://wa.me/62895328068023";
    }

    if (has("komplain", "keluhan", "masalah", "gagal", "error", "kendala")) {
      return "Maaf kalau kamu mengalami kendala. 😊 Supaya bisa diperiksa langsung, silakan hubungi admin ANDIKA STORE melalui WhatsApp: https://wa.me/62895328068023. Sertakan nomor pesanan jika ada, tetapi jangan kirim PIN, OTP, atau kata sandi.";
    }

    if (has("selesai", "berapa lama", "lama proses", "kapan diproses", "estimasi")) {
      return "Waktu penyelesaian dapat bergantung pada pemeriksaan pesanan. Aku tidak akan menebak estimasi. Untuk kepastian proses pesananmu, silakan konfirmasi langsung kepada admin melalui WhatsApp: https://wa.me/62895328068023.";
    }

    if (has("terima kasih", "makasih", "thanks", "thank you")) {
      return "Sama-sama! 😊 Senang bisa membantu. Kalau ada pertanyaan tentang harga, pemesanan, pembayaran, atau pengecekan pesanan, tanyakan saja.";
    }

    return "Maaf, aku belum menemukan jawaban yang cocok untuk pertanyaan itu. 😊 Aku bisa bantu tentang harga member, cara memesan, pembayaran, dan pengecekan pesanan.\n\nKalau perlu bantuan lebih lanjut, hubungi admin ANDIKA STORE:\nWhatsApp: https://wa.me/62895328068023\nEmail: mailto:andikaotakunimerz@gmail.com";
  }

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || loading) return;

    setMessages((current) => [...current, { role: "user", content }]);
    setInput("");
    setLoading(true);

    // Local FAQ replies: no external AI API, API key, or paid credits required.
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const reply = getAutoReply(content);
    setMessages((current) => [...current, { role: "assistant", content: reply }]);
    setLoading(false);
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const current = positionRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const button = buttonRef.current;
    if (!drag || !button || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    suppressClickRef.current = true;

    const rect = button.getBoundingClientRect();
    const minX = 8 - (rect.left - positionRef.current.x);
    const maxX = window.innerWidth - 8 - rect.right + positionRef.current.x;
    const minY = 8 - (rect.top - positionRef.current.y);
    const maxY = window.innerHeight - 8 - rect.bottom + positionRef.current.y;
    const x = Math.min(maxX, Math.max(minX, drag.originX + dx));
    const y = Math.min(maxY, Math.max(minY, drag.originY + dy));

    // Update only the compositor transform while dragging; avoid React renders per pointer event.
    positionRef.current = { x, y };
    button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function endDrag(event?: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || (event && drag.pointerId !== event.pointerId)) return;
    dragRef.current = null;
    if (drag.moved) {
      const button = buttonRef.current;
      if (!button) return;

      // Snap to the nearest screen edge and keep the user's chosen vertical position.
      const rect = button.getBoundingClientRect();
      const goLeft = rect.left + rect.width / 2 < window.innerWidth / 2;
      const targetLeft = goLeft ? 8 : window.innerWidth - rect.width - 8;
      const targetX = positionRef.current.x + targetLeft - rect.left;
      const targetY = Math.min(
        Math.max(positionRef.current.y, 8 - (rect.top - positionRef.current.y)),
        window.innerHeight - rect.height - 8 - (rect.top - positionRef.current.y),
      );
      const start = { ...positionRef.current };
      const targetTransform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      const overshootX = targetX + (goLeft ? -10 : 10);

      // Animate a small overshoot, then settle against the screen edge.
      if (typeof button.animate === "function") {
        const animation = button.animate(
          [
            { transform: `translate3d(${start.x}px, ${start.y}px, 0) scale(1)` },
            { transform: `translate3d(${overshootX}px, ${targetY}px, 0) scale(1.04)`, offset: 0.72 },
            { transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(0.98)`, offset: 0.88 },
            { transform: `${targetTransform} scale(1)` },
          ],
          { duration: 460, easing: "cubic-bezier(0.22, 1.25, 0.36, 1)", fill: "none" },
        );
        animation.onfinish = () => {
          positionRef.current = { x: targetX, y: targetY };
          setPosition({ x: targetX, y: targetY });
          button.style.transform = targetTransform;
        };
      } else {
        positionRef.current = { x: targetX, y: targetY };
        setPosition({ x: targetX, y: targetY });
        button.style.transform = targetTransform;
      }
    }
  }

  function handleButtonClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (open) {
      setOpen(false);
      return;
    }
    if (!labelVisible) {
      setLabelVisible(true);
      return;
    }
    setOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-[100] sm:bottom-6 sm:right-6">
      {open && (
        <section
          className="mb-2 flex h-[min(500px,calc(100dvh-125px))] w-[min(320px,calc(100vw-40px))] flex-col overflow-hidden rounded-3xl border border-violet-300/20 bg-[#0c0916] shadow-[0_24px_80px_rgba(0,0,0,.65),0_0_35px_rgba(124,58,237,.18)]"
          aria-label="Chat DAU AI"
        >
          <header className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-violet-700 to-fuchsia-700 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">DAU AI</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-violet-100/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Asisten ANDIKA STORE
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); setLabelVisible(false); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
              aria-label="Tutup chat"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-violet-300/10 bg-violet-500/[0.07] p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
              <p className="text-[11px] leading-relaxed text-white/55">
                Jangan kirim PIN, OTP, kata sandi, atau data rahasia melalui chat.
              </p>
            </div>

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-md bg-violet-600 text-white"
                      : "rounded-bl-md border border-white/[0.07] bg-white/[0.055] text-white/85"
                  }`}
                >
                  {message.content.split(/(https:\/\/wa\.me\/\d+|mailto:[^\s]+)/g).map((part, partIndex) => {
                    if (part.startsWith("https://wa.me/")) {
                      return <a key={partIndex} href={part} target="_blank" rel="noreferrer" className="font-semibold text-violet-300 underline underline-offset-2 hover:text-violet-200">Chat WhatsApp admin</a>;
                    }
                    if (part.startsWith("mailto:")) {
                      return <a key={partIndex} href={part} className="font-semibold text-violet-300 underline underline-offset-2 hover:text-violet-200">Kirim email ke admin</a>;
                    }
                    return part;
                  })}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    disabled={loading}
                    className="rounded-full border border-violet-300/20 bg-violet-500/[0.08] px-3 py-2 text-left text-[11px] font-medium text-violet-200 transition hover:border-violet-300/40 hover:bg-violet-500/15 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.055] px-3.5 py-2.5 text-xs text-white/60">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-violet-300" />
                  DAU AI sedang mengetik...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-1.5 focus-within:border-violet-400/50">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1000}
                placeholder="Tulis pertanyaan..."
                aria-label="Pesan untuk DAU AI"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Kirim pesan"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/30">Jawaban AI bisa keliru. Periksa instruksi resmi di website.</p>
          </form>
        </section>
      )}

      {!open && (
      <button
        type="button"
        ref={buttonRef}
        onClick={handleButtonClick}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)`, touchAction: "none", willChange: "transform" }}
        className="ml-auto flex h-12 items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 text-white shadow-[0_10px_35px_rgba(109,40,217,.45)] transition-colors transition-shadow hover:shadow-[0_14px_40px_rgba(109,40,217,.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        aria-label={open ? "Tutup DAU AI" : "Chat dengan DAU AI"}
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        {(labelVisible || open) && (
          <span className="text-xs font-bold">{open ? "Tutup chat" : "Tanya DAU"}</span>
        )}
      </button>
      )}
    </div>
  );
}
