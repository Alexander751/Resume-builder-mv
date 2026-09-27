# Resume Builder MV

Bina resume dalam pelayar, pratonton saiz A4 hidup, jana PDF pada peranti sendiri.
Semua berlaku dalam pelayar — **tiada data dihantar ke mana-mana pelayan**.

- Guna (awan): https://alexander751.github.io/Resume-builder-mv/
- Kod: https://github.com/Alexander751/Resume-builder-mv

## Fail

| Fail | Peranan |
|---|---|
| `index.html` | Keseluruhan app (HTML + CSS + JS dalam satu fail, tiada binaan, tiada pelayan) |
| `test/test_ui.js` | Ujian UI jsdom: elemen, pratonton hidup, baris berulang, kedua-dua templat, muat naik foto, jana PDF, simpan automatik |
| `QR_Resume_Builder.png` | Kod QR ke laman awam |

## Cara guna

Buka `index.html` (klik dua kali) atau laman awam di atas.

1. Pilih **Templat** — *Klasik* (satu lajur) atau *Biru & Kelabu* (dua lajur + foto)
2. Isi **Butiran Peribadi** — Nama dan Nombor Telefon wajib; **Foto** hanya untuk templat Biru & Kelabu
3. Isi **Jawatan Disasarkan**, **Ringkasan Profil**
4. **+ Tambah Pengalaman** / **+ Tambah Pendidikan** untuk setiap rekod; **Hapus** untuk buang
5. Kemahiran dan Bahasa: pisahkan dengan koma (cth. `AutoCAD, BQ, MS Excel`)
6. Rujukan: satu baris satu orang
7. Pratonton di kanan dikemas kini serta-merta
8. **Jana PDF** → dialog cetak → *Destination: Save as PDF*

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

**Fasa 3** — aliran jualan WhatsApp:
- Tanda air (watermark) pada pratonton dan PDF pelanggan (`#cap-air`)
- Panel pesanan `#panel-pesanan` + pautan `#wa` (`wa.me`) dengan mesej siap
- Kod resume Base64 untuk pesanan, dipulihkan semula di sisi penjual
- Mod Penjual (`#penjual` atau `#kod=<kod>`): tanda air dimatikan, panel pesanan disembunyikan

**Fasa 4** — dua templat reka bentuk:
- Pemilih **`#templat`**: *Klasik* (putih, satu lajur) dan *Biru & Kelabu* (dua lajur dengan rel kelabu + foto)
- Templat **Biru & Kelabu** dibina semula mengikut ukuran sebenar fail rujukan *Blue and Gray Simple Professional CV Resume* (A4, 596 × 842 pt): banner biru gelap `#323b4c` setinggi 50 mm, rel kiri kelabu `#e4e4e4` selebar 65 mm (Kontak / Kemahiran / Bahasa), lajur kanan dengan garisan bawah biru `#163853` (Profil / Pengalaman Kerja / Pendidikan / Rujukan), garis pemisah menegak pada 73 mm
- Medan baharu: **`#bahasa`**, **`#rujukan`**, **`#foto`** (fail gambar dikecilkan ke 420 px dan disimpan sebagai JPEG dalam pelayar sahaja)
- Foto hanya masuk ke templat Biru & Kelabu; bila tiada foto, nama digeser ke kiri supaya banner tidak berlubang
- Templat + bahasa + rujukan **turut serta dalam kod pesanan WhatsApp** (maklumat kecil), tetapi **foto tidak** — supaya kod kekal pendek dan boleh disalin; minta pelanggan hantar gambar, kemudian muat naik di sisi penjual
- Cetakan: `@page { margin: 0 }` supaya templat dua lajur boleh mencetak penuh ke tepi kertas; templat Klasik pula dapat padding 12 mm dari pembalutnya sendiri

## Ujian

```bash
cd test && npm install        # sekali sahaja (jsdom)
"$LOCALAPPDATA/hermes/node/node.exe" test/test_ui.js
```

Keputusan semasa: **103 lulus, 0 gagal**.

## Aliran jualan melalui WhatsApp (tanpa gerbang bayaran)

Tiada gerbang bayaran, tiada pelayan — jadi tiada yuran transaksi dan tiada data pelanggan disimpan.

