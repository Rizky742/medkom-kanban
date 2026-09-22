# Medkom Tracker — GenBI UNAIR 2026

Pengganti Form + Mastersheet manual. 1 request bisa dipecah jadi beberapa garapan per orang.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka:

- `#/request` — form publik divisi (tanpa login)
- `#/track/` — pantau status pakai ID request (tanpa login)
- `#/app/intake` — verifikasi + pecah garapan (Admin)
- `#/app/board` — kanban per garapan, drag-drop
- `#/app/calendar` — deadline vs jadwal Up
- `#/app/assets` — proofing + Approve/Revisi (Admin: Rizky, Vita, Fayola, Lina)
- `#/app/dashboard` — overdue, beban anggota

Login internal: pilih nama + PIN (`/app/*` terkunci tanpa login). PIN diatur di
`src/lib/auth.js` (`ADMIN_PIN` untuk Rizky/Vita/Fayola/Lina, `MEMBER_PIN` untuk
anggota lain) — ganti sebelum disebar. Approve final dikunci hanya untuk Admin.

## Data

Mode real: database bawaan berisi 3 request yang belum dikerjakan (BLOOD,
Company Visit, WEeBI — dari Form Responses), proyek yang sudah selesai tidak
dimasukkan. Tersimpan di `localStorage (medkom_v3)`.
Footer internal punya tombol "Muat contoh" (data demo Welpart dkk, opt-in) dan
"Hapus semua" (kembali kosong).

## Sinkronisasi (Sheets + Drive) — STATUS: LIVE ✅

Backend sudah deploy sebagai Web app (akses Anyone, eksekusi sebagai
`medkomgenbiunair2026@gmail.com`) dan terverifikasi (`?action=ping` + `?action=list`
mengembalikan JSON). URL tersimpan di `.env` sebagai `VITE_API_URL`, jadi aplikasi
langsung mode online saat dibuka.

Tanpa setup apa pun aplikasi jalan **mode lokal** (data per browser).
Untuk instal ulang / ganti backend:

1. `script.google.com` → proyek Medkom Tracker (kode di `apps-script/Code.gs`, dipush via `clasp`).
2. Jalankan `setup()` sekali → Allow → akun `medkomgenbiunair2026@gmail.com`. Ini membuat sheet `REQUESTS`/`TASKS` (di spreadsheet `MEDKOM_DB` milik script) + folder `Arsip Medkom/_APP_TRACKER/`.
3. Deploy → New deployment → Web app → Execute as: **Me** → Who has access: **Anyone** → Deploy → copy URL `/exec`. (Catatan: deploy via UI — deploy via `clasp` tercatat tapi tidak melayani akses anonim.)
4. Di aplikasi: sidebar → **Sambungkan ke Sheets** → tempel URL → **Tes & Simpan**. (Alternatif: isi `VITE_API_URL` di `.env` + restart dev server.)
5. Setelah tersambung, sinkronisasi berjalan otomatis (tiap perubahan dikirim ~2,5 detik, data terbaru ditarik tiap 30 detik / saat kembali fokus). ID lokal dipertahankan, ID server mulai REQ-500 agar tak tabrakan.

Catatan v1: komentar & checklist versi cuma tersimpan lokal. File (maks 5 @20MB) hanya terkirim saat online; saat offline pakai link Drive, file menyusul otomatis setelah online.

## Deploy gratis

```bash
npm run build
```

Upload folder `dist/` ke Netlify Drop / Vercel. Tanpa WA (sesuai keputusan), tracking via link saja.
