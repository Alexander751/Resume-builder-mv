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
2. **Isi butiran** — **pratonton langsung di tepi** (skrin lebar) menunjukkan resume sambil menaip; pelanggan boleh **tambah bahagian sendiri** (cth. Projek, Sijil, Aktiviti), **buang mana-mana bahagian** yang tidak mahu, dan **alih blok** dalam pratonton (seret atau anak panah)
2. **Isi butiran** — Nama + Nombor Telefon wajib; foto, jawatan, ringkasan, pengalaman, pendidikan, kemahiran, bahasa, rujukan → **Seterusnya: Pratonton**
3. **Pratonton** — desktop: helaian A4 penuh + butang **Skrin penuh** + senarai semak "Semak sebelum hantar"; telefon: pratonton **sepenuh skrin** tanpa skrol → **Seterusnya: Hantar**
4. **Hantar** — tekan butang WhatsApp; mesej pesanan + kod resume sudah siap diisi, anda cuma tekan hantar

Pelanggan **tidak** perlu butang cetak — pratonton + hantar melalui WhatsApp sudah cukup. Cetak hanya perlu oleh penjual (lihat bahagian Mod Penjual).

Data disimpan automatik dalam pelayar (localStorage) — pelanggan ulangan akan nampak pilihan **kemas kini** dengan nama resumenya. **Kosongkan** memadam semuanya.

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
- **Mod penjual**: `#penjual` membuka halaman butiran (panel penjual + butang Cetak PDF ada di situ), `#kod=<kod>` terus ke halaman pratonton; butang "Hantar ke WhatsApp" disembunyikan (`body.mod-penjual #ke-4`). Cetakan penjual disemak: 811 aksara, tiada tanda air, 1 halaman A4
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

**Fasa 10** — pratonton skrin penuh pada telefon (tanpa skrol):

- Di telefon, halaman pratonton kini jadi **lapisan tetap sepenuh skrin** (`#hal-3 { position: fixed; inset: 0 }`): bar tajuk di atas, butang tindakan di bawah, helaian A4 di tengah. Skrol halaman dikunci (`body[data-hal="3"] { overflow: hidden }`)
- `.bar-pratonton { display: contents }` supaya `bar-teks` dan `bar-butang` jadi baris flex `#hal-3` — tiada tinggi bar yang dikodkan keras, helaian ambil baki skrin (`flex: 1 1 auto`)
- Dipakai pada **skrin sempit (≤760px) DAN skrin rendah (≤620px)** — jadi telefon landskap dan tetingkap pendek pun dapat pratonton penuh, bukan skrol
- Hasil diukur: telefon 390×844 → helaian **485×686, skrol halaman 0px**; telefon pendek 501×551 → 342×484, skrol 0px; desktop 1440×900 → tidak berubah (lapisan statik, 361×511)
- **Pepijat 1**: `susunSkala()` mengambil lebar daripada **panel** (yang selebar helaian itu sendiri), jadi had lebar tidak pernah dikira dan helaian **terpotong** pada telefon. Kini lebar diambil daripada **bekas** panel (`.papan`), tolak padding/border dan lebar kad semak di sisi
- **Pepijat 2**: helaian ada `overflow: auto` dan tanda air (`inset: -8%`) menjadikannya lebih besar daripada kotak, jadi pelayar sebenar memaparkan **bar skrol dalam** pratonton. Ditukar kepada `overflow: hidden` (helaian sentiasa diskalakan supaya muat)
- **Pepijat 3**: peraturan `@media (max-width: 760px)` **bocor ke mod cetak** (padding `.papan` menambah 16px) menjadikan PDF **2 halaman**. Semua media query lebar kini ditulis `@media screen and (...)` supaya tidak menyentuh cetakan; ditambah `.papan { padding: 0 !important }` dalam `@media print`
- Cetakan disemak semula: dari keempat-empat halaman, dari telefon, dan dari mod penjual — **semuanya identik dengan sebelum perubahan** (1 halaman A4, 595×842pt, 7/7 bahagian)
- Ujian bertambah kepada **214 lulus, 0 gagal**

**Fasa 11** — buang butang "Jana PDF" untuk pelanggan:

- Butang **Jana PDF** dibuang daripada halaman butiran; pelanggan hanya perlu **pratonton** kemudian **hantar melalui WhatsApp**. Kurang satu jalan yang mengelirukan (dan tiada PDF bertanda air yang tersebar secara tak sengaja)
- Cetak dipindahkan ke butang **Cetak PDF** (`#cetak-pdf`) yang **hanya muncul dalam Mod Penjual** (`#cetak-pdf { display: none }` + `body.mod-penjual #cetak-pdf { display: inline-flex }`) — penjual masih boleh hasilkan PDF bersih
- Hantar borang (tekan Enter dalam medan) kini membawa terus ke **halaman pratonton**, bukan mencetak
- Disemak dalam Chrome: pelanggan → `#cetak-pdf` `display: none` (0×0), penjual → `display: flex` (108×44); tiada `#jana` di mana-mana
- Cetakan penjual dari halaman pratonton masih **1 halaman A4, 595×842 pt, tanpa tanda air** (bbox sama seperti sebelum ini)
- Ujian bertambah kepada **219 lulus, 0 gagal**

**Fasa 15** — pratonton di sisi + alih blok (drag) dalam pratonton:

