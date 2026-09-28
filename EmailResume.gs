/**
 * =====================================================================
 *  Resume Builder MV  -  EmailResume.gs
 *  Google Apps Script (V8) untuk:
 *    (a) simpan rekod resume pelanggan dalam Google Sheet
 *    (b) email data + kod kepada PENJUAL serta-merta
 *    (c) email PDF resume (dihantar kemudian oleh helper di PC penjual)
 * =====================================================================
 *
 *  CARA GUNA RINGKAS
 *  -----------------
 *  1) Apps Script ini dipasang dari dalam Google Sheet (Extensions > Apps Script).
 *  2) Ubah 2 baris di bawah: EMAIL_PENERIMA dan TOKEN.
 *  3) Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
 *  4) Salin URL yang berakhir dengan /exec ke dalam app (Mod Penjual > URL email).
 *
 *  PEMBOLEH UBAH YANG MESTI DIUBAH
 *  -------------------------------
 *   EMAIL_PENERIMA : email penjual - semua resume akan sampai ke email ini.
 *   TOKEN          : kunci kongsi antara app dan GAS. MESTI SAMA dengan token
 *                    yang ditaip dalam app. Jangan kongsi dengan sesiapa.
 *   NAMA_SHEET     : nama tab sheet. Terus guna 'ResumeMV' - JANGAN ubah,
 *                    kerana helper di PC penjual cari nama ini.
 *
 *  SUSUNAN KOLUM SHEET 'ResumeMV' (mesti tepat)
 *  -------------------------------------------
 *   A Tarikh | B Nama | C Telefon | D Emel | E Halaman | F Kod | G FotoID | H Status | I PDFID
 *   Status: 'Menunggu' (belum diproses) -> 'Diproses' (helper sedang ambil)
 *           -> 'Dihantar' (PDF sudah diemail).
 *
 *  KUOTA EMAIL
 *  -----------
 *  MailApp (akaun Gmail percuma) = 100 penerima / hari. Satu resume baru
 *  menggunakan 1 kuota (email data), dan satu PDF menggunakan 1 kuota lagi.
 *  Jadi selebih-lebihnya lebih kurang 50 resume sehari. Kuota reset setiap
 *  hari (waktu tengah malam waktu Pasifik). Semak baki kuota dengan
 *  MailApp.getRemainingDailyQuota(), atau jalankan fungsi ujiEmail().
 *
 *  KESELAMATAN
 *  -----------
 *  Semua action (POST 'hantar', POST 'selesai', GET 'kerja', GET 'uji')
 *  WAJIB lulus semakan token dahulu. Kalau token salah: tiada email dihantar
 *  dan tiada data didedahkan - hanya {ok:false,ralat:'token'} dipulangkan.
 */

// ============ RUANG UBAH SUAI - MULA (ubah 2 baris ini sahaja) ============
const EMAIL_PENERIMA = 'TUKAR-EMAIL-INI';   // <-- email penjual, cth: alex@gmail.com
const TOKEN = 'TUKAR-TOKEN-INI';            // <-- kunci kongsi, cth: ResumeMV-alex-9f42b1-KUNCI
// ============ RUANG UBAH SUAI - TAMAT ============

const NAMA_SHEET = 'ResumeMV';              // nama tab sheet - jangan ubah
const TAJUK_KOLUM = ['Tarikh', 'Nama', 'Telefon', 'Emel', 'Halaman', 'Kod', 'FotoID', 'Status', 'PDFID'];
const STATUS_MENUNGGU = 'Menunggu';
const STATUS_DIPROSES = 'Diproses';
const STATUS_DIHANTAR = 'Dihantar';
const NAMA_FOLDER = 'ResumeMV-Fail';        // folder Drive untuk simpan foto + PDF
const PAUTAN_RESUME = 'https://alexander751.github.io/Resume-builder-mv/#kod=';