| Pihak | Langkah |
|---|---|
| Pelanggan | Isi borang → pratonton ada **tanda air** ("PRATONTON · BELUM DIBAYAR") → tekan **Hantar Pesanan ke WhatsApp** |
| Pelanggan | WhatsApp terbuka dengan mesej siap: nama, telefon, harga, dan **kod resume** (satu rentetan panjang) |
| Anda | Terima pesanan, minta bayaran (DuitNow QR / pindahan bank) |
| Anda | Buka laman dengan `#penjual` → tampal kod ke kotak **Mod Penjual** → **Buka Kod** → resume pelanggan muncul **tanpa tanda air** |
| Anda | Tekan **Jana PDF** → hantar PDF bersih kepada pelanggan |

### Tiga cara buka Mod Penjual

1. **Ketuk tajuk 5 kali** — paling mudah di telefon. Ketuk perkataan "Resume Builder MV" di atas sekali 5 kali berturut-turut (dalam ~1.5 saat antara ketukan). Pil oren **MOD PENJUAL** akan muncul. Muat semula halaman untuk kembali ke mod pelanggan.
2. **URL** — buka `https://alexander751.github.io/Resume-builder-mv/#penjual` (simpan sebagai bookmark di PC).
3. **URL + kod pelanggan** — `.../#kod=<kod-pelanggan>`: laman terus memuatkan resume pelanggan dalam mod penjual, sedia untuk dicetak.

Kotak **Buka Kod** dalam panel Mod Penjual berfungsi dalam ketiga-tiga keadaan — tampal kod pelanggan dan tekan butang itu.

**Kod resume** ialah ringkasan data pelanggan yang dikodkan Base64 (selamat untuk URL). Ia hanya mengandungi apa yang pelanggan taip — tiada apa-apa dihantar ke pelayar lain dan tiada apa-apa disimpan di pelayan.

**TETAPAN PENJUAL** — buka `index.html`, cari blok ini di awal `<script>` dan tukar dua baris:

```js
var NOMBOR_WA = '601159003242';  // nombor WhatsApp bisnes, format 60xxxxxxxxx
var HARGA = 29.90;               // harga jualan PDF bersih (RM)
```

## Jadual gejala → penyelesaian

| Gejala | Sebab | Penyelesaian |
|---|---|---|
| Butang Jana PDF tiada tindak balas | Nama atau Nombor Telefon kosong | Isi kedua-duanya; mesej ralat keluar di bawah butang |
| PDF keluar kosong / tiada borang | Dialog cetak dipilih "Print" biasa, bukan "Save as PDF" | Pilih *Destination: Save as PDF* dalam dialog |
| PDF ada bahagian yang hilang | Medan dibiarkan kosong — kosong memang ditapis | Isi medan itu; semak kiraan hidup dalam `#log` |
| Data hilang selepas tutup pelayar | Mod private/incognito menyekat localStorage | Guna tetingkap biasa, atau jana PDF sebelum tutup |
| Laman awam masih tunjuk versi lama | GitHub Pages perlu ~1 minit selepas push | Tunggu, kemudian muat semula dengan Ctrl+F5 |
| Pautan WhatsApp tidak buka WhatsApp | Nama atau Nombor Telefon kosong | Isi kedua-duanya; butang jadi kelabu bila belum lengkap |
| Nombor WhatsApp salah orang | `NOMBOR_WA` masih nombor contoh | Tukar dalam blok TETAPAN PENJUAL di `index.html`, format `60xxxxxxxxx` |
| Resume penjual masih ada tanda air | Mod penjual tidak dihidupkan | Ketuk tajuk 5 kali, atau buka URL dengan `#penjual` |
| Kod resume ditolak | Kod dipotong semasa salin (WhatsApp kadang pecahkan baris) | Salin semula seluruh kod; pastikan tiada ruang dalam kod |
| Banner biru / rel kelabu tiada dalam PDF | Templat Biru & Kelabu bergantung pada warna latar; sesetengah pelayar tidak mencetak latar secara lalai | Dalam dialog cetak, buka *More settings* → tandakan **Background graphics** |
| Kotak URL dan tarikh muncul atas banner | `@page` dimulakan pada margin 0 supaya banner boleh penuh ke tepi | Dalam dialog cetak, buka *More settings* → **matikan** *Headers and footers* |
| Foto tidak naik | Fail melebihi 6 MB atau bukan gambar | Kecilkan gambar (JPG/PNG), kemudian cuba lagi |

## Belum ada (fasa seterusnya)

- Penjana PDF terus tanpa dialog cetak
- Templat tambahan (kini ada 2: Klasik, Biru & Kelabu) dan pilihan warna
- Rekod pesanan (siapa sudah bayar) — sekarang tiada langsung
- Eksport .docx