- **Pratonton langsung di sisi borang** (skrin ≥1180px): kad *Pratonton langsung* melekat (sticky) di kanan borang, helaian A4 diskalakan automatik (`data-skala`) dan **dikemas kini setiap kali menaip** — tiada lagi keperluan menekan *Seterusnya* hanya untuk melihat hasil
- Pada skrin kecil: butang terapung **Pratonton resume** membuka pratonton sebagai lapisan penuh (butang **Tutup** untuk kembali) — telefon kekal cepat tanpa mengecilkan borang
- **Mod susun blok**: butang **Susun blok** (ada di sisi borang dan di halaman pratonton) menghidupkan mod alih — setiap blok resume bertanda `data-blok` (Kontak, Kemahiran, Bahasa, Profil, Pengalaman, Pendidikan, Rujukan, bahagian tambahan `t0`, `t1`, …)
  - **Seret** blok: naik/turun dalam lajur sama, atau **lintas lajur** (rel kelabu ↔ lajur kanan); garis biru menunjukkan tempat jatuh
  - **Butang anak panah** pada setiap blok (↑ ↓ ⇄) untuk gerakan tepat — juga jalan mudah pada telefon
  - **Tetapkan semula** memulangkan susunan asal (satu klik)
- Susunan disimpan **dalam data borang + kod pesanan WhatsApp** (kunci ringkas `y`) — Mod Penjual boleh buka semula resume pelanggan dengan susunan yang sama
- Blok dibalut `<div class="blok" data-blok="…">` yang **telus kepada cetakan** (tiada kesan pada susun atur A4) dan alat susun bertanda `.no-print`
- **Disahkan dalam Chrome sebenar** (bukan hanya JSDOM): pratonton sisi 470px dengan helaian 445×629 (skala 0.56); seret **Rujukan** dari lajur kanan ke rel kiri berjaya, dan **cetakan kekal 1 halaman A4** — Rujukan dicetak di rel kiri (x=19.8), Projek di lajur kanan mengikut susunan baru
- **Nota ujian**: drag diuji dalam Chrome dengan `MouseEvent('pointerdown'/'pointermove'/'pointerup')` + koordinat sebenar (JSDOM tiada geometri — `getBoundingClientRect()` memulangkan 0, jadi drag tidak boleh diuji dalam JSDOM); logik gerakan diuji melalui butang anak panah
- Ujian bertambah kepada **288 lulus, 0 gagal**

**Fasa 14** — builder: tambah bahagian sendiri + buang bahagian yang tak mahu:

- **Tambah bahagian sendiri** — butang **+ Tambah bahagian sendiri** di hujung borang: setiap bahagian ada **tajuk** (cth. Kemahiran Profesional, Projek, Sijil, Aktiviti) + **isi satu baris satu item**.
- **Cadangan satu klik** — empat cip siap: **+ Kemahiran Profesional**, **+ Sijil & Latihan**, **+ Projek**, **+ Aktiviti**. Satu klik terus mencipta baris dengan **tajuk sudah diisi** dan kursor di ruang isi — jalan pantas menjawab "template tiada kawasan kemahiran profesional" (terutama di telefon) Ia muncul dalam resume sebagai bahagian baharu di hujung lajur kanan — satu item jadi perenggan, dua item ke atas jadi senarai bulet (gaya sama seperti Pengalaman Kerja)
- **Buang bahagian** — butang **Buang bahagian ini** di penjuru kanan 7 bahagian borang: Jawatan Disasarkan, Ringkasan Profil, Pengalaman Kerja, Pendidikan, Kemahiran, Bahasa, Rujukan. Bahagian yang dibuang **hilang dari pratonton dan PDF cetakan**, tetapi datanya **tidak dipadam** — kotak borang berubah jadi nota *"Bahagian X dibuang dari resume. Tambah balik"*, jadi pelanggan boleh ubah fikiran tanpa mengisi semula
- **Hapus baris** — setiap baris Pengalaman / Pendidikan / bahagian tambahan sudah ada butang **Hapus**
- Bahagian tambahan dan senarai dibuang **disimpan dalam kod pesanan WhatsApp** (kunci ringkas `a` = tambahan, `x` = dibuang) — jadi Mod Penjual boleh buka semula resume pelanggan dan sambung kerja
- Disahkan dalam Chrome sebenar: bahagian **Projek** (2 item) masuk pratonton + **Bahasa dibuang** hilang dari pratonton; **cetakan kekal 1 halaman A4** dengan bahagian tambahan dimasukkan
- **Nota ujian**: `closest()` pada `#borang` mesti dihadkan kepada `button[data-sek]` — jika tidak, klik pada butang **+ Tambah Pengalaman** (yang berada DALAM fieldset boleh buang) akan tersalah dianggap sebagai "buang bahagian Pengalaman"
- Ujian bertambah kepada **262 lulus, 0 gagal**
- Tambahan kemudian (cip cadangan satu klik): blok **Kemahiran Profesional** dengan 4 item dirender sebagai senarai bulet di lajur kanan dan **cetakan kekal 1 halaman A4** (disahkan dalam Chrome); blok itu juga boleh dialih (cth. ke rel kiri); ujian **298 lulus, 0 gagal**

**Fasa 16 — Templat kedua: Biru Bersih + daftar templat**

Permintaan: "kalau saya masukkan template baru macam mana awak integrasi?" (rujukan dihantar:
`Blue and White Clean and Professional Resume.pdf`).

- **Daftar templat** — `var TEMPLAT = { biru: {...}, bersih: {...} }` + `KUNCI_TEMPLAT` + `htmlTemplat(d)`.
  `papar()`, `susunMini()` dan kad pilihan halaman 1 semuanya guna satu jalan render ini.
  Templat seterusnya = satu entri + fungsi render + blok CSS + kad (panduan penuh: `TEMPLAT-BARU.md`).
- **Halaman 1 kini dua kad reka bentuk** (Biru & Kelabu, Biru Bersih) dengan pratonton mini sebenar;
  klik kad → `aria-pressed` + pratonton bertukar serta-merta. Pilihan disimpan dalam kod pesanan (`s`).
