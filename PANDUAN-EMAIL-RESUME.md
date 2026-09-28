# PANDUAN SETUP: EMAIL RESUME OTOMATIK (Resume Builder MV)

Panduan ini memasang ciri **email resume pelanggan**: bila pelanggan tekan butang WhatsApp, resume dia masuk ke Google Sheet + email penjual **serta-merta**, dan PDF menyusul dalam email kedua selepas PC penjual render PDF.

**Masa diperlukan:** 15-20 minit (Bahagian 1 paling lama).
**Apa yang anda perlukan:** akaun Google (Gmail), PC penjual, dan fail `EmailResume.gs`.

| Bahagian | Buat apa |
|---|---|
| 1 | Pasang Google Sheet + Apps Script, deploy jadi Web app, salin URL |
| 2 | Tampal URL + token ke dalam app (Mod Penjual) |
| 3 | Jalankan helper di PC (`mula-email-resume.bat`) |
| 4 | Penyelesaian masalah |
| 5 | Nota privasi (PDPA) |

---

## Bahagian 1 - Pasang di Google (sekali sahaja)

### 1.1 Cipta sheet

1. Buka **https://sheets.new** dalam pelayar.
2. Klik nama fail di kiri atas, taip **Resume MV**, tekan Enter.
3. Perhatikan nama tab di bawah (biasanya "Sheet1"). Klik kanan tab itu > **Rename** > taip tepat: **ResumeMV** > Enter.
   - Mesti tepat `ResumeMV` (huruf besar, tiada ruang). Helper di PC cari nama ini.

Tajuk kolum **tidak perlu** anda taip - skrip akan tulis sendiri.

### 1.2 Buka Apps Script

4. Dalam sheet itu: menu **Extensions** > **Apps Script**. Tab baharu akan terbuka.
5. Di kiri atas ada nama "Untitled project" - klik dan tukar jadi **EmailResume** (pilihan, untuk senang dikenali).

### 1.3 Tampal kod

6. Dalam editor, ada kod asal:
   `function myFunction() { }`
   Pilih semua (**Ctrl+A**), padam (**Delete**).
7. Buka fail `EmailResume.gs` (Notepad/VS Code), pilih semua (**Ctrl+A**), salin (**Ctrl+C**).
8. Tampal ke dalam editor Apps Script (**Ctrl+V**).

### 1.4 Tukar 2 baris penting

9. Di bahagian atas fail, cari baris ini dan tukar:

```javascript
const EMAIL_PENERIMA = 'TUKAR-EMAIL-INI';   // ganti dengan email penjual
const TOKEN = 'TUKAR-TOKEN-INI';            // ganti dengan token kongsi
```

Jadi contohnya (pakai email sebenar anda):

```javascript
const EMAIL_PENERIMA = 'alex.resumemv@gmail.com';
const TOKEN = 'ResumeMV-alex-9f42b1-KUNCI';
```

**Cadangan token yang kuat (salin satu, atau cipta sendiri):**

| Token contoh |
|---|
| `ResumeMV-alex-9f42b1-KUNCI` |
| `ResumeMV-mv2026-T7k2qz-PENJUAL` |
| `kunci-resume-mv-8Wm4xp-2026` |

Peraturan token:
- Mesti **sama** dengan token yang akan anda taip dalam app (Bahagian 2). Kalau berbeza, semua permintaan akan pulangkan `RALAT: token`.
- Sekurang-kurangnya 20 aksara, ada huruf + nombor, boleh guna tanda `-`.
- Jangan letak ruang. Jangan kongsi dengan pelanggan.

> Kalau anda salin token contoh di atas, **tukar** sekurang-kurangnya beberapa aksara supaya ia hanya milik anda.

10. Tekan **Ctrl+S** (ikon disket) untuk simpan. Bila diminta nama projek, taip **EmailResume** > **Save**.

### 1.5 Uji email (WAJIB sebelum deploy)

11. Di editor Apps Script, cari dropdown fungsi di bahagian atas (di sebelah ikon Run/Debug) yang bertulis **ujiEmail**.
12. Pilih **ujiEmail**, tekan **Run**.
13. Google akan minta kebenaran (sekali sahaja):
    - **Review permissions** > pilih akaun Google anda.
    - Skrin "Google hasn't verified this app" > **Advanced** > **Go to EmailResume (unsafe)** > **Allow**.
      (Ini normal - skrip anda sendiri, bukan dari pihak luar.)
14. Buka bahagian **Execution log** di bawah. Anda patut nampak:

```
UJIAN LULUS: email ujian dihantar. Kuota tinggal: 97
```

15. Semak inbox email penjual - sepatutnya ada email bertajuk **UJIAN Resume Builder MV**.
    - Kalau tak ada, semak folder **Spam**.

### 1.6 Deploy jadi Web app

16. Klik **Deploy** (kanan atas) > **New deployment**.
17. Klik ikon gear di sebelah "Select type" > pilih **Web app**.
18. Isi tetapan dengan tepat:

| Medan | Nilai |
|---|---|
| Description | `Email Resume MV` |
| Execute as | **Me (email anda)** |
| Who has access | **Anyone** |

> **Anyone** di sini bermaksud pelanggan boleh hantar ke skrip ini daripada halaman GitHub Pages. Data masih dilindungi oleh **token** - tanpa token yang betul, tiada apa-apa akan berlaku.

19. Klik **Deploy**.
20. Salin **Web app URL**. Ia mesti berakhir dengan **/exec**, contohnya:

```
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
```

21. Tampal URL itu sementara ke Notepad - anda perlukan dua-dua **URL** dan **TOKEN** di Bahagian 2.

Tip: nanti bila anda ubah kod, anda **mesti Deploy semula** (bahagian 4).

---

## Bahagian 2 - Masukkan ke dalam app

1. Buka halaman app Resume Builder MV.
2. Pergi ke **Mod Penjual** (biasanya di bahagian bawah halaman / selepas masukkan kata laluan mod).
3. Cari medan **URL email** dan medan **Token** (disimpan dalam pelayar anda sahaja).

| Medan dalam app | Isi dengan | Kunci simpanan (localStorage) |
|---|---|---|
| URL email | Web app URL dari langkah 20 (berakhir `/exec`) | `resume-mv-email-api` |
| Token | Token yang **sama** dengan dalam GAS | `resume-mv-email-token` |
| Nama penjual / emel (jika ada) | untuk rujukan sendiri | - |

4. Klik **Simpan**. Nilai ini disimpan dalam **localStorage pelayar ini sahaja** - bukan dihantar ke mana-mana, dan tidak hilang bila tutup tab.
5. Uji: buat satu resume percubaan dan tekan butang WhatsApp, ATAU tampal URL ini dalam pelayar:

```
<URL Anda>/exec?action=uji&token=<TOKEN Anda>
```

Anda patut nampak jawapan seperti:

```json
{"ok":true,"kuota":97}
```

- Kalau nampak `{"ok":false,"ralat":"token"}` -> token dalam langkah ini tidak sama dengan token dalam `EmailResume.gs`.

> Nota: simpanan localStorage hanya untuk pelayar itu. Kalau anda tukar PC atau guna mod penyamaran, masukkan semula URL + token.

---

## Bahagian 3 - Jalankan helper di PC (untuk PDF)

Helper inilah yang buka resume dalam PC, render jadi PDF, dan minta GAS email PDF itu.

### 3.1 Isi URL + token pada helper (sekali sahaja)

1. Buka folder `Resume-builder-mv` > subfolder **`backend_email`**.
2. Buka fail **`resume_pdf_helper.py`** dengan Notepad (klik kanan > Open with > Notepad).
3. Cari 2 baris ini di bahagian atas dan tukar:

```python
GAS_URL = 'TUKAR-DENGAN-URL-GAS-ANDA'
TOKEN = 'TUKAR-TOKEN-INI'
```

Isi dengan nilai dari Bahagian 1 - contoh:

```python
GAS_URL = 'https://script.google.com/macros/s/AKfycbxxxx/exec'
TOKEN = 'ResumeMV-alex-9f42b1-KUNCI'
```

   - `GAS_URL` **mesti** berakhir dengan `/exec`.
   - `TOKEN` **mesti sama** dengan dalam GAS dan dalam app.

4. Simpan (**Ctrl+S**) dan tutup Notepad.
   - Pilihan lanjutan: daripada edit `.py`, anda boleh cipta fail **`config_email.json`** dalam folder `backend_email` yang sama dengan isi `{"GAS_URL": "...", "TOKEN": "..."}`. Kalau fail ini ada, ia mengalahkan nilai dalam `.py`. (Mesti JSON yang sah - tiada tanda `//` atau komen.)

### 3.2 Jalankan helper

5. Pastikan PC penjual **hidup** dan ada sambungan internet.
6. Pergi ke folder projek `Resume-builder-mv`.
7. Klik dua kali **`mula-email-resume.bat`**, kemudian biarkan tingkap itu terbuka.
   - Kalau fail `.bat` belum ada: buka Command Prompt dalam folder `backend_email` dan jalankan `python resume_pdf_helper.py`.
8. Kali pertama: Windows/Python mungkin minta kebenaran firewall atau "Run anyway" - benarkan. Anda hanya perlu buat sekali.

Apa yang berlaku selepas ini, dalam susunan:

| Langkah | Apa yang berlaku | Status dalam sheet | Email yang anda terima |
|---|---|---|---|
| 1 | Pelanggan tekan WhatsApp | `Menunggu` | - |
| 2 | GAS simpan rekod + hantar email data | `Menunggu` | **Resume baru - Nama (telefon)** - ada kod + pautan |
| 3 | Helper PC ambil kerja | `Diproses` | - |
| 4 | Helper render PDF dan hantar balik ke GAS | `Dihantar` | **PDF Resume - Nama** - ada lampiran PDF |
| 5 | Anda buka kod dalam app (Mod Penjual > Buka Kod), semak, balas pelanggan | `Dihantar` | - |

