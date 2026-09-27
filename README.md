# Resume Builder MV

Bina resume dalam pelayar, pratonton saiz A4 hidup, jana PDF pada peranti sendiri.
Semua berlaku dalam pelayar — **tiada data dihantar ke mana-mana pelayan**.

- Guna (awan): https://alexander751.github.io/Resume-builder-mv/
- Kod: https://github.com/Alexander751/Resume-builder-mv

## Fail

| Fail | Peranan |
|---|---|
| `index.html` | Keseluruhan app (HTML + CSS + JS dalam satu fail, tiada binaan, tiada pelayan) |
| `test/test_ui.js` | Ujian UI jsdom: elemen, pratonton hidup, baris berulang, reka bentuk Biru & Kelabu, muat naik foto, jana PDF, simpan automatik |
| `QR_Resume_Builder.png` | Kod QR ke laman awam |

## Cara guna

Buka `index.html` (klik dua kali) atau laman awam di atas. Aliran **4 halaman**:

1. **Pilih reka bentuk** — kad *Biru & Kelabu* dengan **pratonton mini sebenar** (bukan gambar) → **Mula Isi Butiran**
2. **Isi butiran** — Nama + Nombor Telefon wajib; foto, jawatan, ringkasan, pengalaman, pendidikan, kemahiran, bahasa, rujukan → **Seterusnya: Pratonton**
3. **Pratonton** — helaian A4 penuh (muat tanpa skrol) + butang **Skrin penuh** + senarai semak "Semak sebelum hantar" → **Seterusnya: Hantar**
4. **Hantar** — tekan butang WhatsApp; mesej pesanan + kod resume sudah siap diisi, anda cuma tekan hantar

Butang **Jana PDF** ada di halaman butiran; cetak tetap keluar resume penuh walaupun anda berada di halaman lain.

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

**Fasa 4** — reka bentuk resume: **Biru & Kelabu** (satu-satunya reka bentuk)
- Dibina semula mengikut ukuran sebenar fail rujukan *Blue and Gray Simple Professional CV Resume* (A4, 596 × 842 pt): banner biru gelap `#323b4c` setinggi 50 mm, rel kiri kelabu `#e4e4e4` selebar 65 mm (Kontak / Kemahiran / Bahasa), lajur kanan dengan garisan bawah biru `#163853` (Profil / Pengalaman Kerja / Pendidikan / Rujukan), garis pemisah menegak pada 73 mm
- Medan baharu: **`#bahasa`**, **`#rujukan`**, **`#foto`** (fail gambar dikecilkan ke 420 px dan disimpan sebagai JPEG dalam pelayar sahaja)
- Foto berbentuk **bulat** (`border-radius: 50%` pada bingkai dan imej) — PDF rujukan asal memakai bingkai putih petak; bulatan ini pilihan reka bentuk sendiri
- Bila tiada foto, nama digeser ke kiri supaya banner tidak berlubang
- Bahasa + rujukan **turut serta dalam kod pesanan WhatsApp** (maklumat kecil), tetapi **foto tidak** — supaya kod kekal pendek dan boleh disalin; minta pelanggan hantar gambar, kemudian muat naik di sisi penjual
- Cetakan: `@page { margin: 0 }` supaya reka bentuk dua lajur boleh mencetak penuh ke tepi kertas
- Rel kelabu templat Biru & Kelabu dipaksa memenuhi **penuh satu halaman A4** semasa cetak (`min-height: calc(297mm - 1px)`) — tanpa ini rel berhenti separuh jalan dan tinggal jalur putih di bawah kertas. Tolak 1 px itu penting: tanpa ia, Chrome kadang menambah halaman kedua yang kosong
- **Lencana bulat 20 pt** pada garisan pemisah untuk setiap tajuk lajur kanan, berisi ikon putih: orang (Profil), beg bimbit (Pengalaman Kerja), topi graduasi (Pendidikan), dua orang (Rujukan). Cincin putih (`box-shadow`, bukan `border`) memutuskan garisan pemisah di belakangnya — sama seperti fail rujukan
- Garisan bawah tajuk **2 pt** (`border-bottom`), bukan bar tebal; Chrome membulatkan border ke piksel peranti, jadi 2 pt menghasilkan ~1.25 pt pada cetakan — sama dengan rujukan
- Titik kemahiran, bahasa dan pengalaman **bulat** 3 pt (`border-radius: 50%`), jarak titik ke teks 9 pt (rujukan: titik x20.5, teks x32.5)
- Font **Lato** (badan, sama seperti rujukan) + **Montserrat** (nama & tajuk, hampir dengan Now-Black rujukan), dimuatkan dari Google Fonts. Ini **satu-satunya** permintaan luar app; buang dua baris `<link>` di `<head>` kalau mahu halaman 100% luar talian — ia akan jatuh semula ke Segoe UI/Arial tanpa merosakkan susun atur