- **Templat Biru Bersih** — diukur terus daripada PDF rujukan (A4 595.5 x 842.2 pt):
  tepi 12.5mm, nama Inter Bold 20pt #00366d, tajuk bahagian Inter Bold 12pt dengan garis 1pt navy,
  badan Inter Regular 10.5pt #1e1e1e (tinggi baris 14.3pt), bulet 3pt, kontak berlabel sebaris,
  foto segi empat naik ke penjuru atas. Satu lajur → mesra ATS.
- **Susun blok dalam satu lajur** — `urutanSatu()` (kiri + kanan sebagai satu aliran), `rapikanSatuLajur()`;
  anak panah pindah lajur disembunyikan kerana tiada lajur, tetapi naik/turun dan seret tetap berfungsi.
- **Cetakan** — `.lembar .cv-bersih { min-height: auto }`, tajuk `break-after: avoid` (tajuk tidak terpisah
  daripada isinya), item tidak dipotong. Disahkan Chrome: data paling padat (3 pengalaman, 6 poin, 2 pendidikan,
  kemahiran, bahasa, rujukan, 1 bahagian tambahan) **cetak 1 halaman A4**, teks terakhir y=813.8 daripada 842.
- **Ujian** — blok 24 (24 ujian baharu): tukar reka bentuk, struktur satu lajur, kod pesanan menyimpan templat,
  susun blok satu lajur, buang bahagian, bahagian tambahan. Jumlah **322 lulus, 0 gagal**.

**Fasa 17 — Isi sikit: halaman tidak lopong (auto-renggang)**

Masalah yang dilaporkan: "kalau info sikit sangat letak, nanti pdf resume akan jadi lopong".

- **Auto-renggang** — `larasRuang()` mengukur tinggi isi sebenar (bukan tinggi helaian) dan menaikkan
  pemboleh CSS `--renggang` (1.0-1.6x) supaya jarak antara bahagian mengisi halaman sampai ~86%.
  Nilai ditulis pada **kedua-dua** helaian (`#resume` dan `#sisi-kertas`) dan kekal semasa cetak,
  sebab ia pemboleh CSS biasa - bukan transformasi skrin sahaja.
- **Perlindungan dua lapis**: had 1.6x dan pemeriksaan `tinggi > siling` (1123 - 10 px) supaya
  renggangan tidak pernah menyebabkan halaman kedua.
- **Nota jujur kepada pelanggan** (`#nota-lapang`) pada halaman pratonton bila halaman kurang **55%** penuh,
  menyenaraikan apa yang boleh ditambah (Kemahiran, Bahasa, bahagian sendiri Projek/Sijil/Aktiviti).
  Nota ini `no-print` (tidak masuk PDF) dan mesej status juga menyebutnya.
- **Disahkan Chrome** (templat Biru Bersih):
  isi sederhana (1 pengalaman + 2 poin, pendidikan, kemahiran, bahasa, rujukan) → renggang 1.48,
  halaman **85% penuh**, nota tersembunyi, cetakan **1 halaman** (teks terakhir y=675/842);
  isi sangat sikit (1 pengalaman 1 poin, 1 kemahiran) → renggang 1.6 (maksimum), halaman 32% penuh,
  nota **dipaparkan**, cetakan kekal **1 halaman**.
- **Ujian** — blok 25 (13 ujian baharu). Jumlah **339 lulus, 0 gagal**.

**Fasa 18 — Isi terlalu banyak: auto-padat + nota 2 halaman**

Masalah pasangan kepada Fasa 17: "macam mana kalau pelanggan isi terlalu banyak info" (melimpah ke halaman 2
dengan halaman terakhir hampir kosong).

- **Auto-padat** — `larasRuang()` kini dua hala. Kalau isi melebihi halaman, ia cuba tiga tahap berturut-turut
  (`--renggang`/`--teks` = 0.86/0.97 lalu 0.78/0.94 lalu 0.72/0.93) dan berhenti sebaik muat satu halaman.
  Kalau ketiga-tiganya gagal, saiz **dikembalikan kepada 1.0** - tidak guna mengecilkan teks kalau ia tetap
  2 halaman (kebolehbacaan diutamakan).
- **--teks** (skala fon 0.93-1) ditambah pada semua saiz fon templat (nama, tajuk, badan, tempoh, sub);
  `--renggang` kini dibenarkan turun bawah 1 untuk mod padat.
- **Nota & mesej status** — bila isi melebihi satu halaman, pelanggan diberitahu terus: akan dicetak 2 halaman,
  dan cara untuk kembali ke 1 halaman (padam poin kurang penting, pendekkan Ringkasan, buang bahagian).
  Kini berfungsi untuk **kedua-dua** templat: templat dua lajur diukur melalui tinggi banner + lajur tertinggi.
- **Disahkan Chrome** (templat Biru Bersih): 2 pengalaman x 3 poin → 92% halaman, 1 halaman cetak;
  3 x 3 → auto-padat 0.86/0.97, 96%, **1 halaman**; 3 x 4 → 0.78/0.94, 98%, **1 halaman**;
  5 x 4 → 128% (tidak boleh dipadatkan lagi) → saiz normal, nota dipaparkan, cetak **2 halaman**
  (halaman 1 penuh sehingga y=795/842). Templat Biru & Kelabu dengan 5 x 4 → 165%, nota tetap dipaparkan.
- **Ujian** — blok 26 (12 ujian baharu). Jumlah **351 lulus, 0 gagal**.

**Fasa 19 — Rujukan mesra pengguna + halaman 2 berdesign sama**

