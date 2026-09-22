import { useState } from "react";
import { Key, Plus, Trash, UserPlus } from "@phosphor-icons/react";
import { Avatar, Empty } from "../components/ui.jsx";
import {
  addMember,
  changePin,
  loadTeam,
  removeMember,
  setPin,
  setRole,
} from "../lib/team.js";

function RoleBadge({ role }) {
  return role === "admin" ? (
    <span className="jloz jloz-blue">Admin</span>
  ) : (
    <span className="jloz jloz-gray">Anggota</span>
  );
}

export default function Team({ me, isAdmin, onTeamChange }) {
  const [team, setTeam] = useState(() => loadTeam());
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // ganti PIN sendiri
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");

  // tambah anggota (admin)
  const [nName, setNName] = useState("");
  const [nRole, setNRole] = useState("anggota");
  const [nPin, setNPin] = useState("");

  // reset PIN anggota (admin) — inline per baris
  const [resetFor, setResetFor] = useState(null);
  const [resetPin, setResetPin] = useState("");

  function reload() {
    setTeam(loadTeam());
    onTeamChange?.();
  }
  function flashOk(t) {
    setMsg(t);
    setErr("");
  }
  function flashErr(t) {
    setErr(t);
    setMsg("");
  }

  function submitChangeOwn(e) {
    e.preventDefault();
    if (newPin !== newPin2) {
      flashErr("PIN baru dan konfirmasi tidak sama.");
      return;
    }
    const r = changePin(me, oldPin, newPin);
    if (!r.ok) {
      flashErr(r.error);
      return;
    }
    setOldPin("");
    setNewPin("");
    setNewPin2("");
    flashOk("PIN kamu berhasil diganti.");
  }

  function submitAdd(e) {
    e.preventDefault();
    const r = addMember(nName, nRole, nPin);
    if (!r.ok) {
      flashErr(r.error);
      return;
    }
    setNName("");
    setNRole("anggota");
    setNPin("");
    reload();
    flashOk(`${nName.trim()} ditambahkan sebagai ${nRole}.`);
  }

  function doReset(name) {
    const r = setPin(name, resetPin);
    if (!r.ok) {
      flashErr(r.error);
      return;
    }
    setResetFor(null);
    setResetPin("");
    reload();
    flashOk(`PIN ${name} berhasil diganti.`);
  }

  function doRemove(name) {
    if (name === me) {
      flashErr("Tidak bisa menghapus akun sendiri yang sedang login.");
      return;
    }
    if (!confirm(`Hapus ${name} dari tim? Ia tidak bisa login lagi.`)) return;
    const r = removeMember(name);
    if (!r.ok) {
      flashErr(r.error);
      return;
    }
    reload();
    flashOk(`${name} dihapus dari tim.`);
  }

  function doRole(name, role) {
    const r = setRole(name, role);
    if (!r.ok) {
      flashErr(r.error);
      return;
    }
    reload();
    flashOk(`${name} sekarang ${role}.`);
  }

  return (
    <div className="py-5">
      <p className="jcrumb">Medkom 2026</p>
      <h1 className="font-display mt-0.5 text-[32px]">Tim & PIN</h1>
      <p className="text-[13px] text-[#6B6B6B]">
        {isAdmin
          ? "Kelola anggota tim, atur ulang PIN, dan tambah anggota baru."
          : "Ganti PIN login kamu di sini. Minta admin kalau lupa PIN."}
      </p>

      {msg && (
        <p className="mt-3 rounded-[8px] border border-[#E8E8EC] bg-[#e8f8f1] px-3 py-2 text-[13px] font-medium text-[#0c7a55]">
          {msg}
        </p>
      )}
      {err && (
        <p className="mt-3 rounded-[8px] border border-[#E8E8EC] bg-[#fdecec] px-3 py-2 text-[13px] font-medium text-[#c0362c]">
          {err}
        </p>
      )}

      {/* Ganti PIN sendiri */}
      <div className="card mt-4 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Key size={18} weight="bold" className="text-[#6366F1]" />
          <p className="font-display text-[15px]">Ganti PIN saya</p>
        </div>
        <p className="mt-0.5 text-[13px] text-[#6B6B6B]">
          Login sebagai <span className="font-medium text-[#0A0A0A]">{me}</span>. PIN minimal 4 karakter.
        </p>
        <form onSubmit={submitChangeOwn} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="lbl">PIN lama</p>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              className="input mt-1"
              placeholder="••••"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
            />
          </div>
          <div>
            <p className="lbl">PIN baru</p>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              className="input mt-1"
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
          </div>
          <div>
            <p className="lbl">Ulangi PIN baru</p>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              className="input mt-1"
              placeholder="••••"
              value={newPin2}
              onChange={(e) => setNewPin2(e.target.value)}
            />
          </div>
        </form>
        <div className="mt-3 flex justify-end">
          <button onClick={submitChangeOwn} className="btn-pine h-9 px-4 text-sm">
            Simpan PIN baru
          </button>
        </div>
      </div>

      {/* Kelola tim (admin) */}
      {isAdmin ? (
        <>
          <div className="card mt-5 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <UserPlus size={18} weight="bold" className="text-[#6366F1]" />
              <p className="font-display text-[15px]">Tambah anggota</p>
            </div>
            <form onSubmit={submitAdd} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_160px_auto]">
              <div>
                <p className="lbl">Nama</p>
                <input
                  className="input mt-1"
                  placeholder="cth: Nadia"
                  value={nName}
                  onChange={(e) => setNName(e.target.value)}
                />
              </div>
              <div>
                <p className="lbl">Peran</p>
                <select className="input mt-1" value={nRole} onChange={(e) => setNRole(e.target.value)}>
                  <option value="anggota">Anggota</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <p className="lbl">PIN awal</p>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  className="input mt-1"
                  placeholder="••••"
                  value={nPin}
                  onChange={(e) => setNPin(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-pine h-[38px] px-4 text-sm">
                  <Plus size={14} weight="bold" /> Tambah
                </button>
              </div>
            </form>
          </div>

          <div className="card mt-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E8E8EC] px-4 py-3">
              <p className="font-display text-[15px]">Anggota tim</p>
              <span className="jkey">{team.members.length} orang</span>
            </div>
            {team.members.map((m) => (
              <div key={m.name} className="jtable-row px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={m.name} size={28} />
                  <span className="min-w-0 flex-1 truncate text-[15px]">
                    {m.name}
                    {m.name === me && <span className="text-[12px] text-[#9C9C9C]"> (kamu)</span>}
                  </span>
                  <RoleBadge role={m.role} />
                </div>
                {resetFor === m.name ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      className="input max-w-[200px]"
                      placeholder="PIN baru (min 4)"
                      value={resetPin}
                      onChange={(e) => setResetPin(e.target.value)}
                    />
                    <button onClick={() => doReset(m.name)} className="btn-pine h-8 px-3 text-[13px]">
                      Simpan
                    </button>
                    <button
                      onClick={() => {
                        setResetFor(null);
                        setResetPin("");
                      }}
                      className="jbtn h-8 px-3 text-[13px]"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setResetFor(m.name);
                        setResetPin("");
                        setMsg("");
                        setErr("");
                      }}
                      className="jbtn h-8 px-3 text-[13px]"
                    >
                      <Key size={13} weight="bold" /> Set PIN
                    </button>
                    {m.role === "admin" ? (
                      <button
                        onClick={() => doRole(m.name, "anggota")}
                        className="jbtn h-8 px-3 text-[13px]"
                        disabled={team.members.filter((x) => x.role === "admin").length <= 1}
                        title="Ubah jadi anggota"
                      >
                        Jadikan anggota
                      </button>
                    ) : (
                      <button onClick={() => doRole(m.name, "admin")} className="jbtn h-8 px-3 text-[13px]">
                        Jadikan admin
                      </button>
                    )}
                    <button
                      onClick={() => doRemove(m.name)}
                      className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#E8E8EC] px-3 text-[13px] font-medium text-[#EF4444] hover:bg-[#fdecec]"
                      disabled={m.name === me}
                      title={m.name === me ? "Tidak bisa hapus akun sendiri" : `Hapus ${m.name}`}
                    >
                      <Trash size={13} weight="bold" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-[#6B6B6B]">
            PIN tersimpan per browser (localStorage). Anggota yang login di HP/laptop lain memakai PIN yang diset di perangkat itu — beri tahu PIN baru ke yang bersangkutan.
          </p>
        </>
      ) : (
        <div className="mt-4">
          <Empty title="Khusus admin" hint="Hanya admin yang bisa menambah anggota dan mengatur PIN orang lain." />
        </div>
      )}
    </div>
  );
}
