# Fasa 58 — Mod Builder gaya Canva (kotak teks + imej/logo bebas)

> **Goal:** Tambah lapisan "builder" pada Resume Builder MV — pelanggan/penjual boleh tambah
> kotak teks dan muat naik imej/logo, seret & ubah saiz di atas helaian A4, dan ia tercetak
> dalam PDF dengan betul.

**Seni bina:** Overlay kedudukan mutlak dalam unit **mm** di atas helaian A4 (`.kertas`, 794×1123 px
@96dpi). Elemen disimpan sebagai tatasusunan `PEMBINA`, dibawa dalam kod pesanan (medan `bd`) dan
localStorage. Ia hidup di halaman 1 sahaja (MVP) — bukan pengganti templat, tapi lapisan tambahan.

**Teknologi:** HTML/CSS/JS satu fail (tiada binaan), ujian jsdom (`node test/test_ui.js`), dwibahasa MS/EN.

---

## Model data

```js
var PEMBINA = [];   // { id:'pb1', jenis:'teks'|'imej', x,y,w,h (mm), teks|src, fon, tebal, warna, sejajar }
var MOD_PEMBINA = false;   // mod "alih elemen" (seret/ubah saiz)
```

Koordinat **x,y** = sudut kiri-atas dalam mm (0,0 = penjuru A4). **w,h** dalam mm.
Teks: `w` = lebar kotak, `h` auto (kandungan). Imej: `w,h` kedua-duanya.

## Fail & tempat yang disentuh (semua dalam `index.html`)

1. **CSS** — tambah blok `.pembina-lapisan`, `.pb-el`, `.pb-teks`, `.pb-img`, `.pb-handle`,
   `.pb-alat` (selepas blok templat, sebelum `@media print`); peraturan cetak (sorok pemegang/alat).
2. **DOM** — `<div class="pembina-lapisan" id="pembina-1">` dalam `#kertas-1`; `id="pembina-sisi"`
   dalam `#kertas-sisi`; butang toolbar "Kotak teks" / "Imej/Logo" / "Alih elemen" pada bar pratonton
   (halaman 3) + sisi-live.
3. **JS**
   - `paparPembina(elemen)` — render lapisan (kedua-dua helaian).
   - `tambahKotak()`, `tambahImej(fail)` (guna semula `kecilkanFoto` dengan siling 800px).
   - `setModPembina(on)`, pengendali seret (pointerdown/move/up, penukaran px→mm guna `getBoundingClientRect`).
   - Pemegang ubah saiz + bar alat mini (fon +/-, tebal, warna, sejajar, hapus).
   - Integrasi: `kumpul()` (`pembina: PEMBINA.slice()`), `isiBorang()` (`PEMBINA = ...`),
     `kosongkanBorang()` (`PEMBINA = []`), `kodDari()` (`bd:`), `borangDariKod()` (`bd`),
     `papar()` (panggil `paparPembina`).
   - `ResumeMV` API: dedah `pembina()`, `tambahKotak()`, `tambahImej()`, `setModPembina()`.

## Langkah (setiap satu = commit, jalankan `node test/test_ui.js` selepas setiap)

1. CSS + DOM lapisan + `paparPembina()` (render sahaja, belum interaktif) — tiada regresi.
2. Data layer: `PEMBINA` global + `kumpul/isiBorang/kosongkanBorang/kodDari/borangDariKod` + `ResumeMV`.
3. Toolbar + `tambahKotak()` (kotak teks boleh edit kandungan, contenteditable).
4. Seret + ubah saiz (px→mm) + bar alat mini (fon/tebal/warna/sejajar/hapus).
5. `tambahImej()` (muat naik + mampat) + seret/ubah saiz imej.
6. Dwibahasa (KAMUS_EN) + pengesahan cetak (sorok pemegang semasa cetak, elemen kekal).
7. Ujian jsdom baharu (blok "Fasa 58") + commit + push + sahkan Pages live (sha256).

## Risiko / soalan terbuka

- Kod pesanan WhatsApp membesar dengan imej base64 (foto pun sudah begitu) — mampat imej, siling 800px.
- Elemen builder hanya halaman 1; resume 2+ halaman: elemen dipotong pada 297mm (terima untuk MVP).
- `zoom` pada `.kertas`: penukaran px→mm mesti guna lebar sebenar `getBoundingClientRect().width`.
- Elak `.pb-*` bocor ke terjemahan (`.kertas` sudah dalam `UI_LOMPAT` — elok).