Tiga permintaan: (1) ruang rujukan jangan paksa taip berkoma, (2) kad reka bentuk duduk di atas (tidak
ditengahkan menegak), (3) kalau isi terlalu banyak, halaman kedua mesti berdesign sama.

- **Rujukan berstruktur** — textarea tunggal diganti dengan baris berulang seperti Pengalaman:
  **Nama**, **Jawatan & syarikat**, **Telefon atau e-mel**. Butang **+ Tambah rujukan** dan **Hapus** setiap baris.
  Data disimpan sebagai senarai objek (`{nama, jawatan, telefon}`) - tiada koma, tiada format yang perlu dihafal.
  Kod pesanan kod menyimpannya sebagai `u: [{n,j,t}]`; kod **lama** (rujukan sebagai teks satu baris satu orang)
  tetap dibaca betul (`senaraiRujukan()` menerima kedua-duanya).
- **Cetakan halaman 2+ berdesign sama** — `.cetak-berulang` dengan `position: fixed` (Chrome mencetaknya pada
  **setiap** halaman): jalur atas 5mm berwarna ikut reka bentuk (`--jalur`) + kaki halaman dengan nama & jawatan.
  Untuk templat dua lajur, rel kelabu 65mm juga diteruskan (`body[data-templat="biru"] .cb-rel`), dengan
  `z-index` supaya teks lajur kekal di atas rel.
- **Warna dipaksa cetak** — `print-color-adjust: exact` supaya reka bentuk tidak hilang kalau pelanggan
  mematikan "background graphics".
- **Kad reka bentuk rata atas** — `.kad-pilih { align-items: start }` (pratonton mini tidak lagi ditengahkan
  menegak) + padding bawah templat ditambah supaya baris terakhir tidak tertindih kaki halaman.
- **Disahkan Chrome** (2 halaman cetak): templat Biru Bersih - jalur navy `#00366d` dan kaki nama muncul pada
  **kedua-dua** halaman; templat Biru & Kelabu - jalur `#323b4c` + **rel kelabu 65mm berterusan** pada halaman 2
  (piksel x=30, y=300 dan y=600 = (227,227,227)) + kaki nama pada kedua-dua halaman.
- **Ujian** — blok 27 (24 ujian baharu). Jumlah **379 lulus, 0 gagal**.

**Fasa 20 - Skala tahap penguasaan 1-5 (Bahasa & Kemahiran)**

- **Borang** - medan berkoma dibuang. Setiap kemahiran/bahasa ialah satu baris: **nama** + butang **1-5**
  (sasaran sentuh 42x40px). Teks bawah butang menunjukkan tahap: "Tahap 4 / 5 - Sangat mahir"
  (1 Asas, 2 Sederhana, 3 Mahir, 4 Sangat mahir, 5 Pakar). Butang **+ Tambah** dan **Hapus** setiap baris.
- **Resume** - setiap item dirender dengan **lima titik**: titik penuh ikut tahap, titik kosong selebihnya
  (cth. AutoCAD tahap 5 = lima titik penuh, MS Excel tahap 4 = empat penuh). Titik dilukis dengan CSS
  (`border-radius: 50%`, 3.4pt) supaya cetak konsisten - bukan aksara Unicode.
  - Templat Biru & Kelabu: titik penuh `#323b4c`, kosong `#c2c9d3` (rel kelabu).
  - Templat Biru Bersih: titik penuh `#00366d`, kosong `#d3dae4`.
  - Setiap skala ada `aria-label="Tahap N daripada 5"` untuk pembaca skrin.
- **Keserasian kod lama** - kod pesanan lama menyimpan kemahiran/bahasa sebagai teks berkoma. Ia tetap dibaca,
  tetapi **tidak direka tahap**: borang menunjukkan "Belum dipilih" dan resume dirender **tanpa titik skala**.
- **Kod pesanan** - `k: [{n,p}]`, `b: [{n,p}]` (nama + tahap). Data lama (teks) mempunyai panjang berbeza tetapi
  kod pesanan kekal di bawah had URL.
- **Disahkan Chrome** (ukur gaya sebenar dalam pelayar): templat dua lajur - AutoCAD (5) = lima titik `rgb(50,59,76)`,
  MS Excel (3) = tiga penuh + dua `rgb(194,201,211)`; templat satu lajur - titik penuh `rgb(0,54,109)`.
  Cetakan kedua-dua templat dengan 5 kemahiran + 3 bahasa kekal **1 halaman A4**.
  *Bug ditemui semasa pengesahan:* titik penuh templat dua lajur tiada warna sendiri (skala kelihatan sama
  dengan titik kosong) - dibetulkan sebelum dikomit.
- **Ujian** - blok 28 (34 ujian baharu). Jumlah **421 lulus, 0 gagal**.

**Fasa 21 - Butiran satu per satu (wizard 8 langkah) + kad tambahan bulat**

- **Halaman butiran kini 8 langkah kecil**, satu topik satu langkah: (1) Butiran Peribadi, (2) Jawatan
  Disasarkan + Profil, (3) Pengalaman Kerja, (4) Pendidikan, (5) Kemahiran, (6) Bahasa, (7) Rujukan,
  (8) Tambahan (pilihan). Pengguna isi satu bahagian, tekan **Seterusnya**, terus ke bahagian berikutnya.
- **Bar navigasi langkah** (`#lk-nav`, `position: sticky` di bawah skrin supaya sentiasa boleh ditekan):
  kiraan "Langkah 5 / 8", tajuk langkah, jalur kemajuan, **8 bulatan bernombor** (boleh tekan untuk lompat
  terus ke mana-mana langkah; bulatan yang sudah dilihat jadi hijau lembut, yang aktif jadi warna jenama),
  dan butang **Kembali / Seterusnya**. Pada langkah terakhir butang bertukar jadi "Seterusnya: Pratonton".
  Bar ini bertanda `no-print` - tidak masuk ke dalam PDF.
