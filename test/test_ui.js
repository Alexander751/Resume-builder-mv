// Ujian UI Resume Builder MV — Fasa 1 (regresi) + Fasa 2 (medan resume sebenar)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

let pass = 0, fail = 0, skip = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS  ' + msg); }
  else { fail++; console.log('  FAIL  ' + msg); }
}
function skip_(msg) { skip++; console.log('  SKIP  ' + msg); }

let printCalls = 0;
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://alexander751.github.io/Resume-builder-mv/',
  beforeParse(w) {
    w.print = () => { printCalls++; };
    w.confirm = () => true;
  }
});
const w = dom.window, d = w.document;
const el = (id) => d.getElementById(id);
const isi = (sel, val) => { d.querySelector(sel).value = val; };
const resume = () => el('resume').textContent;

console.log('== 1. Fasa 1: elemen asas masih wujud ==');
ok(!!el('nama'), 'input #nama wujud');
ok(!!el('telefon'), 'input #telefon wujud');
ok(!!el('jana'), 'butang #jana wujud');
ok(el('jana').textContent.trim() === 'Jana PDF', 'teks butang = "Jana PDF"');
const labels = [...d.querySelectorAll('label')].map(l => l.textContent.trim());
ok(labels.includes('Nama'), 'label "Nama" ada');
ok(labels.includes('Nombor Telefon'), 'label "Nombor Telefon" ada');

console.log('== 2. Fasa 2: medan baru wujud ==');
['emel', 'lokasi', 'jawatan', 'ringkasan', 'kemahiran'].forEach(id => ok(!!el(id), 'input #' + id + ' wujud'));
ok(!!el('tambah-pengalaman'), 'butang #tambah-pengalaman wujud');
ok(!!el('tambah-pendidikan'), 'butang #tambah-pendidikan wujud');
ok(!!el('kosongkan'), 'butang #kosongkan wujud');
ok(!!el('resume'), 'bekas pratonton #resume wujud');
ok(d.querySelectorAll('#senarai-pengalaman .baris').length === 1, 'bermula dengan 1 baris pengalaman');
ok(d.querySelectorAll('#senarai-pendidikan .baris').length === 1, 'bermula dengan 1 baris pendidikan');

console.log('== 3. Ralat bila Nama/Telefon kosong ==');
printCalls = 0;
el('jana').click();
ok(el('log').textContent.includes('Sila isi Nama dan Nombor Telefon'), 'mesej ralat dipaparkan');
ok(printCalls === 0, 'PDF tidak dijana bila data wajib kosong');

console.log('== 4. Isi borang -> pratonton hidup ==');
el('nama').value = 'Ahmad bin Ali';
el('telefon').value = '012-3456789';
el('emel').value = 'ahmad@gmail.com';
el('lokasi').value = 'Kemaman, Terengganu';
el('jawatan').value = 'Junior Quantity Surveyor';
el('ringkasan').value = 'Graduan Ukur Bahan dengan 2 tahun pengalaman dalam projek perumahan.';
isi('#senarai-pengalaman .baris:nth-child(1) .p-jawatan', 'Quantity Surveyor');
isi('#senarai-pengalaman .baris:nth-child(1) .p-syarikat', 'EPH Construction Sdn Bhd');
isi('#senarai-pengalaman .baris:nth-child(1) .p-tempoh', 'Mac 2024 - Kini');
isi('#senarai-pengalaman .baris:nth-child(1) .p-poin', 'Sediakan BQ 3 projek perumahan\nSemak tuntutan kontraktor');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
let r = resume();
ok(r.includes('Ahmad bin Ali'), 'nama masuk pratonton');
ok(r.includes('012-3456789') && r.includes('ahmad@gmail.com') && r.includes('Kemaman'), 'kontak masuk pratonton');
ok(r.includes('Junior Quantity Surveyor'), 'jawatan disasarkan masuk pratonton');
ok(r.includes('Graduan Ukur Bahan'), 'ringkasan masuk pratonton');
ok(r.includes('EPH Construction Sdn Bhd'), 'syarikat masuk pratonton');
ok(r.includes('Mac 2024 - Kini'), 'tempoh masuk pratonton');
ok(d.querySelectorAll('#resume ul li').length === 2, '2 poin pengalaman jadi 2 <li>');