/* =====================================================================
 *  SEKATAN SEMAKAN TOKEN
 *  Kenapa di hadapan? Supaya setiap action disemak dengan cara yang sama
 *  dan mustahil ada laluan yang terlupa disemak. Satu tempat sahaja.
 * ===================================================================== */
function tokenSah_(token) {
  return String(token === undefined || token === null ? '' : token) === TOKEN;
}

/* Pulangkan JSON sebagai jawapan (mimeType JSON). */
function jsonOut_(objek) {
  return ContentService
    .createTextOutput(JSON.stringify(objek))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================================
 *  POST - app pelanggan / helper PC menghantar data ke sini
 * ===================================================================== */
function doPost(e) {
  try {
    const mentah = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(mentah);

    // SEMAKAN TOKEN DI HADAPAN - kalau salah, berhenti di sini.
    // Tiada email dihantar, tiada data didedahkan.
    if (!tokenSah_(data.token)) {
      return jsonOut_({ ok: false, ralat: 'token' });
    }

    if (data.action === 'hantar') return urusHantar_(data);
    if (data.action === 'selesai') return urusSelesai_(data);

    return jsonOut_({ ok: false, ralat: 'action' });
  } catch (err) {
    return jsonOut_({ ok: false, ralat: String(err) });
  }
}

/**
 * action: 'hantar'  -  resume baru dari pelanggan.
 * 1) Tambah baris baharu (Status = 'Menunggu')
 * 2) Simpan foto ke Drive (kalau ada), catat ID fail dalam kolum FotoID
 * 3) HANTAR EMAIL SERTA-MERTA kepada penjual
 * Pulangkan: {ok:true, id:<nombor baris>}
 */
function urusHantar_(data) {
  const sheet = ambilSheet_();
  const tarikh = data.tarikh || new Date().toISOString();
  const nama = String(data.nama || '');
  const telefon = String(data.telefon || '');
  const emel = String(data.emel || '');
  const kod = String(data.kod || '');
  const halaman = Number(data.halaman) || 1;

  // (1) Tambah baris dulu supaya kita tahu nombor baris (= id kerja)
  sheet.appendRow([tarikh, nama, telefon, emel, halaman, kod, '', STATUS_MENUNGGU, '']);
  const baris = sheet.getLastRow();

  // (2) Simpan foto kalau pelanggan ada muat naik (format data:image/jpeg;base64,...)
  let fotoId = '';
  if (data.foto && String(data.foto).indexOf('base64,') !== -1) {
    fotoId = simpanFoto_(data.foto, baris, nama);
    if (fotoId) sheet.getRange(baris, 7).setValue(fotoId); // kolum G = FotoID
  }

  // (3) Email data + kod kepada penjual - serta-merta, jangan tunggu helper PC
  hantarEmailData_(nama, telefon, emel, halaman, tarikh, kod, baris);

  return jsonOut_({ ok: true, id: baris });
}

/**
 * action: 'selesai'  -  helper di PC sudah render PDF.
 * Email PDF kepada penjual, simpan ID fail PDF, tandakan Status = 'Dihantar'.
 * Pulangkan: {ok:true}
 */
function urusSelesai_(data) {
  const sheet = ambilSheet_();
  const id = Number(data.id) || 0;

  // Semak baris wujud (baris 1 = tajuk, jadi data bermula dari baris 2)
  if (id < 2 || id > sheet.getLastRow()) return jsonOut_({ ok: false, ralat: 'id' });
  if (!data.pdf) return jsonOut_({ ok: false, ralat: 'pdf' });

  const nama = String(sheet.getRange(id, 2).getValue() || '');
  const namaFail = 'Resume-' + namaBersih_(nama) + '.pdf';
  const blobPdf = Utilities.newBlob(Utilities.base64Decode(data.pdf), 'application/pdf', namaFail);

  // Email PDF sebagai lampiran
  MailApp.sendEmail({
    to: EMAIL_PENERIMA,
    subject: 'PDF Resume - ' + nama,
    body: 'Lampiran: PDF resume untuk ' + nama + '.\n\n'
        + 'Resume Builder MV',
    attachments: [blobPdf]
  });

  // Simpan PDF ke Drive dan catat ID fail (kolum I = PDFID)
  let pdfId = '';
  try {
    pdfId = ambilFolder_().createFile(blobPdf).getId();
  } catch (err) {
    pdfId = ''; // email sudah dihantar - kegagalan simpan PDF tidak menghalang
  }
  if (pdfId) sheet.getRange(id, 9).setValue(pdfId);
  sheet.getRange(id, 8).setValue(STATUS_DIHANTAR); // kolum H = Status

  return jsonOut_({ ok: true });
}

/* =====================================================================
 *  GET - helper di PC penjual mengambil kerja
 * ===================================================================== */
function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};

  // SEMAKAN TOKEN DI HADAPAN - sama seperti doPost.
  if (!tokenSah_(p.token)) {
    return jsonOut_({ ok: false, ralat: 'token' });
  }

  if (p.action === 'kerja') return ambilKerja_(p.had);
  if (p.action === 'uji') return jsonOut_({ ok: true, kuota: MailApp.getRemainingDailyQuota() });

  return jsonOut_({ ok: false, ralat: 'action' });
}