- **Nota mesra** (`#lk-nota`) memberitahu apa yang belum diisi ("Belum diisi: nama dan nombor telefon"),
  tanpa menghalang pengguna daripada terus mengisi bahagian lain. Nama & telefon tetap disemak sebelum
  pratonton pada akhirnya.
- **Langkah Tambahan (pilihan)** dibina semula sebagai kad bulat: 4 kad siap-pakai (Kemahiran Profesional,
  Sijil & Latihan, Projek, Aktiviti) setiap satu dengan **ikon bulat sendiri** (SVG, bukan emoji) + satu kad
  "Tulis bahagian sendiri" dengan bulatan `+`. Kad disusun dalam grid (2 lajur di telefon), ada gerak naik
  bila ditunjuk, dan boleh ditekan lebih daripada sekali.
- **Muatan segar**: sebelum ini senarai Kemahiran, Bahasa dan Rujukan bermula **kosong** (hanya Pengalaman dan
  Pendidikan dapat satu baris). Kini kesemuanya bermula dengan satu baris sedia untuk diisi - ditemui semasa
  membina wizard, apabila baris pertama tidak wujud pada muatan baru.
- **Disahkan Chrome**: bar langkah `position: sticky` betul dalam pelayar; bulatan 31x31 `border-radius: 50%`;
  bulatan aktif `rgb(18,80,140)` teks putih, bulatan sudah dilihat `rgb(241,251,246)` teks hijau
  `rgb(15,122,86)` (ukur `getComputedStyle`); kad 16px radius dengan ikon bulat 31px; cetakan PDF dengan
  wizard ini kekal **1 halaman A4** dan tiada teks borang masuk ke dalam PDF.
- **Ujian** - blok 29 (59 ujian baharu, termasuk muatan segar). Jumlah **480 lulus, 0 gagal**.

**Fasa 26 - Butang dalaman "Kembali/Pratonton" yang masih muncul di penjuru bawah**

- **Bug**: butang pratonton/kembali lama disimpan sebagai butang dalaman dengan atribut `hidden`, tetapi
  peraturan `.nav-bawah { display: flex; ... }` **mengalahkan** atribut `hidden` (atribut hanya bergantung
  pada gaya lalai pelayar). Kesannya dua butang muncul semula di penjuru bawah skrin - betul-betul seperti
  yang pelanggan tunjukkan - walaupun butang itu sepatutnya tidak kelihatan.
- **Pembetulan**: (1) tambah peraturan global `[hidden] { display: none !important; }` supaya atribut hidden
  sentiasa menang atas apa-apa `display` dalam CSS; (2) bekas butang dalaman tidak lagi memakai kelas
  `.nav-bawah` (jadi tiada `display: flex` dikenakan padanya). Gaya `.nav-bawah` kekal untuk bar halaman hantar.
- **Pengesahan Chrome**: bekas dalaman `display: none` (0x0), `#ke-3` dan `#balik-2` tiada kotak, dan
  imbasan semua butang di penjuru bawah skrin (1656x854) mendapati **tiada butang tersasar**.
- **Ujian** - blok 34. Jumlah **574 lulus, 0 gagal**.

**Fasa 25 - Pratonton hanya selepas langkah 8 + galeri reka bentuk beranimasi**

- **Satu sahaja jalan ke pratonton**: sebelum ini ada DUA butang pratonton yang sentiasa kelihatan -
  titik "3 Pratonton" pada bar langkah di atas dan bar "Seterusnya: Pratonton" yang melekat di bawah
  halaman butiran. Pelanggan yang belum habis mengisi mudah terkena salah satu. Kini:
  bar langkah hanya 3 titik (Reka bentuk, Butiran, Hantar), dan butang pratonton/kembali lama disimpan
  sebagai butang **dalaman tersembunyi** yang hanya dicetuskan oleh butang "Seterusnya: Pratonton"
  pada langkah 8. Hantar tetap terkunci sehingga pratonton dilawati (`HAL_MAKS`).
- **Galeri reka bentuk baharu**: kad dijana oleh JavaScript daripada senarai `TEMPLAT` (`paparKadTemplat()`),
  jadi menambah reka bentuk baharu hanya perlu **satu entri** dalam `TEMPLAT` - kad, pratonton mini dan
  kiraan muncul sendiri. Entri templat kini ada `aksen` (warna kad) dan `ciri` (2-3 ciri tanda centang).
- **Animasi**: kad masuk berperingkat (`@keyframes kadMasuk`, lewat `--i * 80ms`), terangkat dan bayang
  mendalam semasa hover (`@media (hover: hover)` supaya tidak melekat di telefon), kilau melintas pada
  pratonton mini, lencana "Dipilih" muncul dengan `@keyframes pilPop`, dan maklum balas :active semasa ditekan.
  Semua animasi dimatikan dalam `prefers-reduced-motion`.
- **Telefon**: galeri bertukar menjadi jalur leret-menjadi (`scroll-snap-type: x mandatory`, satu kad 84%
  lebar skrin) dengan petunjuk "Leret untuk lihat reka bentuk lain".
- **Disahkan Chrome**: 2 kad bersebelahan (309x644px), mini dirender (`--skala-mini` 0.35), animasi
  `kadMasuk 0.5s`, aksen `#323b4c` / `#00366d`, bar langkah 3 titik, butang pratonton lama tersembunyi;
  pada lebar telefon galeri `display: flex` boleh dileret (472 -> 802px) dengan snap.