**Fasa 6** — pratonton muat penuh pada skrin (tanpa skrol):

- Fungsi `susunSkala()` mengira `--skala = min(1, lebarPanel/794, tinggiTersedia/1123)`; CSS memakainya melalui `zoom: var(--skala, 1)` pada `.kertas`. Helaian A4 mengecil supaya **seluruh halaman kelihatan sekali pandang** — tiada skrol dalam pratonton, dan tiada skrol halaman di bahagian pratonton
- Dikira semula pada `resize`, `orientationchange`, dan selepas `load` (bila font web selesai dimuat). Skala minimum 0.28 supaya teks tidak jadi terlalu kecil
- Ukuran sebenar dalam Chrome (viewport 1424×749, 1350×617, 1904×929):

| Skrin | Skala | Helaian | Baki bawah | Muat? |
|---|---|---|---|---|
| 1440×900 | 0.541 | 430×608 px | 20 px | ya |
| 1366×768 | 0.424 | 337×476 px | 20 px | ya |
| 1920×1080 | 0.702 | 557×788 px | 20 px | ya |

- Butang **Skrin penuh** (kekunci **Esc** untuk keluar) — panel pratonton menutup seluruh tetingkap, helaian jadi lebih besar sedikit (0.592 pada 1440×900) kerana kekangan lebar ruang borang hilang
- Cetakan **tidak** mengecil: `zoom: 1 !important` dalam `@media print`, jadi PDF kekal saiz A4 penuh (disemak: 595×842 pt, 1 halaman, bbox teks sama seperti sebelum perubahan)
- Telefon: panel tidak melekat (`position: static`) dan skala dikira mengikut lebar skrin

**Fasa 7** — satu reka bentuk sahaja: **Biru & Kelabu**

- Templat *Klasik*, *Eksekutif*, *Minimalis Teal*, *Kemahiran Dulu* dan pemilih `#templat` telah **dibuang**. Fail mengecil **53,051 → 37,298 bait** (−15.4 KB), dan app jadi lebih ringkas untuk dijaga
- Kod pesanan lama yang membawa templat lain (`s: 'klasik'` dan sebagainya) **masih boleh dibuka** — semuanya kini dipaparkan dengan reka bentuk Biru & Kelabu
- Cetakan disemak semula selepas pembersihan: PDF **identik** dengan sebelum pembuangan (959 aksara teks, bbox sama, 1 halaman A4) — tiada regresi pada reka bentuk

**Fasa 8** — aliran 4 halaman (wizard mesra pengguna):

- Halaman 1 **pilih reka bentuk**, 2 **butiran**, 3 **pratonton**, 4 **hantar WhatsApp** — setiap satu `<section class="hal">` dengan atribut `hidden`
- **Pratonton mini di halaman 1 ialah render sebenar** (`htmlBiru(CONTOH)`), bukan gambar: apa yang pelanggan lihat pada kad itu memang apa yang akan dia dapat. Diskalakan dengan `zoom: var(--skala-mini)` (dikira dalam `susunMini()`, dikemas kini pada `resize`)
- **Petunjuk langkah** di atas (4 pil). Langkah yang sudah dilalui bertukar hijau dan boleh diklik semula; langkah yang belum sampai tidak boleh diklik
- **Validasi**: tekan "Seterusnya: Pratonton" tanpa Nama/Telefon → mesej ralat muncul dan medan yang tertinggal terus difokus
- Skop CSS ditukar daripada `#resume` kepada kelas **`.lembar`** supaya helaian utama *dan* pratonton mini boleh berkongsi gaya resume yang sama
- **Cetakan dari mana-mana halaman tetap betul**: `@media print` menyembunyikan `.langkah`, `.nav-bawah`, tajuk halaman dan `#hal-1/2/4`, lalu memaksa `#hal-3 { display: block !important }`. Disemak: cetak dari halaman 2 dan halaman 3 menghasilkan PDF yang **sama** (1 halaman, 595×842 pt)
- **Mod penjual**: `#penjual` membuka halaman butiran (panel penjual + Jana PDF ada di situ), `#kod=<kod>` terus ke halaman pratonton; butang "Hantar ke WhatsApp" disembunyikan (`body.mod-penjual #ke-4`). Cetakan penjual disemak: 811 aksara, tiada tanda air, 1 halaman A4
- Ujian bertambah kepada **169 lulus, 0 gagal** (26 ujian baharu untuk aliran 4 halaman)