Makna status dalam kolum **Status**:

- `Menunggu` - belum diproses. Kalau lekat di sini lama, PC mungkin tidak hidup.
- `Diproses` - helper sedang ambil/rendah.
- `Dihantar` - PDF sudah diemail kepada anda. Selesai.

Tingkap `.bat` tidak perlu ditutup; ia berjalan berulang-ulang. Tutup tingkap = berhenti ambil kerja baharu.

---

## Bahagian 4 - Penyelesaian masalah

| Masalah | Punca biasa | Buat apa |
|---|---|---|
| Email tidak sampai | Masuk spam | Semak folder **Spam** dan tandakan "Not spam". Pastikan `EMAIL_PENERIMA` betul. |
| Email masih tidak sampai selepas tukar kod | Lupa deploy semula | **Deploy > Manage deployments > ikon pensel > Version: New version > Deploy**. Kod lama masih berjalan sampai deploy semula. |
| `RALAT: token` / `{"ok":false,"ralat":"token"}` | Token dalam app tidak sama dengan dalam GAS, atau ada ruang tersalah taip | Buka GAS, salin baris `const TOKEN = ...` tepat-tepat, tampal semula dalam medan token app (tiada ruang di hadapan/belakang). |
| PDF lambat/tidak datang | PC penjual tidak hidup, atau `.bat` ditutup, atau belum dirender | Hidupkan PC, jalankan `mula-email-resume.bat`. Status `Diproses` yang lama = helper masuk tengah jalan; jalankan semula. |
| Kuota habis | MailApp percuma = 100 penerima/hari (kira-kira 50 resume, kerana data + PDF = 2 kuota) | Semak baki: jalankan dalam GAS `MailApp.getRemainingDailyQuota()`, atau buka `<URL>/exec?action=uji&token=<TOKEN>`. Tunggu kuota reset (tengah malam waktu Pasifik). |
| `GetRemainingDailyQuota` pulangkan 0 | Kuota hari itu habis | Tunggu reset. Sementara itu, resume masih masuk ke sheet - PDF boleh diemail esok atau dimuat turun terus dari Drive. |
| Sheet tiada baris baharu | Tab sheet tidak dinamakan tepat, atau deploy belum dibuat | Pastikan nama tab tepat `ResumeMV`. Uji sambungan dengan jalankan fungsi **ujiSimpan** dari dropdown GAS. |
| Butang WhatsApp tidak hantar apa-apa | URL email kosong dalam Mod Penjual | Isi semula medan URL email (berakhir `/exec`) dan klik Simpan. |

Cara cepat sahkan semua sistem hidup:

```
<URL>/exec?action=uji&token=<TOKEN>
```

Jawapan `{"ok":true,"kuota":N}` = URL + token + kuota semuanya OK.

---

## Bahagian 5 - Nota privasi (PDPA)

Resume pelanggan mengandungi data peribadi (nama, telefon, emel, gambar). Di bawah **PDPA 2010** (Akta Perlindungan Data Peribadi), anda bertanggungjawab menjaganya:

- **Jangan kongsi** Google Sheet ini secara awam. Kongsi hanya kepada diri sendiri (butang **Share** > kekalkan "Restricted").
- **Jangan letak** pautan sheet dalam app, media sosial, atau dalam chat pelanggan.
- Folder Drive `ResumeMV-Fail` juga peribadi - jangan setkan "Anyone with the link".
- Token GAS adalah seperti kata laluan. Jangan taip dalam chat atau skrin yang dirakam.
- Gunakan data pelanggan **hanya** untuk buat resume dia, bukan untuk iklan/senarai lain.
- Simpan hanya selagi perlu; padam baris + foto + PDF pelanggan lama yang sudah tidak diperlukan.
- Kalau ada permintaan pelanggan untuk padam data, padam dari Sheet, folder Drive, dan inbox email.

Ringkasnya: **satu sheet untuk diri anda sahaja, akses "Restricted", jangan kongsi pautan.**

---

## Rujukan pantas

| Item | Nilai |
|---|---|
| Nama tab sheet | `ResumeMV` (jangan ubah) |
| Kolum sheet | Tarikh \| Nama \| Telefon \| Emel \| Halaman \| Kod \| FotoID \| Status \| PDFID |
| Status | `Menunggu` -> `Diproses` -> `Dihantar` |
| Pautan resume | `https://alexander751.github.io/Resume-builder-mv/#kod=<kod>` |
| Uji kuota | `<URL>/exec?action=uji&token=<TOKEN>` |
| Kuota harian | 100 penerima/hari (Gmail percuma) |
| Kunci localStorage app | URL: `resume-mv-email-api` \| Token: `resume-mv-email-token` |
| Tetapan helper PC | `backend_email/resume_pdf_helper.py` - `GAS_URL` (berakhir `/exec`) + `TOKEN`, atau `backend_email/config_email.json` |
| Selepas ubah kod | **Deploy > Manage deployments > New version** |