- Cetakan PDF tidak terjejas (1 halaman, galeri tidak masuk PDF).
- **Ujian** - blok 33 (20 ujian baharu) + kemas kini ujian 18. Jumlah **568 lulus, 0 gagal**.

**Fasa 24 - Mesra telefon: tidak lagi tersalah tekan ke pratonton**

- **Punca utama ditemui**: `#borang` ialah `<form>`, jadi kekunci "Pergi/Next" pada papan kekunci telefon
  menghantar borang secara senyap. Pengendali `submit` dahulu terus membawa ke pratonton, jadi pelanggan
  yang baru selesai menaip nama/telefon tiba-tiba sudah berada di halaman pratonton walaupun belum mengisi
  bahagian lain.
  Pembetulan: (1) Enter biasa **tidak** menghantar borang - ia memindahkan fokus ke medan seterusnya
  **dalam langkah yang sama** (fungsi `fokusSeterusnya()`); (2) `submit` tanpa niat diabaikan sepenuhnya;
  (3) hanya **Ctrl+Enter** (sengaja) membawa ke pratonton; (4) medan mendapat `enterkeyhint="next"` supaya
  papan kekunci telefon memaparkan "Next", bukan "Pergi".
- **Punca kedua**: bar langkah yang melekat (`position: sticky; bottom: 8px`) menutupi medan terakhir
  sesuatu langkah. Bila papan kekunci terbuka, pelanggan yang menekan medan itu sebenarnya menekan
  "Seterusnya". Pembetulan: bar **mengecil** menjadi jalur nipis (`dikecilkan`, butang dan bulatan
  disembunyikan) sementara ada medan dalam borang yang menerima fokus, dan kembali besar apabila fokus
  keluar. Disahkan Chrome pada 390x700: bar 214px -> **37px** semasa menaip.
- **Penjaga dua ketukan**: pada langkah terakhir, jika masih ada bahagian kosong (Ringkasan/Pengalaman/
  Pendidikan/Kemahiran/Bahasa/Rujukan - bahagian yang dibuang pelanggan dikecualikan), ketukan pertama
  hanya memaparkan amaran "Belum diisi: ... Tekan sekali lagi untuk terus ke pratonton", ketukan kedua
  barulah ke pratonton. Bila semua lengkap, satu ketukan sahaja.
- Tambahan: pada telefon `#borang` diberi `padding-bottom: 168px` (ruang skrol) dan bulatan langkah
  dibesarkan ke 32px untuk sasaran jari.
- **Ujian** - blok 32, kemas kini ujian 3 dan 19 (kelakuan Enter lama). Jumlah **543 lulus, 0 gagal**.

**Fasa 23 - Foto bulat + jidar untuk templat Biru Bersih**

- **Masalah**: foto templat Biru Bersih ialah segi empat dengan `left: -3mm`. Kerana unsur
  `position: absolute` dikira dari *padding box* (bukan kotak kandungan), `-3mm` bermakna gambar itu
  terkeluar **3mm dari tepi kertas** - sebab itu ia nampak rapat dan terpotong di tepi. Templat
  Biru & Kelabu pula fotonya bulat (`border-radius: 50%`), jadi kedua-dua templat tidak selaras.
- **Pembetulan**: foto Biru Bersih kini **bulat 42mm** (sama bahasa reka bentuk dengan Biru & Kelabu),
  diletakkan pada `left: 12.5mm; top: 10mm` - sejajar dengan jidar teks - dengan gelang halus
  `box-shadow: 0 0 0 .8mm #dbe7f4`. Teks identiti digeser ke `margin-left: 47mm` supaya ada jarak
  4.8mm dari bulatan. Tinggi kepala dijadikan tetap `50mm` (dulu `calc(52mm * var(--renggang))`)
  supaya foto saiz tetap tidak pernah dihimpit/bertindih dengan teks di bawahnya dalam mod padat.
- **Disahkan pada PDF cetakan**: gambar bulat sepenuhnya dalam kertas (x 11.6-55.3mm, y 9.3-52.9mm),
  tiada pertindihan dengan teks (nama bermula x=59.5mm, RINGKASAN bermula y=60.1mm), jalur halaman
  0-5mm tidak bertindih dengan foto. Resume sederhana (2 pekerjaan) kekal **1 halaman**; resume
  sangat panjang (3 pekerjaan x 4 bulet + 6 kemahiran + 3 bahasa + 2 rujukan) memang **2 halaman**
  dengan reka bentuk halaman kedua yang sama.
- **Ujian** - blok 31 (12 ujian baharu) + kemas kini ujian tinggi kepala. Jumlah **518 lulus, 0 gagal**.

**Fasa 22 - UI padat + bar jenama profesional + pratonton skrin penuh**

- **UI dipadatkan** (pengguna kata borang "besar sangat"): jarak halaman 22/20/60 -> 16/18/40px, tajuk halaman
  22 -> 19px, kad fieldset 16/20/22 -> 12/15/14px, label 14px -> 10px jarak, medan input 11/13 -> 9/11px dengan fon
  14.5 -> 14px, kad baris dan butang 1-5 (42x40 -> 38x34px) serta butang utama dikecilkan, bar langkah butiran
  13/15/12 -> 11/13/10px, bulatan langkah 31 -> 29px. Semua masih melebihi sasaran sentuh 34px.