**Fasa 9** — antara muka digilap (lebih bersih, lebih mesra pengguna):

- Sistem gaya baharu: token warna (`--brand-soft`, `--ok`, `--sh1/--sh2`), kad putih bersudut bulat + bayang lembut, latar `#f5f8fc`, tajuk guna **Montserrat**, badan guna **Lato** (dua-dua sudah dimuat untuk resume — tiada permintaan rangkaian tambahan)
- Bar atas: lencana jenama berikon SVG + tajuk dua baris (menyimpan ketukan-5-kali Mod Penjual)
- **Penunjuk langkah jadi penunjuk kemajuan**: bulatan bernombor yang bertukar **tanda centang hijau** apabila langkah selesai, langkah semasa bercahaya biru, langkah yang belum sampai tidak boleh diklik. Pada skrin kecil label diganti dengan teks "Langkah 2 daripada 4 · Butiran" (`#langkah-teks`)
- Halaman 1: kad pilihan dengan jalur navy, senarai ciri bercentang hijau, ikon perisai pada nota kepercayaan
- Halaman 2: medan pendek **dua lajur** (`.grid-2`), tanda `*` pada Nama & Telefon (`.wajib`), medan 11px padding (sasaran jari), setiap fieldset jadi kad, baris pengalaman gaya kad, dan **bar tindakan melekat** (`#hal-2 .nav-bawah { position: sticky }`) supaya butang *Seterusnya* sentiasa kelihatan dalam borang yang panjang
- Halaman 3: butang dipindah ke bar atas (`Kembali edit` / `Skrin penuh` / `Seterusnya: Hantar`) supaya helaian A4 dapat ruang penuh — hasilnya **skrol 0px**; ditambah kad sisi **"Semak sebelum hantar"** (4 soalan) yang hanya muncul ≥1080px; butang **Skrin penuh** kini berada di dalam panel dan bertukar `position: fixed` dalam mod skrin penuh, jadi ia tetap boleh diklik untuk keluar (sebelum ini labelnya bertukar tetapi butangnya tersembunyi)
- Halaman 4: kad pengesahan dengan tanda centang hijau, harga dalam pil, butang WhatsApp penuh lebar berlogo SVG, 3 langkah bayaran sebagai garis masa bernombor
- **Skrin kecil (≤760px)**: satu lajur, butang penuh lebar, `header.top p` disembunyikan ≤520px
- **Pepijat cetak yang ditemui semasa penggilapan**: `animation: masuk .3s ease-out both` pada `.hal` menyebabkan `opacity: 0` terbeku semasa cetak — mencetak dari halaman pratonton keluar **PDF kosong**. Dibetulkan dengan `* { animation: none !important; transition: none !important; }` dalam `@media print`, dan `.papan { display: block !important }` supaya grid pratonton jadi blok biasa
- Disahkan dalam Chrome: tiada limpahan mendatar pada mana-mana halaman, skrol pratonton 0px, helaian 361×511 pada 1424×749, butang WhatsApp 566×53, dan **cetakan dari keempat-empat halaman menghasilkan PDF yang identik** (1 halaman, 595×842 pt, 7/7 bahagian)
- Ujian bertambah kepada **198 lulus, 0 gagal**

## Ujian

```bash
cd test && npm install        # sekali sahaja (jsdom)
"$LOCALAPPDATA/hermes/node/node.exe" test/test_ui.js
```

Keputusan semasa: **198 lulus, 0 gagal**.

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
- Templat tambahan (sekarang **satu reka bentuk sahaja** — Biru & Kelabu) dan pilihan warna
- Rekod pesanan (siapa sudah bayar) — sekarang tiada langsung
- Eksport .docx
