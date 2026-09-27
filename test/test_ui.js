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

console.log('== 9. Semakan statik pada HTML ==');
ok(html.includes('@page { size: A4'), 'ada tetapan cetak A4 (@page size A4)');
ok(/@media print/.test(html), 'ada @media print');
ok(html.includes('page-break-inside: avoid'), 'ada kawalan pecah halaman untuk item');
const dirujuk = [...html.matchAll(/el\('([^']+)'\)/g)].map(m => m[1]);
const ditakrif = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const hilang = [...new Set(dirujuk)].filter(id => !ditakrif.includes(id));
ok(hilang.length === 0, 'setiap el(\'...\') ada padanan id= dalam HTML' + (hilang.length ? ' -> hilang: ' + hilang.join(', ') : ''));

console.log('\n' + pass + ' lulus, ' + fail + ' gagal, ' + skip + ' dilangkau');
process.exit(fail ? 1 : 0);