- **Bar jenama dibina semula supaya nampak profesional**: garis aksen gradien 3px di atas, lencana monogram
  38x38px dengan gradien navy + sorotan dalam (nampak timbul) + ikon dokumen dengan percikan kilau (SVG),
  wordmark 18.5px, label **MV** dalam kotak huruf berjarak, slogan faedah ("Resume A4 siap cetak - tanpa daftar
  akaun - hantar terus melalui WhatsApp"), dan tiga lencana kepercayaan (A4 / Siap cetak / 2 reka bentuk) yang
  disembunyikan di telefon.
- **Pratonton kini benar-benar skrin penuh**: sebelum ini ambang "skrin rendah" ialah 620px, jadi laptop biasa
  (tinggi skrin ~650-780px) terlepas dan helaian A4 menjadi kecil (skala 0.28) sedangkan halaman masih berskrol.
  Ambang dinaikkan ke **820px**, dan pada halaman pratonton bar jenama + penunjuk langkah + baris kecil tajuk
  dibuang (`body[data-hal="3"]`) supaya helaian dapat seluruh tinggi skrin.
  Disahkan Chrome: pada tetingkap 1424x679 helaian 534px tinggi (79% skrin), tiada skrol; pada 1904x929 skala 0.66.
- **Disemak semula**: semua media query lebar kini `@media screen and (...)` (elak gaya telefon bocor ke cetakan).
- **Ujian** - blok 30 (30 ujian baharu). Jumlah **506 lulus, 0 gagal**.

**Fasa 13** — muat naik resume lama **dibuang** (keputusan pengguna):

- Ciri muat naik resume (PDF / Word / teks) dengan auto-isi telah dibangunkan penuh, diuji, dan **kemudian dibuang atas permintaan pengguna** kerana bacaan fail tidak cukup boleh dipercayai untuk pelanggan awam
- Bukti yang mengesahkan keputusan itu: pembaca PDF terbina dalam berjaya membaca PDF eksport **Word** (586 aksara, semua medan betul) tetapi **gagal (0 aksara)** pada **PDF cetakan Chrome/Canva/Google Docs** — iaitu format yang paling kerap pelanggan ada. Punca: PDF jenis itu menyimpan fon subset dalam objek termampat/xref stream, jadi peta ToUnicode tidak dapat dipulihkan
- Pelajaran: untuk app layan diri, **jangan tawarkan pilihan yang boleh gagal** — pelanggan yang muat naik fail dan dapat hasil kosong akan hilang kepercayaan pada seluruh app
- Apa yang **kekal** (nilai sebenar tanpa risiko): autosimpan dalam peranti + nota kecil di halaman 1 — "Resume terakhir di peranti ini: **<nama>**. Tekan Mula Isi Butiran untuk sambung, atau *mula kosong (buang dari peranti)*" (dengan pengesahan `confirm`)
- Dibuang bersama ciri ini: pembaca DOCX (`DecompressionStream`), pembaca PDF terbina dalam (`objekPdf`, CMap/ToUnicode), pdf.js, dan penghurai resume (`huraiTeks`/`huraiPengalaman`/`huraiPendidikan`) — fail kembali daripada 106 KB kepada **66 KB**
- Ujian: **236 lulus, 0 gagal** (blok ujian muat naik diganti dengan ujian "satu CTA + nota simpanan peranti")

**Fasa 12** — pilihan "resume baru" vs "kemas kini resume lama" **dibuang**:

- Asalnya: pil pilihan + tampal kod (Fasa 12) → kemudian muat naik fail (Fasa 13) → kedua-duanya dibuang
- Sebab yang sama: jalan pemulihan yang memerlukan input teknikal daripada pelanggan (kod panjang) atau fail yang mungkin gagal dibaca hanya menambah pintu yang boleh tersangkut
- Halaman 1 kini: **satu kad reka bentuk + satu CTA** (+ nota simpanan peranti bila ada data lama)

**Fasa 11** — buang butang "Jana PDF" untuk pelanggan:

- Butang **Jana PDF** dibuang daripada halaman butiran; pelanggan hanya perlu **pratonton** kemudian **hantar melalui WhatsApp**. Kurang satu jalan yang mengelirukan (dan tiada PDF bertanda air yang tersebar secara tak sengaja)
- Cetak dipindahkan ke butang **Cetak PDF** (`#cetak-pdf`) yang **hanya muncul dalam Mod Penjual** (`#cetak-pdf { display: none }` + `body.mod-penjual #cetak-pdf { display: inline-flex }`) — penjual masih boleh hasilkan PDF bersih
- Hantar borang (tekan Enter dalam medan) kini membawa terus ke **halaman pratonton**, bukan mencetak
- Disemak dalam Chrome: pelanggan → `#cetak-pdf` `display: none` (0×0), penjual → `display: flex` (108×44); tiada `#jana` di mana-mana
- Cetakan penjual dari halaman pratonton masih **1 halaman A4, 595×842 pt, tanpa tanda air** (bbox sama seperti sebelum ini)
- Ujian bertambah kepada **219 lulus, 0 gagal**

**Fasa 13** — muat naik resume lama (PDF / Word / teks) dan auto-isi:

- Pilihan "tampal kod" **dibuang**; pelanggan kini **memuat naik fail resume lama**: butang **Pilih fail resume lama** atau **seret & lepas** ke zon putus-putus (terima `.pdf`, `.docx`, `.txt`, `.md`)
- **Semua bacaan berlaku dalam pelayar** — fail tidak dimuat naik ke mana-mana pelayan (nota privasi di bawah zon)
- **Pembaca fail terbina dalam** (tiada pelayan, tiada API, kekal satu fail):
  - `.docx` → ZIP dibaca sendiri + `DecompressionStream('deflate-raw')` + `word/document.xml` → teks (disahkan pada fail Word sebenar: semua medan betul)
  - `.pdf` → pdf.js dari CDN (jika ada, had 8 saat) → sandaran **pembaca PDF terbina dalam**: parse objek, nyahmampat Flate (had 2.5s setiap strim), **ToUnicode CMap** (bfchar/bfrange), operator `Tj`/`TJ`/`Tf`/`Td`, peta fon gabungan + sandaran kod mentah
  - `.txt`/`.md` → terus; `.doc` (Word lama) dan format lain → ditolak dengan arahan jelas (Save As → PDF/.docx)
- **Penghurai resume** mengisi: nama (pemarkahan baris teratas), telefon (format Malaysia, tahan pemisah berbilang & baris terpecah), e-mel, lokasi (senarai negeri/bandar), jawatan, profil, kemahiran, bahasa, rujukan, **pengalaman** (jawatan/syarikat/tempoh/poin — sauh tarikh) dan **pendidikan** (kelulusan/institusi/tahun)
- Panel hasil memaparkan apa yang dijumpai (`Nama: … · Telefon: … · 2 pengalaman kerja …`) + butang **Guna butiran ini** / **Pilih fail lain**; log mengingatkan "semak setiap medan"
- PDF imej/scan dikesan → mesej jujur ("nampaknya imej atau scan"), **tiada data rekaan**
- Disahkan dalam Chrome sebenar: `.docx` Word → semua medan + poin pengalaman masuk borang; PDF eksport Microsoft Word → 586 aksara dibaca pembaca terbina dalam (tanpa CDN) → nama/telefon/e-mel/jawatan/lokasi/kemahiran/bahasa/2 pengalaman/1 pendidikan diisi; PDF scan → mesej jujur
- **Had yang diakui**: daripada PDF, **poin pengalaman** kadangkala tidak terbaca (fon subset tanpa ToUnicode) — medan utama tetap masuk, pelanggan boleh tampal poin itu sendiri; pdf.js (bila tersedia) membaca lebih lengkap
- Pepijat dibetulkan semasa fasa ini: pdf.js **memindahkan ArrayBuffer** (`buf.slice(0)` sebelum ia detach), pdf.js boleh **tergantung** (had masa 8s + `.catch` pada semua laluan baca), strim PDF rosak menyekat bacaan (had 2.5s/strim), slicing guna `/Length` tepat, "BAHASA" dianggap tajuk seksyen (isi hilang), lokasi tersalah ambil nama syarikat, baris poin tanpa bullet, dan baris PDF terpecah (`012` / `-` / `3456789`)
- Ujian bertambah kepada **282 lulus, 0 gagal**

**Fasa 12** — pilihan "resume baru" vs "kemas kini resume lama" (selepas pilih reka bentuk):

- Halaman 1 kini ada blok pilihan: pil **Resume baru** (isi dari kosong) dan **Kemas kini resume lama** (muat naik fail resume lama)
- Pilih "kemas kini" → kotak muat naik terbuka: fail dibaca dan dihurai, kemudian butang **Guna butiran ini** membawa terus ke halaman butiran dengan **semua detail sudah terisi**
- **Pelanggan ulangan dikesan automatik**: kalau ada resume dalam `localStorage`, app terus pilih pil "kemas kini", buka kotak kod dan papar nota "Ada resume disimpan dalam peranti ini: <nama>" + butang **Guna resume terakhir: <nama>**
- Kod tidak sah → mesej merah pada kotak kod (`Kod resume tidak sah atau tidak lengkap…`), kekal di halaman 1, kod yang salah tidak dipadam; kod kosong + tekan CTA → terus ke butiran tanpa ralat
- Buang data tersimpan hanya melalui pautan eksplisit **"buang dari peranti ini"** (+ `confirm`) — tiada pemadaman senyap
- `kosongkanBorang()` dikongsi antara butang **Kosongkan** dan pautan buang; selepas kosong, satu baris pengalaman/pendidikan kosong ditinggalkan sebagai tempat isi
- Disemak dalam Chrome (4 senario): peranti baru → pil "resume baru", kotak tertutup; pelanggan ulangan → pil "kemas kini" + nota nama; kod salah → mesej merah, kekal halaman 1; kod sah → halaman butiran dengan `Siti Nurhaliza / 013-9998877 / Pembantu Tadbir / Syarikat Maju / Politeknik Kuantan` dan pratonton dikemas kini
- Ujian bertambah kepada **260 lulus, 0 gagal** (termasuk satu JSDOM kedua dengan `localStorage` disemai untuk meniru pelanggan ulangan)

## Ujian

```bash
cd test && npm install        # sekali sahaja (jsdom)
"$LOCALAPPDATA/hermes/node/node.exe" test/test_ui.js
```

Keputusan semasa: **574 lulus, 0 gagal**.

## Aliran jualan melalui WhatsApp (tanpa gerbang bayaran)

Tiada gerbang bayaran, tiada pelayan — jadi tiada yuran transaksi dan tiada data pelanggan disimpan.

| Pihak | Langkah |
|---|---|
| Pelanggan | Isi borang → pratonton ada **tanda air** ("PRATONTON · BELUM DIBAYAR") → tekan **Hantar Pesanan ke WhatsApp** |
| Pelanggan | WhatsApp terbuka dengan mesej siap: nama, telefon, harga, dan **kod resume** (satu rentetan panjang) |
| Anda | Terima pesanan, minta bayaran (DuitNow QR / pindahan bank) |
| Anda | Buka laman dengan `#penjual` → tampal kod ke kotak **Mod Penjual** → **Buka Kod** → resume pelanggan muncul **tanpa tanda air** |
| Anda | Buka kod pelanggan dalam Mod Penjual → tekan **Cetak PDF** (atau Ctrl+P) → hantar PDF bersih kepada pelanggan |

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
| Butang Cetak PDF tidak kelihatan | Ia hanya muncul dalam **Mod Penjual** (pelanggan tidak perlu cetak) | Buka `/#penjual` atau ketuk tajuk 5 kali |
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
