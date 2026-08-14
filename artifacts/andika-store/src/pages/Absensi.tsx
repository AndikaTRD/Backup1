import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";

type Personnel = { id: number; name: string; role: string; sortOrder: number };
type Entry = {
  personnelId: number;
  attendanceDate: string;
  status: string;
  shift: string;
};
type StoreData = { id: number; storeName: string };

const STATUS_OPTIONS = [
  ["hadir", "Hadir"],
  ["libur", "Libur"],
  ["izin", "Izin"],
  ["sakit", "Sakit"],
  ["alpha", "Alpha"],
];
const SHIFT_OPTIONS = [
  ["pagi", "Pagi"],
  ["siang", "Siang"],
  ["malam", "Malam"],
  ["libur", "Libur"],
];

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

function displayStatus(status: string) {
  return status === "hadir" ? "H" : status === "libur" ? "L" : status.slice(0, 1).toUpperCase();
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
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Crew");
  const [editingStore, setEditingStore] = useState(false);

  const days = useMemo(() => Array.from({ length: daysIn(month) }, (_, i) => i + 1), [month]);

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
    setStoreName(data.store?.storeName ?? "");
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

  async function saveAttendance(
    personnelId: number,
    day: number,
    status: string,
    shift: string,
  ) {
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
    }
  }

  async function saveStoreName() {
    if (!storeName.trim()) return;
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
    }
  }

  async function addPersonnel(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    const response = await fetch("/api/absensi/personnel", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, role: newRole }),
    });
    if (response.ok) {
      const data = (await response.json()) as { personnel: Personnel };
      setPersonnel((current) => [...current, data.personnel]);
      setNewName("");
      setNewRole("Crew");
    }
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

  if (loading) {
    return <Layout><div className="flex-1 flex items-center justify-center text-sm text-white/40">Memuat Absensi Toko...</div></Layout>;
  }

  return (
    <Layout>
      <main className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-violet-400 font-bold">Produk Aktif</p>
            <div className="flex items-center gap-2 mt-2">
              {editingStore ? (
                <>
                  <input
                    value={storeName}
                    onChange={(event) => setStoreName(event.target.value)}
                    className="h-9 rounded-lg border border-violet-500/40 bg-white/5 px-3 text-lg font-black text-white outline-none"
                  />
                  <button onClick={() => void saveStoreName()} className="text-emerald-300"><Save className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-black text-white">{store?.storeName}</h1>
                  <button onClick={() => setEditingStore(true)} className="text-white/35 hover:text-violet-300"><Pencil className="w-4 h-4" /></button>
                </>
              )}
            </div>
            <p className="text-xs text-white/40 mt-1">ABSENSI TOKO · kalender kehadiran</p>
          </div>
          <Link href="/product-saya" className="text-xs text-white/45 hover:text-violet-300">← Produk Saya</Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-5 text-sm text-pink-300">{error}</div>
        ) : (
          <>
            <div className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => moveMonth(-1)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                  <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white" />
                  <button onClick={() => moveMonth(1)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-white/45">
                  <span>H Hadir</span><span>L Libur</span><span>I Izin</span><span>S Sakit</span><span>A Alpha</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#0c0c1a] overflow-hidden mb-5">
              <div className="overflow-x-auto">
                <table className="border-collapse min-w-max text-xs">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="sticky left-0 z-10 bg-[#0c0c1a] min-w-[150px] px-4 py-3 text-left text-[10px] uppercase tracking-wider text-white/40">Personil</th>
                      {days.map((day) => <th key={day} className="w-20 px-1 py-3 text-center text-[10px] text-white/40">{day}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {personnel.map((person) => (
                      <tr key={person.id} className="border-b border-white/5 last:border-0">
                        <td className="sticky left-0 z-10 bg-[#0c0c1a] px-4 py-3">
                          <div className="font-bold text-white">{person.name}</div>
                          <div className="text-[10px] text-white/35">{person.role}</div>
                        </td>
                        {days.map((day) => {
                          const entry = findEntry(person.id, day);
                          return (
                            <td key={day} className="px-1 py-2 align-top">
                              <select
                                value={entry?.status ?? ""}
                                aria-label={`${person.name} status tanggal ${day}`}
                                onChange={(event) => {
                                  if (event.target.value) void saveAttendance(person.id, day, event.target.value, entry?.shift ?? "pagi");
                                }}
                                className="w-20 rounded-md border border-white/8 bg-white/5 px-1 py-1 text-[10px] text-white outline-none"
                              >
                                <option value="">—</option>
                                {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{displayStatus(value)} · {label}</option>)}
                              </select>
                              <select
                                value={entry?.shift ?? "pagi"}
                                aria-label={`${person.name} shift tanggal ${day}`}
                                onChange={(event) => void saveAttendance(person.id, day, entry?.status ?? "hadir", event.target.value)}
                                className="mt-1 w-20 rounded-md border border-white/8 bg-white/5 px-1 py-1 text-[9px] text-white/55 outline-none"
                              >
                                {SHIFT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {personnel.length === 0 && <tr><td colSpan={days.length + 1} className="px-4 py-10 text-center text-sm text-white/35">Belum ada personil.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <form onSubmit={addPersonnel} className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4">
                <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-violet-400" /><h2 className="text-sm font-black text-white">Tambah Personil</h2></div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-2">
                  <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Nama personil" className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/40" />
                  <input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="Jabatan" className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/40" />
                  <button className="h-10 rounded-xl btn-primary px-4 text-white font-bold text-xs uppercase"><Plus className="w-4 h-4 inline mr-1" />Tambah</button>
                </div>
              </form>
              <div className="rounded-2xl border border-white/8 bg-[#0c0c1a] p-4">
                <h2 className="text-sm font-black text-white mb-3">Daftar Personil</h2>
                <div className="space-y-2">
                  {personnel.map((person) => (
                    <div key={person.id} className="flex items-center justify-between rounded-xl bg-white/4 px-3 py-2">
                      <div><p className="text-xs font-bold text-white">{person.name}</p><p className="text-[10px] text-white/35">{person.role}</p></div>
                      <button onClick={() => void deletePersonnel(person.id)} className="text-white/25 hover:text-pink-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </Layout>
  );
}