console.log('== 5. Tambah / padam baris berulang ==');
el('tambah-pengalaman').click();
ok(d.querySelectorAll('#senarai-pengalaman .baris').length === 2, 'baris pengalaman jadi 2 selepas Tambah');
isi('#senarai-pengalaman .baris:nth-child(2) .p-jawatan', 'Pembantu Ukur');
isi('#senarai-pengalaman .baris:nth-child(2) .p-syarikat', 'Syarikat ABC');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
r = resume();
ok(r.includes('Pembantu Ukur') && r.includes('Syarikat ABC'), 'pengalaman kedua masuk pratonton');
ok(el('log').textContent.includes('2 pengalaman'), 'kiraan hidup tunjuk 2 pengalaman');

el('tambah-pendidikan').click();
ok(d.querySelectorAll('#senarai-pendidikan .baris').length === 2, 'baris pendidikan jadi 2');
isi('#senarai-pendidikan .baris:nth-child(1) .d-kelulusan', 'Sarjana Muda Ukur Bahan');
isi('#senarai-pendidikan .baris:nth-child(1) .d-institusi', 'UiTM Shah Alam');
isi('#senarai-pendidikan .baris:nth-child(1) .d-tahun', '2021 - 2024');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(resume().includes('Sarjana Muda Ukur Bahan'), 'pendidikan masuk pratonton');
ok(el('log').textContent.includes('1 pendidikan'), 'baris pendidikan kosong ditapis dari kiraan');

el('kosongkan').click();
ok(d.querySelectorAll('#senarai-pengalaman .baris').length === 0, 'Kosongkan buang semua baris pengalaman');
ok(resume().includes('Nama Anda'), 'pratonton kembali ke tempat letak');

console.log('== 6. Kemahiran + keselamatan ==');
el('tambah-pengalaman').click();
isi('#senarai-pengalaman .baris:nth-child(1) .p-jawatan', 'QS');
el('kemahiran').value = 'AutoCAD, BQ, MS Excel, BIM';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(d.querySelectorAll('#resume .chip').length === 4, '4 kemahiran jadi 4 chip');
el('nama').value = '<b>Ali</b>';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(el('resume').querySelector('b') === null, 'input HTML di-escape (tiada <b> dijana)');
ok(resume().includes('<b>Ali</b>'), 'teks HTML dipaparkan sebagai teks biasa');

console.log('== 7. Jana PDF dengan data lengkap ==');
el('nama').value = 'Ahmad bin Ali';
el('telefon').value = '012-3456789';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
printCalls = 0;
el('jana').click();
ok(printCalls === 1, 'window.print() dipanggil sekali');
ok(resume().includes('Ahmad bin Ali') && resume().includes('AutoCAD'), 'kandungan resume lengkap ketika cetak');

console.log('== 8. Simpan automatik (localStorage) ==');
let simpan = null;
try { simpan = w.localStorage.getItem('resume-mv-v1'); } catch (e) { simpan = null; }
if (simpan) {
  const obj = JSON.parse(simpan);
  ok(obj.nama === 'Ahmad bin Ali', 'nama tersimpan');
  ok(Array.isArray(obj.pengalaman) && obj.pengalaman.length === 1, 'pengalaman tersimpan (1 rekod)');
  ok(obj.kemahiran.includes('AutoCAD'), 'kemahiran tersimpan');
} else { skip_('localStorage tidak tersedia dalam jsdom ini'); }

