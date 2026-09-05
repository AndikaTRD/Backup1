import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";

type Role = "COS" | "ACOS" | "Crew";
type Personnel = { id: number; name: string; role: string; sortOrder: number };
type Entry = {
  personnelId: number;
  attendanceDate: string;
  status: string;
  shift: string;
};
type StoreData = { id: number; storeName: string };

const STATUSES = [
  ["P", "Pagi"],
  ["S", "Siang"],
  ["M", "Malam"],
  ["O", "Off"],
  ["SO", "Stock Opname"],
  ["AO", "Add Off"],
  ["Cuti", "Cuti"],
  ["Izin", "Izin"],
] as const;
const ROLE_RANK: Record<string, number> = { COS: 0, ACOS: 1, Crew: 2 };

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function daysIn(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

function dateKey(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function weekdayLabel(month: string, day: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, day)
    .toLocaleDateString("id-ID", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}

function entryCode(entry?: Entry) {
  if (!entry) return "—";
  const status = entry.status.toUpperCase();
  if (status === "P" || status === "S" || status === "M") return entry.shift || status;
  if (status === "CUTI") return "Cuti";
  if (status === "IZIN") return "Izin";
  if (["O", "SO", "AO"].includes(status)) return status;
  return "—";
}

function codeClass(code: string) {
  if (code === "SO") return "text-amber-200";
  if (code.startsWith("P")) return "text-violet-200";
  if (code.startsWith("S")) return "text-sky-200";
  if (code.startsWith("M")) return "text-indigo-200";
  if (code === "O") return "text-slate-200";
  if (code === "AO") return "text-cyan-200";
  if (code === "Cuti") return "text-emerald-200";
  if (code === "Izin") return "text-rose-200";
  return "text-white/20";
}

export default function FullAbsensi() {
  const [, setLocation] = useLocation();
  const initialMonth = useMemo(
    () => new URLSearchParams(window.location.search).get("month") ?? currentMonth(),
    [],
  );
  const [month, setMonth] = useState(initialMonth);
  const [store, setStore] = useState<StoreData | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareState, setShareState] = useState("");

  const days = useMemo(
    () => Array.from({ length: daysIn(month) }, (_, index) => index + 1),
    [month],
  );
  const orderedPersonnel = useMemo(
    () =>
      [...personnel].sort(
        (a, b) =>
          (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99) ||
          a.name.localeCompare(b.name, "id") ||
          a.id - b.id,
      ),
    [personnel],
  );

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/absensi/store?month=${month}`, {
      credentials: "include",
    });
    if (response.status === 401) {
      setLocation("/product-saya");
      return;
    }
    const data = (await response.json()) as {
      error?: string;
      store?: StoreData;
      personnel?: Personnel[];
      entries?: Entry[];
    };
    if (!response.ok) {
      setError(data.error ?? "ABSENSI TOKO belum aktif untuk akun ini.");
      setLoading(false);
      return;
    }
    setStore(data.store ?? null);
    setPersonnel(data.personnel ?? []);
    setEntries(data.entries ?? []);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [month]);

  function findEntry(personnelId: number, day: number) {
    return entries.find(
      (entry) =>
        entry.personnelId === personnelId &&
        entry.attendanceDate === dateKey(month, day),
    );
  }

  function moveMonth(offset: number) {
    const [year, monthNumber] = month.split("-").map(Number);
    const next = new Date(year, monthNumber - 1 + offset, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    setMonth(nextMonth);
    window.history.replaceState(null, "", `/absensi/full?month=${nextMonth}`);
  }

  async function shareFullAbsensi() {
    const shareData = {
      title: `${store?.storeName || "Toko"} · ABSENSI TOKO`,
      text: `${store?.storeName || "Toko"} — ABSENSI TOKO — ${monthLabel(month)}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareState("Tampilan siap dibagikan");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareState("Link tersalin");
      }
    } catch {
      setShareState("");
    }
    window.setTimeout(() => setShareState(""), 2200);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080812] flex items-center justify-center text-sm text-white/45">
        Memuat absensi...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#080812] px-4 py-8 text-white">
        <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-[#111020] p-6">
          <p className="text-sm text-rose-200">{error}</p>
          <Link href="/product-saya" className="inline-block mt-4 text-xs font-bold text-violet-200 underline">
            ← Kembali
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080812] text-white">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-black tracking-[0.3em] text-violet-300 uppercase">
              ANDIKA STORE
            </p>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mt-2">
              ABSENSI TOKO
            </h1>
            <p className="text-sm sm:text-base text-white/55 mt-1">
              {store?.storeName || "Nama toko belum diatur"}
            </p>
            <p className="text-sm font-bold capitalize text-violet-200 mt-3">
              {monthLabel(month)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/absensi"
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 flex items-center text-xs font-bold text-white/75 hover:bg-white/10"
            >
              ← Kembali
            </Link>
            <button
              onClick={() => void shareFullAbsensi()}
              className="h-10 rounded-xl bg-violet-600 px-3 flex items-center gap-2 text-xs font-bold text-white hover:bg-violet-500"
            >
              <Share2 className="w-3.5 h-3.5" /> Bagikan
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => moveMonth(-1)}
              className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/60"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-[145px] text-center text-sm font-bold capitalize">
              {monthLabel(month)}
            </span>
            <button
              onClick={() => moveMonth(1)}
              className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/60"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                window.history.replaceState(null, "", `/absensi/full?month=${event.target.value}`);
              }}
              className="h-9 w-[135px] rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white"
              aria-label="Pilih bulan"
            />
          </div>
          {shareState && <span className="text-xs font-bold text-emerald-300">{shareState}</span>}
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/12 bg-[#0d0d18]">
          <table className="border-collapse min-w-max text-sm">
            <thead>
              <tr className="border-b border-white/12">
                <th className="sticky left-0 z-20 min-w-[190px] bg-[#0d0d18] px-4 py-3 text-left text-[10px] uppercase tracking-widest text-white/50">
                  Personil
                </th>
                {days.map((day) => (
                  <th key={day} className="w-[72px] px-1 py-2 text-center">
                    <span className="block text-[9px] font-bold text-violet-300/80">
                      {weekdayLabel(month, day)}
                    </span>
                    <span className="block text-sm font-black text-white/85 mt-1">{day}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedPersonnel.map((person) => (
                <tr key={person.id} className="border-b border-white/8 last:border-0">
                  <td className="sticky left-0 z-10 min-w-[190px] bg-[#0d0d18] px-4 py-3">
                    <p className="font-bold text-white">{person.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-violet-300/65 mt-1">
                      {person.role}
                    </p>
                  </td>
                  {days.map((day) => {
                    const code = entryCode(findEntry(person.id, day));
                    return (
                      <td key={day} className="w-[72px] px-1 py-3 text-center">
                        <span className={`font-black ${codeClass(code)}`}>{code}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {orderedPersonnel.length === 0 && (
                <tr>
                  <td colSpan={days.length + 1} className="px-4 py-12 text-center text-sm text-white/40">
                    Belum ada personil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 text-[11px] text-white/55">
          <span className="font-bold text-white/75">Keterangan:</span>
          {STATUSES.map(([code, label]) => (
            <span key={code}>
              <b className={codeClass(code)}>{code}</b> {label}
            </span>
          ))}
        </footer>
      </div>
    </main>
  );
}