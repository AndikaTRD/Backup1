import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

type Role = "COS" | "ACOS" | "Crew";
type AttendanceType = "P" | "S" | "M" | "O" | "SO" | "AO" | "CUTI" | "IZIN";
type Personnel = { id: number; name: string; role: string; sortOrder: number };
type Entry = {
  id?: number;
  personnelId: number;
  attendanceDate: string;
  status: string;
  shift: string;
};
type StoreData = { id: number; storeName: string };
type PersonnelForm = { id?: number; name: string; role: Role };

const ROLES: Role[] = ["COS", "ACOS", "Crew"];
const ROLE_RANK: Record<string, number> = { COS: 0, ACOS: 1, Crew: 2 };
const STATUS_OPTIONS: Array<{
  type: AttendanceType;
  label: string;
  description: string;
  className: string;
}> = [
  { type: "P", label: "P", description: "Shift Pagi", className: "border-violet-400/30 bg-violet-500/10 text-violet-100" },
  { type: "S", label: "S", description: "Shift Siang", className: "border-sky-400/30 bg-sky-500/10 text-sky-100" },
  { type: "M", label: "M", description: "Shift Malam", className: "border-indigo-400/30 bg-indigo-500/10 text-indigo-100" },
  { type: "O", label: "O", description: "Off / Libur", className: "border-slate-400/20 bg-slate-500/10 text-slate-100" },
  { type: "SO", label: "SO", description: "Stock Opname", className: "border-amber-400/30 bg-amber-500/10 text-amber-100" },
  { type: "AO", label: "AO", description: "Add Off", className: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100" },
  { type: "CUTI", label: "Cuti", description: "Cuti", className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" },
  { type: "IZIN", label: "Izin", description: "Izin", className: "border-rose-400/30 bg-rose-500/10 text-rose-100" },
];
const SHIFT_OPTIONS: Record<"P" | "S" | "M", string[]> = {
  P: ["P6", "P7", "P8", "P9", "P10", "P11", "P12"],
  S: ["S13", "S14", "S15", "S16", "S17", "S18"],
  M: ["M19", "M20", "M21", "M22", "M23"],
};

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

function sortedPersonnel(personnel: Personnel[]) {
  return [...personnel].sort(
    (a, b) =>
      (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99) ||
      a.name.localeCompare(b.name, "id") ||
      a.id - b.id,
  );
}

function normalizeStatus(status: string): AttendanceType | null {
  const normalized = status.toUpperCase();
  if (["P", "S", "M", "O", "SO", "AO", "CUTI", "IZIN"].includes(normalized)) {
    return normalized as AttendanceType;
  }
  return null;
}

function displayEntry(entry?: Entry) {
  if (!entry) return "";
  const type = normalizeStatus(entry.status);
  if (!type) return "";
  if (type === "P" || type === "S" || type === "M") return entry.shift || type;
  if (type === "CUTI") return "Cuti";
  if (type === "IZIN") return "Izin";
  return type;
}

function typeForEntry(entry?: Entry): AttendanceType | null {
  return entry ? normalizeStatus(entry.status) : null;
}

function statusStyle(type: AttendanceType | null) {
  return STATUS_OPTIONS.find((option) => option.type === type)?.className ??
    "border-white/8 bg-white/[0.03] text-white/25";
}

export default function Absensi() {
  const [, setLocation] = useLocation();
  const [month, setMonth] = useState(currentMonth);
  const [store, setStore] = useState<StoreData | null>(null);
  const [storeName, setStoreName] = useState("");
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStore, setEditingStore] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [selectedCell, setSelectedCell] = useState<{ personnelId: number; day: number } | null>(null);
  const [detailType, setDetailType] = useState<"P" | "S" | "M" | null>(null);
  const [personnelForm, setPersonnelForm] = useState<PersonnelForm | null>(null);
  const [personnelSaving, setPersonnelSaving] = useState(false);

  const days = useMemo(
    () => Array.from({ length: daysIn(month) }, (_, index) => index + 1),
    [month],
  );
  const orderedPersonnel = useMemo(() => sortedPersonnel(personnel), [personnel]);
  const selectedPerson = selectedCell
    ? personnel.find((person) => person.id === selectedCell.personnelId)
    : undefined;

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
      setError(data.error ?? "Akses Absensi Toko belum aktif.");
      setLoading(false);
      return;
    }
    setStore(data.store ?? null);
    setStoreName(data.store?.storeName === "Toko Saya" ? "" : data.store?.storeName ?? "");
    setPersonnel(sortedPersonnel(data.personnel ?? []));
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

  function markSaved() {
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1800);
  }

  async function saveAttendance(
    personnelId: number,
    day: number,
    status: AttendanceType,
    shift = "",
  ) {
    setSaveState("saving");
    const response = await fetch("/api/absensi/attendance", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personnelId,
        attendanceDate: dateKey(month, day),
        status,
        shift,
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as { entry: Entry };
      setEntries((current) => [
        ...current.filter(
          (entry) =>
            !(
              entry.personnelId === personnelId &&
              entry.attendanceDate === data.entry.attendanceDate
            ),
        ),
        data.entry,
      ]);
      markSaved();
    } else {
      setSaveState("idle");
    }
    setSelectedCell(null);
    setDetailType(null);
  }

  async function clearAttendance(personnelId: number, day: number) {
    setSaveState("saving");
    const response = await fetch("/api/absensi/attendance", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personnelId,
        attendanceDate: dateKey(month, day),
      }),
    });
    if (response.ok) {
      setEntries((current) =>
        current.filter(
          (entry) =>
            !(
              entry.personnelId === personnelId &&
              entry.attendanceDate === dateKey(month, day)
            ),
        ),
      );
      markSaved();
    } else {
      setSaveState("idle");
    }
    setSelectedCell(null);
    setDetailType(null);
  }

  async function saveStoreName() {
    if (!storeName.trim()) return;
    setSaveState("saving");
    const response = await fetch("/api/absensi/store", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName }),
    });
    if (response.ok) {
      const data = (await response.json()) as { store: StoreData };
      setStore(data.store);
      setStoreName(data.store.storeName);
      setEditingStore(false);
      markSaved();
    } else {
      setSaveState("idle");
    }
  }

  async function savePersonnel(event: FormEvent) {
    event.preventDefault();
    if (!personnelForm?.name.trim()) return;
    setPersonnelSaving(true);
    const editing = personnelForm.id !== undefined;
    const response = await fetch(
      editing ? `/api/absensi/personnel/${personnelForm.id}` : "/api/absensi/personnel",
      {
        method: editing ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: personnelForm.name.trim(),
          role: personnelForm.role,
        }),
      },
    );
    if (response.ok) {
      const data = (await response.json()) as { personnel: Personnel };
      setPersonnel((current) =>
        sortedPersonnel(
          editing
            ? current.map((person) =>
                person.id === data.personnel.id ? data.personnel : person,
              )
            : [...current, data.personnel],
        ),
      );
      setPersonnelForm(null);
    }
    setPersonnelSaving(false);
  }

  async function deletePersonnel(personnelId: number) {
    if (!window.confirm("Hapus personil ini beserta data absensinya?")) return;
    const response = await fetch(`/api/absensi/personnel/${personnelId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      setPersonnel((current) => current.filter((person) => person.id !== personnelId));
      setEntries((current) => current.filter((entry) => entry.personnelId !== personnelId));
    }
  }

  function moveMonth(offset: number) {
    const [year, monthNumber] = month.split("-").map(Number);
    const next = new Date(year, monthNumber - 1 + offset, 1);
    setMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  function isToday(day: number) {
    const today = new Date();
    return (
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}` === month &&
      today.getDate() === day
    );
  }

  function recapFor(personnelId: number) {
    const recap = { P: 0, S: 0, M: 0, O: 0, SO: 0, AO: 0, CUTI: 0, IZIN: 0 };
    entries
      .filter(
        (entry) =>
          entry.personnelId === personnelId &&
          entry.attendanceDate.startsWith(month),
      )
      .forEach((entry) => {
        const type = typeForEntry(entry);
        if (type) recap[type] += 1;
      });
    return recap;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center text-sm text-white/40">
          Memuat Absensi Toko...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="w-full max-w-7xl mx-auto px-4 py-7">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-violet-400 font-bold">
              Produk Aktif · Jadwal & Absensi
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
              ABSENSI TOKO
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {editingStore ? (
                <>
                  <input
                    autoFocus
                    value={storeName}
                    onChange={(event) => setStoreName(event.target.value)}
                    placeholder="Nama toko belum diatur"
                    className="h-9 w-64 rounded-lg border border-violet-500/40 bg-white/5 px-3 text-sm font-bold text-white outline-none"
                  />
                  <button
                    onClick={() => void saveStoreName()}
                    className="text-emerald-300"
                    aria-label="Simpan nama toko"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className={`text-sm font-bold ${storeName ? "text-white/70" : "text-white/30 italic"}`}>
                    {storeName || "Nama toko belum diatur"}
                  </span>
                  <button
                    onClick={() => setEditingStore(true)}
                    className="text-white/35 hover:text-violet-300"
                    aria-label="Edit nama toko"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveState !== "idle" && (
              <span className={`text-[11px] font-bold ${saveState === "saving" ? "text-amber-300" : "text-emerald-300"}`}>
                {saveState === "saving" ? "Menyimpan..." : "✓ Tersimpan"}
              </span>
            )}
            <Link href="/product-saya" className="text-xs text-white/45 hover:text-violet-300">
              ← Produk Saya
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-5 text-sm text-pink-300">
            <p>{error}</p>
            <Link href="/product-saya" className="inline-block mt-3 text-xs font-bold text-violet-200 underline">
              Kembali ke Produk Saya
            </Link>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => moveMonth(-1)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/55 hover:text-white hover:bg-violet-500/15"
                    aria-label="Bulan sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-[170px] text-center">
                    <p className="text-[10px] uppercase tracking-widest text-violet-400 font-bold">
                      Kalender Bulanan
                    </p>
                    <p className="text-base font-black capitalize text-white">
                      {monthLabel(month)}
                    </p>
                  </div>
                  <button
                    onClick={() => moveMonth(1)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/55 hover:text-white hover:bg-violet-500/15"
                    aria-label="Bulan berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    className="h-10 w-[138px] rounded-xl border border-white/10 bg-white/5 px-2 text-xs text-white"
                    aria-label="Pilih bulan"
                  />
                  <button
                    onClick={() => setMonth(currentMonth())}
                    className="h-10 rounded-xl border border-violet-500/20 bg-violet-500/8 px-3 text-[10px] font-bold uppercase tracking-wider text-violet-200 hover:bg-violet-500/15"
                  >
                    Hari ini
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-white/45">
                  {STATUS_OPTIONS.map((option) => (
                    <span key={option.type} className={`rounded-md border px-2 py-1 ${option.className}`}>
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/6 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-white/45">
                <span className="font-bold text-white/60">Keterangan Shift:</span>
                <span><b className="text-violet-200">P</b> Pagi · 06:00–14:00</span>
                <span><b className="text-sky-200">S</b> Siang · 13:00–21:00</span>
                <span><b className="text-indigo-200">M</b> Malam · 19:00–23:00</span>
                <span>Jam contoh, dapat disesuaikan toko</span>
              </div>
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#0c0c1a] overflow-hidden mb-5">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/80">
                    Personil × Tanggal
                  </p>
                  <p className="text-[10px] text-white/35 mt-1">
                    Tap sel tanggal untuk mengisi atau mengubah jadwal
                  </p>
                </div>
                <span className="text-[10px] rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-violet-200">
                  Geser tabel →
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse min-w-max text-xs">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="sticky left-0 z-20 bg-[#0c0c1a] min-w-[210px] px-4 py-3 text-left text-[10px] uppercase tracking-wider text-white/40">
                        Personil
                      </th>
                      {days.map((day) => (
                        <th
                          key={day}
                          className={`w-[76px] px-1 py-2 text-center text-[10px] ${
                            isToday(day) ? "bg-violet-500/10" : ""
                          }`}
                        >
                          <span className="block text-[9px] text-violet-300/70">
                            {weekdayLabel(month, day)}
                          </span>
                          <span className={`block text-sm mt-0.5 ${isToday(day) ? "text-violet-200" : "text-white/70"}`}>
                            {day}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderedPersonnel.length === 0 ? (
                      <tr>
                        <td colSpan={days.length + 1} className="px-5 py-14 text-center">
                          <Users className="w-8 h-8 mx-auto text-violet-300/30" />
                          <p className="text-sm font-bold text-white/60 mt-3">Belum ada personil</p>
                          <p className="text-xs text-white/30 mt-1">Tambahkan personil untuk mulai membuat jadwal.</p>
                          <button
                            onClick={() => setPersonnelForm({ name: "", role: "Crew" })}
                            className="mt-4 rounded-xl btn-primary px-4 py-2.5 text-xs font-bold text-white"
                          >
                            <Plus className="w-3.5 h-3.5 inline mr-1" /> Tambah Personil
                          </button>
                        </td>
                      </tr>
                    ) : (
                      ROLES.map((role) => {
                        const members = orderedPersonnel.filter((person) => person.role === role);
                        if (members.length === 0) return null;
                        return (
                          <Fragment key={role}>
                            <tr className="border-b border-white/5">
                              <td
                                colSpan={days.length + 1}
                                className="sticky left-0 z-10 bg-[#0c0c1a] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-violet-300/70"
                              >
                                {role}
                              </td>
                            </tr>
                            {members.map((person) => (
                              <tr key={person.id} className="border-b border-white/5 last:border-0">
                                <td className="sticky left-0 z-10 bg-[#0c0c1a] min-w-[210px] px-4 py-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="font-bold text-white">{person.name}</div>
                                      <div className="text-[10px] text-white/35">{person.role}</div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        setPersonnelForm({
                                          id: person.id,
                                          name: person.name,
                                          role: (ROLES.includes(person.role as Role) ? person.role : "Crew") as Role,
                                        })
                                      }
                                      className="text-white/25 hover:text-violet-300"
                                      aria-label={`Edit ${person.name}`}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                                {days.map((day) => {
                                  const entry = findEntry(person.id, day);
                                  const type = typeForEntry(entry);
                                  return (
                                    <td key={day} className={`p-1 align-top ${isToday(day) ? "bg-violet-500/5" : ""}`}>
                                      <button
                                        onClick={() => {
                                          setSelectedCell({ personnelId: person.id, day });
                                          setDetailType(null);
                                        }}
                                        className={`w-[72px] min-h-[58px] rounded-xl border px-1 py-2 flex flex-col items-center justify-center gap-1 transition-all ${statusStyle(type)} hover:brightness-125`}
                                        aria-label={`Edit absensi ${person.name} tanggal ${day}`}
                                      >
                                        <span className="text-sm font-black">{displayEntry(entry) || "—"}</span>
                                        <span className="text-[9px] opacity-50">{entry ? "Edit" : "Isi"}</span>
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-5">
              <div className="flex items-end justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/80">Rekap Absensi</p>
                  <p className="text-[10px] text-white/35 mt-1">Otomatis berdasarkan {monthLabel(month)}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {orderedPersonnel.map((person) => {
                  const recap = recapFor(person.id);
                  return (
                    <div key={person.id} className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-black text-white">{person.name}</p>
                          <p className="text-[10px] text-violet-300/65">{person.role}</p>
                        </div>
                        <span className="text-[10px] text-white/30">
                          {Object.values(recap).reduce((sum, value) => sum + value, 0)} hari
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {STATUS_OPTIONS.map((option) => (
                          <div key={option.type} className="rounded-lg bg-white/[0.035] border border-white/6 px-1 py-1.5 text-center">
                            <p className="text-xs font-black text-white/80">{recap[option.type]}</p>
                            <p className="text-[9px] text-white/35 mt-0.5">{option.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {orderedPersonnel.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/30">
                    Rekap akan muncul setelah personil ditambahkan.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-400" />
                  <div>
                    <h2 className="text-sm font-black text-white">Pengelolaan Personil</h2>
                    <p className="text-[10px] text-white/35 mt-1">Urutan otomatis: COS → ACOS → Crew</p>
                  </div>
                </div>
                <button
                  onClick={() => setPersonnelForm({ name: "", role: "Crew" })}
                  className="h-9 rounded-xl btn-primary px-3 text-[11px] font-bold text-white"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Tambah Personil
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {orderedPersonnel.map((person) => (
                  <div key={person.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] border border-white/6 px-3 py-2.5">
                    <div>
                      <p className="text-xs font-bold text-white">{person.name}</p>
                      <p className="text-[10px] text-violet-300/60">{person.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setPersonnelForm({
                            id: person.id,
                            name: person.name,
                            role: (ROLES.includes(person.role as Role) ? person.role : "Crew") as Role,
                          })
                        }
                        className="text-white/30 hover:text-violet-300"
                        aria-label={`Edit ${person.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => void deletePersonnel(person.id)}
                        className="text-white/30 hover:text-pink-400"
                        aria-label={`Hapus ${person.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {selectedCell && selectedPerson && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCell(null);
              setDetailType(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Pilih absensi ${selectedPerson.name}`}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-violet-500/20 bg-[#111020] p-5 shadow-2xl shadow-violet-950/40"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-violet-300 font-bold">
                  {selectedPerson.name} · {weekdayLabel(month, selectedCell.day)} {selectedCell.day}
                </p>
                <h2 className="text-xl font-black text-white mt-1">
                  {detailType ? `Pilih jam masuk ${detailType}` : "Pilih Absensi"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCell(null);
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
                {SHIFT_OPTIONS[detailType].map((code) => (
                  <button
                    key={code}
                    onClick={() => void saveAttendance(selectedPerson.id, selectedCell.day, detailType, code)}
                    className="h-12 rounded-xl border border-violet-400/25 bg-violet-500/10 text-sm font-black text-violet-100 hover:bg-violet-500/25"
                  >
                    {code}
                  </button>
                ))}
                <button
                  onClick={() => setDetailType(null)}
                  className="col-span-4 mt-1 h-10 rounded-xl text-xs font-bold text-white/45 hover:text-white"
                >
                  ← Kembali ke pilihan status
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      if (option.type === "P" || option.type === "S" || option.type === "M") {
                        setDetailType(option.type);
                      } else {
                        void saveAttendance(selectedPerson.id, selectedCell.day, option.type);
                      }
                    }}
                    className={`rounded-xl border px-3 py-3 text-left hover:brightness-125 ${option.className}`}
                  >
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className="block text-[10px] opacity-60 mt-0.5">{option.description}</span>
                  </button>
                ))}
                <button
                  onClick={() => void clearAttendance(selectedPerson.id, selectedCell.day)}
                  className="col-span-2 h-10 rounded-xl border border-rose-400/15 text-xs font-bold text-rose-200/70 hover:bg-rose-400/10"
                >
                  Kosongkan tanggal
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {personnelForm && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={(event) => void savePersonnel(event)}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-violet-500/20 bg-[#111020] p-5 shadow-2xl shadow-violet-950/40"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-violet-300 font-bold">
                  {personnelForm.id ? "Edit Personil" : "Personil Baru"}
                </p>
                <h2 className="text-xl font-black text-white mt-1">
                  {personnelForm.id ? "Perbarui data personil" : "Tambah Personil"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPersonnelForm(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50"
                aria-label="Tutup form personil"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-xs font-bold text-white/60">
              Nama Personil
              <input
                autoFocus
                value={personnelForm.name}
                onChange={(event) =>
                  setPersonnelForm((current) =>
                    current ? { ...current, name: event.target.value } : current,
                  )
                }
                placeholder="Masukkan nama personil"
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/50"
              />
            </label>
            <label className="block text-xs font-bold text-white/60 mt-4">
              Jabatan
              <select
                value={personnelForm.role}
                onChange={(event) =>
                  setPersonnelForm((current) =>
                    current ? { ...current, role: event.target.value as Role } : current,
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-violet-500/50"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <button
              disabled={personnelSaving}
              className="mt-5 h-11 w-full rounded-xl btn-primary text-sm font-bold text-white disabled:opacity-50"
            >
              {personnelSaving ? "Menyimpan..." : personnelForm.id ? "Simpan Perubahan" : "Tambah Personil"}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}