console.log('== 10. Pesanan WhatsApp + Mod Penjual ==');
// tetapkan data yang diketahui supaya ujian bulat (kod -> pulih) benar-benar berisi
el('jawatan').value = 'Junior Quantity Surveyor';
el('kemahiran').value = 'AutoCAD, BQ';
isi('#senarai-pengalaman .baris:nth-child(1) .p-syarikat', 'EPH Construction Sdn Bhd');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(!!el('wa') && !!el('panel-pesanan'), 'panel pesanan + pautan #wa wujud');
ok(el('wa').href.startsWith('https://wa.me/'), 'pautan guna wa.me');
const hrefWa = decodeURIComponent(el('wa').href);
ok(hrefWa.includes('RM29.90'), 'harga masuk mesej WhatsApp');
ok(hrefWa.includes('Ahmad bin Ali'), 'nama pelanggan masuk mesej WhatsApp');
const bahagian = hrefWa.split('Kod resume saya');
const kod = bahagian.length > 1 ? bahagian[1].split('\n').pop().trim() : '';
ok(kod.length > 20 && /^[A-Za-z0-9_-]+$/.test(kod), 'kod resume dihantar (selamat URL)');
ok(d.querySelectorAll('#cap-air span').length > 0, 'tanda air dipaparkan kepada pelanggan');
ok(d.body.classList.contains('mod-penjual') === false, 'pelanggan bukan dalam mod penjual');
ok(el('panel-pesanan').hidden === false, 'panel pesanan kelihatan kepada pelanggan');
ok(el('mod-penjual').hidden === true, 'panel mod penjual tersembunyi daripada pelanggan');
ok(el('harga').textContent === '29.90', 'harga dipaparkan pada panel pesanan');
console.log('  INFO  pautan yang dibuka bila pelanggan tekan butang:');
console.log('        https://wa.me/' + (el('wa').href.split('wa.me/')[1] || '').split('?')[0]);
console.log('  INFO  mesej yang anda akan terima:');
el('wa').href.split('?text=')[1].replace(/^/, '').split('\n').forEach(function (l) {
  console.log('        ' + decodeURIComponent(l).slice(0, 90));
});

// buka kod rosak
el('kod-masuk').value = 'ini-bukan-kod-sah';
el('buka-kod').click();
ok(el('log').textContent.includes('tidak sah'), 'kod rosak ditolak dengan mesej jelas');

// mod penjual melalui URL #kod=...
const st = { print: 0 };
const dom2 = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://alexander751.github.io/Resume-builder-mv/#kod=' + kod,
  beforeParse(w) { w.print = () => { st.print++; }; w.confirm = () => true; }
});
const d2doc = dom2.window.document;
ok(d2doc.getElementById('nama').value === 'Ahmad bin Ali', 'kod memulihkan nama pelanggan');
ok(d2doc.querySelectorAll('#senarai-pengalaman .baris').length === 1, 'kod memulihkan 1 baris pengalaman');
ok(d2doc.getElementById('resume').textContent.includes('EPH Construction Sdn Bhd'), 'resume penuh dipulihkan dari kod');
ok(d2doc.querySelectorAll('#cap-air span').length === 0, 'mod penjual: TIADA tanda air');
ok(dom2.window.document.body.classList.contains('mod-penjual'), 'badge MOD PENJUAL aktif');
ok(d2doc.getElementById('mod-penjual').hidden === false, 'panel mod penjual dibuka untuk penjual');
ok(d2doc.getElementById('panel-pesanan').hidden === true, 'panel pesanan disembunyikan untuk penjual');

// mod penjual melalui #penjual
const dom3 = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://alexander751.github.io/Resume-builder-mv/#penjual',
  beforeParse(w) { w.print = () => {}; w.confirm = () => true; }
});
ok(dom3.window.document.getElementById('mod-penjual').hidden === false, '#penjual membuka panel mod penjual');
ok(dom3.window.document.querySelectorAll('#cap-air span').length === 0, '#penjual mematikan tanda air');

// mod penjual melalui ketukan pada tajuk (jalan telefon)
const dom4 = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://alexander751.github.io/Resume-builder-mv/',
  beforeParse(w) { w.print = () => {}; w.confirm = () => true; }
});
const d4 = dom4.window.document;
for (let i = 0; i < 4; i++) d4.getElementById('tajuk').click();
ok(d4.body.classList.contains('mod-penjual') === false, '4 ketukan belum cukup untuk hidupkan mod penjual');
ok(d4.querySelectorAll('#cap-air span').length > 0, 'selepas 4 ketukan tanda air masih ada');
for (let i = 0; i < 1; i++) d4.getElementById('tajuk').click();
ok(d4.body.classList.contains('mod-penjual'), 'ketukan ke-5 menghidupkan mod penjual');
ok(d4.querySelectorAll('#cap-air span').length === 0, 'ketukan ke-5 membuang tanda air');
ok(d4.getElementById('mod-penjual').hidden === false, 'ketukan ke-5 membuka panel mod penjual');
ok(d4.getElementById('panel-pesanan').hidden === true, 'ketukan ke-5 menyembunyikan panel pesanan');

