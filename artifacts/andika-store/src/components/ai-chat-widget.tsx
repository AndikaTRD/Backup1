import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, PointerEvent } from "react";
import { Send, Sparkles, X, LoaderCircle } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "Berapa harga member?",
  "Bagaimana cara memesan?",
  "Bagaimana cek pesanan?",
];


function DAUHeadIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Kepala robot DAU AI"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="dau-shell" x1="8" y1="6" x2="55" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.58" stopColor="#E9E5FF" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id="dau-visor" x1="13" y1="20" x2="51" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#21103F" />
          <stop offset="1" stopColor="#080516" />
        </linearGradient>
        <linearGradient id="dau-glow" x1="19" y1="27" x2="47" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E9D5FF" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path d="M31.5 7V4.8a4.5 4.5 0 1 1 4.5 4.5h-1" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="32" cy="5" r="3.2" fill="#C084FC" stroke="#7C3AED" strokeWidth="1.5"/>
      <path d="M8 25a7 7 0 0 1 7-7h34a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H15a7 7 0 0 1-7-7V25Z" fill="url(#dau-shell)" stroke="#5B21B6" strokeWidth="2.5"/>
      <rect x="3.5" y="27" width="7" height="14" rx="3.5" fill="#C4B5FD" stroke="#6D28D9" strokeWidth="2"/>
      <rect x="53.5" y="27" width="7" height="14" rx="3.5" fill="#C4B5FD" stroke="#6D28D9" strokeWidth="2"/>
      <path d="M14 27.5a5.5 5.5 0 0 1 5.5-5.5h25a5.5 5.5 0 0 1 5.5 5.5v13a5.5 5.5 0 0 1-5.5 5.5h-25a5.5 5.5 0 0 1-5.5-5.5v-13Z" fill="url(#dau-visor)" stroke="#8B5CF6" strokeWidth="2"/>
      <path d="M21 32.5c2.2-3.4 5.3-3.4 7.5 0" stroke="url(#dau-glow)" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M35.5 32.5c2.2-3.4 5.3-3.4 7.5 0" stroke="url(#dau-glow)" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M26 38.5c3.8 4.3 8.2 4.3 12 0" stroke="#C084FC" strokeWidth="3" strokeLinecap="round"/>
      <path d="M20 16.5c3.5-3.4 7.5-4.8 12-4.8s8.5 1.4 12 4.8" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M25 52h14" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round"/>
      <path d="M29 55.5h6" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

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

  // Keep the expanded label fully inside the viewport when the button is near an edge.
  useEffect(() => {
    if (!labelVisible || open) return;
    const frame = window.requestAnimationFrame(() => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const minX = 8 - (rect.left - positionRef.current.x);
      const maxX = window.innerWidth - 8 - rect.right + positionRef.current.x;
      const safeX = Math.min(maxX, Math.max(minX, positionRef.current.x));
      if (safeX !== positionRef.current.x) {
        const next = { x: safeX, y: positionRef.current.y };
        positionRef.current = next;
        setPosition(next);
        button.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [labelVisible, open]);

  // Automatically collapse the "Tanya DAU" label back to the robot icon when idle.
  useEffect(() => {
    if (!labelVisible || open) return;
    const timeout = window.setTimeout(() => setLabelVisible(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [labelVisible, open]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // Send the recent conversation to our backend. The API key stays server-side.
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-8) }),
      });

      const data = await response.json().catch(() => ({})) as { reply?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Maaf, DAU AI belum bisa menjawab saat ini. Coba lagi sebentar ya.");
      }

      const reply = typeof data.reply === "string" && data.reply.trim()
        ? data.reply.trim()
        : "Maaf, aku belum menerima jawaban. Coba lagi sebentar ya.";
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Koneksi DAU AI sedang bermasalah. Coba lagi sebentar ya.";
      setMessages((current) => [...current, { role: "assistant", content: errorMessage }]);
    } finally {
      setLoading(false);
    }
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
                <DAUHeadIcon className="h-8 w-8" />
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
        {open ? <X className="h-5 w-5" /> : <DAUHeadIcon className="h-8 w-8" />}
        {(labelVisible || open) && (
          <span className="text-xs font-bold">{open ? "Tutup chat" : "Tanya DAU"}</span>
        )}
      </button>
      )}
    </div>
  );
}
