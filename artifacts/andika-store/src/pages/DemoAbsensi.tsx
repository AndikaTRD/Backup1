import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  Smartphone,
  X,
} from "lucide-react";

type DemoEntry = {
  type: "P" | "S" | "M" | "O" | "AO" | "SO" | "CUTI" | "IZIN";
  code: string;
};

type DemoState = {
  storeName: string;
  personnelName: string;
  personnelRole: "COS" | "ACOS" | "Crew";
  entries: Record<string, DemoEntry>;
};

const STORAGE_KEY = "andika-demo-absensi-v3";
const INITIAL_STATE: DemoState = {
  storeName: "Toko Contoh",
  personnelName: "Personil 1",
  personnelRole: "Crew",
  entries: {},
};

const ATTENDANCE_OPTIONS = [
  { type: "P", label: "P", description: "Shift Pagi", color: "violet" },
  { type: "S", label: "S", description: "Shift Siang", color: "blue" },
  { type: "M", label: "M", description: "Shift Malam", color: "indigo" },
  { type: "O", label: "O", description: "Off / Libur", color: "slate" },
  { type: "AO", label: "AO", description: "Add Off", color: "cyan" },
  { type: "SO", label: "SO", description: "Stock Opname", color: "amber" },
  { type: "CUTI", label: "Cuti", description: "Cuti", color: "emerald" },
  { type: "IZIN", label: "Izin", description: "Izin", color: "rose" },
] as const;

const DETAIL_OPTIONS = {
  P: ["P6", "P7", "P8", "P9", "P10", "P11", "P12"],
  S: ["S13", "S14", "S15", "S16", "S17", "S18"],
  M: ["M19", "M20", "M21", "M22", "M23"],
} as const;

const POSITION_OPTIONS = ["COS", "ACOS", "Crew"] as const;

function loadDemoState(): DemoState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_STATE;
    const parsed = JSON.parse(saved) as Partial<DemoState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      entries: parsed.entries ?? {},
    };
  } catch {
    return INITIAL_STATE;
  }
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function daysInMonth(month: string) {
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
  return new Date(year, monthNumber - 1, day).toLocaleDateString("id-ID", {
    weekday: "short",
  }).replace(".", "").toUpperCase();
}