/**
 * action=kerja&had=5
 * Ambil baris Status = 'Menunggu' (maksimum `had` baris), TUKAR status kepada
 * 'Diproses' SEBELUM memulangkan - supaya kerja yang sama tidak diambil dua kali.
 * Pulangkan: {ok:true,kerja:[{id,nama,emel,kod,halaman,foto}]}
 */
function ambilKerja_(had) {
  const sheet = ambilSheet_();
  const maks = Number(had) || 5;
  const terakhir = sheet.getLastRow();
  const kerja = [];

  if (terakhir < 2) return jsonOut_({ ok: true, kerja: [] });

  const nilai = sheet.getRange(2, 1, terakhir - 1, 9).getValues();
  for (let i = 0; i < nilai.length && kerja.length < maks; i++) {
    const baris = nilai[i];
    if (String(baris[7]) !== STATUS_MENUNGGU) continue; // kolum H = Status

    const id = i + 2; // +2 kerana indeks bermula 0 dan baris 1 ialah tajuk
    sheet.getRange(id, 8).setValue(STATUS_DIPROSES);     // tanda dulu, hantar kemudian

    kerja.push({
      id: id,
      nama: String(baris[1] || ''),
      emel: String(baris[3] || ''),
      kod: String(baris[5] || ''),
      halaman: Number(baris[4]) || 1,
      foto: bacaFotoBase64_(String(baris[6] || ''))      // '' kalau tiada foto
    });
  }

  return jsonOut_({ ok: true, kerja: kerja });
}

/* =====================================================================
 *  FUNGSI PEMBANTU
 * ===================================================================== */

