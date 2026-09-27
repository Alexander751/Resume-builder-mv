# Resume Builder MV

Bina resume dalam pelayar, pratonton saiz A4 hidup, jana PDF pada peranti sendiri.
Semua berlaku dalam pelayar — **tiada data dihantar ke mana-mana pelayan**.

- Guna (awan): https://alexander751.github.io/Resume-builder-mv/
- Kod: https://github.com/Alexander751/Resume-builder-mv

## Fail

| Fail | Peranan |
|---|---|
| `index.html` | Keseluruhan app (HTML + CSS + JS dalam satu fail, tiada binaan, tiada pelayan) |
| `test/test_ui.js` | Ujian UI jsdom: elemen, pratonton hidup, baris berulang, jana PDF, simpan automatik |
| `QR_Resume_Builder.png` | Kod QR ke laman awam |

## Cara guna

Buka `index.html` (klik dua kali) atau laman awam di atas.

1. Isi **Butiran Peribadi** — Nama dan Nombor Telefon wajib
2. Isi **Jawatan Disasarkan**, **Ringkasan Profil**
3. **+ Tambah Pengalaman** / **+ Tambah Pendidikan** untuk setiap rekod; **Hapus** untuk buang
4. Kemahiran: pisahkan dengan koma (cth. `AutoCAD, BQ, MS Excel`)
5. Pratonton di kanan dikemas kini serta-merta
6. **Jana PDF** → dialog cetak → *Destination: Save as PDF*

Data disimpan automatik dalam pelayar (localStorage). **Kosongkan** memadam semuanya.

## Apa yang sudah ada

**Fasa 1** — borang asas: `#nama`, `#telefon`, butang `#jana`.

**Fasa 2** — medan resume sebenar:
- `#emel`, `#lokasi`, `#jawatan`, `#ringkasan`, `#kemahiran`
- Pengalaman berulang (`#senarai-pengalaman`) + pendidikan berulang (`#senarai-pendidikan`), boleh tambah/hapus
- Pratonton A4 hidup (`#resume`) yang dikemas kini pada setiap taipan
- Kiraan hidup + amaran dalam `#log` (cth. "2 pengalaman, 1 pendidikan akan masuk ke resume")
- Cetak A4 (`@page size A4`), borang disembunyikan semasa cetak, item tidak dipotong merentas halaman
- Data di-escape (tiada suntikan HTML), simpan automatik, butang Kosongkan

## Ujian

```bash
cd test && npm install        # sekali sahaja (jsdom)
"$LOCALAPPDATA/hermes/node/node.exe" test/test_ui.js
```

Keputusan semasa: **46 lulus, 0 gagal**.

## Jadual gejala → penyelesaian

| Gejala | Sebab | Penyelesaian |
|---|---|---|
| Butang Jana PDF tiada tindak balas | Nama atau Nombor Telefon kosong | Isi kedua-duanya; mesej ralat keluar di bawah butang |
| PDF keluar kosong / tiada borang | Dialog cetak dipilih "Print" biasa, bukan "Save as PDF" | Pilih *Destination: Save as PDF* dalam dialog |
| PDF ada bahagian yang hilang | Medan dibiarkan kosong — kosong memang ditapis | Isi medan itu; semak kiraan hidup dalam `#log` |
| Data hilang selepas tutup pelayar | Mod private/incognito menyekat localStorage | Guna tetingkap biasa, atau jana PDF sebelum tutup |
| Laman awam masih tunjuk versi lama | GitHub Pages perlu ~1 minit selepas push | Tunggu, kemudian muat semula dengan Ctrl+F5 |

## Belum ada (fasa seterusnya)

- Penjana PDF terus tanpa dialog cetak
- Pilihan template/warna
- Eksport .docx dan simpan berbilang resume