export default function DemoAbsensi() {
  const [month, setMonth] = useState(currentMonth);
  const [demo, setDemo] = useState<DemoState>(loadDemoState);
  const [editingStore, setEditingStore] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [detailType, setDetailType] = useState<"P" | "S" | "M" | null>(null);

  const days = useMemo(
    () => Array.from({ length: daysInMonth(month) }, (_, index) => index + 1),
    [month],
  );

  const monthlyEntries = useMemo(
    () =>
      days
        .map((day) => demo.entries[dateKey(month, day)])
        .filter((entry): entry is DemoEntry => Boolean(entry)),
    [days, demo.entries, month],
  );

  const recap = useMemo(
    () => ({
      P: monthlyEntries.filter((entry) => entry.type === "P").length,
      S: monthlyEntries.filter((entry) => entry.type === "S").length,
      M: monthlyEntries.filter((entry) => entry.type === "M").length,
      O: monthlyEntries.filter((entry) => entry.type === "O").length,
      AO: monthlyEntries.filter((entry) => entry.type === "AO").length,
      SO: monthlyEntries.filter((entry) => entry.type === "SO").length,
      CUTI: monthlyEntries.filter((entry) => entry.type === "CUTI").length,
      IZIN: monthlyEntries.filter((entry) => entry.type === "IZIN").length,
    }),
    [monthlyEntries],
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  }, [demo]);

  function updateDemo(partial: Partial<DemoState>) {
    setDemo((current) => ({ ...current, ...partial }));
  }

  function saveEntry(entry: DemoEntry | null) {
    if (activeDay === null) return;
    const key = dateKey(month, activeDay);
    setDemo((current) => {
      const entries = { ...current.entries };
      if (entry) entries[key] = entry;
      else delete entries[key];
      return { ...current, entries };
    });
    setActiveDay(null);
    setDetailType(null);
  }

  function chooseType(type: DemoEntry["type"]) {
    if (type === "P" || type === "S" || type === "M") {
      setDetailType(type);
      return;
    }
    saveEntry({
      type,
      code: type === "CUTI" ? "Cuti" : type === "IZIN" ? "Izin" : type,
    });
  }

  function moveMonth(offset: number) {
    const [year, monthNumber] = month.split("-").map(Number);
    const next = new Date(year, monthNumber - 1 + offset, 1);
    setMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  function resetDemo() {
    if (window.confirm("Reset semua perubahan demo ke data awal?")) {
      setDemo(INITIAL_STATE);
      setMonth(currentMonth());
    }
  }

  function savePersonnel(event: FormEvent) {
    event.preventDefault();
    if (demo.personnelName.trim()) setEditingPersonnel(false);
  }

  return (
    <Layout>
      <main className="w-full max-w-6xl mx-auto px-4 py-7">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 mb-5 flex items-start gap-3">
          <Smartphone className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-200">
              Demo Absensi Toko
            </p>
            <p className="text-[11px] text-cyan-100/55 mt-1">
              Preview interaktif dengan mock data terpisah. Perubahan hanya tersimpan
              di browser ini dan tidak terhubung ke customer atau production.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-violet-400 font-bold">
              Jadwal & Absensi Toko
            </p>
            {editingStore ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (demo.storeName.trim()) setEditingStore(false);
                }}
                className="flex items-center gap-2 mt-2"
              >
                <input
                  autoFocus
                  value={demo.storeName}
                  onChange={(event) => updateDemo({ storeName: event.target.value })}
                  className="h-9 rounded-lg border border-violet-500/40 bg-white/5 px-3 text-xl font-black text-white outline-none"
                />
                <button className="text-emerald-300" aria-label="Simpan nama toko">
                  <Save className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setEditingStore(true)}
                className="group flex items-center gap-2 mt-2 text-left"
              >
                <h1 className="text-2xl font-black text-white">{demo.storeName}</h1>
                <span className="text-[10px] text-white/25 group-hover:text-violet-300">
                  Edit
                </span>
              </button>
            )}
            <p className="text-xs text-white/40 mt-1">1 personil contoh · data lokal demo</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetDemo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-white/45 hover:text-white hover:bg-white/5"
            >
              <RotateCcw className="w-3 h-3" /> Reset Demo
            </button>
            <Link
              href="/"
              className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-[11px] font-bold text-violet-200"
            >
              ← Kembali
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => moveMonth(-1)}
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="min-w-[130px] text-center">
                <p className="text-[10px] uppercase tracking-widest text-violet-400 font-bold">
                  Bulan aktif
                </p>
                <p className="text-sm font-black capitalize text-white">{monthLabel(month)}</p>
              </div>
              <button
                onClick={() => moveMonth(1)}
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-9 w-[130px] rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white"
                aria-label="Pilih bulan demo"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/45">
              <CalendarDays className="w-3.5 h-3.5 text-violet-300" />
              Klik sel tanggal untuk memilih atau mengubah absensi
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0c0c1a] overflow-hidden mb-5">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/80">
                Personil × Tanggal
              </p>
              <p className="text-[10px] text-white/35 mt-1">Tap tanggal untuk mengisi jadwal kerja</p>
            </div>
            <span className="text-[10px] rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-violet-200">
              Mobile scroll →
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="border-collapse min-w-max text-xs">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="sticky left-0 z-10 bg-[#0c0c1a] min-w-[170px] px-4 py-3 text-left text-[10px] uppercase tracking-wider text-white/40">
                    Personil
                  </th>
                  {days.map((day) => (
                    <th key={day} className="w-[76px] px-1 py-2 text-center text-[10px] text-white/40">
                      <span className="block text-[9px] text-violet-300/70">{weekdayLabel(month, day)}</span>
                      <span className="block text-sm text-white/70 mt-0.5">{day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sticky left-0 z-10 bg-[#0c0c1a] px-4 py-3 align-top">
                    {editingPersonnel ? (
                      <form onSubmit={savePersonnel} className="space-y-2">
                        <input
                          autoFocus
                          value={demo.personnelName}
                          onChange={(event) => updateDemo({ personnelName: event.target.value })}
                          className="w-full rounded-lg border border-violet-500/40 bg-white/5 px-2 py-1.5 text-xs font-bold text-white outline-none"
                          aria-label="Nama personil demo"
                        />
                        <select
                          value={demo.personnelRole}
                          onChange={(event) =>
                            updateDemo({
                              personnelRole: event.target.value as DemoState["personnelRole"],
                            })
                          }
                          className="w-full rounded-lg border border-violet-500/40 bg-white/5 px-2 py-1.5 text-[10px] text-white outline-none"
                          aria-label="Jabatan personil demo"
                        >
                          {POSITION_OPTIONS.map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </select>
                        <button className="text-[10px] font-bold text-emerald-300">Simpan</button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setEditingPersonnel(true)}
                        className="group text-left"
                      >
                        <div className="font-bold text-white">{demo.personnelName}</div>
                        <div className="text-[10px] text-white/35">{demo.personnelRole}</div>
                        <div className="text-[10px] text-violet-400/70 group-hover:text-violet-300 mt-1">
                          Edit personil
                        </div>
                      </button>
                    )}
                  </td>
                  {days.map((day) => {
                    const entry = demo.entries[dateKey(month, day)];
                    return (
                      <td key={day} className="p-1 align-top">
                        <button
                          onClick={() => {
                            setActiveDay(day);
                            setDetailType(null);
                          }}
                          className={`w-[72px] min-h-[62px] rounded-xl border px-1 py-2 flex flex-col items-center justify-center gap-1 transition-all ${
                            entry
                              ? "border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20"
                              : "border-white/8 bg-white/[0.02] hover:border-violet-400/35 hover:bg-violet-500/5"
                          }`}
                          aria-label={`Edit absensi ${demo.personnelName} tanggal ${day}`}
                        >
                          <span className={`text-sm font-black ${entry ? "text-white" : "text-white/20"}`}>
                            {entry?.code ?? "—"}
                          </span>
                          <span className="text-[9px] text-white/30">
                            {entry ? "Edit" : "Isi jadwal"}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <section className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/80">Rekap Bulan Ini</p>
              <p className="text-[10px] text-white/35 mt-1">{demo.personnelName} · {monthLabel(month)}</p>
            </div>
            <span className="text-[10px] text-white/30">{monthlyEntries.length} hari terisi</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[
              ["P", "Pagi", recap.P],
              ["S", "Siang", recap.S],
              ["M", "Malam", recap.M],
              ["O", "Off", recap.O],
              ["AO", "Add Off", recap.AO],
              ["SO", "Stock Opname", recap.SO],
              ["CUTI", "Cuti", recap.CUTI],
              ["IZIN", "Izin", recap.IZIN],
            ].map(([code, label, count]) => (
              <div key={code} className="rounded-xl bg-white/[0.035] border border-white/6 px-2 py-2 text-center">
                <p className="text-sm font-black text-violet-200">{count}</p>
                <p className="text-[9px] text-white/35 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
            <p className="text-xs font-black text-white">Kode absensi demo</p>
            <p className="text-[11px] leading-relaxed text-white/45 mt-2">
              P6–P12 untuk pagi, S13–S18 untuk siang, M19–M23 untuk malam.
              O, AO, SO, Cuti, dan Izin tersimpan langsung sebagai status.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4">
            <p className="text-xs font-black text-white">Terisolasi dari production</p>
            <p className="text-[11px] leading-relaxed text-white/45 mt-2">
              Demo tidak membuat order, tidak memerlukan login, dan tidak mengirim
              request absensi ke server. Alpha memang tidak tersedia di demo.
            </p>
          </div>
        </div>
      </main>

      {activeDay !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveDay(null);
              setDetailType(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Pilih absensi tanggal ${activeDay}`}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-violet-500/20 bg-[#111020] p-5 shadow-2xl shadow-violet-950/40"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-violet-300 font-bold">
                  {demo.personnelName} · {weekdayLabel(month, activeDay)} {activeDay}
                </p>
                <h2 className="text-xl font-black text-white mt-1">
                  {detailType ? `Pilih jam ${detailType}` : "Pilih Absensi"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setActiveDay(null);
                  setDetailType(null);
                }}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50"
                aria-label="Tutup pilihan absensi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailType ? (
              <div className="grid grid-cols-4 gap-2">
                {DETAIL_OPTIONS[detailType].map((code) => (
                  <button
                    key={code}
                    onClick={() => saveEntry({ type: detailType, code })}
                    className="h-12 rounded-xl border border-violet-400/25 bg-violet-500/10 text-sm font-black text-violet-100 hover:bg-violet-500/25"
                  >
                    {code}
                  </button>
                ))}
                <button
                  onClick={() => setDetailType(null)}
                  className="col-span-4 mt-1 h-10 rounded-xl text-xs font-bold text-white/45 hover:text-white"
                >
                  ← Kembali ke pilihan absensi
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {ATTENDANCE_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => chooseType(option.type)}
                    className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-3 text-left hover:border-violet-400/30 hover:bg-violet-500/10"
                  >
                    <span className="block text-sm font-black text-white">{option.label}</span>
                    <span className="block text-[10px] text-white/40 mt-0.5">{option.description}</span>
                  </button>
                ))}
                <button
                  onClick={() => saveEntry(null)}
                  className="col-span-2 h-10 rounded-xl border border-rose-400/15 text-xs font-bold text-rose-200/70 hover:bg-rose-400/10"
                >
                  Kosongkan tanggal
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </Layout>
  );
}