/* Ambil sheet 'ResumeMV'. Cipta + tulis tajuk kolum kalau belum ada. */
function ambilSheet_() {
  const buku = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = buku.getSheetByName(NAMA_SHEET);

  if (!sheet) {
    sheet = buku.insertSheet(NAMA_SHEET);
  }

  // Tulis tajuk kolum jika baris 1 kosong (jangan tulis semula - elak tulis banyak kali)
  const barisPertama = sheet.getLastRow() === 0
    ? []
    : sheet.getRange(1, 1, 1, 9).getValues()[0];
  const adaTajuk = barisPertama.length === 9 && String(barisPertama[0]) === TAJUK_KOLUM[0];
  if (!adaTajuk) {
    sheet.getRange(1, 1, 1, 9).setValues([TAJUK_KOLUM]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/* Ambil (atau cipta) folder Drive untuk simpan foto + PDF. */
function ambilFolder_() {
  const it = DriveApp.getFoldersByName(NAMA_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NAMA_FOLDER);
}

/* Buang aksara yang tidak selamat untuk nama fail. */
function namaBersih_(nama) {
  const bersih = String(nama || 'pelanggan').replace(/[\\\/:*?"<>|]/g, '-').trim();
  return bersih.length ? bersih : 'pelanggan';
}

/* Simpan foto (data URL) ke Drive. Pulangkan ID fail, atau '' kalau gagal. */
function simpanFoto_(dataUrl, baris, nama) {
  try {
    const teks = String(dataUrl);
    const koma = teks.indexOf(',');
    const base64 = koma >= 0 ? teks.slice(koma + 1) : teks;
    if (!base64) return '';

    const namaFail = 'ResumeMV-foto-' + baris + '-' + namaBersih_(nama) + '.jpg';
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', namaFail);
    return ambilFolder_().createFile(blob).getId();
  } catch (err) {
    return ''; // foto gagal bukan ralat maut - baris tetap direkod
  }
}

/* Baca fail Drive (FotoID) dan pulangkan base64 TANPA prefix data:. */
function bacaFotoBase64_(fotoId) {
  if (!fotoId) return '';
  try {
    return Utilities.base64Encode(DriveApp.getFileById(fotoId).getBlob().getBytes());
  } catch (err) {
    return '';
  }
}

/* Email data + kod resume kepada penjual (teks biasa, mudah dibaca di telefon). */
function hantarEmailData_(nama, telefon, emel, halaman, tarikh, kod, baris) {
  const pautan = PAUTAN_RESUME + encodeURIComponent(kod); // kod MESTI URL-encoded

  const badan = [
    'RESUME BARU - Resume Builder MV',
    '',
    'Nama          : ' + nama,
    'Telefon       : ' + telefon,
    'Emel          : ' + (emel || '-'),
    'Bil. halaman  : ' + halaman,
    'Tarikh        : ' + tarikh,
    'Baris sheet   : ' + baris,
    '',
    'Kod resume (tampal dalam app: Mod Penjual > Buka Kod):',
    kod,
    '',
    'Buka terus resume pelanggan:',
    pautan,
    '',
    'NOTA: PDF akan sampai dalam email berasingan.'
  ].join('\n');

  // 1 penerima = 1 kuota MailApp (had 100 penerima/hari untuk Gmail percuma)
  MailApp.sendEmail({
    to: EMAIL_PENERIMA,
    subject: 'Resume baru - ' + nama + ' (' + telefon + ')',
    body: badan
  });
}

/* =====================================================================
 *  FUNGSI UJIAN - jalankan dari dropdown editor Apps Script
 * ===================================================================== */

/**
 * ujiEmail()
 * Hantar email percuma kepada EMAIL_PENERIMA untuk sahkan setup email.
 * Cara: pilih ujiEmail pada dropdown > Run > lihat Execution log.
 */
function ujiEmail() {
  MailApp.sendEmail({
    to: EMAIL_PENERIMA,
    subject: 'UJIAN Resume Builder MV',
    body: 'UJIAN Resume Builder MV - kalau awak nampak email ini, setup email sudah betul.'
  });
  Logger.log('UJIAN LULUS: email ujian dihantar. Kuota tinggal: ' + MailApp.getRemainingDailyQuota());
}

/**
 * ujiSimpan()
 * Tulis satu baris ujian ke sheet untuk sahkan sambungan Sheet <-> Apps Script.
 * Padam baris ujian ini selepas semak.
 */
function ujiSimpan() {
  const sheet = ambilSheet_();
  sheet.appendRow([
    new Date().toISOString(),
    'UJIAN',
    '0123456789',
    'ujian@example.com',
    1,
    'KOD-UJIAN',
    '',
    STATUS_MENUNGGU,
    ''
  ]);
  Logger.log('UJIAN SIMPAN LULUS: baris ujian ditulis ke sheet ' + NAMA_SHEET
           + ' di baris ' + sheet.getLastRow() + '. Padam baris ini selepas semak.');
}