console.log('== 12. Templat Biru & Kelabu ==');
// pastikan data lengkap supaya semua bahagian templat benar-benar diuji
el('emel').value = 'ahmad@gmail.com';
el('lokasi').value = 'Kemaman, Terengganu';
el('ringkasan').value = 'Graduan Ukur Bahan dengan 2 tahun pengalaman dalam projek perumahan.';
isi('#senarai-pengalaman .baris:nth-child(1) .p-poin', 'Sediakan BQ 3 projek\nSemak tuntutan kontraktor');
el('tambah-pendidikan').click();
isi('#senarai-pendidikan .baris:nth-child(1) .d-kelulusan', 'Sarjana Muda Ukur Bahan');
isi('#senarai-pendidikan .baris:nth-child(1) .d-institusi', 'UiTM Shah Alam');
isi('#senarai-pendidikan .baris:nth-child(1) .d-tahun', '2021 - 2024');
ok(!!el('templat'), 'pemilih #templat wujud');
ok(!!d.querySelector('#resume .cv-klasik'), 'pembalut .cv-klasik dirender pada templat klasik');
el('bahasa').value = 'Bahasa Melayu (Fasih), English (Fluent)';
el('rujukan').value = 'En. Ahmad — Pengurus Projek, EPH Construction';
el('templat').value = 'biru';
el('borang').dispatchEvent(new w.Event('change', { bubbles: true }));
const biru = d.querySelector('#resume .cv-biru');
ok(!!biru, 'templat biru dirender');
ok(d.querySelector('#resume .cv-klasik') === null, 'pembalut klasik tiada bila templat biru');
ok(d.querySelector('#resume .cvb-nama h1').textContent.includes('Ahmad bin Ali'), 'nama di dalam banner biru');
ok(biru.className.includes('tanpa-foto'), 'kelas tanpa-foto bila tiada foto');
const kiriTeks = d.querySelector('#resume .cvb-kiri').textContent;
const kananTeks = d.querySelector('#resume .cvb-kanan').textContent;
ok(kiriTeks.includes('Kontak') && kiriTeks.includes('Kemahiran') && kiriTeks.includes('Bahasa'),
   'rel kiri ada Kontak, Kemahiran, Bahasa');
ok(kananTeks.includes('Profil') && kananTeks.includes('Pengalaman Kerja') &&
   kananTeks.includes('Pendidikan') && kananTeks.includes('Rujukan'),
   'lajur kanan ada Profil, Pengalaman, Pendidikan, Rujukan');
ok(kiriTeks.includes('Bahasa Melayu (Fasih)'), 'bahasa masuk rel kiri');
ok(kananTeks.includes('EPH Construction'), 'pengalaman + rujukan masuk lajur kanan');
ok(d.querySelectorAll('#resume .cvb-ikon').length === 3, '3 ikon kontak dirender (telefon, emel, lokasi)');
ok(d.querySelectorAll('#resume .cvb-kontak li').length === 3, '3 baris kontak (telefon, emel, lokasi)');
ok(d.querySelectorAll('#resume .cvb-titik li').length === 4, 'kemahiran + bahasa jadi 4 titik rel');
ok(d.querySelectorAll('#resume .cvb-bullet li').length === 2, '2 poin pengalaman jadi bullet di lajur kanan');

// templat mesti ikut dalam kod pesanan
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
const kodBiru = decodeURIComponent(el('wa').href).split('Kod resume saya')[1].split('\n').pop().trim();
const dom6 = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://alexander751.github.io/Resume-builder-mv/#kod=' + kodBiru,
  beforeParse(w2) { w2.print = () => {}; w2.confirm = () => true; }
});
ok(dom6.window.document.getElementById('templat').value === 'biru', 'templat dipulihkan dari kod pesanan');
ok(!!dom6.window.document.querySelector('#resume .cv-biru'), 'kod memulihkan paparan templat biru');
ok(dom6.window.document.querySelector('#resume .cvb-kiri').textContent.includes('English (Fluent)'),
   'bahasa dipulihkan dari kod');

