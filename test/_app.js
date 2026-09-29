
(function () {
  'use strict';

  var KUNCI = 'resume-mv-v1';
  var bilPengalaman = 0, bilPendidikan = 0, bilTambahan = 0, bilRujukan = 0;
  var bilTahap = { kemahiran: 0, bahasa: 0 };
  var TAHAP_NAMA = ['', 'Asas', 'Sederhana', 'Mahir', 'Sangat mahir', 'Pakar'];
  var BUANG = [];   // bahagian piawai yang pelanggan pilih untuk dibuang

  /* ============================================================
     TETAPAN PENJUAL — tukar dua baris ini sahaja
     ============================================================ */
  var NOMBOR_WA = '601159003242';  // nombor WhatsApp bisnes, format 60xxxxxxxxx (tiada + atau -)
  var HARGA = 29.90;               // harga jualan PDF bersih (RM)
  var JENAMA = 'Resume Builder MV';

  var penjual = false;             // true = mod anda sendiri (tiada tanda air)
  var foto = '';                   // data URL foto (tidak masuk ke kod pesanan)

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var LOG_MENTAH = '', LOG_JENIS = 'info';
  function tulisLog(mesej, jenis) {
    var log = el('log');
    if (!log) return;
    LOG_MENTAH = mesej || '';
    LOG_JENIS = jenis || 'info';
    log.innerHTML = mesej ? '<span class="' + LOG_JENIS + '">' + esc(tbMesej(mesej)) + '</span>' : '';
  }

  /* ---------- baris berulang ---------- */
  // bahagian piawai yang dibuang daripada resume (boleh ditambah balik)
  function dibuang(d, kunci) {
    return ((d && d.buang) || []).indexOf(kunci) >= 0;
  }

  function kemasSek() {
    Array.prototype.forEach.call(document.querySelectorAll('fieldset.sek'), function (fs) {
      fs.classList.toggle('dibuang', BUANG.indexOf(fs.getAttribute('data-sek')) >= 0);
    });
  }

  /* satu item mod "nama + detail": nama kemahiran dahulu, kemudian detailnya */
  function barisDua(data) {
    data = data || {};
    var d = document.createElement('div');
    d.className = 'baris-dua';
    d.innerHTML =
      '<div class="kepala-dua"><strong class="bd-tajuk">Item</strong>' +
      '<button type="button" class="btn-hapus btn-hapus-dua">Hapus</button></div>' +
      '<label>Kemahiran / tajuk kecil</label>' +
      '<input class="bd-nama" type="text" placeholder="cth. Pengurusan Kos">' +
      '<label>Detail</label>' +
      '<textarea class="bd-detail" rows="2" placeholder="cth. Menyedia BQ, mengawal kos dan lapor bulanan"></textarea>';
    d.querySelector('.bd-nama').value = data.nama || '';
    d.querySelector('.bd-detail').value = data.detail || '';
    d.querySelector('.btn-hapus-dua').addEventListener('click', function () {
      var kotak = d.parentNode;
      d.remove();
      kemasDua(kotak);
      kemasSemula();
    });
    terjemahElemen(d);
    return d;
  }

  function kemasDua(kotak) {
    if (!kotak) return;
    var semua = kotak.querySelectorAll('.baris-dua');
    Array.prototype.forEach.call(semua, function (d, i) {
      var t2 = d.querySelector('.bd-tajuk');
      if (t2) t2.textContent = 'Item ' + (i + 1);
      var h = d.querySelector('.btn-hapus-dua');
      if (h) h.hidden = semua.length < 2;
    });
  }

  function barisTambahan(data) {
    data = data || {};
    bilTambahan++;
    var dua = (data.mod === 'dua');
    var b = document.createElement('div');
    b.className = 'baris';
    b.setAttribute('data-mod', dua ? 'dua' : '');
    b.innerHTML =
      '<div class="kepala"><strong>Bahagian ' + bilTambahan + '</strong>' +
      '<button type="button" class="btn-hapus">Hapus</button></div>' +
      '<label>Tajuk bahagian</label>' +
      '<input class="t-tajuk" type="text" placeholder="cth. Kemahiran Profesional, Projek, Sijil">' +
      (dua
        ? '<label>Kemahiran &amp; detail</label><div class="dua-kotak"></div>' +
          '<button type="button" class="btn-tambah btn-tambah-dua">+ Tambah kemahiran</button>'
        : '<label>Isi (satu baris satu item)</label>' +
          '<textarea class="t-isi" rows="4" placeholder="cth. Projek Perumahan Mampu Milik Kemaman (2024)&#10;Sijil AutoCAD Asas (2023)"></textarea>');
    b.querySelector('.t-tajuk').value = data.t || '';
    if (dua) {
      var kotak = b.querySelector('.dua-kotak');
      var senaraiAwal = (data.bahagian && data.bahagian.length) ? data.bahagian : [{ nama: '', detail: '' }];
      senaraiAwal.forEach(function (o) { kotak.appendChild(barisDua(o)); });
      kemasDua(kotak);
      b.querySelector('.btn-tambah-dua').addEventListener('click', function () {
        var baru2 = barisDua({ nama: '', detail: '' });
        kotak.appendChild(baru2);
        kemasDua(kotak);
        baru2.querySelector('.bd-nama').focus();
        kemasSemula();
      });
    } else {
      b.querySelector('.t-isi').value = data.b || '';
    }
    terjemahElemen(b);
    b.querySelector('.btn-hapus').addEventListener('click', function () {
      b.remove();
      kemasSemula();
    });
    return b;
  }

  /* Satu pengalaman = jawatan + syarikat + tempoh + senarai PROJEK. Setiap projek ada nama
     (cth "Projek Hospital Rizen, Kuantan") dan senarai perkara utama untuk projek itu.
     Data lama (poin terus pada pengalaman, tiada projek) dinormalkan kepada SATU projek tanpa
     nama supaya resume sedia ada tidak berubah rupa. */
  function senaraiProjek(o) {
    o = o || {};
    if (Array.isArray(o.projek) && o.projek.length) {
      var keluar = o.projek.map(function (p) {
        p = p || {};
        return {
          nama: String(p.nama || '').trim(),
          klien: String(p.klien || '').trim(),
          poin: (Array.isArray(p.poin) ? p.poin : []).map(function (x) { return String(x || '').trim(); }).filter(Boolean)
        };
      }).filter(function (p) { return p.nama || p.klien || p.poin.length; });
      if (keluar.length) return keluar;
    }
    var lama = (Array.isArray(o.poin) ? o.poin : []).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    return lama.length ? [{ nama: '', poin: lama }] : [];
  }

  /* paparkan nama projek dengan label pilihan pelanggan - jangan gandakan kalau pelanggan
     sudah menulis label sendiri ("Projek ...", "Klien ...") */
  function labelProjek(nama) {
    var t = String(nama || '').trim();
    if (!t) return '';
    if (/^(projek|project|klien|client)\b/i.test(t)) return t;
    return (BAHASA === 'en' ? 'Project: ' : 'Projek: ') + t;
  }

  /* Baris nama projek pada resume: klien (kalau ada) di DEPAN, kemudian nama projek.
     Contoh: "Klien: KKM \u2014 Projek: Hospital Rizen, Kuantan". */
  function teksProjek(pk) {
    var nama = labelProjek(pk && pk.nama);
    var klien = String((pk && pk.klien) || '').trim();
    if (!klien) return nama;
    var lb = (BAHASA === 'en') ? 'Client' : 'Klien';
    if (/^(klien|client)\b/i.test(nama)) return nama;
    return lb + ': ' + klien + (nama ? ' \u2014 ' + nama : '');
  }

  /* Buang tanda bulet yang pelanggan taip sendiri (• - * · ▪ 1.) supaya cetakan tidak keluar DUA titik.
     Hanya tanda di hujung depan dibuang, dan hanya tanda bulet - bukan sebahagian teks. */
  function bersihPoin(s) {
    var t = String(s == null ? '' : s).replace(/\u00a0/g, ' ').trim();
    t = t.replace(/^[\u2022\u00b7\u25cf\u25aa\u25cb\u25e6\u2023\u2043\u2219\*\u2013\u2014\u2015\u2500]+\s*/, '');
    t = t.replace(/^-\s+/, '');
    t = t.replace(/^[\u2022\u00b7\u25cf\u25aa\u25cb\u25e6\u2023\u2043\u2219\*]+/, '');
    return t.trim();
  }

  /* satu projek = satu kad kecil di dalam pengalaman (nama projek + poin projek itu) */
  function barisProjek(data) {
    data = data || {};
    var p = document.createElement('div');
    p.className = 'baris-projek';
    p.innerHTML =
      '<div class="kepala-projek"><strong class="pj-tajuk">Projek</strong>' +
      '<button type="button" class="btn-hapus btn-hapus-projek">Hapus projek</button></div>' +
      '<label>Klien (pilihan)</label>' +
      '<input class="pj-klien" type="text" placeholder="cth. KKM, JKR, Tetuan ABC Sdn Bhd">' +
      '<label>Projek (nama & tempat)</label>' +
      '<input class="pj-nama" type="text" placeholder="cth. Projek Hospital Rizen, Kuantan (RM 120 juta)">' +
      '<label>Perkara utama anda dalam projek ini (satu baris satu poin)</label>' +
      '<textarea class="pj-poin" rows="4" placeholder="Sediakan BQ dan dokumen tawaran&#10;Nilai tuntutan kontraktor dan interim certificate setiap bulan"></textarea>' +
      '<p class="poin-nota">Jangan taip tanda titik di depan ayat &mdash; app sudah menambahnya ' +
      '(tanda yang awak taip akan dibuang supaya cetakan tidak keluar dua titik).</p>';
    p.querySelector('.pj-nama').value = data.nama || '';
    p.querySelector('.pj-klien').value = data.klien || '';
    p.querySelector('.pj-poin').value = (data.poin || []).join('\n');
    terjemahElemen(p);
    p.querySelector('.btn-hapus-projek').addEventListener('click', function () {
      var kotak = p.parentNode;
      p.remove();
      kemasProjek(kotak);
      kemasSemula();
    });
    return p;
  }

  /* nomborkan projek + butang Hapus hanya bila ada lebih daripada satu
     (setiap pengalaman mesti tinggal sekurang-kurangnya satu bekas projek) */
  function kemasProjek(kotak) {
    if (!kotak) return;
    var semua = kotak.querySelectorAll('.baris-projek');
    Array.prototype.forEach.call(semua, function (p, i) {
      var t = p.querySelector('.pj-tajuk');
      if (t) t.textContent = 'Projek ' + (i + 1);
      var h = p.querySelector('.btn-hapus-projek');
      if (h) h.hidden = semua.length < 2;
    });
  }

  /* ---------- bahasa antara muka (dwibahasa) ---------- */
  var TEKS_UI = {
    ms: {
      tajukBahasa: 'Pilih bahasa resume',
      subBahasa: 'Bahasa ini menentukan tajuk dan label di dalam resume anda (cth <strong>KONTAK</strong> atau <strong>CONTACT</strong>). Boleh tukar bila-bila masa.',
      notaBahasa: 'Reka bentuk <strong>Korporat Moden</strong> memakai tajuk bahasa Inggeris terus daripada fail rujukan Canva; pilihan <strong>English</strong> mengekalkan ejaan itu.',
      galeriLabel: 'Langkah 1 &middot; Reka bentuk',
      galeriTajuk: 'Pilih reka bentuk resume anda',
      galeriSub: 'Semua reka bentuk siap A4. Boleh tukar bila-bila masa &mdash; butiran yang sudah diisi tidak hilang.',
      mulaIsi: 'Mula Isi Butiran &rarr;',
      hal2Tajuk: 'Isi butiran anda',
      hal2Sub: 'Medan <strong>Nama</strong> dan <strong>Nombor Telefon</strong> wajib diisi. Data disimpan dalam pelayar anda sendiri sahaja.',
      tajukHal: ['', 'Bahasa & reka bentuk', 'Butiran', 'Pratonton', 'Hantar'],
      teksLangkah: ['', 'Langkah 1 daripada 3 \u00b7 Pilih reka bentuk', 'Langkah 2 daripada 3 \u00b7 Isi butiran',
                    'Pratonton resume', 'Langkah 3 daripada 3 \u00b7 Hantar']
    },
    en: {
      tajukBahasa: 'Choose the resume language',
      subBahasa: 'This language decides the headings and labels INSIDE your resume (e.g. <strong>KONTAK</strong> or <strong>CONTACT</strong>). You can change it anytime.',
      notaBahasa: 'The <strong>Korporat Moden</strong> design keeps the English headings from its Canva reference file; choosing <strong>English</strong> preserves that spelling.',
      galeriLabel: 'Step 1 &middot; Design',
      galeriTajuk: 'Choose your resume design',
      galeriSub: 'Every design is ready as a one-page A4. Change anytime &mdash; the details you already filled in are kept.',
      mulaIsi: 'Start filling details &rarr;',
      hal2Tajuk: 'Fill in your details',
      hal2Sub: 'The <strong>Name</strong> and <strong>Phone number</strong> fields are required. Your data is saved in your own browser only.',
      tajukHal: ['', 'Language & design', 'Details', 'Preview', 'Send'],
      teksLangkah: ['', 'Step 1 of 3 \u00b7 Choose a design', 'Step 2 of 3 \u00b7 Fill in details',
                    'Resume preview', 'Step 3 of 3 \u00b7 Send']
    }
  };

  /* ---------- kamus antara muka (Melayu -> English) ----------
     Pilihan bahasa di halaman 1 menukar SELURUH antara muka pelanggan, bukan hanya tajuk resume:
     teks statik (legend, label, nota, butang, placeholder) melalui kamus ini, dan teks yang dijana
     oleh JavaScript melalui tb(). Teks Melayu asal disimpan pada elemen (data-ms) supaya boleh
     dipulihkan bila pelanggan tukar kembali ke Bahasa Melayu. */
  var KAMUS_EN = {
    "Butiran Peribadi": "Personal Details",
    "Jawatan Disasarkan": "Target Position",
    "Ringkasan Profil": "Profile Summary",
    "Pengalaman Kerja": "Work Experience",
    "Pendidikan": "Education",
    "Kemahiran": "Skills",
    "Bahasa": "Languages",
    "Rujukan": "References",
    "Bahagian Tambahan (pilihan)": "Extra Sections (optional)",
    "Nama": "Name",
    "Nombor Telefon": "Phone Number",
    "E-mel": "Email",
    "Lokasi": "Location",
    "Jawatan / Posisi": "Position / Job Title",
    "Ringkasan (2–4 ayat)": "Summary (2–4 sentences)",
    "Foto (pilihan)": "Photo (optional)",
    "Label nama projek pada resume": "Project name label on the resume",
    "Hapus": "Remove",
    "Hapus projek": "Remove project",
    "Buang bahagian ini": "Remove this section",
    "Tambah balik": "Add back",
    "Buang foto": "Remove photo",
    "Kosongkan": "Clear form",
    "Kembali": "Back",
    "Seterusnya": "Next",
    "Cetak PDF": "Print PDF",
    "Skrin penuh": "Full screen",
    "Susun blok": "Arrange blocks",
    "Selesai susun": "Done arranging",
    "Tetapkan semula": "Reset",
    "Ikut susunan rasmi": "Use official order",
    "Tutup": "Close",
    "Jadikan susunan rasmi": "Save as official order",
    "Buang susunan rasmi": "Remove official order",
    "Pratonton resume": "Full preview",
    "Simpan tetapan email": "Save email settings",
    "Token email": "Email token",
    "Buka Kod": "Open code",
    "← Kembali": "← Back",
    "← Kembali edit": "← Back to edit",
    "← Kembali ke pratonton": "← Back to preview",
    "Leret untuk lihat reka bentuk lain →": "Swipe to see other designs →",
    "Semua reka bentuk siap A4. Boleh tukar bila-bila masa — butiran yang sudah diisi tidak hilang.": "All designs come as A4. You can switch anytime — the details you already filled in are kept.",
    "Semua reka bentuk siap A4 satu halaman. Boleh tukar bila-bila masa — butiran yang sudah diisi tidak hilang.": "Every design is a one-page A4. You can switch anytime — the details you already filled in are kept.",
    "Pratonton resume anda": "Your resume preview",
    "Semak sebelum hantar": "Check before sending",
    "Hantar pesanan anda": "Send your order",
    "Sedia untuk dihantar": "Ready to send",
    "Ada apa-apa lagi nak ditambah? Tekan kad di bawah — boleh tekan lebih daripada satu. Kalau tak ada, terus tekan": "Anything else to add? Tap a card below — you can pick more than one. If not, just tap",
    "Kami sahkan pesanan dan hantar arahan bayaran (DuitNow QR / pindahan bank).": "We confirm your order and send payment instructions (DuitNow QR / bank transfer).",
    "Anda terima PDF bersih dalam WhatsApp, sedia untuk dihantar kepada majikan.": "You receive the clean PDF on WhatsApp, ready to send to employers.",
    "Tiada data disimpan di mana-mana pelayan. Butiran hanya dihantar melalui WhatsApp kepada penjual.": "No data is stored on any server. Details are sent to the seller through WhatsApp only.",
    "Simpan dalam pelayar anda sahaja": "Saved in your browser only",
    "Data disimpan dalam pelayar anda sendiri sahaja": "Data is saved in your own browser only",
    "Email resume automatik": "Automatic resume email",
    "Mod Penjual": "Seller Mode",
    "Susunan blok rasmi": "Official block order",
    "Susunan blok": "Block order",
    "Belum ada susunan rasmi — templat menggunakan susunan asal.": "No official order yet — the template uses its default order.",
    "Seret blok untuk pindah tempat (atau tekan anak panah pada setiap blok). Susunan ini yang akan dicetak.": "Drag a block to move it (or use the arrow buttons on each block). This order is what gets printed.",
    "Pilih langkah butiran": "Choose a details step",
    "Pratonton langsung": "Live preview",
    "Kemahiran Profesional": "Professional Skills",
    "Sijil & Latihan": "Certificates & Training",
    "Aktiviti": "Activities",
    "Percuma dicuba — bayaran": "Free to try — payment",
    "Pilih reka bentuk resume anda": "Choose your resume design",
    "Reka bentuk": "Design",
    "Pratonton": "Preview",
    "Hantar": "Send",
    "Butiran": "Details",
    "Bahasa Resume": "Resume Language",
    "Pilih bahasa resume": "Choose the resume language",
    "English": "English",
    "Bahasa Melayu": "Bahasa Melayu",
    "Satu kemahiran satu baris. Tekan": "One skill per line. Press",
    "Satu bahasa satu baris. Tekan": "One language per line. Press",
    "Isi satu orang satu baris —": "One person per line —",
    "Contoh lain: Anugerah, Keahlian Persatuan, Latihan Industri, Rujukan Tambahan.": "Other examples: Awards, Professional Memberships, Internships, Additional References.",
    "Tulis bahagian sendiri": "Write your own section",
    "Ejaan nama dan jawatan di bahagian atas resume betul?": "Are the name and job title at the top of the resume correct?",
    "Nombor telefon dan e-mel yang boleh dihubungi majikan?": "Is the phone number and email reachable by employers?",
    "Setiap pengalaman ada tempoh kerja dan 2–3 poin utama?": "Does every job have a period and 2–3 key points?",
    "Rujukan sudah minta izin daripada orang itu?": "Have you asked permission from your referees?",
    "PDF bersih tanpa tanda air": "Clean PDF without watermark",
    "Puas hati dengan isi ini? Tekan": "Happy with this content? Press",
    "Tidak puas hati? Tekan": "Not happy? Press",
    "mulai sekarang": "from now on",
    "Rujukan Tambahan": "Additional References",
    "Ketuk tajuk 5 kali untuk Mod Penjual": "Tap the title 5 times for Seller Mode",
  };

  /* tambahan kamus: serpihan ayat + nota dinamik */
  Object.assign(KAMUS_EN, {
    "Kembali edit": "Back to edit",
    " — tiada data hilang.": " — no data is lost.",
    "Tambahan (pilihan)": "Extra Sections (optional)",
    "Bahagian Tambahan": "Extra Sections",
    "Klien (pilihan)": "Client (optional)",
    "cth. KKM, JKR, Tetuan ABC Sdn Bhd": "e.g. Ministry of Health, JKR, ABC Sdn Bhd",
    "susun blok": "arrange blocks",
    "Susunan ini yang akan dicetak.": "This order is what gets printed.",
    "seret blok": "drag a block"
  });
  Object.assign(KAMUS_EN, {
    "Tahap penguasaan": "Proficiency level",
    "perlu.": "needed.",
    "tiada tanda koma": "no commas",
    "Isi satu orang satu baris — ": "One person per line — ",
    "Beginilah rupa resume anda. Tanda air ": "This is how your resume looks. The watermark ",
    "PRATONTON": "PREVIEW",
    "Tanda air ": "The watermark ",
    " hilang dalam PDF bersih selepas pesanan disahkan.": " disappears in the clean PDF once the order is confirmed.",
    "Boleh tukar bila-bila masa.": "You can change it anytime.",
    ". Boleh tukar bila-bila masa.": ". You can change it anytime.",
    "Reka bentuk dipilih: ": "Design selected: ",
    "Buka pratonton, tekan": "Open the preview, press",
    ", atur ikut kehendak anda, kemudian tekan": ", arrange it the way you want, then press",
    "Belum ada susunan rasmi - templat menggunakan susunan asal.": "No official order yet - the template uses its default order.",
    "Belum diset. Isi URL Apps Script dan token, kemudian tekan Simpan.": "Not set yet. Paste the Apps Script URL and token, then press Save.",
    " Tanpa ini, butang WhatsApp berfungsi seperti biasa (kod sahaja).": " Without this, the WhatsApp button works as usual (code only).",
    "Sedia. Resume pelanggan akan diemail ke alamat dalam Apps Script.": "Ready. Customer resumes will be emailed to the address in your Apps Script."
  });

  /* tambahan kamus: ayat penuh + serpihan ayat yang dipisah markup */
  Object.assign(KAMUS_EN, {
    ", fotonya kekal — tidak perlu muat naik semula.": ", the photo is kept — no need to upload it again.",
    ". Susunan yang pelanggan buat sendiri (dalam kod pesanan mereka) mengubah resume mereka sahaja — apabila kod pelanggan itu dibuka di sini, ia dicetak mengikut susunan pelanggan, dan susunan rasmi anda tidak tersentuh.": ". An order the customer arranged themselves (inside their order code) changes only their own resume — when you open that customer code here it prints in the customer's order, and your official order is untouched.",
    "reka bentuk": "designs",
    "Belum diisi: nama dan nombor telefon — perlu sebelum pratonton.": "Not filled in yet: name and phone number — needed before the preview.",
    "Belum diset. Isi URL Apps Script dan token, kemudian tekan Simpan. Tanpa ini, butang WhatsApp berfungsi seperti biasa (kod sahaja).": "Not set yet. Paste the Apps Script URL and token, then press Save. Without this, the WhatsApp button works as usual (code only).",
    "Hantar Pesanan ke WhatsApp": "Send Order via WhatsApp",
    "Kod tidak mengandungi foto (kod akan jadi puluhan ribu huruf kalau foto dimasukkan). Kalau pelanggan ada foto, minta dia hantar gambar dalam WhatsApp, kemudian muat naik di ruang": "The code does not contain the photo (it would be tens of thousands of characters if it did). If the customer has a photo, ask them to send it on WhatsApp, then upload it in the",
    "Resume A4 siap cetak · tanpa daftar akaun · hantar terus melalui WhatsApp": "Print-ready A4 resume · no account needed · sent straight through WhatsApp",
    "Seterusnya: Hantar →": "Next: Send →",
    "Tekan butang WhatsApp di atas — butiran resume dihantar sekali sahaja kepada penjual.": "Press the WhatsApp button above — the resume details are sent to the seller once only.",
    "Tekan butang di bawah — WhatsApp terbuka dengan butiran resume anda sudah siap diisi. Anda cuma perlu tekan hantar.": "Press the button below — WhatsApp opens with your resume details already filled in. You only need to press send.",
    "hanya bila anda mahu PDF bersih tanpa tanda air.": "only when you want the clean PDF without the watermark.",
    "sebelum cetak PDF. Kalau pelanggan membuka kod ini": "before printing the PDF. If the customer opens this code",
    "untuk semak pratonton penuh, kemudian hantar melalui WhatsApp.": "to check the full preview, then send it through WhatsApp.",
    "untuk tahap penguasaan (1 = asas, 5 = fasih sepenuhnya).": "for the proficiency scale (1 = basic, 5 = fully fluent).",
    "untuk tahap penguasaan (1 = asas, 5 = pakar).": "for the proficiency scale (1 = basic, 5 = expert).",
    "— kosongkan kalau kerja anda tidak berasaskan projek (cth kerani, jurujual, cikgu); resume akan terus ke perkara utama.": "— leave it empty if your work is not project-based (e.g. clerk, salesperson, teacher); the resume goes straight to the key points.",
    "— susunan yang diterima SEMUA pelanggan baru.": "— the order that ALL new customers receive.",
    "— tampal sekali sahaja. Selepas ini, setiap pelanggan yang menekan butang WhatsApp akan menghantar resume (bersama data dan kod) ke email anda secara automatik.": "— paste it once. After that, every customer who presses the WhatsApp button will send their resume (data and code) to your email automatically.",
    "← Leret untuk lihat reka bentuk lain →": "← Swipe to see other designs →",
    "Seterusnya: Pratonton →": "Next: Preview →"
  });

  /* tambahan kamus: nama kad yang dijana kod + teks status */
  Object.assign(KAMUS_EN, {
    "Pengalaman": "Experience",
    "Rujukan": "Reference",
    "Projek & perkara utama": "Project & key points",
    "Jangan taip tanda titik di depan ayat — app sudah menambahnya (tanda yang awak taip akan dibuang supaya cetakan tidak keluar dua titik).": "Do not type a bullet character at the start of a line — the app adds it for you (any bullet you type is removed so the print does not show two dots).",
    "Belum ada foto (pilihan).": "No photo yet (optional).",
    "OK - foto akan masuk ke dalam resume.": "OK - the photo will go into the resume.",
    "Foto": "Photo",
    "Buang foto": "Remove photo",
    "Kemahiran Profesional": "Professional Skills",
    "Sijil & Latihan": "Certificates & Training",
    "Aktiviti": "Activities",
    "Projek": "Project",
    "Bahasa": "Languages",
    "Pendidikan": "Education",
    "Kemahiran": "Skills",
    "Tahap": "Level",
    "daripada 5": "of 5",
    "Belum dipilih": "Not selected"
  });

  /* tambahan kamus: placeholder + butang + label kad yang dijana kod */
  Object.assign(KAMUS_EN, {
    "cth. Ahmad bin Ali": "e.g. Ahmad bin Ali",
    "cth. 012-3456789": "e.g. 012-3456789",
    "cth. ahmad@gmail.com": "e.g. ahmad@gmail.com",
    "cth. Kemaman, Terengganu": "e.g. Kemaman, Terengganu",
    "cth. Junior Quantity Surveyor": "e.g. Junior Quantity Surveyor",
    "cth. Graduan Sarjana Muda Ukur Bahan dengan 2 tahun pengalaman...": "e.g. Quantity Surveying graduate with 2 years of experience...",
    "cth. Quantity Surveyor": "e.g. Quantity Surveyor",
    "cth. EPH Construction Sdn Bhd": "e.g. EPH Construction Sdn Bhd",
    "cth. Mac 2024 - Kini": "e.g. Mar 2024 - Present",
    "cth. Projek Hospital Rizen, Kuantan (RM 120 juta)": "e.g. Rizen Hospital Project, Kuantan (RM 120 million)",
    "Sediakan BQ dan dokumen tawaran&#10;Nilai tuntutan kontraktor dan interim certificate setiap bulan": "Prepare BQ and tender documents&#10;Assess monthly contractor claims and interim certificates",
    "Sediakan BQ untuk 3 projek perumahan&#10;Semak tuntutan kontraktor setiap bulan": "Prepare BQ for 3 housing projects&#10;Review monthly contractor claims",
    "cth. Sarjana Muda Ukur Bahan": "e.g. Bachelor of Quantity Surveying",
    "cth. UiTM Shah Alam": "e.g. UiTM Shah Alam",
    "cth. 2021 - 2024": "e.g. 2021 - 2024",
    "cth. AutoCAD": "e.g. AutoCAD",
    "cth. Bahasa Melayu": "e.g. Bahasa Melayu",
    "cth. En. Samad bin Yusof": "e.g. Mr Samad bin Yusof",
    "cth. Pengurus Projek, EPH Construction Sdn Bhd": "e.g. Project Manager, EPH Construction Sdn Bhd",
    "cth. 012-345 6789 atau ahmad@contoh.my": "e.g. 012-345 6789 or ahmad@example.my",
    "cth. Projek, Sijil, Aktiviti, Latihan": "e.g. Projects, Certificates, Activities, Training",
    "cth. Projek Perumahan Mampu Milik Kemaman (2024)&#10;Sijil AutoCAD Asas (2023)": "e.g. Kemaman Affordable Housing Project (2024)&#10;Basic AutoCAD Certificate (2023)",
    "cth. Projek Perumahan Kemaman (2024)": "e.g. Kemaman Housing Project (2024)",
    "Tampal kod resume di sini...": "Paste the resume code here...",
    "URL Apps Script (berakhir dengan /exec)": "Apps Script URL (ends with /exec)",
    "+ Tambah Pengalaman": "+ Add Experience",
    "+ Tambah Pendidikan": "+ Add Education",
    "+ Tambah kemahiran": "+ Add skill",
    "+ Tambah bahasa": "+ Add language",
    "+ Tambah rujukan": "+ Add reference",
    "+ Tambah projek lain (cth. projek perumahan)": "+ Add another project (e.g. a housing project)",
    "Projek (nama & tempat)": "Project (name & location)",
    "Perkara utama anda dalam projek ini (satu baris satu poin)": "Your key responsibilities on this project (one per line)",
    "Perkara utama (satu baris satu poin)": "Key responsibilities (one per line)",
    "Jawatan & syarikat": "Position & company",
    "Telefon atau e-mel": "Phone or email",
    "Tahun": "Year",
    "Institusi": "Institution",
    "Kelulusan": "Qualification",
    "Telefon": "Phone",
    "Tajuk bahagian": "Section title",
    "Isi (satu baris satu item)": "Content (one item per line)",
    "Syarikat": "Company",
    "Tempoh": "Period",
    "Jawatan": "Position",
    "Tulis bahagian sendiri": "Write your own section",
    "Kemahiran Profesional": "Professional Skills",
    "Tampal kod resume daripada pelanggan:": "Paste the customer's resume code:",
    "Nama projek dalam setiap kad adalah": "The project name in each card is"
  });

  /* tambahan kamus: mesej log, teks tahap, teks kad templat */
  Object.assign(KAMUS_EN, {
    '\u2190 Butiran Reka Bentuk': '\u2190 Design Details',
    'Seterusnya: Pratonton \u2192': 'Next: Preview \u2192',
    'Seterusnya \u2192': 'Next \u2192',
    'Reka bentuk dipilih: ': 'Design selected: ',
    'Resume terakhir di peranti ini: ': 'Last resume on this device: ',
    'Dua lajur: banner biru gelap dengan nama dan foto bulat, rel kelabu untuk kontak, kemahiran dan bahasa, lajur kanan untuk profil, pengalaman dan pendidikan.':
      'Two columns: a dark blue banner with your name and a round photo, a grey rail for contact, skills and languages, and a right column for profile, experience and education.',
    'Padat - banyak maklumat dalam satu halaman A4': 'Compact - lots of information on one A4 page',
    'Foto bulat dan lencana ikon pada kontak': 'Round photo and icon badges on the contact details',
    'Satu lajur gaya korporat yang lapang: nama besar, foto bulat di penjuru dan garis tajuk biru navy yang tersusun ke bawah.':
      'A spacious single-column corporate look: large name, round photo in the corner and navy heading rules stacking down the page.',
    'Mesra sistem automatik (ATS) - satu lajur': 'Friendly to automated systems (ATS) - single column',
    'Sesuai jawatan korporat dan kerajaan': 'Suits corporate and government positions',
    'Gaya korporat moden: rel kelabu-hijau di kiri untuk foto dan kemahiran, lajur kanan untuk ringkasan dan pengalaman, dengan garis tajuk yang tegas.':
      'A modern corporate look: a grey-green rail on the left for photo and skills, a right column for summary and experience, with crisp heading rules.',
    'Ruang putih luas - sesuai jawatan korporat dan pengurusan': 'Plenty of white space - suits corporate and management roles',
    'Tajuk huruf besar dengan garis dan ikon petak': 'Uppercase headings with rules and square icons',
    "Belum dipilih": "Not selected",
    "Asas": "Basic",
    "Sederhana": "Intermediate",
    "Mahir": "Proficient",
    "Sangat mahir": "Highly proficient",
    "Pakar": "Expert",
    "Halaman": "Page",
    "Langkah": "Step",
    "Bahagian dibuang dari resume. Boleh tambah balik bila-bila masa.": "Section removed from the resume. You can add it back anytime.",
    "Bahagian dikembalikan ke resume.": "Section restored to the resume.",
    "Bahagian tambahan ditambah — isi tajuk dan isinya.": "Extra section added — fill in its title and content.",
    "Blok dipindahkan. Susunan ini akan ikut semasa cetak PDF.": "Block moved. This order will be used when printing the PDF.",
    "Email tidak dapat dihantar (semak URL dan token). Kod resume tetap ada di WhatsApp.": "Email could not be sent (check the URL and token). The resume code is still in WhatsApp.",
    "Isi Nama dan Nombor Telefon dahulu sebelum hantar pesanan.": "Fill in Name and Phone Number before sending the order.",
    "Kod resume dalam pautan itu tidak sah.": "The resume code in that link is invalid.",
    "Kod resume tidak sah — pastikan ia disalin penuh.": "Invalid resume code — make sure it is copied fully.",
    "MOD PENJUAL: tanda air dimatikan — tekan Cetak PDF atau Ctrl+P untuk simpan PDF bersih.": "SELLER MODE: watermark disabled — press Print PDF or Ctrl+P to save the clean PDF.",
    "Mod susun hidup: seret blok dalam pratonton, atau tekan anak panah pada blok.": "Arrange mode on: drag a block in the preview, or press the arrow buttons on a block.",
    "Resume dihantar ke email anda.": "Resume sent to your email.",
    "Resume tersimpan dibuang. Isi butiran baru anda.": "Saved resume cleared. Fill in your new details.",
    "Sila isi Nama dan Nombor Telefon untuk cetak PDF.": "Please fill in Name and Phone Number to print the PDF.",
    "Susunan rasmi dibuang - templat kembali ke susunan asal.": "Official order removed — the template returns to its default order.",
    "Susunan rasmi hanya boleh diubah dalam mod penjual.": "The official order can only be changed in Seller Mode.",
    "Susunan blok dikembalikan ke susunan RASMI (susunan yang pelanggan baru terima).": "Block order reset to the OFFICIAL order (what new customers receive).",
    "Susunan blok dikembalikan ke susunan asal templat.": "Block order reset to the template default.",
    "Susunan blok sekarang disimpan sebagai susunan RASMI untuk templat ": "The current block order is now saved as the OFFICIAL order for the ",
    "Bahasa resume: English.": "Resume language: English.",
    "Bahasa resume: Bahasa Melayu.": "Resume language: Bahasa Melayu.",
    "Bahagian": "Section",
    "dibuang dari resume.": "removed from the resume.",
    "Tahap": "Level",
    "daripada 5": "of 5"
  });

  /* terjemah satu teks pendek yang dijana kod (cth 'Hapus', 'Pengalaman') */
  function tb(ms) {
    if (BAHASA !== 'en' || ms == null) return ms;
    return KAMUS_EN[ms] || ms;
  }

  /* Gantikan setiap frasa kamus yang panjang (>=8 aksara) DI DALAM teks. Ini menangkap ayat yang
     dipisah markup (satu <p> ada <strong> di tengah) dan mesej log yang dibina dengan gabungan. */
  function gantiFrasa(teks) {
    if (BAHASA !== 'en' || !teks) return teks;
    Object.keys(KAMUS_EN).forEach(function (k) {
      var kk = k.replace(/\s+$/, '');           // kunci tanpa ruang hujung juga dicuba
      if (kk.length >= 8 && teks.indexOf(kk) >= 0) teks = teks.split(kk).join(KAMUS_EN[k]);
    });
    return teks;
  }
  function tbMesej(mesej) { return gantiFrasa(mesej); }

  /* Gantikan teks Melayu dengan terjemahan dalam nilai nod. Nod HTML sering merentas baris
     (newline + indent), jadi teks yang dipangkas TIDAK menjadi substring nilai asal -
     fungsi ini memadankan perkataan demi perkataan bila padanan terus gagal. */
  function gantiTeks(nilai, cari, ganti) {
    var i = (nilai || '').indexOf(cari);
    if (i >= 0) return nilai.slice(0, i) + ganti + nilai.slice(i + cari.length);
    var corak = (cari || '').split(' ').map(function (x) {
      return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('\\s+');
    if (!corak) return nilai;
    try { return nilai.replace(new RegExp('^\\s*' + corak + '\\s*$'), ganti); } catch (e) { return nilai; }
  }

  /* senarai teks antara muka yang pernah diterjemah, untuk dipulihkan */
  var UI_ASAL = [];
  var UI_LOMPAT = '#resume, .lembar, .kertas, #log, #galeri, #mini-';

  /* kunci = teks Melayu yang dipangkas (dipakai untuk cari terjemahan); ms = nilai asal penuh
     (untuk nod teks yang ada ruang/newline, kita pulihkan nilai penuh itu) */
  function ingatUI(e, jenis, ms, en, kunci) {
    for (var i = 0; i < UI_ASAL.length; i++) {
      if (UI_ASAL[i].e === e && UI_ASAL[i].jenis === jenis) return;
    }
    UI_ASAL.push({ e: e, jenis: jenis, ms: ms, kunci: kunci || ms, en: en });
  }

  /* kumpul teks dalam satu bekas yang ada dalam kamus (untuk bekas kecil selepas render).
     Menyokong NOD TEKS supaya teks di dalam elemen ber-markup (cth "<strong>Nama</strong> dan ...")
     juga diterjemah, bukan hanya elemen kosong. */
  /* tukar teks kad reka bentuk mengikut bahasa TANPA membina semula kad (elak hilang pilihan) */
  function kemasTeksKad() {
    Array.prototype.forEach.call(document.querySelectorAll('.kad-pilih[data-templat]'), function (k) {
      var t = TEMPLAT[k.getAttribute('data-templat')];
      if (!t) return;
      var nota = k.querySelector('.kad-nota');
      if (nota) nota.textContent = tb(t.nota) || '';
      var li = k.querySelectorAll('.kad-ciri li');
      Array.prototype.forEach.call(li, function (x, i) {
        var asal = (t.ciri || [])[i];
        if (asal) x.textContent = tb(asal);
      });
    });
  }

  function terjemahElemen(akar) {
    if (!akar) return;
    var en = (BAHASA === 'en');
    var w = document.createTreeWalker(akar, NodeFilter.SHOW_TEXT, null);
    var nod;
    while ((nod = w.nextNode())) {
      var p = nod.parentNode;
      if (!p || (p.closest && p.closest(UI_LOMPAT))) continue;
      var ms = nod.nodeValue || '';
      var t = ms.replace(/\s+/g, ' ').trim();
      if (!t) continue;
      var terjemah = KAMUS_EN[t], dariCorak = false;
      if (!terjemah) {
        /* teks yang dijana kod: "Pengalaman 2", "Pendidikan 1", "Projek 3" */
        var m = /^([^0-9]+?) (\d+)$/.exec(t);
        if (m && KAMUS_EN[m[1].trim()]) terjemah = KAMUS_EN[m[1].trim()] + ' ' + m[2];
        if (!terjemah) {                                 /* cth "2 reka bentuk" */
          var m2 = /^(\d+) (.+)$/.exec(t);
          if (m2 && KAMUS_EN[m2[2].trim()]) terjemah = m2[1] + ' ' + KAMUS_EN[m2[2].trim()];
        }
        dariCorak = !!terjemah;
      }
      if (!terjemah) {
        var frasa = gantiFrasa(t);          /* ayat yang dipisah markup */
        if (frasa !== t) { terjemah = frasa; dariCorak = true; }
      }
      if (!terjemah) continue;
      ingatUI(nod, 'teksNod', ms, dariCorak ? gantiTeks(ms, t, terjemah) : undefined, t);
      if (en) nod.nodeValue = gantiTeks(ms, t, terjemah);
    }
    Array.prototype.forEach.call(akar.querySelectorAll('[placeholder]'), function (e) {
      if (e.closest && e.closest(UI_LOMPAT)) return;
      var t = e.getAttribute('placeholder');
      if (t && KAMUS_EN[t]) { ingatUI(e, 'placeholder', t); if (en) e.setAttribute('placeholder', KAMUS_EN[t]); }
    });
    Array.prototype.forEach.call(akar.querySelectorAll('[title]'), function (e) {
      var t = e.getAttribute('title');
      if (t && KAMUS_EN[t]) { ingatUI(e, 'title', t); if (en) e.setAttribute('title', KAMUS_EN[t]); }
    });
    Array.prototype.forEach.call(akar.querySelectorAll('[aria-label]'), function (e) {
      if (e.closest && e.closest(UI_LOMPAT)) return;
      var t = e.getAttribute('aria-label');
      if (t && KAMUS_EN[t]) { ingatUI(e, 'aria', t); if (en) e.setAttribute('aria-label', KAMUS_EN[t]); }
    });
  }

  /* kumpul teks statik yang ada dalam kamus (dijalankan sekali selepas borang dibina) */
  function kumpulTeksUI() {
    var akar = document.body;
    Array.prototype.forEach.call(akar.querySelectorAll('legend, label, button, option, p, h2, h3, span, strong, td, th, li'), function (e) {
      if (e.closest && e.closest(UI_LOMPAT)) return;
      if (e.children && e.children.length) return;              // ada tag dalaman: dibiarkan (elak pecah markup)
      var t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (t && KAMUS_EN[t]) ingatUI(e, 'teks', t);
    });
    Array.prototype.forEach.call(akar.querySelectorAll('[placeholder]'), function (e) {
      if (e.closest && e.closest(UI_LOMPAT)) return;
      var t = e.getAttribute('placeholder');
      if (t && KAMUS_EN[t]) ingatUI(e, 'placeholder', t);
    });
    Array.prototype.forEach.call(akar.querySelectorAll('[title]'), function (e) {
      var t = e.getAttribute('title');
      if (t && KAMUS_EN[t]) ingatUI(e, 'title', t);
    });
    Array.prototype.forEach.call(akar.querySelectorAll('[aria-label]'), function (e) {
      if (e.closest && e.closest(UI_LOMPAT)) return;
      var t = e.getAttribute('aria-label');
      if (t && KAMUS_EN[t]) ingatUI(e, 'aria', t);
    });
  }

  function terjemahAntaraMuka() {
    var en = (BAHASA === 'en');
    UI_ASAL.forEach(function (o) {
      /* 'en' hanya disimpan untuk teks yang dijana oleh pola (cth "Pengalaman 2");
         selebihnya dikira daripada kamus SEMASA supaya entri yang ditambah kemudian ikut terpakai */
      var nilai = en ? (o.en || KAMUS_EN[o.kunci] || o.kunci || o.ms) : (o.kunci || o.ms);
      if (o.jenis === 'teksNod') o.e.nodeValue = gantiTeks(o.ms, o.kunci || o.ms, nilai);
      else if (o.jenis === 'teks') o.e.textContent = nilai;
      else if (o.jenis === 'placeholder') o.e.setAttribute('placeholder', nilai);
      else if (o.jenis === 'title') o.e.setAttribute('title', nilai);
      else if (o.jenis === 'aria') o.e.setAttribute('aria-label', nilai);
    });
    /* imbasan penuh: menangkap teks yang dibina/ditukar selepas render (kad borang, mesej)
       yang belum didaftarkan. Teks Inggeris tidak akan didaftarkan semula kerana kunci kamus
       semuanya Bahasa Melayu - jadi menukar balik ke Melayu tetap betul. */
    terjemahElemen(document.body);
  }

  function terapkanBahasa() {
    document.documentElement.setAttribute('lang', BAHASA === 'en' ? 'en' : 'ms');
    var t = TEKS_UI[BAHASA] || TEKS_UI.ms;
    var set = function (id, teks) { var e = el(id); if (e && teks != null) e.innerHTML = teks; };
    set('tajuk-bahasa', t.tajukBahasa);
    set('sub-bahasa', t.subBahasa);
    set('pb-nota', t.notaBahasa);
    set('galeri-label', t.galeriLabel);
    set('mula-isi', t.mulaIsi);
    var h1 = document.querySelector('#hal-1 .galeri-kepala h2');
    if (h1) h1.innerHTML = t.galeriTajuk;
    var s1 = document.querySelector('#hal-1 .galeri-kepala .hal-sub');
    if (s1) s1.innerHTML = t.galeriSub;
    var h2 = document.querySelector('#hal-2 > .hal-tajuk');
    if (h2) h2.innerHTML = t.hal2Tajuk;
    var s2 = document.querySelector('#hal-2 > .hal-sub');
    if (s2) s2.innerHTML = t.hal2Sub;
    TAJUK_HAL = t.tajukHal.slice();
    TEKS_LANGKAH = t.teksLangkah.slice();
    ['ms', 'en'].forEach(function (k) {
      var b = document.querySelector('.pb-btn[data-bahasa="' + k + '"]');
      if (b) b.setAttribute('aria-pressed', k === BAHASA ? 'true' : 'false');
    });
    var lt = el('langkah-teks');           // teks langkah di bar atas
    if (lt && TEKS_LANGKAH[HAL_SEMASA]) lt.textContent = TEKS_LANGKAH[HAL_SEMASA];
    terjemahAntaraMuka();                    // seluruh antara muka (legend, label, nota, butang, placeholder)
    var kiraKad = el('galeri-kira');         // teks yang dijana kod
    if (kiraKad) kiraKad.textContent = Object.keys(TEMPLAT).length + (BAHASA === 'en' ? ' designs' : ' reka bentuk');
    kemasTeksKad();                          // kad reka bentuk (nota + ciri) ikut bahasa, TANPA bina semula
    if (typeof tunjukLangkah === 'function' && typeof langkahKini !== 'undefined') {
      tunjukLangkah(langkahKini);            // bar langkah kecil (Step N / 8, tajuk langkah, butang)
    }
    if (LOG_MENTAH) tulisLog(LOG_MENTAH, LOG_JENIS);   // log status ikut bahasa, tanpa hilang mesej
    if (typeof kemasLkNota === 'function') kemasLkNota();   // nota "belum diisi" ikut bahasa
    if (typeof semakSimpanan === 'function') semakSimpanan();   // nota resume tersimpan ikut bahasa
                                             // (bina semula akan membuang rujukan elemen & pilihan semasa)
    
  }

  function gunaBahasa(bhs) {
    BAHASA = (bhs === 'en') ? 'en' : 'ms';
    try { localStorage.setItem(KUNCI_BAHASA, BAHASA); } catch (e) { /* storan dihalang */ }
    terapkanBahasa();
    kemasSemula();
  }

  function barisPengalaman(data) {
    data = data || {};
    bilPengalaman++;
    var n = bilPengalaman;
    var b = document.createElement('div');
    b.className = 'baris';
    b.innerHTML =
      '<div class="kepala"><strong>Pengalaman ' + n + '</strong>' +
      '<button type="button" class="btn-hapus">Hapus</button></div>' +
      '<label>Jawatan</label><input class="p-jawatan" type="text" placeholder="cth. Quantity Surveyor">' +
      '<label>Syarikat</label><input class="p-syarikat" type="text" placeholder="cth. EPH Construction Sdn Bhd">' +
      '<label>Tempoh</label><input class="p-tempoh" type="text" placeholder="cth. Mac 2024 - Kini">' +
      '<label>Projek &amp; perkara utama</label>' +
      '<div class="projek-kotak"></div>' +
      '<button type="button" class="btn-tambah btn-tambah-projek">+ Tambah projek lain (cth. projek perumahan)</button>';
    b.querySelector('.p-jawatan').value = data.jawatan || '';
    b.querySelector('.p-syarikat').value = data.syarikat || '';
    b.querySelector('.p-tempoh').value = data.tempoh || '';
    var kotakProjek = b.querySelector('.projek-kotak');
    var senaraiAwal = senaraiProjek(data);
    (senaraiAwal.length ? senaraiAwal : [{ nama: '', poin: [] }]).forEach(function (pk) {
      kotakProjek.appendChild(barisProjek(pk));
    });
    kemasProjek(kotakProjek);
    b.querySelector('.btn-tambah-projek').addEventListener('click', function () {
      var baharu = barisProjek({ nama: '', poin: [] });
      kotakProjek.appendChild(baharu);
      kemasProjek(kotakProjek);
      baharu.querySelector('.pj-nama').focus();
      kemasSemula();
    });
    b.querySelector('.btn-hapus').addEventListener('click', function () {
      b.remove();
      kemasSemula();
    });
    terjemahElemen(b);
    return b;
  }

  /* satu kemahiran / bahasa = satu baris + tahap penguasaan 1-5 */
  function barisTahap(kunci, data) {
    data = data || {};
    bilTahap[kunci] = (bilTahap[kunci] || 0) + 1;
    var n = bilTahap[kunci];
    var tajuk = kunci === 'bahasa' ? 'Bahasa' : 'Kemahiran';
    var cth = kunci === 'bahasa' ? 'cth. Bahasa Melayu' : 'cth. AutoCAD';
    // baris baharu bermula di 3; data yang memang tiada tahap (kod lama) kekal "belum dipilih"
    var nilai = (data.tahap === undefined || data.tahap === null) ? 3 : (parseInt(data.tahap, 10) || 0);
    var b = document.createElement('div');
    b.className = 'baris';
    b.innerHTML =
      '<div class="kepala"><strong>' + tajuk + ' ' + n + '</strong>' +
      '<button type="button" class="btn-hapus">Hapus</button></div>' +
      '<label>' + tajuk + '</label><input class="t-nama" type="text" placeholder="' + cth + '">' +
      '<label>Tahap penguasaan</label>' +
      '<div class="tahap" data-tahap="' + nilai + '">' +
        [1, 2, 3, 4, 5].map(function (i) {
          return '<button type="button" class="tahap-btn" data-nilai="' + i + '">' + i + '</button>';
        }).join('') +
      '</div>' +
      '<p class="tahap-teks"></p>';
    b.querySelector('.t-nama').value = data.nama || '';
    b.querySelector('.btn-hapus').addEventListener('click', function () {
      b.remove();
      kemasSemula();
    });
    kemasTahap(b);
    terjemahElemen(b);
    return b;
  }

  /* selaraskan butang 1-5 yang menonjol dengan nilai dalam data-tahap */
  function kemasTahap(bekas) {
    var kotak = bekas && bekas.querySelector ? bekas.querySelector('.tahap') : null;
    if (!kotak) return;
    var nilai = parseInt(kotak.getAttribute('data-tahap'), 10) || 0;
    Array.prototype.forEach.call(kotak.querySelectorAll('.tahap-btn'), function (btn) {
      var n = parseInt(btn.getAttribute('data-nilai'), 10);
      btn.classList.toggle('aktif', n === nilai);
      btn.setAttribute('aria-pressed', n === nilai ? 'true' : 'false');
    });
    var teks = bekas.querySelector('.tahap-teks');
    if (teks) {
      teks.innerHTML = nilai
        ? (BAHASA === 'en'
            ? 'Level <strong>' + nilai + ' / 5</strong> &#8212; ' + tb(TAHAP_NAMA[nilai])
            : 'Tahap <strong>' + nilai + ' / 5</strong> &#8212; ' + TAHAP_NAMA[nilai])
        : tb('Belum dipilih');
    }
  }

  /* terima format baharu (senarai {nama, tahap}) atau kod lama (teks berkoma) */
  function senaraiTahap(d, kunci) {
    var v = d ? d[kunci] : null;
    if (Array.isArray(v)) {
      return v.map(function (o) {
        var nama = String((o && (o.nama || o.n)) || '').trim();
        var tahap = parseInt(o && (o.tahap || o.p), 10) || 0;
        return { nama: nama, tahap: Math.max(0, Math.min(5, tahap)) };
      }).filter(function (o) { return o.nama; });
    }
    if (typeof v === 'string' && v.trim()) {          // kod lama: teks dipisah koma, tiada skala
      return v.split(',').map(function (x) { return x.trim(); }).filter(Boolean)
        .map(function (x) { return { nama: x, tahap: 0 }; });
    }
    return [];
  }

  /* titik skala 1-5 untuk cetakan */
  function titikTahap(tahap) {
    if (!tahap) return '';
    var h = '<span class="titik-tahap" role="img" aria-label="Tahap ' + tahap + ' daripada 5">';
    for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= tahap ? 'penuh' : '') + '"></i>';
    return h + '</span>';
  }

  /* satu rujukan = satu baris (nama / jawatan+syarikat / telefon) - tiada tanda koma */
  function barisRujukan(data) {
    data = data || {};
    bilRujukan++;
    var n = bilRujukan;
    var b = document.createElement('div');
    b.className = 'baris';
    b.innerHTML =
      '<div class="kepala"><strong>Rujukan ' + n + '</strong>' +
      '<button type="button" class="btn-hapus">Hapus</button></div>' +
      '<label>Nama</label><input class="rj-nama" type="text" placeholder="cth. En. Ahmad Faizal bin Hassan">' +
      '<label>Jawatan &amp; syarikat</label><input class="rj-jawatan" type="text" placeholder="cth. Pengurus Projek, EPH Construction Sdn Bhd">' +
      '<label>Telefon atau e-mel</label><input class="rj-telefon" type="text" placeholder="cth. 012-345 6789 atau ahmad@contoh.my">';
    b.querySelector('.rj-nama').value = data.nama || '';
    b.querySelector('.rj-jawatan').value = data.jawatan || '';
    b.querySelector('.rj-telefon').value = data.telefon || '';
    b.querySelector('.btn-hapus').addEventListener('click', function () {
      b.remove();
      kemasSemula();
    });
    terjemahElemen(b);
    return b;
  }

  /* terima format baharu (senarai objek) atau kod lama (teks satu baris satu orang) */
  function senaraiRujukan(d) {
    var r = d ? d.rujukan : null;
    if (Array.isArray(r)) {
      return r.filter(function (o) { return o && (o.nama || o.jawatan || o.telefon); })
        .map(function (o) { return { nama: o.nama || '', jawatan: o.jawatan || '', telefon: o.telefon || '' }; });
    }
    if (typeof r === 'string' && r.trim()) {
      return r.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)
        .map(function (x) { return { nama: x, jawatan: '', telefon: '' }; });
    }
    return [];
  }

  function barisPendidikan(data) {
    data = data || {};
    bilPendidikan++;
    var n = bilPendidikan;
    var b = document.createElement('div');
    b.className = 'baris';
    b.innerHTML =
      '<div class="kepala"><strong>Pendidikan ' + n + '</strong>' +
      '<button type="button" class="btn-hapus">Hapus</button></div>' +
      '<label>Kelulusan</label><input class="d-kelulusan" type="text" placeholder="cth. Sarjana Muda Ukur Bahan">' +
      '<label>Institusi</label><input class="d-institusi" type="text" placeholder="cth. UiTM Shah Alam">' +
      '<label>Tahun</label><input class="d-tahun" type="text" placeholder="cth. 2021 - 2024">';
    b.querySelector('.d-kelulusan').value = data.kelulusan || '';
    b.querySelector('.d-institusi').value = data.institusi || '';
    b.querySelector('.d-tahun').value = data.tahun || '';
    b.querySelector('.btn-hapus').addEventListener('click', function () {
      b.remove();
      kemasSemula();
    });
    terjemahElemen(b);
    return b;
  }

  /* ---------- kumpul data ---------- */
  function kumpul() {
    var d = {
      nama: el('nama').value.trim(),
      telefon: el('telefon').value.trim(),
      emel: el('emel').value.trim(),
      lokasi: el('lokasi').value.trim(),
      jawatan: el('jawatan').value.trim(),
      ringkasan: el('ringkasan').value.trim(),
      kemahiran: [], bahasa: [],
      rujukan: [],
      foto: foto,
      pengalaman: [],
      pendidikan: [],
      tambahan: [],          // bahagian yang pelanggan tambah sendiri (tajuk + isi)
      buang: BUANG.slice(),  // bahagian piawai yang pelanggan buang
      susun: SUSUN ? { kiri: SUSUN.kiri.slice(), kanan: SUSUN.kanan.slice() } : null   // susunan blok
    };
    Array.prototype.forEach.call(document.querySelectorAll('#senarai-pengalaman .baris'), function (b) {
      var projek = [];
      Array.prototype.forEach.call(b.querySelectorAll('.baris-projek'), function (pk) {
        var nama = pk.querySelector('.pj-nama').value.trim();
        var klien = pk.querySelector('.pj-klien') ? pk.querySelector('.pj-klien').value.trim() : '';
        var poin = pk.querySelector('.pj-poin').value.split('\n')
          .map(bersihPoin).filter(Boolean);
        if (nama || klien || poin.length) projek.push({ nama: nama, klien: klien, poin: poin });
      });
      var o = {
        jawatan: b.querySelector('.p-jawatan').value.trim(),
        syarikat: b.querySelector('.p-syarikat').value.trim(),
        tempoh: b.querySelector('.p-tempoh').value.trim(),
        projek: projek,
        poin: []                                   // senarai rata (keserasian kod/ujian lama)
      };
      projek.forEach(function (pk) { pk.poin.forEach(function (x) { o.poin.push(x); }); });
      if (o.jawatan || o.syarikat || o.tempoh || projek.length) d.pengalaman.push(o);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#senarai-pendidikan .baris'), function (b) {
      var o = {
        kelulusan: b.querySelector('.d-kelulusan').value.trim(),
        institusi: b.querySelector('.d-institusi').value.trim(),
        tahun: b.querySelector('.d-tahun').value.trim()
      };
      if (o.kelulusan || o.institusi || o.tahun) d.pendidikan.push(o);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#senarai-tambahan .baris'), function (b) {
      var modDua = (b.getAttribute('data-mod') === 'dua');
      var bahagian = [];
      if (modDua) {
        Array.prototype.forEach.call(b.querySelectorAll('.baris-dua'), function (d2) {
          var nama = d2.querySelector('.bd-nama').value.trim();
          var detail = d2.querySelector('.bd-detail').value.split('\n').join(' ').trim();
          if (nama || detail) bahagian.push({ nama: nama, detail: detail });
        });
      }
      var o = {
        t: b.querySelector('.t-tajuk').value.trim(),
        b: modDua
          ? bahagian.map(function (x) { return x.nama + (x.detail ? (x.nama ? ' \u2014 ' : '') + x.detail : ''); }).join('\n')
          : b.querySelector('.t-isi').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).join('\n')
      };
      if (modDua) { o.mod = 'dua'; o.bahagian = bahagian; }
      if (o.t || o.b) d.tambahan.push(o);
    });
    ['kemahiran', 'bahasa'].forEach(function (kunci) {
      Array.prototype.forEach.call(document.querySelectorAll('#senarai-' + kunci + ' .baris'), function (b) {
        var nama = b.querySelector('.t-nama').value.trim();
        if (!nama) return;
        var kotak = b.querySelector('.tahap');
        d[kunci].push({ nama: nama, tahap: parseInt(kotak ? kotak.getAttribute('data-tahap') : '', 10) || 0 });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('#senarai-rujukan .baris'), function (b) {
      var o = {
        nama: b.querySelector('.rj-nama').value.trim(),
        jawatan: b.querySelector('.rj-jawatan').value.trim(),
        telefon: b.querySelector('.rj-telefon').value.trim()
      };
      if (o.nama || o.jawatan || o.telefon) d.rujukan.push(o);
    });
    d.templat = KUNCI_TEMPLAT;
    d.labelProjek = 'projek';
    d.bahasaResume = BAHASA;
    return d;
  }

  /* ---------- pratonton ---------- */
  var RENGGANG = 1;              // faktor jarak templat satu lajur (1 = padat)
  var PENUH = 1;                 // berapa penuh halaman selepas direnggangkan (0-1)
  var TEKS = 1;                  // skala fon templat satu lajur (0.93-1)
  var LEBIH = false;             // isi melebihi satu halaman (akan dicetak 2 halaman)
  /* Jidar atas yang berulang pada setiap halaman cetakan (px pada 96dpi). Mesti sama dengan
     padding atas yang di-clone oleh setiap templat: Biru Bersih 10mm, Biru & Kelabu 5mm,
     Korporat Moden 0 (jalurnya tersembunyi - tiada apa yang menutup kandungan). */
  var JIDAR_HAL = { bersih: 38, biru: 19, korporat: 0 };

  var TINGGI_KERTAS = 1123;      // px: tinggi A4 pada 96dpi (794 x 1123)
  var TINGGI_ISI = 0;            // px: tinggi kandungan resume yang akan dicetak
  var HALAMAN = 1;               // berapa halaman resume ini (1-4)
  var ISI_TERKINI = '';          // HTML resume semasa (untuk salinan halaman 2+)

  /* Templat satu lajur: kalau isi pendek, renggangkan jarak supaya halaman tidak lopong.
     Nilai disimpan dalam --renggang pada helaian, jadi cetakan pun sama. */
  /* berapa halaman kandungan setinggi ini? Toleransi 10px sama seperti siling auto-fit,
     supaya resume yang berjaya dipadatkan ke satu halaman tidak dilaporkan 2 halaman. */
  /* Anggaran KASAR sahaja: nilai sebenar datang daripada kiraPotong() yang mensimulasi
     pemotongan cetakan (termasuk elemen yang tidak boleh dipecah). Jangan kembali ke siling
     "TINGGI_KERTAS - 10": kandungan yang berakhir antara 1113-1123px (cth Korporat Moden
     dengan 4 pekerjaan) sebenarnya muat SATU halaman, tetapi siling itu memaksa 2 halaman -
     dan pratonton jadi bercanggah dengan PDF. */
  function kiraHalaman(t) {
    var j = jidarHal();
    if (!t || t <= TINGGI_KERTAS) return 1;
    if (j <= 0) return Math.max(1, Math.min(4, Math.ceil(t / TINGGI_KERTAS)));
    /* Halaman 1 memakai 297mm penuh aliran; setiap halaman berikutnya kehilangan jidar atas
       yang berulang, jadi kapasitinya TINGGI_KERTAS - jidar. */
    return Math.max(2, Math.min(4, 1 + Math.ceil((t - TINGGI_KERTAS) / (TINGGI_KERTAS - j))));
  }

  function jidarHal() { return JIDAR_HAL[KUNCI_TEMPLAT] || 0; }

  /* ---------- pratonton berbilang halaman ----------
     Setiap helaian tambahan ialah "tingkap" ke bahagian kandungan seterusnya: kandungan
     yang sama digeser ke atas (n-1) x 297mm lalu dipotong pada tinggi A4. Chrome mencetak
     dengan cara yang sama (aliran kandungan dipotong setiap 297mm), jadi pratonton ini
     sama dengan cetakan sebenar - bukan anggaran. */
  var POTONG = [0];              // POTONG[h-1] = kedudukan (px) mula halaman h (halaman 1 = 0)

  /* PENTING: titik potong mesti diukur pada skala SEBENAR (1), bukan skala pratonton yang
     sedang aktif. Skala pratonton baru ditetapkan oleh susunSkala() SELEPAS fungsi ini
     berjalan, jadi memakai nilai lama menghasilkan ukuran yang salah - titik potong jatuh
     terlalu awal dan halaman 1 nampak terpotong. */
  function tanpaSkala(fn) {
    var akar = document.documentElement;
    var simpan = akar.style.getPropertyValue('--skala');
    akar.style.setProperty('--skala', '1');
    var hasil = fn();
    if (simpan) akar.style.setProperty('--skala', simpan); else akar.style.removeProperty('--skala');
    return hasil;
  }

  /* Cari tempat cetakan SEBENARNYA memotong untuk sempadan pada 'had' px.
     Elemen yang tidak boleh dipecah (satu bulet/poin, satu item pengalaman, atau tajuk
     bahagian) yang merentasi sempadan akan dihantar bulat-bulat ke halaman berikutnya.
     Elemen yang lebih tinggi daripada satu halaman diabaikan (pelayar pun akan memecahnya). */
  function titikPotong(lembar, had) {
    return tanpaSkala(function () { return titikPotongDalam(lembar, had); });
  }

  function titikPotongDalam(lembar, had) {
    var sk = 1;                                   // diukur pada saiz sebenar (lihat tanpaSkala)
    var lr = lembar.getBoundingClientRect();
    function atas(e) { return (e.getBoundingClientRect().top - lr.top) / sk; }
    function bawah(e) { return (e.getBoundingClientRect().bottom - lr.top) / sk; }
    var potong = had;
    /* Apa yang TIDAK BOLEH dipecah (sama seperti peraturan cetakan):
       - LI: satu bulet/poin mesti kekal satu ayat penuh
       - tajuk bahagian (H2) dan tajuk item (.cvb-item-kepala/.cvs-item-kepala dsb):
         mesti kekal bersama baris pertama kandungannya
       ITEM PENGALAMAN SENDIRI pula BOLEH dipecah - sebahagian di halaman 1, sebahagian di
       halaman 2 - jadi ia sengaja tidak disenaraikan di sini. */
    function bawa(e) {
      var c = e.className ? String(e.className) : '';
      if (e.tagName === 'H2') return true;
      return /\b(cvb|cvs)-item-kepala\b/.test(c) || /\b(cvb|cvs)-item-sub\b/.test(c);
    }
    function kandunganPertama(e) {
      var n = e.nextElementSibling;
      if (!n) return null;
      if (n.tagName === 'UL') return n.firstElementChild || n;      // bulet pertama
      var k = n.querySelector ? n.querySelector('.cvb-item-kepala, .cvs-item-kepala') : null;
      return k || n;
    }
    var calon = lembar.querySelectorAll('li, h2, .cvb-item-kepala, .cvb-item-sub, .cvs-item-kepala, .cvs-item-sub');
    Array.prototype.forEach.call(calon, function (e) {
      var a = atas(e), b = bawah(e);
      if (b - a > TINGGI_KERTAS) return;              // terlalu tinggi: pelayar pun akan memecahnya
      if (a < had && b > had + 0.5) {                 // elemen ini sendiri merentasi sempadan
        if (a < potong) potong = a;
        return;
      }
      // tajuk: jangan tinggal keseorangan - kalau baris pertama kandungannya jatuh ke halaman
      // berikutnya (break-after: avoid), bawa tajuk itu sekali
      if (bawa(e) && a < had) {
        var k = kandunganPertama(e);
        if (k && atas(k) < had && bawah(k) > had + 0.5 && a < potong) potong = a;
      }
    });
    /* Math.floor (bukan round): titik potong tidak boleh melebihi bahagian atas elemen yang
       tidak boleh dipecah - jika tidak elemen itu terkeluar 1px di hujung halaman 1. */
    return Math.max(0, Math.floor(potong));
  }

  /* helaian pengukur (skala 1, tidak kelihatan) - sumber semua ukuran tinggi */
  function lembarUkur() {
    var a = el('ukur-lembar');
    if (!a) return null;
    var q = a.querySelector('.' + tmp().kelas);
    return q || a.firstElementChild;
  }

  /* tinggi isi satu lembar pada skala sebenar (foto mutlak diabaikan) */
  function hitungTinggiIsi(lembar) {
    var bawah = 0;
    Array.prototype.forEach.call(lembar.children, function (a) {
      if (a.classList.contains('cvs-foto')) return;      // foto diletak mutlak di penjuru
      bawah = Math.max(bawah, a.offsetTop + a.offsetHeight);
    });
    return bawah + 40;                                   // + sedikit ruang bawah
  }

  /* Bilangan halaman = bilangan potongan cetakan + 1. Helaian pratonton, nota "akan dicetak
     N halaman" dan bilangan halaman datang daripada simulasi YANG SAMA, jadi pratonton tidak
     boleh bercanggah dengan PDF. */
  function kiraPotong() {
    POTONG = [0];
    var lembar = lembarUkur();
    if (!lembar) { HALAMAN = 1; return; }
    POTONG = tanpaSkala(function () {
      var senarai = [0];
      var j = jidarHal();
      var tinggi = TINGGI_ISI || hitungTinggiIsi(lembar);
      for (var h = 2; h <= 4; h++) {
        /* h = 2: hujung halaman 1 (padding pertama sudah dikira dalam aliran).
           h >= 3: setiap halaman seterusnya menyusut jidar px kerana padding berulang. */
        var had = senarai[h - 2] + TINGGI_KERTAS - (h >= 3 ? j : 0);
        if (tinggi <= had + 0.5) break;                  // isi habis sebelum sempadan ini
        var potong = titikPotongDalam(lembar, had);
        if (potong <= senarai[h - 2] + 1) potong = had;   // tiada potongan lebih awal
        senarai.push(potong);
      }
      return senarai;
    });
    HALAMAN = Math.max(1, Math.min(4, POTONG.length));
  }

  /* Tinggi tingkap helaian h: sampai titik potong seterusnya (jadi ada ruang kosong di
     bawah seperti cetakan sebenar), atau penuh A4 untuk halaman terakhir. */
  function tinggiHal(h) {
    if (h < POTONG.length) return Math.max(40, POTONG[h] - POTONG[h - 1]);
    return TINGGI_KERTAS;
  }

  function setTingkap(kertas, h) {
    var w = kertas ? kertas.querySelector('.sambungan') : null;
    if (!w) return;
    w.style.setProperty('--tinggi-hal', Math.round(tinggiHal(h)) + 'px');
    w.style.setProperty('--potong', (-Math.round(POTONG[h - 1] || 0)) + 'px');
  }

  function helaianHalaman(n) {
    var kartu = document.createElement('div');
    kartu.className = 'kertas kertas-tambahan';
    kartu.setAttribute('data-hal', n);
    kartu.setAttribute('aria-label', 'Halaman ' + n);
    kartu.innerHTML = '<div class="pr-berulang" aria-hidden="true">'
      + '<div class="cb-jalur"></div><div class="cb-rel"></div><div class="cb-garis"></div>'
      + '<div class="cb-kaki"><span class="pr-kaki-nama"></span>'
      + '<span class="cb-sambung">sambungan halaman</span></div></div>'
      + '<div class="sambungan" style="--potong: ' + (-Math.round(POTONG[n - 1] || 0)) + 'px; '
      + '--tinggi-hal: ' + Math.round(tinggiHal(n)) + 'px">'
      + '<article class="lembar"></article></div>'
      + '<div class="cap-air" aria-hidden="true"></div>'
      + '<span class="pil-hal">Halaman ' + n + '</span>';
    kartu.querySelector('.lembar').innerHTML = ISI_TERKINI;
    var cap = kartu.querySelector('.cap-air');
    if (cap && el('cap-air')) cap.innerHTML = el('cap-air').innerHTML;
    var nm = kartu.querySelector('.pr-kaki-nama');
    if (nm) nm.textContent = el('cb-nama') ? el('cb-nama').textContent : '';
    return kartu;
  }

  var ISI_DIBINA = null, HALAMAN_DIBINA = 0;
  function susunHalaman() {
    var n = Math.max(1, Math.min(4, HALAMAN || 1));
    kiraPotong();
    /* nota "N halaman" mesti ikut bilangan potongan sebenar, bukan anggaran tinggi */
    LEBIH = HALAMAN > 1;
    tandaLapang();
    var tanda = ISI_TERKINI + '|' + POTONG.join(',');
    if (ISI_DIBINA === tanda && HALAMAN_DIBINA === n) return;   // tiada perubahan
    ISI_DIBINA = tanda; HALAMAN_DIBINA = n;
    // halaman 1 juga dipotong pada titik cetakan (bukan penuh 297mm kalau ada elemen terdorong)
    setTingkap(el('kertas-1'), 1);
    setTingkap(el('kertas-sisi'), 1);
    [el('papan-kertas'), el('papan-sisi')].forEach(function (pk) {
      if (!pk) return;
      Array.prototype.forEach.call(pk.querySelectorAll('.kertas-tambahan'), function (x) { pk.removeChild(x); });
      for (var h = 2; h <= n; h++) {
        var kartu = helaianHalaman(h);
        if (pk.id === 'papan-sisi') kartu.classList.add('kertas-sisi-tambahan');
        pk.appendChild(kartu);
      }
      var pertama = pk.firstElementChild;
      if (!pertama) return;
      var pil = pertama.querySelector('.pil-hal');
      if (n > 1 && !pil) {
        pil = document.createElement('span');
        pil.className = 'pil-hal';
        pil.textContent = 'Halaman 1';
        pil.setAttribute('aria-hidden', 'true');
        pertama.appendChild(pil);
      } else if (n === 1 && pil) {
        pil.parentNode.removeChild(pil);
      }
    });
    document.body.classList.toggle('dua-halaman', n > 1);
  }

  /* pemboleh ubah auto-fit (--renggang / --teks) diset pada helaian halaman 1;
     salin ke semua helaian tambahan supaya jarak dan saiz fon sama. */
  function salinLaras() {
    var asal = el('resume') ? el('resume').firstElementChild : null;
    if (!asal) return;
    var senarai = document.querySelectorAll('.kertas-tambahan .sambungan > .lembar > *, #ukur-lembar > *');
    Array.prototype.forEach.call(senarai, function (a) { a.style.cssText = asal.style.cssText; });
  }

  /* Pembalut: selepas mengukur ruang, pastikan helaian halaman 2+ sepadan dengan
     bilangan halaman yang baru dikira. Setiap laluan yang mengukur semula (masuk
     pratonton, tukar langkah, muat data) akan menyegerakkan helaian sekali gus. */
  function larasRuang() {
    var r = larasRuangDalam();
    susunHalaman();
    return r;
  }

  function larasRuangDalam() {
    var kertas = [el('kertas-ukur'), el('sisi-kertas'), el('resume')];
    var lembar = null;
    RENGGANG = 1;
    for (var i = 0; i < kertas.length && !lembar; i++) {
      var q = kertas[i] ? kertas[i].querySelector('.' + tmp().kelas) : null;
      if (q && q.offsetHeight > 0) lembar = q;        // ambil helaian yang sedang kelihatan
    }
    if (!tmp().satuLajur) {
      // templat dua lajur: ukur sahaja (tidak ubah jarak) supaya nota "cetak 2 halaman" tetap betul
      if (lembar) { lembar.style.removeProperty('--renggang'); lembar.style.removeProperty('--teks'); }
      var dua = null;
      for (var t = 0; t < kertas.length && !dua; t++) {
        var qd = kertas[t] ? kertas[t].querySelector('.' + tmp().kelas) : null;
        if (qd && qd.offsetHeight > 0) dua = qd;
      }
      if (dua) {
        var ban = dua.querySelector('.cvb-banner'), ki = dua.querySelector('.cvb-kiri'), ka = dua.querySelector('.cvb-kanan');
        var hd;
        /* Tinggi sebenar templat dua lajur = tinggi kotak terbesarnya. Jangan guna jumlah
           anggaran + 20px: lebihan itu menjadikan kandungan yang berakhir tepat pada hujung
           halaman (cth Biru & Kelabu dengan 1 pekerjaan) dilaporkan 2 halaman sedangkan PDF
           1 halaman - dan pratonton jadi bercanggah dengan cetakan. scrollHeight diambil
           supaya limpahan tersembunyi tetap dikira (offsetHeight sahaja boleh memendekkan). */
        hd = Math.max(dua.offsetHeight || 0, dua.scrollHeight || 0);
        if (!hd) hd = (ban ? ban.offsetHeight : 0) + Math.max(ki ? ki.offsetHeight : 0, ka ? ka.offsetHeight : 0);
        PENUH = hd / TINGGI_KERTAS;
        LEBIH = hd > TINGGI_KERTAS - 10;
        TINGGI_ISI = hd;
        HALAMAN = kiraHalaman(hd);
      } else {
        PENUH = 1; LEBIH = false; TINGGI_ISI = 0; HALAMAN = 1;
      }
      TEKS = 1; RENGGANG = 1;
      tandaLapang();
      return RENGGANG;
    }
    if (!lembar) {
      PENUH = 1; TEKS = 1; LEBIH = false; TINGGI_ISI = 0; HALAMAN = 1;
      tandaLapang();
      return RENGGANG;
    }
    function tinggiIsi() { return hitungTinggiIsi(lembar); }
    TEKS = 1; LEBIH = false;
    lembar.style.setProperty('--renggang', '1');
    lembar.style.setProperty('--teks', '1');
    var tinggi = tinggiIsi();
    var sasaran = TINGGI_KERTAS * 0.86;                    // isi sepatutnya ~86% halaman
    var siling = TINGGI_KERTAS - 10;                       // jangan sampai melimpah ke halaman 2
    if (tinggi > 0 && tinggi < sasaran) {
      for (var j = 0; j < 4; j++) {
        var cuba = Math.min(1.6, RENGGANG * (sasaran / Math.max(1, tinggi)));
        if (cuba <= RENGGANG + 0.005) break;
        lembar.style.setProperty('--renggang', cuba.toFixed(3));
        var baharu = tinggiIsi();
        if (baharu > siling) { lembar.style.setProperty('--renggang', RENGGANG.toFixed(3)); break; }
        RENGGANG = cuba; tinggi = baharu;
        if (tinggi >= sasaran * 0.98) break;
      }
    }
    // terlalu banyak isi: cuba padatkan (jarak rapat + fon kecil sedikit) supaya muat satu halaman
    if (tinggi > siling) {
      var TAHAP = [[0.86, 0.97], [0.78, 0.94], [0.72, 0.93]];
      for (var k = 0; k < TAHAP.length; k++) {
        lembar.style.setProperty('--renggang', TAHAP[k][0].toFixed(3));
        lembar.style.setProperty('--teks', TAHAP[k][1].toFixed(3));
        var t2 = tinggiIsi();
        RENGGANG = TAHAP[k][0]; TEKS = TAHAP[k][1]; tinggi = t2;
        if (t2 <= siling) break;
        if (k === TAHAP.length - 1) {          // masih tidak muat: balik ke saiz biasa (jangan kecilkan sia-sia)
          lembar.style.setProperty('--renggang', '1');
          lembar.style.setProperty('--teks', '1');
          RENGGANG = 1; TEKS = 1; tinggi = tinggiIsi();
        }
      }
    }
    var nilai = RENGGANG.toFixed(3), nilaiFon = TEKS.toFixed(3);
    kertas.forEach(function (k) {
      var q = k ? k.querySelector('.' + tmp().kelas) : null;
      if (!q) return;
      q.style.setProperty('--renggang', nilai);
      q.style.setProperty('--teks', nilaiFon);
    });
    PENUH = tinggi / TINGGI_KERTAS;
    LEBIH = tinggi > siling;
    TINGGI_ISI = tinggi;
    HALAMAN = kiraHalaman(tinggi);
    tandaLapang();
    return RENGGANG;
  }

  /* nota jujur kepada pelanggan: maklumat sedikit = halaman nampak lapang */
  function tandaLapang() {
    var nota = el('nota-lapang');
    if (!nota) return;
    if (LEBIH) {
      nota.hidden = false;
      var bil = HALAMAN > 1 ? HALAMAN : 2;
      nota.innerHTML = (BAHASA === 'en'
        ? '<strong>Your resume is longer than one page.</strong> It will print as ' + bil + ' pages '
        : '<strong>Resume melebihi satu halaman.</strong> Ia akan dicetak sebagai ' + bil + ' halaman ')
        + '(tidak salah untuk jawatan berpengalaman, tetapi penjual boleh bantu rapatkan). Kalau anda mahu '
        + '<strong>1 halaman</strong>: padam poin yang kurang penting (butang <strong>&times;</strong> pada baris poin), '
        + 'pendekkan <strong>Ringkasan</strong>, atau buang bahagian yang tidak perlu.';
      return;
    }
    if (tmp().satuLajur && PENUH < 0.55) {
      nota.hidden = false;
      nota.innerHTML = BAHASA === 'en'
        ? '<strong>The page is still empty.</strong> Spacing was stretched automatically, but this resume '
          + 'still has a lot of blank space. Add another section to fill it \u2014 for example more '
          + '<strong>Skills</strong>, <strong>Languages</strong>, or your own section such as '
          + '<strong>Projects</strong>, <strong>Certificates &amp; Training</strong> or <strong>Activities</strong> '
          + '(buttons at the end of the page 2 form).'
        : '<strong>Halaman masih lapang.</strong> Jarak sudah direnggangkan automatik, '
          + 'tetapi resume ini masih ada banyak ruang kosong. Tambah bahagian lain supaya nampak penuh \u2014 '
          + 'contohnya <strong>Kemahiran</strong> yang lebih lengkap, <strong>Bahasa</strong>, atau bahagian sendiri '
          + 'seperti <strong>Projek</strong>, <strong>Sijil &amp; Latihan</strong> atau <strong>Aktiviti</strong> '
          + '(butang di hujung borang halaman 2).';
    } else {
      nota.hidden = true;
      nota.innerHTML = '';
    }
  }

  function papar(d) {
    var isi = htmlTemplat(d);
    ISI_TERKINI = isi;
    el('resume').innerHTML = isi;
    var sisi = el('sisi-kertas');
    if (sisi) sisi.innerHTML = isi;
    var ukur = el('ukur-lembar');          // helaian pengukur (tidak kelihatan)
    if (ukur) ukur.innerHTML = isi;
    document.body.setAttribute('data-templat', KUNCI_TEMPLAT);
    var kakiNama = el('cb-nama');
    if (kakiNama) kakiNama.textContent = (d.nama || 'Resume') + (d.jawatan ? ' \u00b7 ' + d.jawatan : '');
    capAir(!penjual);      // cop air dahulu: kedudukan mutlak, tidak menjejaskan ukuran
    larasRuang();          // ukur tinggi + kira PENUH/LEBIH/HALAMAN + bina helaian halaman 2+
    salinLaras();          // jarak & saiz fon sama pada semua helaian
    susunSkala();
    susunSkalaSisi();
    tandaSusunRasmi();     // butang + nota susunan rasmi ikut peranan (penjual/pelanggan) dan templat
  }

  /* ---------- templat 2: Biru & Kelabu ---------- */
  function ikon(jenis) {
    var bentuk = {
      telefon: '<path d="M3.2 1.2h3.1l1.1 3.6-1.9 1.2a9.6 9.6 0 0 0 4.5 4.5l1.2-1.9 3.6 1.1v3.1a1.1 1.1 0 0 1-1.2 1.1A13.6 13.6 0 0 1 2.1 2.4 1.1 1.1 0 0 1 3.2 1.2z"/>',
      emel: '<path d="M1.4 3.2h13.2v9.6H1.4z" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
            '<path d="M1.4 4 8 9.2 14.6 4" fill="none" stroke="currentColor" stroke-width="1.4"/>',
      lokasi: '<path d="M8 1.1A4.9 4.9 0 0 1 12.9 6c0 3.4-4.9 8.9-4.9 8.9S3.1 9.4 3.1 6A4.9 4.9 0 0 1 8 1.1z"/>' +
              '<circle cx="8" cy="5.9" r="1.9" fill="#fdfdfd"/>'
    };
    return '<svg class="cvb-ikon" viewBox="0 0 16 16" aria-hidden="true">' + (bentuk[jenis] || '') + '</svg>';
  }

  /* lencana bulat putih di dalam bulatan biru pada garisan pemisah */
  function ikonLencana(jenis) {
    var bentuk = {
      orang: '<circle cx="8" cy="5.1" r="3.1"/><path d="M2.3 14.6c0-3.2 2.6-5.3 5.7-5.3s5.7 2.1 5.7 5.3z"/>',
      beg: '<rect x="1.6" y="5.4" width="12.8" height="8.6" rx="1.3"/>' +
           '<path d="M5.7 5.4V4c0-.9.7-1.6 1.6-1.6h1.4c.9 0 1.6.7 1.6 1.6v1.4" fill="none" stroke="#fff" stroke-width="1.3"/>' +
           '<path d="M1.6 8.8h12.8" fill="none" stroke="#323b4c" stroke-width="1"/>',
      topi: '<path d="M8 2.1 15.2 5.7 8 9.3 0.8 5.7z"/>' +
            '<path d="M4.1 7.5v3.3c0 1.5 1.8 2.5 3.9 2.5s3.9-1 3.9-2.5V7.5" fill="none" stroke="#fff" stroke-width="1.3"/>',
      orangRamai: '<circle cx="6" cy="5.2" r="2.7"/><path d="M1.1 14.6c0-2.7 2.2-4.6 4.9-4.6s4.9 1.9 4.9 4.6z"/>' +
                  '<path d="M10.9 3.2a2.6 2.6 0 0 1 0 5.1" fill="none" stroke="#fff" stroke-width="1.3"/>' +
                  '<path d="M11.9 10.2c1.9.5 3.1 2 3.1 4.4" fill="none" stroke="#fff" stroke-width="1.3"/>'
    };
    return '<span class="cvb-lencana" aria-hidden="true"><svg viewBox="0 0 16 16">' + (bentuk[jenis] || '') + '</svg></span>';
  }

  /* ---------- susunan blok resume (boleh dialih oleh pelanggan) ---------- */
  /* Dua lapisan susunan blok:
       SUSUN        = susunan DOKUMEN ini sahaja. Ia datang daripada kod pesanan pelanggan (atau aturan
                      yang pelanggan buat dalam pratonton) dan hanya memberi kesan pada resume itu.
       SUSUN RASMI  = disimpan oleh PENJUAL (localStorage, satu set bagi setiap templat). Ia menjadi
                      susunan lalai untuk SEMUA dokumen baru, dan pelanggan tidak boleh mengubahnya.
     null bermakna "ikut susunan rasmi"; kalau tiada susunan rasmi, susunan asal templat digunakan. */
  var SUSUN = null;                 // { kiri: [id...], kanan: [id...] } — null bermakna ikut susunan rasmi
  var KUNCI_SUSUN = 'resume-mv-susun-rasmi';
  var KUNCI_BAHASA = 'resume-mv-bahasa';

  /* ---------- bahasa resume (dwibahasa) ----------
     BAHASA menentukan tajuk & label di dalam resume. Templat Korporat Moden memakai ejaan fail
     rujukan Canva (CONTACT / SUMMARY / KEY SKILLS / LANGUAGE / WORK EXPERIENCE) bila bahasa Inggeris
     dipilih - TAJUK_KORP - supaya kesetiaan kepada rujukan tidak hilang. */
  var BAHASA = 'en';        // lalai ENGLISH (pelanggan boleh tukar ke Bahasa Melayu di halaman 1)
  var TAJUK_BHS = {
    ms: { kontak: 'Kontak', profil: 'Ringkasan', pengalaman: 'Pengalaman Kerja', pendidikan: 'Pendidikan',
          kemahiran: 'Kemahiran', bahasa: 'Bahasa', rujukan: 'Rujukan' },
    en: { kontak: 'Contact', profil: 'Summary', pengalaman: 'Work Experience', pendidikan: 'Education',
          kemahiran: 'Key Skills', bahasa: 'Languages', rujukan: 'References' }
  };
  /* Setiap templat ada ejaan sendiri: Biru & Kelabu memakai "Profil" sejak awal, dan templat
     Korporat Moden (bila bahasa Inggeris) mengekalkan ejaan fail rujukan Canva. */
  var TAJUK_TEMPLAT_KHAS = {
    biru: { ms: { profil: 'Profil' }, en: { profil: 'Profile' } },
    korporat: { en: { kontak: 'Contact', profil: 'Summary', pengalaman: 'Work Experience',
                      pendidikan: 'Education', kemahiran: 'Key Skills', bahasa: 'Language',
                      rujukan: 'References' } }
  };
  function tt(kunci) {
    var khas = (TAJUK_TEMPLAT_KHAS[KUNCI_TEMPLAT] || {})[BAHASA] || {};
    if (khas[kunci]) return khas[kunci];
    return (TAJUK_BHS[BAHASA] || TAJUK_BHS.ms)[kunci] || TAJUK_BHS.ms[kunci];
  }
  /* label projek: pelanggan boleh ubah (Projek / Klien / Projek & Klien / tanpa label) */
  var LABEL_PROJEK = 'projek';
  var MOD_SUSUN = false;            // mod alih: blok boleh diseret / digerak
  var URUTAN_ASAS = { kiri: ['kontak', 'kemahiran', 'bahasa'], kanan: ['profil', 'pengalaman', 'pendidikan', 'rujukan'] };

  /* ---------- daftar templat ----------
     Templat baharu = satu entri di sini + fungsi render (htmlXxx) + blok CSS (.cv-xxx)
     + kad pilihan di halaman 1. Langkah penuh: lihat TEMPLAT-BARU.md */
  /* Daftar reka bentuk. Untuk menambah reka bentuk BAHARU, tambah satu entri di sini:
       kunci   : nama pendek dalam kod (huruf kecil)
       nama    : nama yang pelanggan lihat pada kad
       aksen   : warna utama reka bentuk (dipakai pada kad galeri)
       nota    : satu ayat penerangan pada kad
       ciri    : 2-3 ciri ringkas (titik tanda centang pada kad)
       html    : fungsi yang menghasilkan resume (contoh: htmlBiru)
     Kad pada halaman 1 dijana automatik daripada senarai ini - tiada HTML perlu diubah. */
  var TEMPLAT = {
    biru: {
      kunci: 'biru', kelas: 'cv-biru', nama: 'Biru & Kelabu', aksen: '#323b4c',
      nota: 'Dua lajur: banner biru gelap dengan nama dan foto bulat, rel kelabu untuk kontak, kemahiran dan bahasa, lajur kanan untuk profil, pengalaman dan pendidikan.',
      ciri: ['Padat - banyak maklumat dalam satu halaman A4', 'Foto bulat dan lencana ikon pada kontak'],
      html: htmlBiru
    },
    bersih: {
      kunci: 'bersih', kelas: 'cv-bersih', nama: 'Biru Bersih', satuLajur: true, aksen: '#00366d',
      nota: 'Satu lajur gaya korporat yang lapang: nama besar, foto bulat di penjuru dan garis tajuk biru navy yang tersusun ke bawah.',
      ciri: ['Mesra sistem automatik (ATS) - satu lajur', 'Sesuai jawatan korporat dan kerajaan'],
      urutanAsas: ['profil', 'pengalaman', 'pendidikan', 'kemahiran', 'bahasa', 'rujukan'],
      html: htmlBersih
    },
    korporat: {
      kunci: 'korporat', kelas: 'cv-korporat', nama: 'Korporat Moden', aksen: '#404041',
      nota: 'Gaya korporat moden: rel kelabu-hijau di kiri untuk foto dan kemahiran, lajur kanan untuk ringkasan dan pengalaman, dengan garis tajuk yang tegas.',
      ciri: ['Ruang putih luas - sesuai jawatan korporat dan pengurusan', 'Tajuk huruf besar dengan garis dan ikon petak'],
      urutanDua: { kiri: ['kontak', 'pendidikan', 'kemahiran', 'bahasa'], kanan: ['profil', 'pengalaman', 'rujukan'] },
      html: htmlKorporat
    }
  };
  var KUNCI_TEMPLAT = 'biru';

  function tmp() { return TEMPLAT[KUNCI_TEMPLAT] || TEMPLAT.biru; }
  function htmlTemplat(d) { return tmp().html(d); }

  /* templat satu lajur: susunan blok dibaca sebagai satu aliran (kiri kemudian kanan) */
  function urutanSatu(d) {
    var u = urutan(d);
    return u.kiri.map(function (id) { return { id: id, kol: 'kiri' }; })
      .concat(u.kanan.map(function (id) { return { id: id, kol: 'kanan' }; }));
  }
  /* apabila blok dialih dalam templat satu lajur, ratakan susunan supaya satu senarai */
  function rapikanSatuLajur(d) {
    if (!tmp().satuLajur) return;
    var u = urutan(d);
    SUSUN = { kiri: u.kiri.concat(u.kanan), kanan: [] };
  }

  function idBlok(d) {
    var t = tmp();
    /* templat dua lajur boleh tentukan susunan asasnya sendiri (cth Minimalis Korporat:
       pendidikan berada dalam rel kiri bersama kontak, bukan dalam lajur kanan) */
    if (t.urutanDua) {
      var kiriDua = (t.urutanDua.kiri || []).slice();
      var kananDua = (t.urutanDua.kanan || []).slice();
      (d.tambahan || []).forEach(function (o, i) { kananDua.push('t' + i); });
      return { kiri: kiriDua, kanan: kananDua };
    }
    if (t.satuLajur && t.urutanAsas) {
      var senarai = t.urutanAsas.slice();
      (d.tambahan || []).forEach(function (o, i) { senarai.push('t' + i); });
      return { kiri: senarai, kanan: [] };
    }
    var kanan = URUTAN_ASAS.kanan.slice();
    (d.tambahan || []).forEach(function (o, i) { kanan.push('t' + i); });
    return { kiri: URUTAN_ASAS.kiri.slice(), kanan: kanan };
  }

  /* ---------- susunan rasmi (penjual) lawan susunan dokumen (pelanggan) ---------- */
  function bacaSusunRasmi() {
    try {
      var o = JSON.parse(localStorage.getItem(KUNCI_SUSUN) || '{}') || {};
      var s = o[KUNCI_TEMPLAT];
      if (s && (s.kiri || s.kanan)) return { kiri: (s.kiri || []).slice(), kanan: (s.kanan || []).slice() };
    } catch (e) { /* storan dihalang - bukan ralat maut */ }
    return null;
  }

  /* Hanya mod penjual boleh menulis. Ini yang menjamin susunan pelanggan tidak pernah
     mengubah susunan rasmi walaupun dia membuka kodnya di peranti sendiri. */
  function simpanSusunRasmi(susun) {
    if (!penjual) return false;
    try {
      var o = {};
      try { o = JSON.parse(localStorage.getItem(KUNCI_SUSUN) || '{}') || {}; } catch (e) { o = {}; }
      if (susun && (susun.kiri || susun.kanan)) {
        o[KUNCI_TEMPLAT] = { kiri: (susun.kiri || []).slice(), kanan: (susun.kanan || []).slice() };
      } else {
        delete o[KUNCI_TEMPLAT];
      }
      localStorage.setItem(KUNCI_SUSUN, JSON.stringify(o));
    } catch (e) {
      return false;
    }
    tandaSusunRasmi();
    return true;
  }

  function rasmiUntukTemplatIni() { return bacaSusunRasmi(); }

  /* Butang + nota: penjual nampak kawalan susunan rasmi, pelanggan diberitahu aturannya hanya untuk dia. */
  function tandaSusunRasmi() {
    var rasmi = rasmiUntukTemplatIni();
    var boleh = penjual && MOD_SUSUN;
    ['susun-rasmi', 'susun-rasmi-3'].forEach(function (id) {
      var b = el(id);
      if (b) b.hidden = !boleh;
    });
    ['susun-rasmi-buang', 'susun-rasmi-buang-3'].forEach(function (id) {
      var b = el(id);
      if (b) b.hidden = !(boleh && rasmi);
    });
    var en = (BAHASA === 'en');
    var teks = '';
    if (penjual) {
      teks = rasmi
        ? (en ? 'The official order is being used for all new customers. A customer can arrange blocks for themselves without changing this order.'
              : 'Susunan rasmi sedang digunakan untuk semua pelanggan baru. Pelanggan boleh susun untuk dirinya sendiri tanpa mengubah susunan ini.')
        : (en ? 'No official order yet - this template uses its default order. Arrange the blocks, then press "Save as official order".'
              : 'Belum ada susunan rasmi - templat ini memakai susunan asal. Susun blok, kemudian tekan "Jadikan susunan rasmi".');
    } else if (SUSUN) {
      teks = en ? 'This block order is for your resume only - the official order is unchanged.'
                : 'Susunan blok ini hanya untuk resume anda - susunan rasmi tidak berubah.';
    }
    var reset = el('susun-reset');
    if (reset) reset.textContent = rasmi ? 'Ikut susunan rasmi' : 'Tetapkan semula';
  }

  // susunan sebenar: susunan dokumen ini dahulu, kemudian susunan RASMI penjual, kemudian asas templat
  function urutan(d) {
    var asas = idBlok(d), hasil = { kiri: [], kanan: [] };
    function sudah(id) { return hasil.kiri.indexOf(id) >= 0 || hasil.kanan.indexOf(id) >= 0; }
    var pilihan = SUSUN || bacaSusunRasmi();
    if (pilihan) {
      ['kiri', 'kanan'].forEach(function (k) {
        (pilihan[k] || []).forEach(function (id) {
          if (sudah(id)) return;
          if (asas.kiri.indexOf(id) < 0 && asas.kanan.indexOf(id) < 0) return;   // blok sudah tiada
          hasil[k].push(id);
        });
      });
    }
    ['kiri', 'kanan'].forEach(function (k) {
      asas[k].forEach(function (id) { if (!sudah(id)) hasil[k].push(id); });
    });
    return hasil;
  }

  function pindahBlok(d, id, kol, indeks) {
    var u = urutan(d);
    u.kiri = u.kiri.filter(function (x) { return x !== id; });
    u.kanan = u.kanan.filter(function (x) { return x !== id; });
    kol = (kol === 'kiri') ? 'kiri' : 'kanan';
    var i = (typeof indeks === 'number') ? Math.max(0, Math.min(indeks, u[kol].length)) : u[kol].length;
    u[kol].splice(i, 0, id);
    SUSUN = u;
    rapikanSatuLajur(d);      // templat satu lajur: simpan sebagai satu senarai
    return urutan(d);
  }

  function blokAlat(id, kol) {
    if (!MOD_SUSUN) return '';
    var alat = '<div class="blok-alat no-print" data-alat="' + id + '">' +
      '<button type="button" class="ba" data-gerak="naik" data-dari="' + id + '" title="Naik">&uarr;</button>' +
      '<button type="button" class="ba" data-gerak="turun" data-dari="' + id + '" title="Turun">&darr;</button>';
    // templat satu lajur tidak ada lajur kiri/kanan - anak panah pindah lajur tidak relevan
    if (!tmp().satuLajur) {
      alat += '<button type="button" class="ba" data-gerak="' + (kol === 'kiri' ? 'kanan' : 'kiri') + '" data-dari="' + id + '" title="Pindah lajur">' +
        (kol === 'kiri' ? '&rarr;' : '&larr;') + '</button>';
    }
    return alat + '</div>';
  }

  function blokHtml(id, isi, kol) {
    if (!isi) return '';
    return '<div class="blok" data-blok="' + id + '" data-kol="' + kol + '">' + blokAlat(id, kol) + isi + '</div>';
  }

  function htmlBiru(d) {
    var h = '<div class="cv-biru' + (d.foto ? '' : ' tanpa-foto') + '">';

    h += '<div class="cvb-banner">';
    if (d.foto) h += '<div class="cvb-foto"><img src="' + esc(d.foto) + '" alt=""></div>';
    h += '<div class="cvb-nama"><h1>' + esc(d.nama || 'NAMA ANDA') + '</h1>';
    if (d.jawatan && !dibuang(d, 'jawatan')) h += '<p>' + esc(d.jawatan) + '</p>';
    h += '</div></div>';

    var blok = {};
    var kontak = '';
    if (d.telefon) kontak += '<li>' + ikon('telefon') + '<span>' + esc(d.telefon) + '</span></li>';
    if (d.emel) kontak += '<li>' + ikon('emel') + '<span>' + esc(d.emel) + '</span></li>';
    if (d.lokasi) kontak += '<li>' + ikon('lokasi') + '<span>' + esc(d.lokasi) + '</span></li>';
    if (kontak) blok.kontak = '<h2>' + tt('kontak') + '</h2><ul class="cvb-kontak">' + kontak + '</ul>';
    var kemBiru = senaraiTahap(d, 'kemahiran'), bahBiru = senaraiTahap(d, 'bahasa');
    if (kemBiru.length && !dibuang(d, 'kemahiran')) {
      blok.kemahiran = '<h2>' + tt('kemahiran') + '</h2><ul class="cvb-titik cvb-tahap">' + kemBiru.map(function (o) {
        return '<li><span>' + esc(o.nama) + '</span>' + titikTahap(o.tahap) + '</li>';
      }).join('') + '</ul>';
    }
    if (bahBiru.length && !dibuang(d, 'bahasa')) {
      blok.bahasa = '<h2>' + tt('bahasa') + '</h2><ul class="cvb-titik cvb-tahap padat">' + bahBiru.map(function (o) {
        return '<li><span>' + esc(o.nama) + '</span>' + titikTahap(o.tahap) + '</li>';
      }).join('') + '</ul>';
    }

    if (d.ringkasan && !dibuang(d, 'ringkasan')) blok.profil = '<h2>' + ikonLencana('orang') + tt('profil') + '</h2><p class="cvb-teks">' + esc(d.ringkasan) + '</p>';

    if (d.pengalaman.length && !dibuang(d, 'pengalaman')) {
      blok.pengalaman = '<h2>' + ikonLencana('beg') + tt('pengalaman') + '</h2>' + d.pengalaman.map(function (o) {
        var tajuk = o.syarikat || o.jawatan || '(Syarikat)';
        var s = '<div class="cvb-item"><div class="cvb-item-kepala"><strong>' + esc(tajuk) + '</strong>' +
                '<span>' + esc(o.tempoh) + '</span></div>';
        if (o.syarikat && o.jawatan) s += '<div class="cvb-item-sub">' + esc(o.jawatan) + '</div>';
        /* setiap projek: baris nama projek, kemudian poin untuk projek itu */
        senaraiProjek(o).forEach(function (pk) {
          if (pk.nama) s += '<div class="cvb-projek">' + esc(teksProjek(pk)) + '</div>';
          if (pk.poin.length) {
            s += '<ul class="cvb-bullet">' + pk.poin.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
          }
        });
        return s + '</div>';
      }).join('');
    }

    if (d.pendidikan.length && !dibuang(d, 'pendidikan')) {
      blok.pendidikan = '<h2>' + ikonLencana('topi') + tt('pendidikan') + '</h2>' + d.pendidikan.map(function (o) {
        var s = '<div class="cvb-item"><div class="cvb-item-kepala"><strong>' + esc(o.kelulusan || '(Kelulusan)') + '</strong>' +
                '<span>' + esc(o.tahun) + '</span></div>';
        if (o.institusi) s += '<div class="cvb-item-sub">' + esc(o.institusi) + '</div>';
        return s + '</div>';
      }).join('');
    }

    var rujBiru = senaraiRujukan(d);
    if (rujBiru.length && !dibuang(d, 'rujukan')) {
      blok.rujukan = '<h2>' + ikonLencana('orangRamai') + tt('rujukan') + '</h2>' + rujBiru.map(function (o) {
        var x = '<div class="cvb-item"><div class="cvb-item-kepala"><strong>' + esc(o.nama || o.jawatan || '(Rujukan)') + '</strong>' +
                '<span>' + esc(o.telefon) + '</span></div>';
        if (o.jawatan && o.nama) x += '<div class="cvb-item-sub">' + esc(o.jawatan) + '</div>';
        return x + '</div>';
      }).join('');
    }

    // bahagian yang pelanggan tambah sendiri (Projek, Sijil, Aktiviti, ...)
    (d.tambahan || []).forEach(function (o, i) {
      var tajuk = String(o.t || '').trim();
      var item = String(o.b || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      if (o.mod === 'dua' && Array.isArray(o.bahagian) && o.bahagian.length) {
        /* mod nama + detail: nama kemahiran tebal, detail selepasnya */
        blok['t' + i] = '<h2>' + esc(tajuk) + '</h2>' + o.bahagian.map(function (x) {
          return '<p class="cv-dua"><strong>' + esc(x.nama) + '</strong>' +
                 (x.detail ? (x.nama ? ' &#8212; ' : '') + esc(x.detail) : '') + '</p>';
        }).join('');
      } else {
        if (!tajuk || !item.length) return;
        blok['t' + i] = '<h2>' + esc(tajuk) + '</h2>' + (item.length === 1
          ? '<p class="cvb-teks">' + esc(item[0]) + '</p>'
          : '<ul class="cvb-bullet">' + item.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
      }
    });

    // blok dipaparkan ikut susunan pelanggan (boleh dialih dalam pratonton)
    var ur = urutan(d);
    var kiri = ur.kiri.map(function (id) { return blokHtml(id, blok[id], 'kiri'); }).join('');
    var kanan = ur.kanan.map(function (id) { return blokHtml(id, blok[id], 'kanan'); }).join('');

    h += '<div class="cvb-badan"><aside class="cvb-kiri">' + kiri + '</aside>';
    h += '<div class="cvb-kanan">' + kanan + '</div></div></div>';
    return h;
  }

  /* ---------- templat: Biru Bersih (satu lajur, foto segi empat) ----------
     Rujukan: "Blue and White Clean and Professional Resume.pdf".
     Nama besar di kanan foto, kontak berlabel, bahagian bergaris navy. */
  function htmlBersih(d) {
    var h = '<div class="cv-bersih' + (d.foto ? '' : ' tanpa-foto') + '">';
    if (d.foto) h += '<div class="cvs-foto"><img src="' + esc(d.foto) + '" alt=""></div>';

    h += '<div class="cvs-kepala"><div class="cvs-identiti">';
    h += '<h1 class="cvs-nama">' + esc(d.nama || 'Nama Anda') + '</h1>';
    if (d.jawatan && !dibuang(d, 'jawatan')) h += '<p class="cvs-jawatan">' + esc(d.jawatan) + '</p>';
    var kontak = '';
    if (d.telefon && !dibuang(d, 'kontak')) kontak += '<li><span class="cvs-label">Telefon:</span><span>' + esc(d.telefon) + '</span></li>';
    if (d.emel && !dibuang(d, 'kontak')) kontak += '<li><span class="cvs-label">E-mel:</span><span>' + esc(d.emel) + '</span></li>';
    if (d.lokasi && !dibuang(d, 'kontak')) kontak += '<li><span class="cvs-label">Alamat:</span><span>' + esc(d.lokasi) + '</span></li>';
    if (kontak) h += '<ul class="cvs-kontak">' + kontak + '</ul>';
    h += '</div></div>';

    var blok = {};
    if (d.ringkasan && !dibuang(d, 'ringkasan')) {
      blok.profil = '<h2>' + tt('profil') + '</h2><p class="cvs-teks">' + esc(d.ringkasan) + '</p>';
    }
    if (d.pengalaman.length && !dibuang(d, 'pengalaman')) {
      blok.pengalaman = '<h2>' + tt('pengalaman') + '</h2>' + d.pengalaman.map(function (o) {
        var tajuk = (o.jawatan && o.syarikat) ? (o.jawatan + ', ' + o.syarikat) : (o.jawatan || o.syarikat || '(Syarikat)');
        var x = '<div class="cvs-item"><div class="cvs-item-kepala"><strong>' + esc(tajuk) + '</strong>' +
                '<span>' + esc(o.tempoh) + '</span></div>';
        senaraiProjek(o).forEach(function (pk) {
          if (pk.nama) x += '<div class="cvs-projek">' + esc(teksProjek(pk)) + '</div>';
          if (pk.poin.length) x += '<ul class="cvs-senarai">' + pk.poin.map(function (k) { return '<li>' + esc(k) + '</li>'; }).join('') + '</ul>';
        });
        return x + '</div>';
      }).join('');
    }
    if (d.pendidikan.length && !dibuang(d, 'pendidikan')) {
      blok.pendidikan = '<h2>' + tt('pendidikan') + '</h2>' + d.pendidikan.map(function (o) {
        var x = '<div class="cvs-item"><div class="cvs-item-kepala"><strong>' + esc(o.kelulusan || '(Kelulusan)') + '</strong>' +
                '<span>' + esc(o.tahun) + '</span></div>';
        if (o.institusi) x += '<div class="cvs-item-sub">' + esc(o.institusi) + '</div>';
        return x + '</div>';
      }).join('');
    }
    var kemBersih = senaraiTahap(d, 'kemahiran'), bahBersih = senaraiTahap(d, 'bahasa');
    if (kemBersih.length && !dibuang(d, 'kemahiran')) {
      blok.kemahiran = '<h2>' + tt('kemahiran') + '</h2><ul class="cvs-tahap">' + kemBersih.map(function (o) {
        return '<li><span>' + esc(o.nama) + '</span>' + titikTahap(o.tahap) + '</li>';
      }).join('') + '</ul>';
    }
    if (bahBersih.length && !dibuang(d, 'bahasa')) {
      blok.bahasa = '<h2>' + tt('bahasa') + '</h2><ul class="cvs-tahap">' + bahBersih.map(function (o) {
        return '<li><span>' + esc(o.nama) + '</span>' + titikTahap(o.tahap) + '</li>';
      }).join('') + '</ul>';
    }
    var rujBersih = senaraiRujukan(d);
    if (rujBersih.length && !dibuang(d, 'rujukan')) {
      blok.rujukan = '<h2>' + tt('rujukan') + '</h2>' + rujBersih.map(function (o) {
        var x = '<div class="cvs-item"><div class="cvs-item-kepala"><strong>' + esc(o.nama || o.jawatan || '(Rujukan)') + '</strong>' +
                '<span>' + esc(o.telefon) + '</span></div>';
        if (o.jawatan && o.nama) x += '<div class="cvs-item-sub">' + esc(o.jawatan) + '</div>';
        return x + '</div>';
      }).join('');
    }
    (d.tambahan || []).forEach(function (o, i) {
      var tajuk = String(o.t || '').trim();
      var item = String(o.b || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      if (o.mod === 'dua' && Array.isArray(o.bahagian) && o.bahagian.length) {
        /* mod nama + detail: nama kemahiran tebal, detail selepasnya */
        blok['t' + i] = '<h2>' + esc(tajuk) + '</h2>' + o.bahagian.map(function (x) {
          return '<p class="cv-dua"><strong>' + esc(x.nama) + '</strong>' +
                 (x.detail ? (x.nama ? ' &#8212; ' : '') + esc(x.detail) : '') + '</p>';
        }).join('');
      } else {
        if (!tajuk || !item.length) return;
        blok['t' + i] = '<h2>' + esc(tajuk) + '</h2>' + (item.length === 1
          ? '<p class="cvs-teks">' + esc(item[0]) + '</p>'
          : '<ul class="cvs-senarai">' + item.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
      }
    });

    // satu lajur: semua blok mengikut satu aliran (kiri kemudian kanan)
    var ikut = urutanSatu(d);
    h += '<div class="cvs-badan">' + ikut.map(function (o) { return blokHtml(o.id, blok[o.id], o.kol); }).join('') + '</div>';
    return h + '</div>';
  }

  /* ---------- templat: Minimalis Korporat ----------
     Dua lajur: rel kelabu-hijau (foto, kontak, pendidikan, kemahiran, bahasa) + lajur kanan
     (nama, jawatan, ringkasan, pengalaman, rujukan). Gaya: dakwat #403f41, huruf besar pada
     tajuk, garis nipis di kanan tajuk, petak gelap sebagai ikon tajuk. */
  function ikonKorp(jenis) {
    var bentuk = {
      orang: '<circle cx="12" cy="8.2" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
             '<path d="M5.2 20.4a6.8 6.8 0 0 1 13.6 0" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      beg: '<path d="M3.6 8.6h16.8v10.8H3.6z" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
           '<path d="M9.2 8.6V6.4a2.8 2.8 0 0 1 5.6 0v2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      petak: '<path d="M7.2 7.2h9.6v9.6H7.2z" fill="currentColor"/>'
    };
    return '<svg class="ck-ikon" viewBox="0 0 24 24" aria-hidden="true">' + (bentuk[jenis] || bentuk.petak) + '</svg>';
  }

  /* Tajuk bahagian templat Korporat Moden diambil VERBATIM daripada fail rujukan
     ("Minimalist Professional Corporate ATS Resume.pdf" - lapisan teks Poppins-Medium
     13pt #414042): CONTACT / EDUCATION / KEY SKILLS / LANGUAGE pada rel kiri dan
     SUMMARY / WORK EXPERIENCE / REFERENCES pada lajur kanan. Jangan terjemahkan - ejaan itu
     sebahagian daripada format rujukan. */
  var TAJUK_KORP = { kontak: 'Contact', pendidikan: 'Education', kemahiran: 'Key Skills',
                     bahasa: 'Language', profil: 'Summary', pengalaman: 'Work Experience',
                     rujukan: 'References' };

  function htmlKorporat(d) {
    var h = '<div class="cv-korporat' + (d.foto ? '' : ' tanpa-foto') + '">';
    var blok = {};

    /* --- blok: kontak --- */
    var kontak = '';
    if (d.telefon && !dibuang(d, 'kontak')) kontak += '<li>' + ikon('telefon') + '<span>' + esc(d.telefon) + '</span></li>';
    if (d.emel && !dibuang(d, 'kontak')) kontak += '<li>' + ikon('emel') + '<span>' + esc(d.emel) + '</span></li>';
    if (d.lokasi && !dibuang(d, 'kontak')) kontak += '<li>' + ikon('lokasi') + '<span>' + esc(d.lokasi) + '</span></li>';
    if (kontak) blok.kontak = '<h2>' + tt('kontak') + '</h2><ul class="ck-kontak">' + kontak + '</ul>';

    /* --- blok: pendidikan (institusi tebal, kelulusan, tahun) --- */
    if (d.pendidikan.length && !dibuang(d, 'pendidikan')) {
      blok.pendidikan = '<h2>' + tt('pendidikan') + '</h2>' + d.pendidikan.map(function (o) {
        var x = '<div class="ck-item ck-pendidikan">';
        x += '<strong>' + esc(o.institusi || o.kelulusan || '(Pendidikan)') + '</strong>';
        if (o.institusi && o.kelulusan) x += '<div class="ck-item-sub">' + esc(o.kelulusan) + '</div>';
        if (o.tahun) x += '<div class="ck-tahun">' + esc(o.tahun) + '</div>';
        return x + '</div>';
      }).join('');
    }

    /* --- blok: kemahiran & bahasa (nama + skala, bulatan jadi petak melalui CSS) --- */
    ['kemahiran', 'bahasa'].forEach(function (kunci) {
      var senarai = senaraiTahap(d, kunci);
      if (!senarai.length || dibuang(d, kunci)) return;
      blok[kunci] = '<h2>' + tt(kunci) + '</h2><ul class="ck-senarai">' +
        senarai.map(function (o) {
          return '<li><span>' + esc(o.nama) + '</span>' + titikTahap(o.tahap) + '</li>';
        }).join('') + '</ul>';
    });

    /* --- blok: ringkasan --- */
    if (d.ringkasan && !dibuang(d, 'ringkasan')) {
      blok.profil = '<h2>' + ikonKorp('orang') + tt('profil') + '</h2>' +
        '<p class="ck-teks">' + esc(d.ringkasan) + '</p>';
    }

    /* --- blok: pengalaman kerja --- */
    if (d.pengalaman.length && !dibuang(d, 'pengalaman')) {
      blok.pengalaman = '<h2>' + ikonKorp('beg') + tt('pengalaman') + '</h2>' + d.pengalaman.map(function (o) {
        var tajuk = (o.jawatan && o.syarikat) ? (o.jawatan + ', ' + o.syarikat) : (o.jawatan || o.syarikat || '(Syarikat)');
        var x = '<div class="ck-item"><div class="ck-item-kepala"><strong>' + esc(tajuk) + '</strong>' +
                '<span>' + esc(o.tempoh) + '</span></div>';
        senaraiProjek(o).forEach(function (pk) {
          if (pk.nama) x += '<div class="ck-projek">' + esc(teksProjek(pk)) + '</div>';
          if (pk.poin.length) {
            x += '<ul class="ck-senarai-item">' + pk.poin.map(function (k) { return '<li>' + esc(k) + '</li>'; }).join('') + '</ul>';
          }
        });
        return x + '</div>';
      }).join('');
    }

    /* --- blok: rujukan --- */
    var ruj = senaraiRujukan(d);
    if (ruj.length && !dibuang(d, 'rujukan')) {
      blok.rujukan = '<h2>' + ikonKorp('petak') + tt('rujukan') + '</h2>' + ruj.map(function (o) {
        var x = '<div class="ck-item"><div class="ck-item-kepala"><strong>' + esc(o.nama || o.jawatan || '(Rujukan)') + '</strong>' +
                '<span>' + esc(o.telefon) + '</span></div>';
        if (o.jawatan && o.nama) x += '<div class="ck-item-sub">' + esc(o.jawatan) + '</div>';
        return x + '</div>';
      }).join('');
    }

    /* --- blok: bahagian yang pelanggan tambah sendiri --- */
    (d.tambahan || []).forEach(function (o, i) {
      var tajuk = String(o.t || '').trim();
      var item = String(o.b || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      if (o.mod === 'dua' && Array.isArray(o.bahagian) && o.bahagian.length) {
        /* mod nama + detail: nama kemahiran tebal, detail selepasnya */
        blok['t' + i] = '<h2>' + ikonKorp('petak') + esc(tajuk) + '</h2>' + o.bahagian.map(function (x) {
          return '<p class="cv-dua"><strong>' + esc(x.nama) + '</strong>' +
                 (x.detail ? (x.nama ? ' &#8212; ' : '') + esc(x.detail) : '') + '</p>';
        }).join('');
      } else {
        if (!tajuk || !item.length) return;
        blok['t' + i] = '<h2>' + ikonKorp('petak') + esc(tajuk) + '</h2>' + (item.length === 1
          ? '<p class="ck-teks">' + esc(item[0]) + '</p>'
          : '<ul class="ck-senarai-item">' + item.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
      }
    });

    /* --- susun: rel kiri (foto + blok kiri) dan lajur kanan (nama + blok kanan) --- */
    var urut = urutan(d);
    h += '<div class="ck-kiri">';
    if (d.foto) h += '<div class="ck-foto"><img src="' + esc(d.foto) + '" alt=""></div>';
    h += urut.kiri.map(function (id) { return blokHtml(id, blok[id], 'kiri'); }).join('');
    h += '</div><div class="ck-kanan">';
    h += '<header class="ck-kepala"><h1 class="ck-nama">' + esc(d.nama || 'Nama Anda') + '</h1>';
    if (d.jawatan && !dibuang(d, 'jawatan')) h += '<p class="ck-jawatan">' + esc(d.jawatan) + '</p>';
    h += '</header>';
    h += urut.kanan.map(function (id) { return blokHtml(id, blok[id], 'kanan'); }).join('');
    h += '</div>';
    return h + '</div>';
  }

  function senaraiTitik(teks) {
    return teks.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
      .map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
  }

  function capAir(aktif) {
    var satu = '<span>' + (BAHASA === 'en' ? 'PREVIEW' : 'PRATONTON') + ' &middot; ' + esc(JENAMA) +
      ' &middot; ' + (BAHASA === 'en' ? 'NOT PAID' : 'BELUM DIBAYAR') + '</span>';
    var keping = '';
    for (var i = 0; i < 20; i++) keping += satu;
    ['cap-air', 'cap-air-sisi'].forEach(function (id) {
      var kotak = el(id);
      if (!kotak) return;
      kotak.innerHTML = aktif ? keping : '';
    });
  }

  /* ---------- kod resume (untuk pesanan WhatsApp) ---------- */
  function kodDari(d) {
    var ringkas = {
      s: KUNCI_TEMPLAT, n: d.nama, t: d.telefon, e: d.emel, l: d.lokasi, j: d.jawatan,
      g: d.ringkasan,
      k: senaraiTahap(d, 'kemahiran').map(function (o) { return { n: o.nama, p: o.tahap }; }),
      b: senaraiTahap(d, 'bahasa').map(function (o) { return { n: o.nama, p: o.tahap }; }),
      u: senaraiRujukan(d).map(function (o) { return { n: o.nama, j: o.jawatan, t: o.telefon }; }),
      p: d.pengalaman, d: d.pendidikan,
      a: (d.tambahan || []).filter(function (o) { return String(o.t || '').trim(); }),   // bahagian tambahan
      x: d.buang || [],                                                                 // bahagian dibuang
      y: (d.susun && (d.susun.kiri || d.susun.kanan)) ? d.susun : null,                  // susunan blok
      lp: d.labelProjek || LABEL_PROJEK || 'projek',                                     // label nama projek
      bh: d.bahasaResume || BAHASA || 'en'                                               // bahasa resume
    };
    var b64 = window.btoa(unescape(encodeURIComponent(JSON.stringify(ringkas))));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function borangDariKod(kod) {
    if (!kod) return null;
    try {
      var b64 = String(kod).replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var o = JSON.parse(decodeURIComponent(escape(window.atob(b64))));
      return {
        templat: (TEMPLAT[o.s] ? o.s : 'biru'),
        nama: o.n || '', telefon: o.t || '', emel: o.e || '', lokasi: o.l || '',
        jawatan: o.j || '', ringkasan: o.g || '',
        kemahiran: senaraiTahap({ kemahiran: o.k }, 'kemahiran'),
        bahasa: senaraiTahap({ bahasa: o.b }, 'bahasa'),
        rujukan: (Array.isArray(o.u)
          ? o.u.map(function (x) { return { nama: x.n || x.nama || '', jawatan: x.j || x.jawatan || '', telefon: x.t || x.telefon || '' }; })
          : senaraiRujukan({ rujukan: o.u })),
        pengalaman: Array.isArray(o.p) ? o.p : [], pendidikan: Array.isArray(o.d) ? o.d : [],
        tambahan: Array.isArray(o.a) ? o.a : [], buang: Array.isArray(o.x) ? o.x : [],
        susun: (o.y && (o.y.kiri || o.y.kanan)) ? { kiri: o.y.kiri || [], kanan: o.y.kanan || [] } : null,
        labelProjek: 'projek',   // dropdown label dibuang (Fasa 49); medan 'Klien' pula menggantikannya
        bahasaResume: (o.bh === 'ms' || o.bh === 'en') ? o.bh : null   // kod lama tiada bahasa: guna tetapan semasa
      };
    } catch (e) {
      return null;
    }
  }

  /* ---------- mod susun: pelanggan boleh alih blok dalam pratonton ---------- */
  function setModSusun(on) {
    MOD_SUSUN = !!on;
    document.body.classList.toggle('mod-susun', MOD_SUSUN);
    ['togol-susun', 'togol-susun-3'].forEach(function (id) {
      var b = el(id);
      if (!b) return;
      b.setAttribute('aria-pressed', MOD_SUSUN ? 'true' : 'false');
      b.textContent = MOD_SUSUN ? 'Selesai susun' : 'Susun blok';
    });
    var reset = el('susun-reset');
    if (reset) reset.hidden = !MOD_SUSUN;
    var nota = el('nota-susun');
    if (nota) nota.hidden = !MOD_SUSUN;
    tandaSusunRasmi();
    kemasSemula();
    if (MOD_SUSUN) tulisLog('Mod susun hidup: seret blok dalam pratonton, atau tekan anak panah pada blok.', 'info');
  }

  // gerak satu blok: naik/turun dalam lajur sama, atau pindah lajur
  function gerakBlok(d, id, arah) {
    if (tmp().satuLajur && (arah === 'kiri' || arah === 'kanan')) return;   // tiada lajur
    rapikanSatuLajur(d);
    var u = urutan(d);
    var kol = (u.kiri.indexOf(id) >= 0) ? 'kiri' : 'kanan';
    if (arah === 'kiri' || arah === 'kanan') {
      pindahBlok(d, id, arah, urutan(d)[arah].length);   // pindah ke hujung lajur itu
      return;
    }
    var senarai = u[kol].slice();
    var i = senarai.indexOf(id);
    if (i < 0) return;
    if (arah === 'naik' && i > 0) { senarai.splice(i, 1); senarai.splice(i - 1, 0, id); }
    else if (arah === 'turun' && i < senarai.length - 1) { senarai.splice(i, 1); senarai.splice(i + 1, 0, id); }
    else return;
    u[kol] = senarai;
    SUSUN = u;
  }

  function kosongkanTanda() {
    Array.prototype.forEach.call(document.querySelectorAll('.blok.sasaran-atas, .blok.sasaran-bawah'), function (b) {
      b.classList.remove('sasaran-atas', 'sasaran-bawah');
    });
  }

  var SERET = null;
  document.addEventListener('pointerdown', function (e) {
    if (!MOD_SUSUN || !e.target || !e.target.closest) return;
    var bl = e.target.closest('.blok');
    if (!bl || (e.target.closest && e.target.closest('.blok-alat'))) return;
    var bekas = bl.closest('#sisi-kertas, #resume, #kertas-sisi');
    if (!bekas) return;
    SERET = { id: bl.getAttribute('data-blok'), el: bl };
    bl.classList.add('seret');
    if (e.preventDefault) e.preventDefault();
  });
  document.addEventListener('pointermove', function (e) {
    if (!SERET) return;
    kosongkanTanda();
    var di = document.elementFromPoint ? document.elementFromPoint(e.clientX, e.clientY) : null;
    if (!di) return;
    var bl = di.closest ? di.closest('.blok') : null;
    if (bl && bl !== SERET.el) {
      var r = bl.getBoundingClientRect();
      var sebelum = e.clientY < r.top + r.height / 2;
      bl.classList.add(sebelum ? 'sasaran-atas' : 'sasaran-bawah');
      SERET.sasaran = { id: bl.getAttribute('data-blok'), sebelum: sebelum };
      return;
    }
    var kol = di.closest ? di.closest('.cvb-kiri, .cvb-kanan') : null;
    if (kol) SERET.sasaran = { kol: kol.classList.contains('cvb-kiri') ? 'kiri' : 'kanan' };
  });
  document.addEventListener('pointerup', function () {
    if (!SERET) return;
    var seret = SERET;
    SERET = null;
    if (seret.el) seret.el.classList.remove('seret');
    kosongkanTanda();
    if (!seret.sasaran) return;
    var d = kumpul(), u = urutan(d), idSasar = seret.sasaran.id;
    var kol = idSasar ? (u.kiri.indexOf(idSasar) >= 0 ? 'kiri' : 'kanan') : seret.sasaran.kol;
    if (!kol) return;
    var idx;
    if (idSasar) {
      var senarai = u[kol].filter(function (x) { return x !== seret.id; });
      var pos = senarai.indexOf(idSasar);
      idx = (pos < 0) ? senarai.length : (seret.sasaran.sebelum ? pos : pos + 1);
    } else {
      idx = u[kol].filter(function (x) { return x !== seret.id; }).length;
    }
    pindahBlok(d, seret.id, kol, idx);
    kemasSemula();
    tulisLog('Blok dipindahkan. Susunan ini akan ikut semasa cetak PDF.', 'info');
  });
  document.addEventListener('pointercancel', function () {
    if (!SERET) return;
    if (SERET.el) SERET.el.classList.remove('seret');
    SERET = null;
    kosongkanTanda();
  });
  // butang anak panah pada setiap blok
  document.addEventListener('click', function (e) {
    var b = (e.target && e.target.closest) ? e.target.closest('.blok-alat .ba') : null;
    if (!b || !MOD_SUSUN) return;
    gerakBlok(kumpul(), b.getAttribute('data-dari'), b.getAttribute('data-gerak'));
    kemasSemula();
  });

  /* ---------- nota resume tersimpan dalam peranti ini ---------- */
  function simpananTerakhir() {
    try {
      var mentah = localStorage.getItem(KUNCI);
      if (!mentah) return null;
      var d = JSON.parse(mentah);
      return (d && d.nama) ? d : null;
    } catch (e) { return null; }
  }

  function semakSimpanan() {
    var d = simpananTerakhir(), nota = el('nota-simpan');
    if (!nota) return;
    if (!d) { nota.hidden = true; nota.innerHTML = ''; return; }
    var en = (BAHASA === 'en');
    nota.hidden = false;
    nota.innerHTML = (en
      ? 'Last resume on this device: <strong>' + esc(String(d.nama).slice(0, 40))
        + '</strong>. Press <strong>Start filling details</strong> to continue, or '
      : 'Resume terakhir di peranti ini: <strong>' + esc(String(d.nama).slice(0, 40))
        + '</strong>. Tekan <strong>Mula Isi Butiran</strong> untuk sambung, atau ');
    var kosong = document.getElementById('buang-simpanan');
    if (kosong) kosong.parentNode.removeChild(kosong);
    var pautan = document.createElement('button');
    pautan.type = 'button'; pautan.className = 'pautan-buang'; pautan.id = 'buang-simpanan';
    pautan.textContent = en ? 'start empty (remove from this device)' : 'mula kosong (buang dari peranti)';
    pautan.addEventListener('click', function () {
      if (!window.confirm(BAHASA === 'en' ? 'Remove the resume saved on this device?'
                                          : 'Buang resume yang disimpan dalam peranti ini?')) return;
      kosongkanBorang();
      semakSimpanan();
      tulisLog('Resume tersimpan dibuang. Isi butiran baru anda.', 'info');
    });
    nota.appendChild(pautan);
  }

  /* ---------- pautan pesanan WhatsApp ---------- */
  function sediakanWa(d) {
    var pautan = el('wa');
    if (!pautan) return;
    var hrg = el('harga');
    if (hrg) hrg.textContent = HARGA.toFixed(2);
    if (!d.nama || !d.telefon) {
      pautan.href = '#';
      pautan.classList.remove('sedia');
      return;
    }
    var mesej = 'Salam, saya nak RESUME BERSIH (tanpa tanda air) dari ' + JENAMA + '.'
      + '\nHarga: RM' + HARGA.toFixed(2)
      + '\nNama: ' + d.nama
      + '\nTelefon: ' + d.telefon
      + '\n\nKod resume saya (untuk penjual buka):\n' + kodDari(d);
    pautan.href = 'https://wa.me/' + NOMBOR_WA + '?text=' + encodeURIComponent(mesej);
    pautan.classList.add('sedia');
  }

  /* ---------- kiraan hidup + simpan ---------- */
  function status(d) {
    var en = (BAHASA === 'en');
    var p = d.pengalaman.length, pd = d.pendidikan.length;
    var bahagian = en
      ? p + (p === 1 ? ' experience' : ' experiences') + ', ' + pd + (pd === 1 ? ' education entry' : ' education entries')
      : p + ' pengalaman, ' + pd + ' pendidikan';
    if (!d.nama && !d.telefon) {
      return { mesej: en ? 'Nothing filled in yet. ' + bahagian + ' will go into the resume.'
                         : 'Belum ada apa-apa diisi. ' + bahagian + ' akan masuk ke resume.', jenis: '' };
    }
    if (p === 0) {
      return { mesej: en ? 'WARNING: the resume will print without a Work Experience section. ' + bahagian + ' so far.'
                         : 'AMARAN: resume akan keluar tanpa bahagian Pengalaman. ' + bahagian + ' setakat ini.',
               jenis: 'amaran' };
    }
    // templat satu lajur: beritahu kalau jarak sudah direnggangkan maksimum (halaman masih lapang)
    if (LEBIH) {
      return { mesej: en ? 'OK - ' + bahagian + ' will go into the resume. The content now exceeds one page '
                         + '(it will print as 2 pages) - remove less important points if you want 1 page.'
                         : 'OK - ' + bahagian + ' akan masuk ke resume. Isi sudah melebihi satu halaman '
                         + '(akan dicetak 2 halaman) - padam poin yang kurang penting kalau mahu 1 halaman.',
               jenis: 'amaran' };
    }
    if (tmp().satuLajur && PENUH < 0.55) {
      return { mesej: en ? 'OK - ' + bahagian + ' will go into the resume. There is still space on the page '
                         + '(spacing was stretched automatically) - add skills, languages or an extra section to fill it.'
                         : 'OK - ' + bahagian + ' akan masuk ke resume. Ruang halaman masih lapang '
                         + '(jarak direnggangkan automatik) - tambah kemahiran, bahasa atau bahagian tambahan supaya resume nampak penuh.',
               jenis: 'info' };
    }
    return { mesej: en ? 'OK - ' + bahagian + ' will go into the resume.'
                       : 'OK - ' + bahagian + ' akan masuk ke resume.', jenis: 'info' };
  }

  function kemasSemula() {
    var d;
    try {
      d = kumpul();
    } catch (e) {
      tulisLog('Ralat membaca borang: ' + e.message, 'ralat');
      return null;
    }
    papar(d);
    kemasLkNota(d);
    var st = status(d);
    tulisLog(st.mesej, st.jenis);
    sediakanWa(d);
    try { localStorage.setItem(KUNCI, JSON.stringify(d)); } catch (e) { /* storan dihalang - bukan ralat maut */ }
    return d;
  }

  /* ---------- isi borang dari data ---------- */
  function kosongkanBorang() {
    foto = '';
    el('borang').reset();
    el('senarai-pengalaman').innerHTML = '';
    el('senarai-pendidikan').innerHTML = '';
    bilPengalaman = 0; bilPendidikan = 0;
    el('senarai-pengalaman').appendChild(barisPengalaman());
    el('senarai-pendidikan').appendChild(barisPendidikan());
    el('senarai-tambahan').innerHTML = '';
    bilTambahan = 0;
    el('senarai-rujukan').innerHTML = '';
    bilRujukan = 0;
    el('senarai-rujukan').appendChild(barisRujukan());
    ['kemahiran', 'bahasa'].forEach(function (kunci) {
      var kotak = el('senarai-' + kunci);
      kotak.innerHTML = '';
      bilTahap[kunci] = 0;
      kotak.appendChild(barisTahap(kunci));
    });
    BUANG = [];
    SUSUN = null;
    kemasSek();
    try { localStorage.removeItem(KUNCI); } catch (e) { /* abaikan */ }
    tulisLogFoto();
    kemasSemula();
    tunjukLangkah(1);
  }

  function isiBorang(d) {
    /* Foto sengaja TIDAK dimuatkan dalam kod pesanan - data URL foto boleh mencecah puluhan
       ribu huruf dan kod itu dihantar melalui WhatsApp. Jadi kalau kod ini tidak membawa foto,
       kekalkan foto yang sudah ada DI PERANTI INI, tetapi hanya jika nama pada kod itu sama
       dengan nama yang sedang diisi. Ini penting untuk mod penjual: tanpa syarat nama itu,
       foto pelanggan yang dimuatkan sebelum ini akan tersalah masuk ke resume pelanggan baru. */
    var fotoLama = foto;
    var namaLama = el('nama') ? String(el('nama').value || '').trim().toLowerCase() : '';
    var namaBaru = String(d.nama || '').trim().toLowerCase();
    var fotoKekal = !!fotoLama && !!namaLama && namaLama === namaBaru;
    pilihTemplat(d.templat || 'biru', true);
    el('nama').value = d.nama || '';
    el('telefon').value = d.telefon || '';
    el('emel').value = d.emel || '';
    el('lokasi').value = d.lokasi || '';
    el('jawatan').value = d.jawatan || '';
    el('ringkasan').value = d.ringkasan || '';
    ['kemahiran', 'bahasa'].forEach(function (kunci) {
      var kotak = el('senarai-' + kunci);
      kotak.innerHTML = '';
      bilTahap[kunci] = 0;
      senaraiTahap(d, kunci).forEach(function (o) { kotak.appendChild(barisTahap(kunci, o)); });
      if (!kotak.children.length) kotak.appendChild(barisTahap(kunci));
    });
    el('senarai-rujukan').innerHTML = '';
    bilRujukan = 0;
    senaraiRujukan(d).forEach(function (o) { el('senarai-rujukan').appendChild(barisRujukan(o)); });
    if (!el('senarai-rujukan').children.length) el('senarai-rujukan').appendChild(barisRujukan());
    foto = d.foto || (fotoKekal ? fotoLama : '');
    tulisLogFoto();
    el('senarai-pengalaman').innerHTML = '';
    el('senarai-pendidikan').innerHTML = '';
    bilPengalaman = 0;
    bilPendidikan = 0;
    (d.pengalaman || []).forEach(function (o) { el('senarai-pengalaman').appendChild(barisPengalaman(o)); });
    (d.pendidikan || []).forEach(function (o) { el('senarai-pendidikan').appendChild(barisPendidikan(o)); });
    BUANG = (d.buang || []).slice();
    SUSUN = d.susun ? { kiri: (d.susun.kiri || []).slice(), kanan: (d.susun.kanan || []).slice() } : null;
    LABEL_PROJEK = d.labelProjek || LABEL_PROJEK || 'projek';
    if (d.bahasaResume) BAHASA = (d.bahasaResume === 'en') ? 'en' : 'ms';
    terapkanBahasa();
    kemasSek();
    el('senarai-tambahan').innerHTML = '';
    bilTambahan = 0;
    (d.tambahan || []).forEach(function (o) { el('senarai-tambahan').appendChild(barisTambahan(o)); });
  }

  /* ---------- muat data lama ---------- */
  function muat() {
    var mentah = null;
    try { mentah = localStorage.getItem(KUNCI); } catch (e) { mentah = null; }
    if (!mentah) return false;
    var d;
    try { d = JSON.parse(mentah); } catch (e) { return false; }
    isiBorang(d);
    return true;
  }

  /* ---------- foto ---------- */
  function tulisLogFoto(mesej, ralat) {
    var kotak = el('foto-info');
    if (!kotak) return;
    kotak.style.fontSize = '12px';
    kotak.style.marginTop = '4px';
    kotak.style.color = ralat ? '#b42318' : (foto ? '#166534' : '#6b7280');
    kotak.textContent = mesej || (foto
      ? (BAHASA === 'en' ? 'OK - the photo will go into the resume.' : 'OK - foto akan masuk ke dalam resume.')
      : (BAHASA === 'en' ? 'No photo yet (optional).' : 'Belum ada foto (pilihan).'));
  }

  function kecilkanFoto(fail, sudah) {
    var pembaca = new window.FileReader();
    pembaca.onload = function () {
      var imej = new window.Image();
      imej.onload = function () {
        try {
          var siling = 420;
          var lebar = imej.width || siling, tinggi = imej.height || siling;
          var skala = Math.min(1, siling / Math.max(lebar, tinggi));
          var kanvas = document.createElement('canvas');
          kanvas.width = Math.max(1, Math.round(lebar * skala));
          kanvas.height = Math.max(1, Math.round(tinggi * skala));
          var ctx = kanvas.getContext ? kanvas.getContext('2d') : null;
          if (!ctx) throw new Error('kanvas tidak tersedia');
          ctx.drawImage(imej, 0, 0, kanvas.width, kanvas.height);
          sudah(kanvas.toDataURL('image/jpeg', 0.82));
        } catch (e) {
          sudah(pembaca.result);   /* pelayar tanpa kanvas: guna fail asal */
        }
      };
      imej.onerror = function () { sudah(null); };
      imej.src = pembaca.result;
    };
    pembaca.onerror = function () { sudah(null); };
    pembaca.readAsDataURL(fail);
  }

  /* ---------- ikatan peristiwa ---------- */
  /* PENTING (mesra telefon): #borang ialah <form>, jadi papan kekunci telefon ("Pergi/Next")
     menghantar borang secara SENYAP -> pengguna terkejut sudah berada di pratonton sebelum
     sempat mengisi semua butiran. Sekarang:
       - Enter biasa  : fokus ke medan seterusnya DALAM langkah yang sama sahaja
       - Ctrl+Enter   : sengaja lompat ke pratonton (kuasa penjual yang biasa)
       - hantar tak sengaja: diabaikan sama sekali (tidak ke mana-mana) */
  var niatPratonton = false;
  el('borang').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.altKey || e.shiftKey) return;
    if (e.target && e.target.tagName === 'TEXTAREA') return;   // textarea: Enter = baris baru
    if (e.ctrlKey || e.metaKey) { niatPratonton = true; return; }  // sengaja: biar hantar berjalan
    e.preventDefault();                                        // elak hantar tak sengaja
    fokusSeterusnya(e.target);
  });
  el('borang').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!niatPratonton) return;    // hantar tak sengaja (Enter papan kekunci telefon) diabaikan
    niatPratonton = false;
    if (!bolehKePratonton()) return;
    pergiHal(3);
  });

  /* hantar fokus ke medan seterusnya dalam langkah yang sedang dilihat - jangan tukar halaman */
  function fokusSeterusnya(dari) {
    var fs = dari && dari.closest ? dari.closest('fieldset[data-langkah]') : null;
    if (!fs) return;
    var medan = fs.querySelectorAll('input, textarea, select');
    var idx = Array.prototype.indexOf.call(medan, dari);
    for (var i = idx + 1; i < medan.length; i++) {
      // langkah lain disembunyikan dengan atribut 'hidden' (lihat tunjukLangkah)
      if (!medan[i].disabled && !medan[i].closest('[hidden]')) { medan[i].focus(); return; }
    }
    dari.blur();   // medan terakhir dalam langkah: tutup papan kekunci, JANGAN ke halaman lain
  }

  /* papan kekunci telefon tunjuk "Next" (bukan "Pergi") supaya tidak nampak macam hantar borang,
     DAN bar langkah dikecilkan semasa menaip supaya tidak menutupi medan yang sedang diisi */
  function medanBorang(e) {
    var t = e.target;
    if (!t || !t.tagName) return null;
    if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA' && t.tagName !== 'SELECT') return null;
    return t.closest && t.closest('#borang') ? t : null;
  }
  document.addEventListener('focusin', function (e) {
    var t = medanBorang(e);
    if (!t) return;
    if (t.tagName === 'INPUT' && !t.getAttribute('enterkeyhint')) t.setAttribute('enterkeyhint', 'next');
    if (el('lk-nav')) el('lk-nav').classList.add('dikecilkan');
  });
  document.addEventListener('focusout', function (e) {
    if (!medanBorang(e)) return;
    setTimeout(function () {
      var akt = document.activeElement;
      var masih = akt && akt.tagName && akt.closest && akt.closest('#borang') && akt.tagName !== 'FORM';
      if (!masih && el('lk-nav')) el('lk-nav').classList.remove('dikecilkan');
    }, 80);
  });

  /* cetak PDF hanya dalam Mod Penjual (pelanggan dapat PDF bersih melalui WhatsApp) */
  el('cetak-pdf').addEventListener('click', function () {
    var d;
    try {
      d = kumpul();
    } catch (err) {
      tulisLog('Ralat membaca borang: ' + err.message, 'ralat');
      return;
    }
    if (!d.nama || !d.telefon) {
      tulisLog('Sila isi Nama dan Nombor Telefon untuk cetak PDF.', 'ralat');
      return;
    }
    papar(d);
    window.print();
  });

  el('borang').addEventListener('input', kemasSemula);
  el('borang').addEventListener('change', kemasSemula);
  el('tambah-pengalaman').addEventListener('click', function () {
    el('senarai-pengalaman').appendChild(barisPengalaman());
    kemasSemula();
  });
  ['kemahiran', 'bahasa'].forEach(function (kunci) {
    el('tambah-' + kunci).addEventListener('click', function () {
      el('senarai-' + kunci).appendChild(barisTahap(kunci));
      kemasSemula();
      var baris = el('senarai-' + kunci).lastElementChild;
      if (baris) baris.querySelector('.t-nama').focus();
    });
  });
  el('tambah-rujukan').addEventListener('click', function () {
    el('senarai-rujukan').appendChild(barisRujukan());
    kemasSemula();
    var baris = el('senarai-rujukan').lastElementChild;
    if (baris) baris.querySelector('.rj-nama').focus();
  });
  Array.prototype.forEach.call(document.querySelectorAll('.pb-btn'), function (b) {
    b.addEventListener('click', function () {
      gunaBahasa(b.getAttribute('data-bahasa'));
      tulisLog(BAHASA === 'en' ? 'Bahasa resume: English.' : 'Bahasa resume: Bahasa Melayu.', 'info');
    });
  });
  el('togol-susun').addEventListener('click', function () { setModSusun(!MOD_SUSUN); });
  el('togol-susun-3').addEventListener('click', function () { setModSusun(!MOD_SUSUN); });
  el('susun-reset').addEventListener('click', function () {
    SUSUN = null;
    kemasSemula();
    tulisLog(bacaSusunRasmi()
      ? 'Susunan blok dikembalikan ke susunan RASMI (susunan yang pelanggan baru terima).'
      : 'Susunan blok dikembalikan ke susunan asal templat.', 'info');
  });
  /* Jadikan apa yang dilihat sekarang sebagai susunan rasmi - hanya dalam mod penjual. */
  ['susun-rasmi', 'susun-rasmi-3'].forEach(function (id) {
    var b = el(id);
    if (!b) return;
    b.addEventListener('click', function () {
      var u = urutan(kumpul());
      if (simpanSusunRasmi(u)) {
        tulisLog('Susunan blok sekarang disimpan sebagai susunan RASMI untuk templat ' + tmp().nama +
                 '. Semua pelanggan baru akan menerimanya.', 'ok');
      } else {
        tulisLog('Susunan rasmi hanya boleh diubah dalam mod penjual.', 'ralat');
      }
      kemasSemula();
    });
  });
  /* Buang susunan rasmi: templat kembali ke susunan asal untuk semua pelanggan. */
  ['susun-rasmi-buang', 'susun-rasmi-buang-3'].forEach(function (id) {
    var b = el(id);
    if (!b) return;
    b.addEventListener('click', function () {
      if (!penjual) return;
      if (!window.confirm('Buang susunan rasmi templat ini? Semua pelanggan baru akan kembali ke susunan asal.')) return;
      simpanSusunRasmi(null);
      kemasSemula();
      tulisLog('Susunan rasmi dibuang - templat kembali ke susunan asal.', 'info');
    });
  });
  el('buka-sisi').addEventListener('click', function () {
    el('sisi').classList.add('buka');
    susunSkalaSisi();
  });
  el('tutup-sisi').addEventListener('click', function () {
    el('sisi').classList.remove('buka');
    susunSkalaSisi();
  });
  function tambahBahagian(tajuk, mod) {
    el('senarai-tambahan').appendChild(barisTambahan({ t: tajuk || '', mod: mod || '' }));
    kemasSemula();
    var baris = el('senarai-tambahan').lastElementChild;
    if (!baris) return;
    if (tajuk) {
      var isi = baris.querySelector('.t-isi');
      if (isi) isi.focus();
      tulisLog('Bahagian "' + tajuk + '" ditambah — tulis satu item satu baris.', 'info');
    } else {
      var inp = baris.querySelector('.t-tajuk');
      if (inp) inp.focus();
      tulisLog('Bahagian tambahan ditambah — isi tajuk dan isinya.', 'info');
    }
  }
  el('tambah-bahagian').addEventListener('click', function () { tambahBahagian(''); });
  // butang tahap 1-5
  el('borang').addEventListener('click', function (e) {
    var btn = (e.target && e.target.closest) ? e.target.closest('.tahap-btn') : null;
    if (!btn) return;
    var kotak = btn.closest('.tahap');
    if (!kotak) return;
    kotak.setAttribute('data-tahap', btn.getAttribute('data-nilai'));
    kemasTahap(kotak.parentNode);
    kemasSemula();
  });
  // cadangan satu klik (cth. Kemahiran Profesional)
  el('borang').addEventListener('click', function (e) {
    var c = (e.target && e.target.closest) ? e.target.closest('.cip[data-tajuk]') : null;
    if (!c) return;
    tambahBahagian(c.getAttribute('data-tajuk'), c.getAttribute('data-mod') || '');
  });
  // buang / tambah balik bahagian piawai (delegasi: butang ada dalam setiap fieldset)
  el('borang').addEventListener('click', function (e) {
    // hanya butang buang / butang tambah balik (bukan seluruh fieldset yang memadankan closest)
    var t = e.target && e.target.closest ? e.target.closest('button[data-sek],button[data-sek-batal]') : null;
    if (!t) return;
    var kunci = t.getAttribute('data-sek') || t.getAttribute('data-sek-batal');
    if (t.hasAttribute('data-sek')) {
      if (BUANG.indexOf(kunci) < 0) BUANG.push(kunci);
      tulisLog('Bahagian dibuang dari resume. Boleh tambah balik bila-bila masa.', 'info');
    } else {
      BUANG = BUANG.filter(function (x) { return x !== kunci; });
      tulisLog('Bahagian dikembalikan ke resume.', 'info');
    }
    kemasSek();
    kemasSemula();
  });
  el('tambah-pendidikan').addEventListener('click', function () {
    el('senarai-pendidikan').appendChild(barisPendidikan());
    kemasSemula();
  });
  el('wa').addEventListener('click', function (e) {
    if (!el('nama').value.trim() || !el('telefon').value.trim()) {
      e.preventDefault();
      tulisLog('Isi Nama dan Nombor Telefon dahulu sebelum hantar pesanan.', 'ralat');
      return;
    }
    /* Hantar resume ke email penjual (kalau tetapan email sudah diisi). Butang WhatsApp
       terbuka di tab baru, jadi muat naik ini tidak terbatal. */
    try {
      var dEmail = kumpul();
      hantarEmailResume(dEmail, kodDari(dEmail));
    } catch (err) {
      tulisLog('Email tidak dapat dihantar: ' + err.message, 'ralat');
    }
  });
  if (el('simpan-email')) el('simpan-email').addEventListener('click', simpanTetapanEmail);
  el('buka-kod').addEventListener('click', function () {
    var d = borangDariKod(el('kod-masuk').value.trim());
    if (!d) {
      tulisLog('Kod resume tidak sah — pastikan ia disalin penuh.', 'ralat');
      return;
    }
    isiBorang(d);
    kemasSemula();
  });
  el('foto').addEventListener('change', function (e) {
    var fail = e.target.files && e.target.files[0];
    if (!fail) return;
    if (fail.size > 6 * 1024 * 1024) {
      tulisLogFoto('Foto terlalu besar — maksimum 6 MB.', true);
      return;
    }
    tulisLogFoto('Memproses foto...');
    kecilkanFoto(fail, function (dataUrl) {
      if (!dataUrl) {
        tulisLogFoto('Gagal membaca foto itu. Cuba format JPG atau PNG.', true);
        return;
      }
      foto = dataUrl;
      tulisLogFoto();
      kemasSemula();
    });
  });
  el('buang-foto').addEventListener('click', function () {
    foto = '';
    el('foto').value = '';
    tulisLogFoto();
    kemasSemula();
  });
  el('kosongkan').addEventListener('click', function () {
    if (!window.confirm('Padam semua isi borang?')) return;
    kosongkanBorang();
    semakSimpanan();
  });

  /* ---------- email resume automatik (Mod Penjual) ----------
     App ini halaman statik: ia tidak boleh menghantar email sendiri. Jadi ia hanya
     MENGHANTAR data resume ke Apps Script (URL yang penjual tampal di Mod Penjual), dan
     Apps Script yang menghantar email. Posting itu 'no-cors' (Apps Script tidak memberi
     CORS) dan tidak perlu membaca jawapan - hantar sekali sahaja, kemudian lupakan. */
  var KUNCI_EMAIL = 'resume-mv-email-api';
  var KUNCI_TOKEN = 'resume-mv-email-token';
  var EMAIL_API = '';
  var EMAIL_TOKEN = '';
  var EMAIL_DIHANTAR = '';        // kod resume terakhir yang sudah dihantar (elak hantar berganda)

  function tulisNotaEmail() {
    var kotak = el('email-nota');
    if (!kotak) return;
    if (!EMAIL_API || !EMAIL_TOKEN) {
      kotak.textContent = 'Belum diset. Isi URL Apps Script dan token, kemudian tekan Simpan. '
        + 'Tanpa ini, butang WhatsApp berfungsi seperti biasa (kod sahaja).';
      return;
    }
    kotak.textContent = 'Sedia. Resume pelanggan akan diemail ke alamat dalam Apps Script.';
  }

  function bacaTetapanEmail() {
    try {
      EMAIL_API = localStorage.getItem(KUNCI_EMAIL) || '';
      EMAIL_TOKEN = localStorage.getItem(KUNCI_TOKEN) || '';
    } catch (e) { /* storan dihalang - bukan ralat maut */ }
    if (el('email-api')) el('email-api').value = EMAIL_API;
    if (el('email-token')) el('email-token').value = EMAIL_TOKEN;
    tulisNotaEmail();
  }

  function simpanTetapanEmail() {
    EMAIL_API = (el('email-api').value || '').trim();
    EMAIL_TOKEN = (el('email-token').value || '').trim();
    try {
      localStorage.setItem(KUNCI_EMAIL, EMAIL_API);
      localStorage.setItem(KUNCI_TOKEN, EMAIL_TOKEN);
    } catch (e) { /* abaikan */ }
    tulisNotaEmail();
    tulisLog(EMAIL_API && EMAIL_TOKEN
      ? 'Tetapan email disimpan. Resume pelanggan akan diemail secara automatik.'
      : 'Tetapan email dikosongkan - resume tidak akan diemail.',
      EMAIL_API && EMAIL_TOKEN ? 'info' : 'ralat');
  }

  function hantarEmailResume(d, kod) {
    if (!EMAIL_API || !EMAIL_TOKEN || !window.fetch) return;
    if (!d || !d.nama || !d.telefon) return;
    if (EMAIL_DIHANTAR === kod) return;                  // resume yang sama - jangan email dua kali
    EMAIL_DIHANTAR = kod;
    var isi = {
      action: 'hantar', token: EMAIL_TOKEN,
      nama: d.nama, telefon: d.telefon, emel: d.emel || '',
      kod: kod, foto: d.foto || '',
      halaman: (typeof HALAMAN === 'number' ? HALAMAN : 1),
      tarikh: new Date().toISOString()
    };
    try {
      window.fetch(EMAIL_API, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(isi)
      }).then(function () {
        tulisLog('Resume dihantar ke email anda.', 'info');
      }).catch(function () {
        tulisLog('Email tidak dapat dihantar (semak URL dan token). Kod resume tetap ada di WhatsApp.', 'ralat');
      });
    } catch (e) {
      tulisLog('Email tidak dapat dihantar: ' + e.message, 'ralat');
    }
  }

  /* ---------- mod penjual ---------- */
  function hidupkanModPenjual(awal) {
    penjual = true;
    document.body.classList.add('mod-penjual');
    el('mod-penjual').hidden = false;
    el('panel-pesanan').hidden = true;
    if (awal) tulisLog('MOD PENJUAL: tanda air dimatikan — tekan Cetak PDF atau Ctrl+P untuk simpan PDF bersih.', 'info');
  }

  /* Tiga jalan masuk:
     a) URL   .../#penjual            (tampal di desktop)
     b) URL   .../#kod=<kod-pelanggan> (buka terus resume pelanggan)
     c) Ketuk tajuk "Resume Builder MV" 5 kali (paling mudah di telefon) */
  function mulakanMod() {
    var h = String(window.location.hash || '');
    var m = h.match(/kod=([A-Za-z0-9_-]+)/);
    if (m) {
      var d2 = borangDariKod(m[1]);
      if (d2) {
        isiBorang(d2);
        hidupkanModPenjual(true);
        return 3;                       // terus ke pratonton, sedia untuk dicetak
      }
      tulisLog('Kod resume dalam pautan itu tidak sah.', 'ralat');
    } else if (/penjual/.test(h)) {
      hidupkanModPenjual(true);
      return 2;                         // panel penjual ada di halaman butiran
    }
    return 1;
  }

  var ketuk = 0, ketukTerakhir = 0;
  el('tajuk').addEventListener('click', function () {
    var kini = Date.now();
    if (kini - ketukTerakhir > 1500) ketuk = 0;
    ketukTerakhir = kini;
    ketuk++;
    if (ketuk >= 5) {
      ketuk = 0;
      var sudah = penjual;
      hidupkanModPenjual(false);
      kemasSemula();
      pergiHal(2, true);
      tulisLog(sudah
        ? 'MOD PENJUAL sudah aktif. Muat semula halaman (F5) untuk kembali ke mod pelanggan.'
        : 'MOD PENJUAL dihidupkan (ketuk 5 kali) — tanda air dimatikan. Muat semula halaman untuk kembali ke mod pelanggan.', 'amaran');
    }
  });

  /* ---------- skala pratonton: seluruh A4 muat pada skrin, tanpa skrol ---------- */
  /* lebar dalam bekas (tolak padding + border) */
  function lebarDalam(n) {
    if (!n) return 0;
    var g = window.getComputedStyle(n);
    var r = n.getBoundingClientRect();
    var tepi = (parseFloat(g.paddingLeft) || 0) + (parseFloat(g.paddingRight) || 0)
             + (parseFloat(g.borderLeftWidth) || 0) + (parseFloat(g.borderRightWidth) || 0);
    return Math.max(0, r.width - tepi);
  }

  // kertas pratonton di sisi borang (halaman 2) — saiz ikut ruang yang ada
  function susunSkalaSisi() {
    var kotak = el('kertas-sisi');
    if (!kotak) return;
    var ada = kotak.offsetWidth > 0 || (kotak.getBoundingClientRect && kotak.getBoundingClientRect().width > 0);
    var bebas = document.getElementById('sisi');
    var penuh = bebas && bebas.classList.contains('buka');
    var lebarTersedia, tinggiTersedia;
    if (penuh) {
      lebarTersedia = window.innerWidth - 40;
      tinggiTersedia = window.innerHeight - 130;
    } else {
      var bekas = kotak.parentElement;
      lebarTersedia = (bekas && bekas.getBoundingClientRect().width) || 0;
      tinggiTersedia = window.innerHeight - 220;
    }
    if (!lebarTersedia) return;
    var skala = Math.min(1, lebarTersedia / 794, tinggiTersedia / 1123);
    var nilai = Math.max(0.2, skala).toFixed(4);
    var papan = el('papan-sisi') || kotak.parentElement;
    if (papan && papan.querySelectorAll) {
      Array.prototype.forEach.call(papan.querySelectorAll('.kertas'), function (k) {
        k.style.setProperty('--skala', nilai);
        k.setAttribute('data-skala', nilai);
      });
    } else {
      kotak.style.setProperty('--skala', nilai);
      kotak.setAttribute('data-skala', nilai);
    }
    if (ada) { /* tiada apa-apa: hanya untuk elak amaran pemboleh tak digunakan */ }
  }
  window.addEventListener('resize', susunSkalaSisi);

  function susunSkala() {
    var panel = document.querySelector('.panel-pratonton');
    var kertas = document.querySelector('#hal-3 .kertas');
    if (!panel || !kertas) return;
    var penuh = document.body.classList.contains('skrin-penuh');
    var akar = document.documentElement;
    akar.style.setProperty('--skala', '1');          // ukur pada saiz sebenar dahulu
    var kk = kertas.getBoundingClientRect();
    var pk = panel.getBoundingClientRect();
    var atas = Math.max(kk.top, 16 + (kk.top - pk.top));   // kedudukan melekat + tinggi tajuk
    var tinggiTersedia = window.innerHeight - atas - 20;
    /* PENTING: lebar diambil daripada BEKAS panel, bukan panel itu sendiri —
       panel hanya selebar helaian, jadi memakainya bermakna had lebar tak pernah dikira
       (helaian terpotong pada skrin telefon). */
    var bekas = panel.parentElement || document.body;
    var lebarTersedia;
    if (penuh) {
      lebarTersedia = window.innerWidth - 56;
    } else {
      lebarTersedia = lebarDalam(bekas) || window.innerWidth;
      var sisi = bekas.querySelector ? bekas.querySelector('.sisi') : null;
      if (sisi && window.getComputedStyle(sisi).display !== 'none') {
        lebarTersedia -= sisi.getBoundingClientRect().width + 22;   // tolok kad semak di sisi
      }
    }
    /* bila resume 2 halaman: di skrin lebar dua helaian duduk sebaris, jadi setiap
       helaian hanya dapat separuh lebar. Di skrin sempit helaian ditindan ke bawah
       (boleh skrol), jadi skala kekal seperti satu helaian. */
    var dua = document.body.classList.contains('dua-halaman');
    var lebarHelaian = (dua && lebarTersedia >= 820) ? (lebarTersedia - 20) / 2 : lebarTersedia;
    var skala = Math.min(1, lebarHelaian / 794, tinggiTersedia / 1123);
    akar.style.setProperty('--skala', Math.max(0.28, skala).toFixed(4));
    kertas.setAttribute('data-skala', Math.max(0.28, skala).toFixed(4));   // untuk ujian/ukur
  }
  /* Ukur semula kandungan SELEPAS font web selesai dimuat: metrik font mengubah tinggi
     kandungan, jadi kiraan halaman dan helaian pratonton mesti dikemas kini. Kalau tidak,
     pratonton tidak sama dengan PDF (Chrome mencetak dengan metrik font sebenar). */
  function susunSemulaSelepasFont() { larasRuang(); susunSkala(); susunMini(); susunSkalaSisi(); }
  window.addEventListener('resize', function () { larasRuang(); susunSkala(); susunMini(); susunSkalaSisi(); });
  window.addEventListener('orientationchange', function () { larasRuang(); susunSkala(); susunMini(); susunSkalaSisi(); });
  window.addEventListener('load', susunSemulaSelepasFont);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(susunSemulaSelepasFont);
  }

  /* ---------- pratonton skrin penuh ---------- */
  function togolSkrinPenuh(paksa) {
    var penuh = (typeof paksa === 'boolean') ? paksa : !document.body.classList.contains('skrin-penuh');
    document.body.classList.toggle('skrin-penuh', penuh);
    el('btn-skrin').textContent = penuh ? 'Tutup (Esc)' : 'Skrin penuh';
    susunSkala();
  }
  el('btn-skrin').addEventListener('click', function () { togolSkrinPenuh(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('skrin-penuh')) togolSkrinPenuh(false);
  });

  /* ---------- aliran 4 halaman (wizard) ---------- */
  var HAL_SEMASA = 1, HAL_MAKS = 1;
  var sediaPratonton = false;   // penjaga dua ketukan sebelum masuk pratonton
  var TAJUK_HAL = ['', 'Reka bentuk', 'Butiran', 'Pratonton', 'Hantar'];
  /* Pratonton bukan lagi satu langkah yang boleh diklik - ia muncul selepas langkah 8 sahaja */
  var TEKS_LANGKAH = ['', 'Langkah 1 daripada 3 \u00b7 Pilih reka bentuk',
                      'Langkah 2 daripada 3 \u00b7 Isi butiran', 'Pratonton resume',
                      'Langkah 3 daripada 3 \u00b7 Hantar pesanan'];

  function pergiHal(n, senyap) {
    n = Math.min(4, Math.max(1, n));
    if (penjual && n === 4) n = 3;                 // penjual tidak perlu halaman pesanan
    HAL_SEMASA = n;
    if (n > HAL_MAKS) HAL_MAKS = n;
    for (var i = 1; i <= 4; i++) {
      var hal = el('hal-' + i);
      if (hal) hal.hidden = (i !== n);
    }
    var titik = document.querySelectorAll('#langkah .dot');
    for (var j = 0; j < titik.length; j++) {
      // titik ditanda dengan data-hal (1 reka bentuk, 2 butiran, 4 hantar) - pratonton bukan langkah
      var s2 = parseInt(titik[j].getAttribute('data-hal'), 10) || (j + 1);
      titik[j].classList.toggle('aktif', s2 === n);
      titik[j].classList.toggle('siap', s2 < n);
      titik[j].disabled = (s2 > HAL_MAKS);
    }
    document.body.setAttribute('data-hal', String(n));
    var lt = el('langkah-teks');
    if (lt) lt.textContent = TEKS_LANGKAH[n] || '';
    if (!senyap) window.scrollTo(0, 0);
    if (n === 1) susunMini();
    if (n === 2 || n === 3) larasRuang();      // ukur semula pada helaian yang baru kelihatan
    if (n === 3) susunSkala();
    if (n === 4) kemasSemula();
  }

  /* ---------- langkah butiran: satu topik satu langkah ---------- */
  var LANGKAH = ['Butiran Peribadi', 'Jawatan Disasarkan', 'Pengalaman Kerja', 'Pendidikan',
                 'Kemahiran', 'Bahasa', 'Rujukan', 'Tambahan (pilihan)'];
  var langkahKini = 1, langkahDilihat = {};

  function tunjukLangkah(n) {
    if (!el('lk-nav')) return;
    langkahKini = Math.max(1, Math.min(LANGKAH.length, parseInt(n, 10) || 1));
    langkahDilihat[langkahKini] = true;
    Array.prototype.forEach.call(document.querySelectorAll('#borang [data-langkah]'), function (x) {
      x.hidden = (parseInt(x.getAttribute('data-langkah'), 10) !== langkahKini);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#lk-bulat .lk-b'), function (b) {
      var n2 = parseInt(b.getAttribute('data-lk'), 10);
      b.classList.toggle('aktif', n2 === langkahKini);
      b.classList.toggle('dilihat', n2 !== langkahKini && !!langkahDilihat[n2]);
      b.setAttribute('aria-current', n2 === langkahKini ? 'step' : 'false');
    });
    el('lk-kira').textContent = tb('Langkah') + ' ' + langkahKini + ' / ' + LANGKAH.length;
    el('lk-tajuk').textContent = tb(LANGKAH[langkahKini - 1]);
    el('lk-jalur').style.width = (langkahKini / LANGKAH.length * 100).toFixed(1) + '%';
    el('lk-balik').textContent = tb(langkahKini === 1 ? '\u2190 Butiran Reka Bentuk' : '\u2190 Kembali');
    el('lk-seterusnya').textContent = tb(langkahKini === LANGKAH.length ? 'Seterusnya: Pratonton \u2192' : 'Seterusnya \u2192');
    sediaPratonton = false;                     // penjaga dua ketukan bermula semula setiap langkah
    if (el('lk-nav')) el('lk-nav').classList.remove('dikecilkan');
    kemasLkNota();
  }

  /* bahagian yang masih kosong (untuk amaran mesra, bukan sekatan) */
  function bahagianKosong(d) {
    var kosong = [];
    if (!d.ringkasan && !dibuang(d, 'ringkasan')) kosong.push('Ringkasan');
    if (!(d.pengalaman || []).length && !dibuang(d, 'pengalaman')) kosong.push('Pengalaman');
    if (!(d.pendidikan || []).length && !dibuang(d, 'pendidikan')) kosong.push('Pendidikan');
    if (!(d.kemahiran || []).length && !dibuang(d, 'kemahiran')) kosong.push('Kemahiran');
    if (!(d.bahasa || []).length && !dibuang(d, 'bahasa')) kosong.push('Bahasa');
    if (!(d.rujukan || []).length && !dibuang(d, 'rujukan')) kosong.push('Rujukan');
    return kosong;
  }

  /* nota mesra: apa yang belum diisi (tidak menghalang pengguna) */
  function kemasLkNota(data, mesej) {
    var nota = el('lk-nota');
    if (!nota) return;
    if (mesej) { nota.hidden = false; nota.textContent = mesej; return; }
    var en = (BAHASA === 'en');
    var d = data || kumpul(), kurang = [];
    if (!d.nama) kurang.push(en ? 'name' : 'nama');
    if (!d.telefon) kurang.push(en ? 'phone number' : 'nombor telefon');
    nota.hidden = !kurang.length;
    if (kurang.length) {
      nota.textContent = en
        ? 'Not filled in yet: ' + kurang.join(' and ') +
          (langkahKini < LANGKAH.length ? ' \u2014 needed before the preview.' : ' \u2014 fill it in first to open the preview.')
        : 'Belum diisi: ' + kurang.join(' dan ') +
          (langkahKini < LANGKAH.length ? ' \u2014 perlu sebelum pratonton.' : ' \u2014 isi dahulu untuk buka pratonton.');
    }
  }

  function bolehKePratonton() {
    var d = kumpul();
    if (d.nama && d.telefon) return true;
    tulisLog(BAHASA === 'en'
      ? 'Fill in ' + (!d.nama ? 'Name' : 'Phone Number') + ' first before opening the preview.'
      : 'Isi ' + (!d.nama ? 'Nama' : 'Nombor Telefon') + ' dahulu sebelum lihat pratonton.', 'ralat');
    var medan = !d.nama ? el('nama') : el('telefon');
    if (medan) {
      medan.focus();
      if (medan.scrollIntoView) medan.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return false;
  }

  /* data contoh untuk pratonton mini pada halaman 1 */
  var CONTOH = {
    nama: 'NURUL AIN BINTI HASSAN',
    jawatan: 'Junior Quantity Surveyor',
    telefon: '012-345 6789',
    emel: 'nurul.ain@gmail.com',
    lokasi: 'Kuantan, Pahang',
    ringkasan: 'Graduan Sarjana Muda Ukur Bahan dengan 3 tahun pengalaman dalam projek perumahan mampu milik '
      + 'dan kerja naik taraf bangunan. Berpengalaman menyediakan BQ dan menilai tuntutan kontraktor.',
    kemahiran: [{ nama: 'Pengukuran Kuantiti (BQ)', tahap: 5 }, { nama: 'AutoCAD', tahap: 4 },
                { nama: 'MS Excel (kos)', tahap: 4 }, { nama: 'Pengurusan Kontrak', tahap: 3 },
                { nama: 'Penyediaan Tuntutan', tahap: 4 }],
    bahasa: [{ nama: 'Bahasa Melayu', tahap: 5 }, { nama: 'Bahasa Inggeris', tahap: 4 },
             { nama: 'Bahasa Mandarin', tahap: 2 }],
    rujukan: [{ nama: 'En. Ahmad Faizal bin Hassan', jawatan: 'Pengurus Projek, EPH Construction Sdn Bhd', telefon: '012-345 6789' }],
    pengalaman: [
      { syarikat: 'EPH Construction Sdn Bhd', jawatan: 'Quantity Surveyor', tempoh: 'Mac 2024 - Kini',
        poin: ['Sediakan BQ dan dokumen tawaran untuk 3 projek perumahan.',
               'Nilai tuntutan kontraktor bulanan dan interim certificate.'],
        projek: [
          { nama: 'Perumahan Idaman Rakyat, Paka (RM 42 juta)', klien: 'KPKT', poin: [
            'Sediakan BQ pakej struktur dan seni bina.',
            'Ukur kerja sebenar di tapak dan lapor kos bulanan.'] },
          { nama: 'Naik Taraf Klinik Kesihatan Kemaman', poin: [
            'Semak variation order dan anggaran kos tambahan.'] }] },
      { syarikat: 'Bina Jaya Sdn Bhd', jawatan: 'Pembantu Ukur Bahan', tempoh: 'Jun 2023 - Feb 2024',
        poin: ['Bantu penyediaan anggaran kos dan pengiraan bahan.',
               'Rekod kemajuan kerja mingguan di tapak projek.'] },
    ],
    tambahan: [{ t: 'Kemahiran Profesional', mod: 'dua', bahagian: [
      { nama: 'Pengurusan Kos', detail: 'Sedia BQ, kawal kos dan lapor bulanan.' },
      { nama: 'Penyeliaan Tapak', detail: 'Ukur kerja sebenar dan sahkan tuntutan kerja.' }] }],
    pendidikan: [
      { kelulusan: 'Sarjana Muda Ukur Bahan (Kepujian)', institusi: 'Universiti Teknologi MARA, Shah Alam', tahun: '2021 - 2024' }
    ],
    foto: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RiZTRlZSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9Ijc4IiByPSIzNiIgZmlsbD0iIzkzYTljNCIvPjxwYXRoIGQ9Ik0xMDAgMTIyYy0zNiAwLTYyIDIzLTYyIDUydjI2aDEyNHYtMjZjMC0yOS0yNi01Mi02Mi01MnoiIGZpbGw9IiM5M2E5YzQiLz48L3N2Zz4='
  };

  function susunMini() {
    Object.keys(TEMPLAT).forEach(function (k) {
      var mini = el('mini-' + k);
      if (!mini || !mini.parentNode) return;
      if (!mini.innerHTML) mini.innerHTML = TEMPLAT[k].html(CONTOH);
      var lebar = mini.parentNode.clientWidth;
      if (!lebar) return;
      mini.style.setProperty('--skala-mini', (lebar / 794).toFixed(4));
    });
  }

  /* ---------- galeri reka bentuk: kad dijana daripada TEMPLAT ----------
     Tiap kad dapat --i (untuk animasi masuk berperingkat) dan --aksen (warna reka bentuk). */
  function kadTemplatHtml(k, i) {
    var t = TEMPLAT[k];
    var ciri = (t.ciri || []).map(function (c) { return '<li>' + esc(tb(c)) + '</li>'; }).join('');
    return '<button type="button" class="kad-pilih" data-templat="' + esc(k) + '" aria-pressed="false"' +
      ' style="--i:' + i + '; --aksen:' + esc(t.aksen || '#12508c') + '"' +
      ' aria-label="Reka bentuk ' + esc(t.nama) + '">' +
      '<div class="mini"><div class="mini-kertas lembar" id="mini-' + esc(k) + '"></div></div>' +
      '<div class="kad-teks">' +
        '<h3>' + esc(t.nama) + '<span class="pil-pilih">Dipilih</span></h3>' +
        '<p class="kad-nota">' + esc(tb(t.nota) || '') + '</p>' +
        (ciri ? '<ul class="kad-ciri">' + ciri + '</ul>' : '') +
      '</div>' +
    '</button>';
  }

  function paparKadTemplat() {
    var kotak = el('galeri');
    if (!kotak) return;
    kotak.innerHTML = Object.keys(TEMPLAT).map(kadTemplatHtml).join('');
    var kira = el('galeri-kira');
    if (kira) kira.textContent = Object.keys(TEMPLAT).length + (BAHASA === 'en' ? ' designs' : ' reka bentuk');
  }

  /* pilih reka bentuk pada halaman 1 */
  function pilihTemplat(kunci, senyap) {
    if (!TEMPLAT[kunci]) kunci = 'biru';
    KUNCI_TEMPLAT = kunci;
    Array.prototype.forEach.call(document.querySelectorAll('.kad-pilih[data-templat]'), function (k) {
      k.setAttribute('aria-pressed', k.getAttribute('data-templat') === kunci ? 'true' : 'false');
    });
    if (senyap) return;
    kemasSemula();
    tulisLog('Reka bentuk dipilih: ' + tmp().nama + '. Boleh tukar bila-bila masa.', 'info');
  }
  paparKadTemplat();                    // kad dijana dahulu, kemudian ikatan klik
  Array.prototype.forEach.call(document.querySelectorAll('.kad-pilih[data-templat]'), function (k) {
    k.addEventListener('click', function () { pilihTemplat(k.getAttribute('data-templat')); });
  });
  pilihTemplat(KUNCI_TEMPLAT, true);
  susunMini();

  el('mula-isi').addEventListener('click', function () { pergiHal(2); });
  el('balik-2').addEventListener('click', function () { pergiHal(1); });
  el('balik-3').addEventListener('click', function () { pergiHal(2); });
  el('balik-4').addEventListener('click', function () { pergiHal(3); });
  el('lk-seterusnya').addEventListener('click', function () {
    if (langkahKini >= LANGKAH.length) {
      /* mesra pengguna: kalau masih ada bahagian kosong, ketukan pertama hanya beri amaran
         (tidak terus bawa ke pratonton) - ketukan kedua barulah ke pratonton */
      var kosong = bahagianKosong(kumpul());
      if (kosong.length && !sediaPratonton) {
        sediaPratonton = true;
        kemasLkNota(null, BAHASA === 'en'
          ? 'Not filled in yet: ' + kosong.join(', ') + '. Press once more to go to the preview anyway, or fill it in first.'
          : 'Belum diisi: ' + kosong.join(', ') + '. Tekan sekali lagi untuk terus ke pratonton, atau isi dahulu.');
        return;
      }
      sediaPratonton = false;
      el('ke-3').click();
      return;
    }
    sediaPratonton = false;
    tunjukLangkah(langkahKini + 1);
  });
  el('lk-balik').addEventListener('click', function () {
    if (langkahKini <= 1) { el('balik-2').click(); return; }
    tunjukLangkah(langkahKini - 1);
  });
  Array.prototype.forEach.call(document.querySelectorAll('#lk-bulat .lk-b'), function (b) {
    b.addEventListener('click', function () { tunjukLangkah(parseInt(b.getAttribute('data-lk'), 10) || 1); });
  });
  el('ke-3').addEventListener('click', function () { if (bolehKePratonton()) pergiHal(3); });
  el('ke-4').addEventListener('click', function () { pergiHal(4); });

  var titikLangkah = document.querySelectorAll('#langkah .dot');
  for (var tl = 0; tl < titikLangkah.length; tl++) {
    titikLangkah[tl].addEventListener('click', function () {
      var n2 = parseInt(this.getAttribute('data-hal'), 10) || 1;
      if (n2 === 3 && !bolehKePratonton()) return;
      pergiHal(n2);
    });
  }

  muat();
  var halAwal = mulakanMod();
  if (!document.querySelectorAll('#senarai-pengalaman .baris').length) {
    el('senarai-pengalaman').appendChild(barisPengalaman());
  }
  if (!document.querySelectorAll('#senarai-pendidikan .baris').length) {
    el('senarai-pendidikan').appendChild(barisPendidikan());
  }
  if (!document.querySelectorAll('#senarai-rujukan .baris').length) {
    el('senarai-rujukan').appendChild(barisRujukan());
  }
  ['kemahiran', 'bahasa'].forEach(function (kunci) {
    if (!document.querySelectorAll('#senarai-' + kunci + ' .baris').length) {
      el('senarai-' + kunci).appendChild(barisTahap(kunci));
    }
  });
  window.ResumeMV = { kod: kodDari, dariKod: borangDariKod, isi: isiBorang, kumpul: kumpul,
    templat: function () { return KUNCI_TEMPLAT; }, renggang: function () { return RENGGANG; },
    penuh: function () { return PENUH; }, teks: function () { return TEKS; },
    lebih: function () { return LEBIH; },
    halaman: function () { return HALAMAN; }, kiraHalaman: kiraHalaman,
    potong: function () { return POTONG.slice(); }, titikPotong: kiraPotong,
    tinggiIsi: function () { return TINGGI_ISI; },
    susun: function () { return SUSUN ? { kiri: SUSUN.kiri.slice(), kanan: SUSUN.kanan.slice() } : null; },
    susunRasmi: bacaSusunRasmi, simpanSusunRasmi: simpanSusunRasmi,
    penjual: function () { return penjual; }, tandaSusunRasmi: tandaSusunRasmi,
    bahasa: function () { return BAHASA; }, gunaBahasa: gunaBahasa, bersihPoin: bersihPoin,
    kamus: function (k) { return KAMUS_EN[k]; }, uiAsal: function () { return UI_ASAL.length; },
    tempat: function () { return Object.keys(TEMPLAT); }, urutan: urutan, pindah: pindahBlok };
  kemasSemula();
  kemasSek();
  try { BAHASA = (localStorage.getItem(KUNCI_BAHASA) === 'ms') ? 'ms' : 'en'; } catch (e) { BAHASA = 'en'; }
  kumpulTeksUI();          // kumpul teks elemen (legend/label/nota/butang)
  terjemahElemen(document.body);   // + nod teks (termasuk di dalam elemen ber-markup)
  terapkanBahasa();
  susunSkalaSisi();
  tunjukLangkah(1);
  bacaTetapanEmail();
  semakSimpanan();
  terjemahElemen(document.body);   // nota yang ditulis selepas init (cth status e-mel) juga ikut bahasa
  pergiHal(halAwal || 1, true);
  susunSkala();
})();