console.log('== 11. Semakan statik pada HTML ==');
ok(html.includes('@page { size: A4'), 'ada tetapan cetak A4 (@page size A4)');
ok(/@media print/.test(html), 'ada @media print');
ok(html.includes('page-break-inside: avoid'), 'ada kawalan pecah halaman untuk item');
const dirujuk = [...html.matchAll(/el\('([^']+)'\)/g)].map(m => m[1]);
const ditakrif = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const hilang = [...new Set(dirujuk)].filter(id => !ditakrif.includes(id));
ok(hilang.length === 0, 'setiap el(\'...\') ada padanan id= dalam HTML' + (hilang.length ? ' -> hilang: ' + hilang.join(', ') : ''));
const waNo = (html.match(/NOMBOR_WA\s*=\s*'([^']+)'/) || [])[1] || '';
ok(/^60\d{9,10}$/.test(waNo), 'NOMBOR_WA format antarabangsa sah (60..., tiada + atau -)');
ok(waNo !== '60123456789', 'NOMBOR_WA bukan nombor contoh lagi');
ok(html.includes('body.mod-penjual .cap-air'), 'CSS mematikan tanda air dalam mod penjual');
ok(/@media print[\s\S]*form, #log[\s\S]*display: none/.test(html), 'borang disembunyikan semasa cetak');
ok(/@media print[\s\S]*#resume \.cv-biru \{ min-height: calc\(297mm - 1px\)/.test(html),
   'cetak: templat dua lajur dipaksa penuh satu halaman A4 (rel kelabu sampai bawah)');

console.log('== 13. Muat naik foto (Image + kanvas dipalsukan) ==');
(async () => {
  class FakeImage {
    constructor() { this.width = 600; this.height = 400; this.onload = null; this.onerror = null; }
    set src(v) { const self = this; setTimeout(() => { if (self.onload) self.onload(); }, 0); }
    get src() { return 'palsu'; }
  }
  const dom7 = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://alexander751.github.io/Resume-builder-mv/',
    beforeParse(w7) {
      w7.print = () => {};
      w7.confirm = () => true;
      try { w7.Image = FakeImage; } catch (e) { /* jatuh ke defineProperty */ }
      if (w7.Image !== FakeImage) Object.defineProperty(w7, 'Image', { value: FakeImage, configurable: true });
      w7.HTMLCanvasElement.prototype.getContext = function () { return { drawImage: function () {} }; };
      w7.HTMLCanvasElement.prototype.toDataURL = function () { return 'data:image/jpeg;base64,FOTOUJIAN'; };
    }
  });
  const w7 = dom7.window, d7 = w7.document;
  ok(w7.Image === FakeImage, 'palsuan Image dipasang untuk ujian ini');
  ok(d7.getElementById('foto').type === 'file', 'input #foto ialah type=file');

  const input = d7.getElementById('foto');
  const failFoto = new w7.File([new Uint8Array([1, 2, 3, 4])], 'foto.png', { type: 'image/png' });
  Object.defineProperty(input, 'files', { value: [failFoto], configurable: true });
  input.dispatchEvent(new w7.Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 80));

  d7.getElementById('templat').value = 'biru';
  d7.getElementById('borang').dispatchEvent(new w7.Event('change', { bubbles: true }));
  const img = d7.querySelector('#resume .cvb-foto img');
  ok(img !== null, 'foto dirender dalam banner templat biru');
  ok(img && img.getAttribute('src') === 'data:image/jpeg;base64,FOTOUJIAN', 'foto dikecilkan melalui kanvas dahulu');
  ok(!d7.querySelector('#resume .cv-biru').className.includes('tanpa-foto'), 'kelas tanpa-foto dibuang bila ada foto');
  ok(d7.getElementById('foto-info').textContent.indexOf('OK') === 0, 'status foto menunjukkan berjaya');

  d7.getElementById('nama').value = 'Ujian Foto';
  d7.getElementById('telefon').value = '0123456789';
  d7.getElementById('borang').dispatchEvent(new w7.Event('input', { bubbles: true }));
  const href7 = decodeURIComponent(d7.getElementById('wa').href);
  ok(href7.indexOf('FOTOUJIAN') === -1, 'foto TIDAK dimasukkan ke dalam kod pesanan WhatsApp');
  ok(d7.getElementById('wa').href.length < 3000, 'pautan WhatsApp kekal pendek (' + d7.getElementById('wa').href.length + ' aksara)');

  d7.getElementById('buang-foto').click();
  ok(d7.querySelector('#resume .cvb-foto') === null, 'butang Buang foto mengeluarkan foto dari pratonton');
  ok(d7.querySelector('#resume .cv-biru').className.includes('tanpa-foto'), 'kelas tanpa-foto kembali selepas buang');

  console.log('\n' + pass + ' lulus, ' + fail + ' gagal, ' + skip + ' dilangkau');
  process.exit(fail ? 1 : 0);
})();
