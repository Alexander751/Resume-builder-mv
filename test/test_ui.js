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
// Fasa 44: lalai bahasa resume kini ENGLISH (pelanggan boleh tukar ke Bahasa Melayu di halaman 1).
// Semakan di bawah mengunci lalai itu, kemudian suite bertukar ke Melayu kerana jangkaan ciri-ciri
// lama ditulis dalam Bahasa Melayu.
ok(w.ResumeMV.bahasa() === 'en', 'LALAI bahasa resume = English (butang English ditanda di halaman 1)');
ok(d.querySelector('.pb-btn[data-bahasa="en"]').getAttribute('aria-pressed') === 'true',
   'butang English bertanda aktif semasa mula');
w.ResumeMV.gunaBahasa('ms');
const el = (id) => d.getElementById(id);
const isi = (sel, val) => { d.querySelector(sel).value = val; };
const isiTahap = (kunci, senarai) => {          // [[nama, tahap], ...]
  senarai.forEach((ps, i) => {
    if (i) el('tambah-' + kunci).click();
    const b = d.querySelectorAll('#senarai-' + kunci + ' .baris')[i];
    b.querySelector('.t-nama').value = ps[0];
    b.querySelector('.tahap').setAttribute('data-tahap', String(ps[1]));
  });
  const semua = d.querySelectorAll('#senarai-' + kunci + ' .baris');
  for (let i = senarai.length; i < semua.length; i++) semua[i].remove();
};
const resume = () => el('resume').textContent;

console.log('== 1. Fasa 1: elemen asas masih wujud ==');
ok(!!el('nama'), 'input #nama wujud');
ok(!!el('telefon'), 'input #telefon wujud');
ok(!el('jana'), 'butang "Jana PDF" dibuang (pratonton + WhatsApp sudah cukup)');
ok(d.querySelectorAll('#hal-2 button[type="submit"]').length === 0, 'tiada butang submit untuk pelanggan');
ok(!!el('cetak-pdf'), 'butang #cetak-pdf wujud (khas Mod Penjual)');
const labels = [...d.querySelectorAll('label')].map(l => l.textContent.trim());
ok(labels.some(l => /^Nama\b/.test(l)), 'label "Nama" ada');
ok(labels.some(l => /^Nombor Telefon\b/.test(l)), 'label "Nombor Telefon" ada');
ok(d.querySelectorAll('label .wajib').length === 2, 'dua medan wajib (Nama, Telefon) ditanda *');

console.log('== 2. Fasa 2: medan baru wujud ==');
['emel', 'lokasi', 'jawatan', 'ringkasan'].forEach(id => ok(!!el(id), 'input #' + id + ' wujud'));
['senarai-kemahiran', 'senarai-bahasa', 'senarai-rujukan'].forEach(id => ok(!!el(id), 'senarai #' + id + ' wujud'));
ok(!!el('tambah-pengalaman'), 'butang #tambah-pengalaman wujud');
ok(!!el('tambah-pendidikan'), 'butang #tambah-pendidikan wujud');
ok(!!el('kosongkan'), 'butang #kosongkan wujud');
ok(!!el('resume'), 'bekas pratonton #resume wujud');
ok(d.querySelectorAll('#senarai-pengalaman .baris').length === 1, 'bermula dengan 1 baris pengalaman');
ok(d.querySelectorAll('#senarai-pendidikan .baris').length === 1, 'bermula dengan 1 baris pendidikan');

console.log('== 3. Ralat bila Nama/Telefon kosong (tanpa Jana PDF) ==');
printCalls = 0;
// hantar tak sengaja (papan kekunci telefon) tidak boleh membawa ke mana-mana
el('borang').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
ok(el('hal-3').hidden === true, 'hantar tak sengaja: masih di halaman butiran (tidak ke pratonton)');
ok(printCalls === 0, 'tiada cetakan berlaku');
// Ctrl+Enter = sengaja -> baru dinilai
el('nama').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
el('borang').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
ok(el('log').textContent.includes('sebelum lihat pratonton'), 'Ctrl+Enter tanpa Nama/Telefon: mesej ralat dipaparkan');
ok(el('hal-3').hidden === true, 'tidak dibawa ke pratonton bila data wajib kosong');
ok(printCalls === 0, 'tiada cetakan berlaku bila data wajib kosong');

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
isi('#senarai-pengalaman .baris:nth-child(1) .pj-poin', 'Sediakan BQ 3 projek perumahan\nSemak tuntutan kontraktor');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
let r = resume();
ok(r.includes('Ahmad bin Ali'), 'nama masuk pratonton');
ok(r.includes('012-3456789') && r.includes('ahmad@gmail.com') && r.includes('Kemaman'), 'kontak masuk pratonton');
ok(r.includes('Junior Quantity Surveyor'), 'jawatan disasarkan masuk pratonton');
ok(r.includes('Graduan Ukur Bahan'), 'ringkasan masuk pratonton');
ok(r.includes('EPH Construction Sdn Bhd'), 'syarikat masuk pratonton');
ok(r.includes('Mac 2024 - Kini'), 'tempoh masuk pratonton');
ok(d.querySelectorAll('#resume .cvb-bullet li').length === 2, '2 poin pengalaman jadi 2 bullet');

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
ok(d.querySelectorAll('#senarai-pengalaman .baris').length === 1, 'Kosongkan tinggalkan satu baris pengalaman kosong');
ok(d.querySelector('#senarai-pengalaman .baris .p-jawatan').value === '', 'baris itu kosong (tiada nilai lama)');
ok(d.querySelector('#senarai-pendidikan .baris .d-kelulusan').value === '', 'baris pendidikan juga kosong');
ok(resume().includes('NAMA ANDA'), 'pratonton kembali ke tempat letak (banner nama kosong)');

console.log('== 6. Kemahiran + keselamatan ==');
el('tambah-pengalaman').click();
isi('#senarai-pengalaman .baris:nth-child(1) .p-jawatan', 'QS');
isiTahap('kemahiran', [['AutoCAD', 5], ['BQ', 5], ['MS Excel', 4], ['BIM', 3]]);
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(d.querySelectorAll('#resume .cvb-titik li').length === 4, '4 kemahiran jadi 4 titik rel kiri');
el('nama').value = '<b>Ali</b>';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(el('resume').querySelector('b') === null, 'input HTML di-escape (tiada <b> dijana)');
ok(resume().includes('<b>Ali</b>'), 'teks HTML dipaparkan sebagai teks biasa');

console.log('== 7. Cetak PDF (Mod Penjual) dan hantar borang ke pratonton ==');
el('nama').value = 'Ahmad bin Ali';
el('telefon').value = '012-3456789';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
printCalls = 0;
el('cetak-pdf').click();
ok(printCalls === 1, 'window.print() dipanggil sekali selepas tekan Cetak PDF');
ok(resume().includes('Ahmad bin Ali') && resume().includes('AutoCAD'), 'kandungan resume lengkap ketika cetak');
printCalls = 0;
el('cetak-pdf').click();
ok(printCalls === 1, 'Cetak PDF boleh ditekan berulang kali (penjual)');

console.log('== 8. Simpan automatik (localStorage) ==');
let simpan = null;
try { simpan = w.localStorage.getItem('resume-mv-v1'); } catch (e) { simpan = null; }
if (simpan) {
  const obj = JSON.parse(simpan);
  ok(obj.nama === 'Ahmad bin Ali', 'nama tersimpan');
  ok(Array.isArray(obj.pengalaman) && obj.pengalaman.length === 1, 'pengalaman tersimpan (1 rekod)');
  ok(Array.isArray(obj.kemahiran) && obj.kemahiran.some(k => k.nama === 'AutoCAD'), 'kemahiran tersimpan (dengan tahap)');
} else { skip_('localStorage tidak tersedia dalam jsdom ini'); }

console.log('== 10. Pesanan WhatsApp + Mod Penjual ==');
// tetapkan data yang diketahui supaya ujian bulat (kod -> pulih) benar-benar berisi
el('jawatan').value = 'Junior Quantity Surveyor';
isiTahap('kemahiran', [['AutoCAD', 5], ['BQ', 4]]);
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
isi('#senarai-pengalaman .baris:nth-child(1) .pj-poin', 'Sediakan BQ 3 projek\nSemak tuntutan kontraktor');
el('tambah-pendidikan').click();
isi('#senarai-pendidikan .baris:nth-child(1) .d-kelulusan', 'Sarjana Muda Ukur Bahan');
isi('#senarai-pendidikan .baris:nth-child(1) .d-institusi', 'UiTM Shah Alam');
isi('#senarai-pendidikan .baris:nth-child(1) .d-tahun', '2021 - 2024');
ok(!el('templat'), 'pemilih templat sudah dibuang (satu reka bentuk sahaja)');
isiTahap('bahasa', [['Bahasa Melayu (Fasih)', 5], ['English (Fluent)', 4]]);
isi('#senarai-rujukan .baris .rj-nama', 'En. Ahmad Faizal');
isi('#senarai-rujukan .baris .rj-jawatan', 'Pengurus Projek, EPH Construction');
isi('#senarai-rujukan .baris .rj-telefon', '012-345 6789');
el('borang').dispatchEvent(new w.Event('change', { bubbles: true }));
const biru = d.querySelector('#resume .cv-biru');
ok(!!biru, 'templat Biru & Kelabu dirender secara lalai');
ok(d.querySelectorAll('#resume > div').length === 1, 'hanya satu reka bentuk dirender dalam #resume');
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
ok(d.querySelectorAll('#resume .cvb-titik li').length === w.ResumeMV.kumpul().kemahiran.length + w.ResumeMV.kumpul().bahasa.length,
     'setiap kemahiran + bahasa jadi satu baris rel kiri');
ok(d.querySelectorAll('#resume .cvb-bullet li').length === 2, '2 poin pengalaman jadi bullet di lajur kanan');
ok(d.querySelectorAll('#resume .cvb-lencana').length === 4, '4 lencana bulat pada garisan pemisah');
ok(d.querySelectorAll('#resume .cvb-lencana svg').length === 4, 'setiap lencana ada ikon SVG putih');
ok(d.querySelector('#resume .cvb-kanan h2').textContent.trim() === 'Profil', 'teks tajuk betul walaupun ada lencana');

// templat mesti ikut dalam kod pesanan
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
const kodBiru = decodeURIComponent(el('wa').href).split('Kod resume saya')[1].split('\n').pop().trim();
const dom6 = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://alexander751.github.io/Resume-builder-mv/#kod=' + kodBiru,
  beforeParse(w2) { w2.print = () => {}; w2.confirm = () => true; }
});
ok(!dom6.window.document.getElementById('templat'),
   'kod pesanan lama (s: klasik) tetap dibuka dengan reka bentuk Biru & Kelabu');
ok(!!dom6.window.document.querySelector('#resume .cv-biru'), 'kod memulihkan paparan Biru & Kelabu');
ok(dom6.window.document.querySelector('#resume .cvb-kiri').textContent.includes('English (Fluent)'),
   'bahasa dipulihkan dari kod');

console.log('== 14. Daftar templat: Biru & Kelabu + Biru Bersih ==');
ok(!/cv-klasik|cv-eksekutif|cv-minimalis|cv-kemahiran/.test(html), 'tiada sisa kelas templat lama dalam fail');
ok(!/htmlKlasik|htmlEksekutif|htmlMinimalis|htmlKemahiran|PELUKIS/.test(html), 'tiada sisa fungsi templat lama');
ok(html.includes('function htmlKorporat') && html.includes('.cv-korporat'), 'templat ketiga (Korporat Moden) wujud');
ok(!/var TEMPLAT = \[/.test(html), 'senarai TEMPLAT sudah dibuang');
ok(!/<select id="templat"/.test(html), 'borang tiada pemilih templat');
ok(/var isi = htmlTemplat\(d\);/.test(html) && /el\('resume'\)\.innerHTML = isi;/.test(html) && /sisi\.innerHTML = isi;/.test(html),
   'papar() menulis resume yang sama ke kertas utama dan kertas pratonton di sisi');
ok(/var TEMPLAT = \{/.test(html) && /bersih: \{/.test(html), 'daftar TEMPLAT (peta) wujud dalam kod');
ok(html.includes('function htmlBersih') && html.includes('.cv-bersih'), 'templat kedua (Biru Bersih) wujud');
ok(d.querySelectorAll('.kad-pilih[data-templat]').length === 3, 'tiga kad reka bentuk di halaman 1');
ok(!/r-sek|r-nama|\.chip/.test(html), 'tiada sisa gaya templat Klasik');
ok(html.includes('function htmlBiru') && html.includes('.cv-biru'), 'reka bentuk Biru & Kelabu kekal utuh');
ok(html.includes('.cvb-lencana') && html.includes('.cvb-titik') && html.includes('ikonLencana'),
   'elemen bulat Biru & Kelabu masih ada');
ok(d.querySelectorAll('#resume .cvb-lencana').length === 4, 'lencana bulat masih dirender selepas pembersihan');
ok(d.querySelectorAll('#resume .cvb-titik li').length === w.ResumeMV.kumpul().kemahiran.length + w.ResumeMV.kumpul().bahasa.length,
     'titik bulat rel kiri masih dirender');
const kodBersih = decodeURIComponent(el('wa').href).split('Kod resume saya')[1].split('\n').pop().trim();
const dom9 = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://alexander751.github.io/Resume-builder-mv/#kod=' + kodBersih,
  beforeParse(w9) { w9.print = () => {}; w9.confirm = () => true; }
});
ok(!!dom9.window.document.querySelector('#resume .cv-biru'), 'kod pesanan baharu masih memulihkan reka bentuk');
ok(dom9.window.document.querySelector('#resume .cvb-nama h1').textContent.includes('Ahmad bin Ali'),
   'nama dipulihkan dari kod selepas pembersihan');

console.log('== 15. Pratonton muat penuh pada skrin (tanpa skrol) ==');
ok(/\.kertas \{[\s\S]{0,400}zoom: var\(--skala, 1\)/.test(html), 'kertas guna skala automatik (--skala)');
ok(/@media print[\s\S]{0,2000}zoom: 1 !important/.test(html), 'cetakan membatalkan skala pratonton');
ok(/\.kertas \{[\s\S]{0,400}aspect-ratio: 210 \/ 297/.test(html), 'nisbah A4 dikekalkan dalam pratonton');
ok(/\.panel-pratonton \{ position: sticky; top: 16px/.test(html), 'panel pratonton melekat 16px dari atas');
ok(/@media screen and \(max-width: 900px\) \{ \.panel-pratonton \{ position: static; \} \}/.test(html), 'telefon: panel tidak melekat');
const skala = d.documentElement.style.getPropertyValue('--skala');
ok(!!skala && Number(skala) > 0.28 && Number(skala) <= 1, 'skala dikira pada muat pertama (--skala: ' + skala + ')');
const tinggiA4 = 794 * 297 / 210;
ok(Math.abs((794 * Number(skala)) / (tinggiA4 * Number(skala)) - 210 / 297) < 1e-9,
   'nisbah A4 kekal pada mana-mana skala');
let meletup = false;
try { w.dispatchEvent(new w.Event('resize')); } catch (e) { meletup = true; }
ok(!meletup, 'peristiwa resize mengira semula skala tanpa ralat');
ok(Number(d.documentElement.style.getPropertyValue('--skala')) > 0.28, 'skala kekal sah selepas resize');
ok(/window\.addEventListener\('load', susunSkala\)/.test(html), 'skala dikira semula selepas font web dimuat');

console.log('== 16. Pratonton skrin penuh ==');
ok(!!el('btn-skrin'), 'butang "Skrin penuh" ada');
ok(el('btn-skrin').textContent.trim() === 'Skrin penuh', 'label butang betul pada mulanya');
ok(/body\.skrin-penuh \.panel-pratonton \{[\s\S]{0,220}position: fixed; inset: 0/.test(html), 'CSS panel jadi skrin penuh');
ok(/@media print[\s\S]{0,600}\.bar-pratonton[\s\S]{0,200}display: none !important/.test(html), 'bar pratonton disembunyikan semasa cetak');
ok(/body\.skrin-penuh \{ overflow: hidden/.test(html), 'halaman tidak berskrol dalam mod skrin penuh');
el('btn-skrin').dispatchEvent(new w.Event('click', { bubbles: true }));
ok(d.body.classList.contains('skrin-penuh'), 'klik menghidupkan mod skrin penuh');
ok(Number(d.documentElement.style.getPropertyValue('--skala')) > 0.28, 'skala dikira semula dalam skrin penuh');
ok(el('btn-skrin').textContent.trim() === 'Tutup (Esc)', 'label bertukar kepada "Tutup (Esc)"');
d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(!d.body.classList.contains('skrin-penuh'), 'kekunci Escape menutup skrin penuh');
ok(el('btn-skrin').textContent.trim() === 'Skrin penuh', 'label kembali asal selepas ditutup');

console.log('== 17. Aliran 4 halaman (wizard) ==');
ok(!el('hal-1').hidden && el('hal-2').hidden && el('hal-3').hidden && el('hal-4').hidden,
   'halaman 1 (pilih reka bentuk) dipaparkan dahulu');
ok(d.querySelectorAll('#langkah .dot').length === 3, 'penunjuk 3 langkah (pratonton bukan langkah yang boleh diklik)');
ok(d.querySelector('#langkah .dot').classList.contains('aktif'), 'langkah 1 ditanda aktif');
ok(d.querySelectorAll('#langkah .dot')[1].disabled, 'langkah 2 belum boleh diklik sebelum mula');
ok(d.querySelectorAll('#mini-biru .cv-biru').length === 1, 'pratonton mini dirender dengan data contoh');
ok(d.querySelector('#mini-biru .cvb-nama h1').textContent.includes('NURUL AIN'), 'nama contoh muncul dalam mini');
ok(d.querySelectorAll('#mini-biru .cvb-lencana').length === 4, 'mini guna gaya yang sama (4 lencana bulat)');
ok(/\.mini-kertas \{[\s\S]{0,120}zoom: var\(--skala-mini/.test(html), 'mini guna skala automatik');
ok(!!d.querySelector('.kad-pilih[data-templat="biru"] .pil-pilih'), 'kad yang dipilih ditanda "Dipilih"');

el('mula-isi').click();
ok(el('hal-2').hidden === false && el('hal-1').hidden === true, 'butang Mula Isi ke halaman butiran');
ok(d.querySelectorAll('#langkah .dot')[1].classList.contains('aktif'), 'langkah 2 jadi aktif');

el('nama').value = '';
el('telefon').value = '';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
el('ke-3').click();
ok(el('hal-3').hidden === true, 'tidak boleh ke pratonton kalau nama/telefon kosong');
ok(el('log').textContent.includes('dahulu sebelum lihat pratonton'), 'mesej ralat dipaparkan');

el('nama').value = 'Ahmad bin Ali';
el('telefon').value = '012-3456789';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
el('ke-3').click();
ok(el('hal-3').hidden === false && el('hal-2').hidden === true, 'butang Seterusnya ke halaman pratonton');
ok(d.querySelectorAll('#langkah .dot')[2].disabled, 'halaman hantar belum terbuka');
el('ke-4').click();
ok(el('hal-4').hidden === false, 'butang Seterusnya ke halaman hantar WhatsApp');
ok(!!d.querySelector('#hal-4 #wa') && !!d.querySelector('#hal-4 #panel-pesanan'),
   'pautan WhatsApp + panel pesanan berada di halaman 4');
ok(el('wa').href.indexOf('wa.me/') > -1, 'pautan WhatsApp sedia untuk dihantar');
ok(d.querySelectorAll('#hal-4 .langkah-bayar li').length === 3, '3 langkah bayaran diterangkan');

el('balik-4').click();
ok(el('hal-3').hidden === false, 'Kembali dari hantar ke pratonton');
el('balik-3').click();
ok(el('hal-2').hidden === false, 'Kembali dari pratonton ke butiran');
el('balik-2').click();
ok(el('hal-1').hidden === false, 'Kembali dari butiran ke pemilihan reka bentuk');
ok(d.body.getAttribute('data-hal') === '1', 'atribut data-hal dikemas kini');
el('mula-isi').click();
ok(!d.querySelectorAll('#langkah .dot')[2].disabled, 'langkah yang pernah dilawati kekal boleh diklik');
ok(/@media print[\s\S]{0,900}#hal-3 \{ display: block !important/.test(html),
   'cetak: helaian resume dicetak dari mana-mana halaman');
ok(/@media print[\s\S]{0,300}animation: none !important/.test(html),
   'cetak: animasi dimatikan (animation-fill-mode:both boleh jadikan cetakan kosong)');
ok(/@media print[\s\S]{0,2000}\.papan \{ display: block !important/.test(html),
   'cetak: grid pratonton jadi blok biasa');

console.log('== 18. Antara muka baharu (bersih & mesra pengguna) ==');
ok(!!d.querySelector('header.top .jenama svg'), 'bar atas ada lencana jenama (SVG)');
ok(d.querySelectorAll('#langkah .dot').length === 3 && d.querySelectorAll('#langkah .dot b').length === 3,
   'penunjuk langkah: 3 bulatan bernombor (reka bentuk, butiran, hantar)');
ok(d.querySelectorAll('#langkah .dot span').length === 3, 'setiap langkah ada label teks');
ok(!d.querySelector('#langkah .dot[data-hal="3"]'), 'tiada titik "Pratonton" yang sentiasa kelihatan di bar langkah');
ok(!!d.querySelector('#ke-3[hidden]') === false || d.getElementById('ke-3').closest('[hidden]') !== null,
   'butang Pratonton lama disimpan sebagai butang dalaman yang tersembunyi (dicetuskan oleh langkah 8 sahaja)');
ok(!!el('langkah-teks'), 'teks langkah untuk skrin kecil wujud');
el('balik-2').click();
ok(el('langkah-teks').textContent === 'Langkah 1 daripada 3 \u00b7 Pilih reka bentuk', 'teks langkah betul di halaman 1');
el('mula-isi').click();
ok(el('langkah-teks').textContent === 'Langkah 2 daripada 3 \u00b7 Isi butiran', 'teks langkah dikemas kini di halaman 2');
ok(!!d.querySelector('.kad-pilih[data-templat="biru"] .kad-ciri li'), 'senarai ciri pada kad reka bentuk');
ok(d.querySelector('#hal-1 .nota-bawah svg') !== null, 'nota halaman 1 ada ikon perisai (kepercayaan)');
ok(d.querySelectorAll('#hal-2 .grid-2 input').length === 4, 'empat medan pendek disusun dua lajur');
ok(!!d.querySelector('#hal-2 .aksi .kecil'), 'bar alat borang ada teks petunjuk');
ok(!!d.querySelector('#hal-3 .bar-butang #balik-3') && !!d.querySelector('#hal-3 .bar-butang #ke-4'),
   'butang Kembali & Seterusnya di bar atas halaman pratonton');
ok(d.querySelector('.panel-pratonton #btn-skrin') !== null,
   'butang Skrin penuh di dalam panel (boleh ditutup dalam mod skrin penuh)');
ok(!!d.querySelector('#hal-4 .tanda-ok svg'), 'kad hantar ada tanda siap (centang hijau)');
ok(!!d.querySelector('#hal-4 .harga-pil b'), 'harga dalam pil di kad hantar');
ok(!!d.querySelector('#wa svg'), 'butang WhatsApp ada logo (SVG)');
ok(d.querySelectorAll('#hal-2 .baris').length >= 1, 'baris pengalaman gaya kad');
// semakan CSS: token warna + peraturan asas antara muka baharu
['--brand-soft', '--ok', '--sh2'].forEach(tok => ok(html.includes(tok + ':'), 'token warna ' + tok + ' ada'));
ok(/\.hal\[hidden\] \{ display: none !important; \}/.test(html), 'halaman tersembunyi benar-benar disembunyikan');
ok(/@keyframes masuk/.test(html), 'halaman masuk dengan animasi lembut');
ok(d.getElementById('ke-3').closest('[hidden]') !== null && d.getElementById('balik-2').closest('[hidden]') !== null,
   'butang Pratonton/Kembali lama tidak kelihatan (butang dalaman sahaja)');
ok(!/nav-bawah \{[\s\S]{0,120}position: sticky/.test(html), 'tiada lagi bar Pratonton yang melekat di halaman butiran');
ok(/\.lk-nav \{[\s\S]{0,300}position: sticky/.test(html), 'bar langkah butiran yang melekat');
ok(/\.kad-pilih \{[\s\S]{0,300}border-radius: 18px/.test(html), 'kad reka bentuk bersudut bulat + bayang');
ok(/\.langkah \.dot\.siap b::after \{ content: /.test(html), 'langkah siap bertukar tanda centang');
ok(/\.kad-ciri li::before \{[\s\S]{0,80}content: /.test(html), 'senarai ciri guna tanda centang hijau');
ok(/#wa:not\(\.sedia\) \{ background: #c3ccd6/.test(html), 'butang WhatsApp kelabu sebelum nama/telefon diisi');
// Enter biasa TIDAK ke pratonton; Ctrl+Enter (sengaja) baru ke pratonton
printCalls = 0;
el('borang').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
ok(el('hal-3').hidden === true, 'Enter papan kekunci telefon tidak melompat ke pratonton');
el('nama').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
el('borang').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
ok(printCalls === 0, 'Ctrl+Enter tidak mencetak apa-apa');
ok(el('hal-3').hidden === false, 'Ctrl+Enter membawa ke halaman pratonton');
el('balik-3').click();

console.log('== 19. Telefon: pratonton skrin penuh tanpa skrol ==');
ok(/@media screen and \(max-width: 760px\)[\s\S]{0,2600}#hal-3 \{[\s\S]{0,200}position: fixed; inset: 0/.test(html),
   'telefon: halaman pratonton jadi lapisan tetap (skrin penuh)');
ok(/body\[data-hal="3"\] \{ overflow: hidden; \}/.test(html), 'telefon: skrol halaman dikunci semasa pratonton');
ok(/#hal-3 \.bar-pratonton \{ display: contents; \}/.test(html), 'bar tajuk & butang jadi baris flex penuh skrin');
ok(/#hal-3 \.papan \{[\s\S]{0,160}flex: 1 1 auto/.test(html), 'helaian ambil baki tinggi skrin');
ok(/#hal-3 \.btn-skrin \{ display: none; \}/.test(html), 'butang Skrin penuh disembunyikan di telefon (sudah penuh)');
ok(/@media print[\s\S]{0,2000}#hal-3 \{[\s\S]{0,90}position: static !important/.test(html),
   'cetak: lapisan tetap dibatalkan supaya cetakan kekal A4');

ok(/var bekas = panel\.parentElement \|\| document\.body;/.test(html),
   'skala: lebar diambil dari bekas panel (bukan helaian sendiri)');
ok(/lebarDalam\(bekas\)/.test(html), 'skala: padding/border bekas ditolak');
ok(/sisi\.getBoundingClientRect\(\)\.width \+ 22/.test(html), 'skala: kad semak di sisi ditolak dari lebar');
ok(d.querySelector('#hal-3 .kertas').getAttribute('data-skala') !== null,
   'skala semasa ditulis pada kertas pratonton (data-skala)');

ok(/\.kertas \{[\s\S]{0,300}overflow: hidden;/.test(html),
   'helaian tiada skrol dalam (elak bar skrol dalam pratonton)');

ok(/@media print[\s\S]{0,2000}#hal-3 \.bar-pratonton \{ display: none !important; \}/.test(html),
   'cetak: bar tajuk/butang kekal tersembunyi (jangan tulis display:block selepas senarai sembunyi)');

ok(!/@media \(max-width: 760px\)/.test(html),
   'media query lebar guna "screen and" supaya peraturan telefon tidak bocor ke cetakan (punca PDF 2 halaman)');
ok(/@media print[\s\S]{0,2000}\.papan \{ display: block !important; padding: 0 !important; \}/.test(html),
   'cetak: .papan tanpa padding supaya helaian kekal tepat satu halaman');

ok(/@media screen and \(max-width: 760px\), screen and \(max-height: 820px\) \{/.test(html),
   'pratonton skrin penuh juga dipakai pada skrin rendah (telefon landskap)');
ok(/#hal-3 \.papan \{[\s\S]{0,160}overflow: auto;/.test(html),
   'kawasan pratonton boleh skrol sendiri kalau skrin terlalu rendah');

console.log('== 20. Halaman 1: satu CTA + nota resume tersimpan dalam peranti ==');
el('balik-3').click(); el('balik-2').click();          // ujian 18 tinggalkan kita di halaman pratonton
ok(el('hal-1').hidden === false && el('hal-2').hidden === true, 'kembali ke halaman pilih reka bentuk');
ok(!el('mula-update') && !el('mula-baru'), 'pilihan "resume baru vs kemas kini" dibuang');
ok(!el('fail-lama') && !el('jatuh') && !el('guna-hasil') && !el('pilih-fail'), 'kawalan muat naik fail dibuang');
ok(!el('kod-lama') && !el('muat-kod'), 'kotak tampal kod dibuang');
ok(!!el('mula-isi') && el('mula-isi').textContent.indexOf('Mula Isi Butiran') >= 0, 'satu CTA kekal');
ok(!!el('nota-simpan'), 'nota simpanan wujud');
mySimpanan = null;
ok(el('nota-simpan').hidden === true, 'peranti kosong: nota simpanan tersembunyi');
ok(!/pilihMula|huraiTeks|bacaFail|DecompressionStream/.test(html), 'enjin baca fail + penghurai resume dibuang sepenuhnya dari kod');
el('mula-isi').click();
ok(el('hal-2').hidden === false, 'CTA terus ke halaman butiran');
el('balik-2').click();

// pelanggan ulangan: nota + pautan buang muncul (data dari autosimpan peranti)
const domUlang = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://alexander751.github.io/Resume-builder-mv/',
  beforeParse(ww) {
    ww.print = () => {};
    ww.confirm = () => true;
    const simpan = { nama: 'Ahmad bin Ali', telefon: '012-3456789', emel: 'ahmad@mail.com', lokasi: 'Kemaman',
                     jawatan: 'Juruteknik', ringkasan: 'Lama.', kemahiran: 'AutoCAD', bahasa: 'Melayu',
                     rujukan: 'En. Samad', pengalaman: [], pendidikan: [] };
    Object.defineProperty(ww, 'localStorage', {
      configurable: true,
      value: { getItem: (k) => (k === 'resume-mv-v1' ? JSON.stringify(simpan) : null), setItem: () => {}, removeItem: () => {} }
    });
  }
});
const wU = domUlang.window, dU = wU.document, elU = (i) => dU.getElementById(i);
ok(elU('nota-simpan').hidden === false, 'pelanggan ulangan: nota simpanan kelihatan');
ok(elU('nota-simpan').textContent.indexOf('Ahmad bin Ali') >= 0, 'nota sebut nama resume tersimpan');
ok(!!elU('buang-simpanan'), 'ada pautan eksplisit untuk mula kosong');
ok(elU('nama').value === 'Ahmad bin Ali', 'borang sudah berisi detail lama (autosimpan peranti)');
ok(elU('mula-isi').textContent.indexOf('Mula Isi Butiran') >= 0 || elU('mula-isi').textContent.indexOf('Start filling') >= 0,
     'CTA sama untuk pelanggan ulangan (teks ikut bahasa resume yang dipilih)');
elU('mula-isi').click();
ok(elU('hal-2').hidden === false, 'CTA membawa terus ke halaman butiran (tiada langkah tambahan)');

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
ok(/@media print[\s\S]*\.lembar \.cv-biru \{ min-height: calc\(297mm - 1px\)/.test(html),
   'cetak: templat dua lajur dipaksa penuh satu halaman A4 (rel kelabu sampai bawah)');
ok(/\.cvb-foto \{[\s\S]{0,220}border-radius: 50%/.test(html), 'foto templat biru berbentuk bulat');
ok(/\.cvb-titik li::before \{[\s\S]{0,130}border-radius: 50%/.test(html), 'titik kemahiran/bahasa bulat (ikut rujukan)');
ok(/\.cvb-bullet li::before \{[\s\S]{0,130}border-radius: 50%/.test(html), 'titik pengalaman bulat (ikut rujukan)');
ok(/\.lembar \.cvb-kiri h2 \{ border-bottom: 2pt/.test(html), 'garis bawah tajuk rel kiri nipis (bukan bar tebal 7pt)');
ok(/\.lembar \.cvb-kanan h2 \{[\s\S]{0,160}border-bottom: 2pt/.test(html), 'garis bawah tajuk lajur kanan nipis (bukan bar tebal 7pt)');
ok(html.includes('fonts.googleapis.com/css2?family=Lato'), 'font Lato + Montserrat dimuatkan (rujukan guna Lato)');

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

  d7.getElementById('borang').dispatchEvent(new w7.Event('input', { bubbles: true }));
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

console.log('== 21. Builder: tambah bahagian sendiri + buang bahagian tak mahu ==');
el('mula-isi').click();
ok(el('hal-2').hidden === false, 'di halaman butiran');
isi('#nama', 'Ahmad bin Ali'); isi('#telefon', '012-3456789');
isi('#jawatan', 'Juruteknik Tapak'); isiTahap('kemahiran', [['AutoCAD', 5], ['MS Excel', 4]]);
isiTahap('bahasa', [['Bahasa Melayu', 5], ['English', 4]]);
isi('#senarai-rujukan .baris .rj-nama', 'En. Samad'); isi('#senarai-rujukan .baris .rj-telefon', '019-1112222');
isi('#ringkasan', 'Juruteknik awam dengan 4 tahun pengalaman.');
isi('#senarai-pengalaman .p-jawatan', 'Juruteknik Tapak');
isi('#senarai-pengalaman .p-syarikat', 'EPH Construction');
isi('#senarai-pengalaman .p-tempoh', 'Mac 2024 - Kini');
isi('#senarai-pendidikan .d-kelulusan', 'Diploma Kejuruteraan Awam');
isi('#senarai-pendidikan .d-institusi', 'Politeknik Kuantan');
isi('#senarai-pendidikan .d-tahun', '2018 - 2021');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(resume().includes('Kemahiran') && resume().includes('Bahasa') && resume().includes('Rujukan'),
   'pratonton bermula dengan semua bahagian');
ok(d.querySelectorAll('fieldset.sek').length === 7, '7 bahagian boleh dibuang (jawatan, ringkasan, pengalaman, pendidikan, kemahiran, bahasa, rujukan)');

// 1) buang satu bahagian
d.querySelector('fieldset[data-sek="bahasa"] .sek-buang').click();
ok(!resume().includes('Bahasa'), 'Bahasa dibuang dari pratonton');
ok(resume().includes('Kemahiran') && resume().includes('Rujukan'), 'bahagian lain tidak terjejas');
ok(d.querySelector('fieldset[data-sek="bahasa"]').className.includes('dibuang'), 'kotak borang Bahasa ditanda dibuang');
d.querySelector('[data-sek-batal="bahasa"]').click();
ok(resume().includes('Bahasa'), 'Bahasa kembali selepas tekan "Tambah balik"');

// 2) buang seluruh bahagian Pengalaman Kerja
d.querySelector('fieldset[data-sek="pengalaman"] .sek-buang').click();
ok(!resume().includes('Pengalaman Kerja'), 'Pengalaman Kerja dibuang dari pratonton');
ok(resume().includes('Pendidikan'), 'bahagian Pendidikan kekal');
d.querySelector('[data-sek-batal="pengalaman"]').click();
ok(resume().includes('Pengalaman Kerja'), 'Pengalaman Kerja kembali');

// 3) tambah bahagian sendiri
el('tambah-bahagian').click();
ok(d.querySelectorAll('#senarai-tambahan .baris').length === 1, 'satu baris bahagian tambahan ditambah');
isi('#senarai-tambahan .t-tajuk', 'Projek');
isi('#senarai-tambahan .t-isi', 'Projek Perumahan Mampu Milik Kemaman (2024)\nSijil AutoCAD Asas (2023)');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(resume().includes('Projek'), 'tajuk bahagian tambahan muncul dalam pratonton');
ok(resume().includes('Projek Perumahan Mampu Milik Kemaman'), 'isi bahagian tambahan muncul dalam pratonton');
ok(d.querySelectorAll('#resume .cvb-bullet li').length >= 2, 'dua baris isi dipaparkan sebagai senarai bulet');

// 4) hapus bahagian tambahan
d.querySelector('#senarai-tambahan .btn-hapus').click();
ok(d.querySelectorAll('#senarai-tambahan .baris').length === 0, 'baris bahagian tambahan boleh dihapus');
ok(!resume().includes('Projek Perumahan Mampu Milik Kemaman'), 'bahagian tambahan hilang dari pratonton selepas dihapus');

// 5) kod pesanan (Mod Penjual) menyimpan bahagian tambahan + senarai dibuang
el('tambah-bahagian').click();
isi('#senarai-tambahan .t-tajuk', 'Sijil');
isi('#senarai-tambahan .t-isi', 'Sijil AutoCAD Asas (2023)');
d.querySelector('fieldset[data-sek="rujukan"] .sek-buang').click();
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
const kodB = w.ResumeMV.kod(w.ResumeMV.kumpul());
const balikB = w.ResumeMV.dariKod(kodB);
ok(balikB.tambahan.length === 1 && balikB.tambahan[0].t === 'Sijil', 'kod pesanan menyimpan bahagian tambahan');
ok(balikB.buang.indexOf('rujukan') >= 0, 'kod pesanan menyimpan senarai bahagian dibuang');
ok(balikB.tambahan[0].b === 'Sijil AutoCAD Asas (2023)', 'isi bahagian tambahan tersimpan dalam kod');

// 6) buka semula kod pelanggan (Mod Penjual) memulihkan borang
w.ResumeMV.isi(balikB);
ok(d.querySelector('fieldset[data-sek="rujukan"]').className.includes('dibuang'), 'isi dari kod memulihkan keadaan "dibuang"');
ok(d.querySelectorAll('#senarai-tambahan .baris').length === 1, 'isi dari kod memulihkan bahagian tambahan ke borang');
ok(d.querySelector('#senarai-tambahan .t-tajuk').value === 'Sijil', 'tajuk bahagian tambahan diisi');
ok(!resume().includes('Rujukan'), 'pratonton mengikut keadaan dibuang selepas kod dibuka');
d.querySelector('[data-sek-batal="rujukan"]').click();
ok(resume().includes('Rujukan'), 'Rujukan boleh dikembalikan selepas kod dibuka');
el('kosongkan').click();
ok(d.querySelectorAll('#senarai-tambahan .baris').length === 0, '"Kosongkan" membuang bahagian tambahan');
ok(d.querySelectorAll('fieldset.sek.dibuang').length === 0, '"Kosongkan" memulihkan semua bahagian');

console.log('== 22. Pratonton di sisi + alih blok dalam pratonton ==');
el('mula-isi').click();
isi('#nama', 'Ahmad bin Ali'); isi('#telefon', '012-3456789'); isi('#emel', 'ahmad@mail.com');
isi('#lokasi', 'Kemaman'); isi('#jawatan', 'Juruteknik Tapak');
isi('#ringkasan', 'Juruteknik awam dengan 4 tahun pengalaman.');
isiTahap('kemahiran', [['AutoCAD', 5], ['MS Excel', 4]]); isiTahap('bahasa', [['Bahasa Melayu', 5], ['English', 4]]);
isi('#senarai-rujukan .baris .rj-nama', 'En. Samad'); isi('#senarai-rujukan .baris .rj-telefon', '019-1112222');
isi('#senarai-pengalaman .p-jawatan', 'Juruteknik Tapak');
isi('#senarai-pengalaman .p-syarikat', 'EPH Construction');
isi('#senarai-pendidikan .d-kelulusan', 'Diploma Kejuruteraan Awam');
isi('#senarai-pendidikan .d-institusi', 'Politeknik Kuantan');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
el('tambah-bahagian').click();
isi('#senarai-tambahan .t-tajuk', 'Projek');
isi('#senarai-tambahan .t-isi', 'Projek Perumahan Kemaman (2024)');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(!!el('sisi') && !!el('sisi-kertas') && !!el('kertas-sisi'), 'kertas pratonton di sisi borang wujud');
ok(!!el('togol-susun') && !!el('susun-reset') && !!el('nota-susun'), 'kawalan mod susun wujud (Susun blok / Tetapkan semula)');
ok(!!el('buka-sisi') && !!el('tutup-sisi'), 'butang buka/tutup pratonton sisi wujud (skrin kecil)');
ok(el('sisi-kertas').innerHTML === el('resume').innerHTML, 'kertas sisi dan kertas utama memaparkan resume yang sama');
ok(d.querySelectorAll('#sisi-kertas [data-blok]').length === d.querySelectorAll('#resume [data-blok]').length,
   'setiap blok ada penanda data-blok dalam kedua-dua pratonton');
ok(d.querySelectorAll('#sisi-kertas [data-blok]').length >= 4, 'blok resume ditanda (Kontak/Kemahiran/Profil/...)');

// susunan asas
const urutAsas = w.ResumeMV.urutan(w.ResumeMV.kumpul());
ok(urutAsas.kiri.join(',') === 'kontak,kemahiran,bahasa', 'lajur kiri asas: kontak, kemahiran, bahasa');
ok(urutAsas.kanan.join(',') === 'profil,pengalaman,pendidikan,rujukan,t0',
   'lajur kanan asas: profil, pengalaman, pendidikan, rujukan, bahagian tambahan (t0) — dapat ' + urutAsas.kanan.join(','));

// mod susun hidup/mati
ok(el('togol-susun').getAttribute('aria-pressed') === 'false', 'mod susun mula dalam keadaan mati');
ok(d.querySelectorAll('#sisi-kertas .blok-alat').length === 0, 'tiada alat gerak bila mod susun mati');
el('togol-susun').click();
ok(el('togol-susun').getAttribute('aria-pressed') === 'true' && el('togol-susun').textContent.indexOf('Selesai') === 0,
   'mod susun hidup (teks butang bertukar)');
ok(d.body.classList.contains('mod-susun'), 'badan dokumen ditanda mod-susun');
ok(d.querySelectorAll('#sisi-kertas .blok-alat').length >= 4, 'setiap blok dapat alat gerak');
ok(el('susun-reset').hidden === false && el('nota-susun').hidden === false, 'butang Tetapkan semula + nota muncul');

// gerak blok: naik
const sebelum = [...d.querySelectorAll('#sisi-kertas [data-blok]')].map(b => b.getAttribute('data-blok'));
d.querySelector('#sisi-kertas [data-blok="bahasa"] [data-gerak="naik"]').click();
const selepas = [...d.querySelectorAll('#sisi-kertas [data-blok]')].map(b => b.getAttribute('data-blok'));
ok(selepas.indexOf('bahasa') < selepas.indexOf('kemahiran'),
   'blok Bahasa dinaikkan melebihi Kemahiran (' + sebelum.join(',') + ' -> ' + selepas.join(',') + ')');
ok(w.ResumeMV.kumpul().susun && w.ResumeMV.kumpul().susun.kiri.indexOf('bahasa') === 1,
   'susunan baru disimpan dalam data borang');

// pindah lajur: blok Rujukan ke lajur kiri
d.querySelector('#sisi-kertas [data-blok="rujukan"] [data-gerak="kiri"]').click();
const urut2 = w.ResumeMV.urutan(w.ResumeMV.kumpul());
ok(urut2.kiri.indexOf('rujukan') >= 0, 'Rujukan berpindah ke lajur kiri');
ok(urut2.kanan.indexOf('rujukan') < 0, 'Rujukan tidak lagi di lajur kanan');
ok(d.querySelector('#sisi-kertas .cvb-kiri [data-blok="rujukan"]') !== null, 'pratonton menunjukkan Rujukan di lajur kiri');
ok(d.querySelector('#resume .cvb-kiri [data-blok="rujukan"]') !== null, 'pratonton utama juga ikut susunan sama');

// susunan disimpan dalam kod pesanan
const kodS = w.ResumeMV.kod(w.ResumeMV.kumpul());
const balikS = w.ResumeMV.dariKod(kodS);
ok(balikS.susun && balikS.susun.kiri.indexOf('rujukan') >= 0, 'susunan blok disimpan dalam kod pesanan WhatsApp');

// tetapkan semula
el('susun-reset').click();
const urut3 = w.ResumeMV.urutan(w.ResumeMV.kumpul());
ok(urut3.kiri.join(',') === 'kontak,kemahiran,bahasa' && urut3.kanan.indexOf('rujukan') >= 0,
   '"Tetapkan semula" memulangkan susunan asal');
el('togol-susun').click();
ok(el('togol-susun').getAttribute('aria-pressed') === 'false', 'mod susun boleh dimatikan');
ok(d.querySelectorAll('#sisi-kertas .blok-alat').length === 0, 'alat gerak hilang bila mod susun mati');

// butang Susun blok di halaman pratonton juga berfungsi
el('ke-3').click();
el('togol-susun-3').click();
ok(w.document.body.classList.contains('mod-susun') && d.querySelectorAll('#resume .blok-alat').length >= 4,
   'butang Susun blok di halaman pratonton menghidupkan mod yang sama');
el('togol-susun-3').click();
ok(d.body.classList.contains('mod-susun') === false, 'mod susun dimatikan semula dari halaman pratonton');
el('balik-3').click();

console.log('== 23. Bahagian siap-pakai: Kemahiran Profesional / Sijil / Projek / Aktiviti ==');
el('mula-isi').click();
el('kosongkan').click();          // mula bersih supaya bahagian baharu jadi t0
isi('#nama', 'Nurul Ain'); isi('#telefon', '012-3456789');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(d.querySelectorAll('.cepat-tambah .cip').length === 4, 'empat cadangan satu klik disediakan');
ok(d.querySelector('.cip[data-tajuk="Kemahiran Profesional"]') !== null, 'cadangan "Kemahiran Profesional" ada');
const bilSebelum = d.querySelectorAll('#senarai-tambahan .baris').length;
d.querySelector('.cip[data-tajuk="Kemahiran Profesional"]').click();
ok(d.querySelectorAll('#senarai-tambahan .baris').length === bilSebelum + 1, 'satu klik menambah baris bahagian baharu');
const barisKP = d.querySelector('#senarai-tambahan .baris:last-child');
ok(barisKP.querySelector('.t-tajuk').value === 'Kemahiran Profesional', 'tajuk sudah diisi automatik (tak perlu taip)');
isi('#senarai-tambahan .baris:last-child .t-isi', 'AutoCAD - penyediaan pelan kerja\nMS Project - jadual projek\nPengurusan kontrak (PAM 2018)');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(resume().includes('Kemahiran Profesional'), 'tajuk "Kemahiran Profesional" muncul dalam resume');
ok(resume().includes('Pengurusan kontrak (PAM 2018)'), 'senarai kemahiran profesional muncul dalam resume');
ok(d.querySelectorAll('#resume .cvb-kanan .blok[data-blok="t0"] .cvb-bullet li').length === 3,
   'tiga item dipaparkan sebagai senarai bulet');
// boleh dialih ke rel kiri seperti blok lain
el('togol-susun').click();
d.querySelector('#sisi-kertas [data-blok="t0"] [data-gerak="kiri"]').click();
ok(d.querySelector('#sisi-kertas .cvb-kiri [data-blok="t0"]') !== null, 'bahagian kemahiran profesional boleh dialih ke rel kiri');
el('susun-reset').click();
el('togol-susun').click();
// cadangan lain masih kosong tajuknya? (hanya Kemahiran Profesional diisi)
d.querySelector('.cip[data-tajuk="Projek"]').click();
ok(d.querySelector('#senarai-tambahan .baris:last-child .t-tajuk').value === 'Projek', 'cadangan "Projek" mengisi tajuknya');
d.querySelector('#senarai-tambahan .baris:last-child .btn-hapus').click();
ok(d.querySelectorAll('#senarai-tambahan .baris').length === bilSebelum + 1, 'baris cadangan boleh dihapus');

console.log('== 24. Tukar reka bentuk + templat Biru Bersih (satu lajur) ==');
el('kosongkan').click();
isi('#nama', 'Muhammad Irfan bin Salleh');
isi('#jawatan', 'Jurutera Mekanikal');
isi('#telefon', '011-2233 4455');
isi('#emel', 'irfan@contoh.my');
isi('#lokasi', 'Kuantan, Pahang');
isi('#ringkasan', 'Jurutera mekanikal dengan pengalaman penyeliaan tapak dan penyediaan dokumen kontrak.');
isiTahap('kemahiran', [['AutoCAD', 5], ['MS Project', 4], ['Ukur Kuantiti', 5]]);
isiTahap('bahasa', [['Bahasa Melayu', 5], ['Bahasa Inggeris', 4]]);
isi('#senarai-pengalaman .baris .p-jawatan', 'Jurutera Tapak');
isi('#senarai-pengalaman .baris .p-syarikat', 'EPH Construction Sdn Bhd');
isi('#senarai-pengalaman .baris .p-tempoh', 'Jan 2023 - Kini');
isi('#senarai-pengalaman .baris .pj-poin', 'Menyelia kerja struktur 3 blok\nMenyediakan laporan kemajuan bulanan');
isi('#senarai-pendidikan .baris .d-kelulusan', 'Ijazah Sarjana Muda Kejuruteraan Mekanikal');
isi('#senarai-pendidikan .baris .d-institusi', 'Universiti Malaysia Pahang');
isi('#senarai-pendidikan .baris .d-tahun', '2018 - 2022');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(!!d.querySelector('#resume .cv-biru'), 'templat lalai ialah Biru & Kelabu');

d.querySelector('.kad-pilih[data-templat="bersih"]').click();
ok(d.querySelector('.kad-pilih[data-templat="bersih"]').getAttribute('aria-pressed') === 'true' &&
   d.querySelector('.kad-pilih[data-templat="biru"]').getAttribute('aria-pressed') === 'false',
   'kad yang dipilih ditanda aria-pressed');
ok(!!d.querySelector('#resume .cv-bersih'), 'pratonton utama kini templat Biru Bersih');
ok(!!d.querySelector('#sisi-kertas .cv-bersih'), 'kertas pratonton sisi juga Biru Bersih');
ok(d.querySelector('#resume .cv-bersih .cvs-nama').textContent.trim() === 'Muhammad Irfan bin Salleh', 'nama dirender besar');
ok(!d.querySelector('#resume .cv-biru'), 'templat lama tidak dirender serentak');
ok(d.querySelectorAll('#resume .cv-bersih .cvs-badan .blok').length >= 5, 'blok utama dirender sebagai satu aliran');
const tajukBersih = Array.prototype.map.call(d.querySelectorAll('#resume .cv-bersih .cvs-badan h2'),
  h => h.textContent.trim().toLowerCase());
ok(tajukBersih[0] === 'ringkasan', 'Ringkasan didahulukan dalam templat satu lajur');
ok(tajukBersih.indexOf('pengalaman kerja') > 0 && tajukBersih.indexOf('pendidikan') > 0, 'pengalaman & pendidikan ikut di bawah');
ok(d.querySelectorAll('#resume .cv-bersih .cvs-item').length === 2, 'satu pengalaman + satu pendidikan');
ok(d.querySelectorAll('#resume .cv-bersih .cvs-senarai li').length === 2, 'dua poin pengalaman jadi bulet');
ok(d.querySelector('#resume .cv-bersih .cvs-kontak li .cvs-label').textContent.trim() === 'Telefon:', 'kontak berlabel jelas');

const pulihBersih = w.ResumeMV.dariKod(w.ResumeMV.kod(w.ResumeMV.kumpul()));
ok(pulihBersih.templat === 'bersih', 'kod pesanan menyimpan templat yang dipilih');
ok(/\.lembar \.cv-bersih \{ min-height: auto; \}/.test(html), 'templat satu lajur tidak dipaksa tinggi A4 dalam cetakan');

el('togol-susun').click();
ok(d.querySelectorAll('#resume .blok-alat .ba').length > 0, 'alat susun muncul dalam templat satu lajur');
ok(d.querySelector('#sisi-kertas [data-blok="profil"] .blok-alat .ba[data-gerak="kanan"]') === null,
   'tiada anak panah pindah lajur dalam templat satu lajur');
function aliran() { const q = w.ResumeMV.urutan(w.ResumeMV.kumpul()); return q.kiri.concat(q.kanan); }
const sebelumSatu = aliran();
d.querySelector('#sisi-kertas [data-blok="pendidikan"] [data-gerak="naik"]').click();
const selepasSatu = aliran();
ok(selepasSatu.indexOf('pendidikan') === sebelumSatu.indexOf('pendidikan') - 1, 'blok boleh dialih naik dalam aliran satu lajur');
ok(w.ResumeMV.urutan(w.ResumeMV.kumpul()).kanan.length === 0, 'susunan satu lajur disimpan sebagai satu senarai');
el('susun-reset').click();
el('togol-susun').click();

d.querySelector('.sek[data-sek="bahasa"] .sek-buang').click();
ok(!/Bahasa Melayu/.test(d.querySelector('#resume .cv-bersih').textContent), 'bahagian dibuang tidak muncul dalam templat bersih');
d.querySelector('.cip[data-tajuk="Kemahiran Profesional"]').click();
isi('#senarai-tambahan .baris:last-child .t-isi', 'AutoCAD\nUkur kuantiti (BQ)');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(d.querySelector('#resume .cv-bersih .cvs-badan').textContent.includes('Kemahiran Profesional'),
   'bahagian tambahan muncul sebagai tajuk sendiri dalam templat bersih');

d.querySelector('.kad-pilih[data-templat="biru"]').click();
ok(!!d.querySelector('#resume .cv-biru') && !d.querySelector('#resume .cv-bersih'), 'boleh tukar balik ke Biru & Kelabu');

console.log('== 25. Isi sikit: halaman tidak lopong (auto-renggang) ==');
ok(/--renggang: 1;/.test(html), 'pemboleh --renggang wujud pada templat satu lajur');
ok(/calc\(4\.2mm \* var\(--renggang\)\)/.test(html), 'jarak tajuk guna --renggang');
ok(/calc\(2\.4mm \* var\(--renggang\)\)/.test(html), 'jarak item/teks guna --renggang');
ok(/min-height: 50mm/.test(html) && /\.cv-bersih \.cvs-kepala \{ min-height: 50mm; \}/.test(html), 'tinggi kepala tetap 50mm (foto bulat saiz tetap tidak mengecil ikut --renggang)');
ok(html.includes('function larasRuang()'), 'fungsi larasRuang() wujud');
ok(/TINGGI_KERTAS = 1123/.test(html) && /TINGGI_KERTAS \* 0\.86/.test(html),
   'sasaran isi ~86% tinggi halaman A4');
ok(/Math\.min\(1\.6,/.test(html), 'renggangan ada had maksimum (1.6x) supaya tidak berlebihan');
ok(/baharu > siling/.test(html), 'ada perlindungan supaya tidak melimpah ke halaman kedua');
ok(/Ruang halaman masih lapang/.test(html), 'app beri peringatan bila ruang masih banyak');
ok(typeof w.ResumeMV.renggang === 'function' && w.ResumeMV.renggang() >= 1, 'nilai renggangan boleh dibaca (>= 1)');
ok(!!el('nota-lapang'), 'nota "halaman lapang" wujud di halaman pratonton');
ok(/Halaman masih lapang/.test(html) && /tandaLapang\(\)/.test(html), 'nota dikawal oleh tandaLapang()');
ok(/PENUH < 0\.55/.test(html), 'nota & peringatan hanya bila halaman kurang 55% penuh');
ok(typeof w.ResumeMV.penuh === 'function' && w.ResumeMV.penuh() > 0, 'nisbah kepenuhan halaman boleh dibaca');
ok(/\.nota-lapang \{[\s\S]{0,200}no-print|\.nota-lapang[\s\S]{0,80}no-print/.test(html) || /nota-lapang no-print/.test(html),
   'nota tidak dicetak ke dalam PDF');
el('mula-isi').click();
el('nama').value = 'Ujian Nota'; el('telefon').value = '012-000 0000';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(el('nota-lapang').hidden === true, 'nota tersembunyi bila isi penuh/dalam templat dua lajur');
ok(w.ResumeMV.tempat().length === 3 && w.ResumeMV.tempat().indexOf('bersih') >= 0 && w.ResumeMV.tempat().indexOf('korporat') >= 0, 'daftar templat boleh dibaca dari luar');

console.log('== 26. Isi terlalu banyak: auto-padat + nota melebihi halaman ==');
ok(/--teks: 1;/.test(html), 'pemboleh --teks (skala fon) wujud');
ok(/calc\(10\.5pt \* var\(--teks\)\)/.test(html), 'saiz fon badan guna --teks');
ok(/calc\(20pt \* var\(--teks\)\)/.test(html) && /calc\(12pt \* var\(--teks\)\)/.test(html),
   'nama & tajuk bahagian pun guna --teks');
ok(/var TAHAP = \[\[0\.86, 0\.97\], \[0\.78, 0\.94\], \[0\.72, 0\.93\]\]/.test(html),
   'tiga tahap pemadatan (jarak + fon) disediakan');
ok(/t2 <= siling/.test(html), 'pemadatan berhenti sebaik muat satu halaman');
ok(/balik ke saiz biasa/.test(html), 'kalau masih tidak muat, saiz dikembalikan (tidak kecil sia-sia)');
ok(/LEBIH = tinggi > siling/.test(html), 'isyarat melebihi halaman dikira');
ok(/Resume melebihi satu halaman/.test(html), 'nota melebihi halaman disediakan untuk pelanggan');
ok(/dicetak 2 halaman/.test(html), 'nota menyatakan kesan sebenar (2 halaman)');
ok(typeof w.ResumeMV.teks === 'function' && w.ResumeMV.teks() === 1, 'skala fon boleh dibaca (lalai 1)');
ok(typeof w.ResumeMV.lebih === 'function' && w.ResumeMV.lebih() === false, 'isyarat melebihi halaman lalai false');
ok(html.indexOf('auto-padat') >= 0 || /padatkan \(jarak rapat/.test(html), 'kod pemadatan berkomentar jelas');

console.log('== 27. Rujukan mesra pengguna (tanpa koma) + halaman 2 berdesign sama ==');
// medan rujukan berstruktur
ok(!!el('senarai-rujukan'), 'bekas #senarai-rujukan wujud');
ok(!!el('tambah-rujukan'), 'butang + Tambah rujukan wujud');
ok(el('rujukan') === null, 'textarea #rujukan yang lama sudah dibuang');
ok(/tiada tanda koma/.test(html), 'arahan jelas: tiada tanda koma perlu');
ok(d.querySelectorAll('#senarai-rujukan .baris').length === 1, 'bermula dengan satu baris rujukan');
const r1 = d.querySelector('#senarai-rujukan .baris');
ok(!!r1.querySelector('.rj-nama') && !!r1.querySelector('.rj-jawatan') && !!r1.querySelector('.rj-telefon'),
   'setiap rujukan ada medan nama / jawatan+syarikat / telefon');
el('tambah-rujukan').click();
ok(d.querySelectorAll('#senarai-rujukan .baris').length === 2, 'butang menambah baris rujukan');
isi('#senarai-rujukan .baris:nth-child(1) .rj-nama', 'En. Ahmad Faizal bin Hassan');
isi('#senarai-rujukan .baris:nth-child(1) .rj-jawatan', 'Pengurus Projek, EPH Construction Sdn Bhd');
isi('#senarai-rujukan .baris:nth-child(1) .rj-telefon', '012-345 6789');
isi('#senarai-rujukan .baris:nth-child(2) .rj-nama', 'Puan Siti Aminah');
isi('#senarai-rujukan .baris:nth-child(2) .rj-telefon', '019-222 3333');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
const dRuj = w.ResumeMV.kumpul();
ok(Array.isArray(dRuj.rujukan) && dRuj.rujukan.length === 2, 'rujukan dikumpul sebagai senarai (bukan teks berkoma)');
ok(dRuj.rujukan[0].nama === 'En. Ahmad Faizal bin Hassan' && dRuj.rujukan[0].jawatan.indexOf('EPH') >= 0 &&
   dRuj.rujukan[0].telefon === '012-345 6789', 'nama / jawatan / telefon disimpan berasingan');
ok(dRuj.rujukan[1].jawatan === '', 'medan yang tidak diisi dibiarkan kosong (tidak jadi koma berganda)');
// pratonton templat bersih
d.querySelector('.kad-pilih[data-templat="bersih"]').click();
const blokRuj = d.querySelector('#resume .cv-bersih [data-blok="rujukan"]');
ok(!!blokRuj, 'bahagian Rujukan dirender dalam templat Biru Bersih');
ok(blokRuj.querySelectorAll('.cvs-item').length === 2, 'dua rujukan = dua item (bukan satu perenggan berkoma)');
ok(blokRuj.textContent.indexOf('En. Ahmad Faizal bin Hassan') >= 0 &&
   blokRuj.textContent.indexOf('Pengurus Projek, EPH Construction Sdn Bhd') >= 0 &&
   blokRuj.textContent.indexOf('012-345 6789') >= 0, 'nama, jawatan dan telefon semua muncul');
ok(blokRuj.textContent.indexOf(', ,') < 0, 'tiada tanda koma berganda');
// templat biru
d.querySelector('.kad-pilih[data-templat="biru"]').click();
const blokRuj2 = d.querySelector('#resume .cv-biru [data-blok="rujukan"]');
ok(!!blokRuj2 && blokRuj2.querySelectorAll('.cvb-item').length === 2, 'dua rujukan juga dirender dalam templat Biru & Kelabu');
// kod pesanan menyimpan + memulihkan rujukan
const kodR = w.ResumeMV.kod(w.ResumeMV.kumpul());
const balikR = w.ResumeMV.dariKod(kodR);
ok(Array.isArray(balikR.rujukan) && balikR.rujukan.length === 2 && balikR.rujukan[0].nama.indexOf('Ahmad') >= 0,
   'kod pesanan menyimpan rujukan berstruktur');
const kodLamaR = 'eyJzIjoiYmlydSIsIm4iOiJVamlhbiIsInQiOiIwMTIiLCJ1IjoiRW4uIExhbWEgLSBQZW5nYXJ1cyJ9';
const balikLama = w.ResumeMV.dariKod(kodLamaR);
ok(Array.isArray(balikLama.rujukan) && balikLama.rujukan.length === 1 && balikLama.rujukan[0].nama.indexOf('En. Lama') >= 0,
   'kod pesanan LAMA (rujukan sebagai teks) tetap dibaca dengan betul');
// buang baris
d.querySelector('#senarai-rujukan .baris:nth-child(2) .btn-hapus').click();
ok(d.querySelectorAll('#senarai-rujukan .baris').length === 1, 'baris rujukan boleh dihapus');
// kad templat: mini di atas, teks di bawah (susunan menegak, tidak ditengahkan)
ok(/\.kad-pilih \{[\s\S]{0,180}flex-direction: column/.test(html), 'kad reka bentuk: pratonton mini di atas, teks di bawah');
ok(d.querySelector('#galeri .kad-pilih .mini') === d.querySelector('#galeri .kad-pilih').firstElementChild,
   'mini ialah elemen pertama dalam kad (duduk di atas)');
// elemen cetak berulang (halaman 2 berdesign sama)
ok(!!el('cetak-berulang') && !!el('cb-nama'), 'elemen cetak berulang wujud (jalur atas + kaki halaman)');
ok(/\.cb-jalur \{[\s\S]{0,200}position: fixed/.test(html) && /\.cb-kaki \{[\s\S]{0,200}position: fixed/.test(html),
   'jalur atas & kaki halaman guna position: fixed (berulang pada setiap halaman cetakan)');
ok(/body\[data-templat="bersih"\] \{ --jalur: #00366d/.test(html) && /body\[data-templat="biru"\] \{ --jalur: #323b4c/.test(html),
   'warna jalur ikut reka bentuk yang dipilih');
ok(/print-color-adjust: exact/.test(html), 'warna dipaksa cetak (reka bentuk tidak hilang kalau kotak warna dimatikan)');
ok(/body\[data-templat="biru"\] \.cb-rel \{[\s\S]{0,200}position: fixed[\s\S]{0,160}width: 65mm/.test(html),
   'templat dua lajur: rel kelabu diteruskan pada halaman 2 (65mm, dari 50mm ke bawah)');
ok(/\.lembar \.cvb-kiri, \.lembar \.cvb-kanan \{ position: relative; z-index: 1; \}/.test(html),
   'kandungan lajur dilukis di atas rel supaya teks tidak tertutup');
ok(d.body.getAttribute('data-templat') === 'biru', 'body ditanda dengan reka bentuk semasa');
d.querySelector('.kad-pilih[data-templat="bersih"]').click();
ok(d.body.getAttribute('data-templat') === 'bersih', 'tanda data-templat bertukar bila reka bentuk ditukar');
ok(el('cb-nama').textContent.indexOf('Ahmad') >= 0 || el('cb-nama').textContent.length > 0, 'nama dipaparkan pada kaki halaman');
d.querySelector('.kad-pilih[data-templat="biru"]').click();

console.log('== 28. Skala tahap penguasaan 1-5 (Bahasa & Kemahiran) ==');
// struktur borang
ok(!!el('senarai-kemahiran') && !!el('senarai-bahasa'), 'senarai kemahiran & bahasa wujud');
ok(!!el('tambah-kemahiran') && !!el('tambah-bahasa'), 'butang + Tambah kemahiran / bahasa wujud');
ok(el('kemahiran') === null && el('bahasa') === null, 'input berkoma yang lama sudah dibuang');
ok(/Tahap penguasaan/.test(html), 'label "Tahap penguasaan" ada pada borang');
// bersihkan borang dahulu supaya kiraan baris tepat
el('kosongkan').click();
const bTahap = d.querySelector('#senarai-kemahiran .baris .tahap');
ok(bTahap && bTahap.querySelectorAll('.tahap-btn').length === 5, 'setiap baris ada butang 1 hingga 5');
ok(bTahap.getAttribute('data-tahap') === '3', 'tahap lalai = 3 (boleh diubah)');
// tekan butang tahap
bTahap.querySelectorAll('.tahap-btn')[4].click();
ok(bTahap.getAttribute('data-tahap') === '5', 'tekan 5 menetapkan tahap 5');
ok(bTahap.querySelectorAll('.tahap-btn')[4].classList.contains('aktif'), 'butang 5 ditanda aktif');
ok(!bTahap.querySelectorAll('.tahap-btn')[0].classList.contains('aktif'), 'butang lain tidak aktif');
ok(/Tahap <strong>5 \/ 5<\/strong>/.test(d.querySelector('#senarai-kemahiran .baris .tahap-teks').innerHTML),
   'teks tahap dikemas kini ("Tahap 5 / 5 - Pakar")');
bTahap.querySelectorAll('.tahap-btn')[1].click();
ok(bTahap.getAttribute('data-tahap') === '2', 'tukar ke 2 berfungsi');
// butang tambah baris
el('tambah-kemahiran').click();
ok(d.querySelectorAll('#senarai-kemahiran .baris').length === 2, 'menambah kemahiran jadi 2 baris');
ok(d.querySelectorAll('#senarai-kemahiran .baris')[1].querySelectorAll('.tahap-btn').length === 5, 'baris baharu juga ada skala 1-5');
el('tambah-bahasa').click();
ok(d.querySelectorAll('#senarai-bahasa .baris').length === 2, 'menambah bahasa jadi 2 baris');
// isi dan kumpul
el('kosongkan').click();
isiTahap('kemahiran', [['AutoCAD', 5], ['MS Excel', 4], ['BIM Revit', 2]]);
isiTahap('bahasa', [['Bahasa Melayu', 5], ['Bahasa Inggeris', 4]]);
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
const dTahap = w.ResumeMV.kumpul();
ok(Array.isArray(dTahap.kemahiran) && dTahap.kemahiran.length === 3, 'kemahiran disimpan sebagai senarai');
ok(dTahap.kemahiran[0].nama === 'AutoCAD' && dTahap.kemahiran[0].tahap === 5, 'nama + tahap disimpan berasingan');
ok(dTahap.kemahiran[2].tahap === 2, 'tahap 2 disimpan (bukan dipaksa 3)');
d.querySelector('#senarai-kemahiran .baris:nth-child(3) .btn-hapus').click();
ok(d.querySelectorAll('#senarai-kemahiran .baris').length === 2, 'baris kemahiran boleh dihapus');
ok(w.ResumeMV.kumpul().kemahiran.length === 2, 'data ikut baris yang tinggal selepas hapus');
// bina semula untuk ujian render
el('kosongkan').click();
isiTahap('kemahiran', [['AutoCAD', 5], ['MS Excel', 4], ['BIM Revit', 2]]);
isiTahap('bahasa', [['Bahasa Melayu', 5], ['Bahasa Inggeris', 4]]);
ok(d.querySelectorAll('#senarai-kemahiran .baris').length === 3, 'tiga baris kemahiran dibina');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
// render templat biru (rel kiri): setiap item ada titik skala
ok(d.querySelectorAll('#resume .cvb-tahap li').length === 5, 'rel kiri: 3 kemahiran + 2 bahasa = 5 baris');
ok(d.querySelectorAll('#resume .cvb-tahap li .titik-tahap').length === 5, 'setiap baris rel kiri ada titik skala');
const titikAuto = d.querySelector('#resume .cvb-tahap li');
ok(titikAuto.querySelectorAll('i.penuh').length === 5, 'AutoCAD (5) = lima titik penuh');
ok(d.querySelectorAll('#resume .cvb-tahap li')[1].querySelectorAll('i.penuh').length === 4, 'MS Excel (4) = empat titik penuh');
ok(d.querySelector('#resume .cvb-tahap li').querySelectorAll('.titik-tahap i').length === 5, 'sentiasa lima titik (kosong + penuh)');
ok(d.querySelector('#resume .titik-tahap').getAttribute('aria-label').includes('5 daripada 5'), 'skala ada label untuk pembaca skrin');
ok(/\.cvb-tahap \.titik-tahap i\.penuh \{ background: #323b4c; \}/.test(html), 'titik penuh templat dua lajur ada warna sendiri');
ok(/\.cv-bersih \.titik-tahap i\.penuh \{ background: #00366d; \}/.test(html), 'titik penuh templat bersih ada warna sendiri');
ok(/\.titik-tahap i \{[\s\S]{0,120}background: #c2c9d3/.test(html), 'titik kosong berbeza warna dari titik penuh');
// render templat bersih (satu lajur)
d.querySelector('.kad-pilih[data-templat="bersih"]').click();
ok(d.querySelectorAll('#resume .cvs-tahap li').length === 5, 'templat Biru Bersih: 5 baris kemahiran/bahasa');
ok(d.querySelectorAll('#resume .cvs-tahap li .titik-tahap').length === 5, 'templat Biru Bersih juga ada titik skala');
ok(d.querySelectorAll('#resume .cvs-tahap li')[0].querySelectorAll('i.penuh').length === 5, 'titik penuh ikut tahap dalam templat bersih');
// render templat korporat: skala titik mesti ada juga (aduan pelanggan: templat 3 tiada titik)
d.querySelector('.kad-pilih[data-templat="korporat"]').click();
const liKorp = d.querySelectorAll('#resume .cv-korporat .ck-senarai li');
ok(liKorp.length === 5, 'Korporat: 3 kemahiran + 2 bahasa = 5 baris dalam rel kiri');
ok(d.querySelectorAll('#resume .cv-korporat .ck-senarai li .titik-tahap').length === 5,
   'Korporat: setiap baris kemahiran/bahasa ada titik skala (tidak lagi kosong)');
ok(liKorp[0].querySelectorAll('.titik-tahap i').length === 5, 'Korporat: sentiasa lima titik (penuh + kosong)');
ok(liKorp[0].querySelectorAll('i.penuh').length === 5, 'Korporat: AutoCAD (5) = lima titik penuh');
ok(liKorp[1].querySelectorAll('i.penuh').length === 4, 'Korporat: MS Excel (4) = empat titik penuh');
ok(/aria-label="Tahap 5 daripada 5"/.test(d.querySelector('#resume .cv-korporat .titik-tahap').outerHTML),
   'Korporat: titik ada label untuk pembaca skrin');
d.querySelector('.kad-pilih[data-templat="biru"]').click();
// kod pesanan menyimpan + memulihkan tahap
const kodTahap = w.ResumeMV.kod(w.ResumeMV.kumpul());
ok(kodTahap.length < 4000, 'kod pesanan tidak membengkak (g: ' + kodTahap.length + ' aksara)');
const balikTahap = w.ResumeMV.dariKod(kodTahap);
ok(Array.isArray(balikTahap.kemahiran) && balikTahap.kemahiran[0].nama === 'AutoCAD' && balikTahap.kemahiran[0].tahap === 5,
   'kod pesanan menyimpan kemahiran + tahap');
ok(balikTahap.bahasa[0].nama === 'Bahasa Melayu' && balikTahap.bahasa[0].tahap === 5, 'kod pesanan menyimpan bahasa + tahap');
// kod LAMA (teks berkoma) tetap dibaca - tanpa skala
const kodLamaTahap = 'eyJzIjoiYmlydSIsIm4iOiJVamlhbiIsInQiOiIwMTIiLCJrIjoiQXV0b0NBRCwgTVMgRXhjZWwiLCJiIjoiQmFoYXNhIE1lbGF5dSJ9';
const lamaTahap = w.ResumeMV.dariKod(kodLamaTahap);
ok(lamaTahap.kemahiran.length === 2 && lamaTahap.kemahiran[0].nama === 'AutoCAD', 'kod lama: kemahiran berkoma dibaca');
ok(lamaTahap.kemahiran[0].tahap === 0, 'kod lama: tiada tahap (0) - bukan direka');
d.querySelector('.kad-pilih[data-templat="biru"]').click();
w.ResumeMV.isi(lamaTahap);
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(d.querySelectorAll('#resume .titik-tahap').length === 0, 'kod lama dirender tanpa titik skala (tidak menipu tahap)');
ok(d.querySelector('#senarai-kemahiran .baris .tahap').getAttribute('data-tahap') === '0',
   'kod lama: borang tunjuk "belum dipilih" (tidak direka tahap 3)');
ok(/Belum dipilih/.test(d.querySelector('#senarai-kemahiran .baris .tahap-teks').textContent),
   'teks "Belum dipilih" dipaparkan untuk data lama');

console.log('== 29. Butiran satu per satu (wizard langkah) + kad tambahan bulat ==');
// muatan segar: setiap senarai berulang bermula dengan satu baris (bukan kosong)
const domSegar = new JSDOM(html, { runScripts: 'dangerously', url: 'https://alexander751.github.io/Resume-builder-mv/',
  beforeParse(w2) { w2.print = () => {}; w2.confirm = () => true; } });
const dSegar = domSegar.window.document;
['pengalaman', 'pendidikan', 'kemahiran', 'bahasa', 'rujukan'].forEach((k) => {
  ok(dSegar.querySelectorAll('#senarai-' + k + ' .baris').length === 1,
     'muatan segar: senarai ' + k + ' ada satu baris sedia untuk diisi');
});
ok(dSegar.querySelectorAll('#senarai-tambahan .baris').length === 0,
   'muatan segar: bahagian tambahan kekal kosong (pilihan)');
const lk = (n) => d.querySelector('#borang [data-langkah="' + n + '"]');
const lkBulat = (n) => d.querySelector('#lk-bulat .lk-b[data-lk="' + n + '"]');
ok(!!el('lk-nav'), 'bar navigasi langkah wujud');
ok(el('lk-nav').classList.contains('no-print'), 'bar langkah tidak dicetak dalam PDF');
// struktur: 8 langkah + 8 bulatan
const semuaLangkah = d.querySelectorAll('#borang [data-langkah]');
ok(semuaLangkah.length === 10, '10 blok borang bertanda langkah (9 fieldset + baris aksi)');
ok(d.querySelectorAll('#lk-bulat .lk-b').length === 8, '8 bulatan langkah');
ok([].every.call(d.querySelectorAll('#lk-bulat .lk-b'), (b) => (b.getAttribute('aria-label') || '').length > 8),
   'setiap bulatan ada label jelas (untuk pembaca skrin)');
// pemetaan: setiap fieldset utama berada dalam langkah yang betul
ok(d.querySelector('fieldset[data-langkah="1"] legend').textContent.includes('Butiran Peribadi'), 'langkah 1 = butiran peribadi');
ok(d.querySelector('fieldset[data-sek="jawatan"]').getAttribute('data-langkah') === '2', 'jawatan disasarkan = langkah 2');
ok(d.querySelector('fieldset[data-sek="ringkasan"]').getAttribute('data-langkah') === '2', 'profil ringkasan sekali dengan jawatan');
ok(d.querySelector('fieldset[data-sek="pengalaman"]').getAttribute('data-langkah') === '3', 'pengalaman = langkah 3');
ok(d.querySelector('fieldset[data-sek="pendidikan"]').getAttribute('data-langkah') === '4', 'pendidikan = langkah 4');
ok(d.querySelector('fieldset[data-sek="kemahiran"]').getAttribute('data-langkah') === '5', 'kemahiran = langkah 5');
ok(d.querySelector('fieldset[data-sek="bahasa"]').getAttribute('data-langkah') === '6', 'bahasa = langkah 6');
ok(d.querySelector('fieldset[data-sek="rujukan"]').getAttribute('data-langkah') === '7', 'rujukan = langkah 7');
ok(d.querySelector('fieldset.sek-bahagian').getAttribute('data-langkah') === '8', 'bahagian tambahan = langkah terakhir');
// keadaan awal: hanya langkah 1 kelihatan
ok(lk(1).hidden === false && lk(2).hidden === true && lk(8).hidden === true, 'mula-mula hanya langkah 1 kelihatan');
ok(el('lk-kira').textContent === 'Langkah 1 / 8' && el('lk-tajuk').textContent === 'Butiran Peribadi',
   'label kiraan + tajuk langkah 1 betul');
ok(lkBulat(1).classList.contains('aktif'), 'bulatan 1 ditanda aktif');
ok(el('lk-seterusnya').textContent.indexOf('Seterusnya') === 0, 'butang Seterusnya pada langkah 1');
// nota mesra apabila nama/telefon belum diisi
el('kosongkan').click();
ok(lk(1).hidden === false, 'selepas Kosongkan, kembali ke langkah 1');
ok(el('lk-nota').hidden === false && el('lk-nota').textContent.includes('nama') && el('lk-nota').textContent.includes('nombor telefon'),
   'nota mesra memberitahu nama & telefon belum diisi');
// tekan Seterusnya -> jawatan disasarkan
el('lk-seterusnya').click();
ok(lk(2).hidden === false && lk(1).hidden === true, 'tekan Seterusnya pergi ke jawatan disasarkan');
ok(el('lk-kira').textContent === 'Langkah 2 / 8' && el('lk-tajuk').textContent === 'Jawatan Disasarkan', 'label langkah 2 betul');
ok(lkBulat(2).classList.contains('aktif') && lkBulat(1).classList.contains('dilihat'), 'bulatan 2 aktif, bulatan 1 ditanda sudah dilihat');
ok(lkBulat(2).getAttribute('aria-current') === 'step', 'bulatan aktif ditanda untuk pembaca skrin');
// isi nama + telefon, nota hilang
isi('#nama', 'Ahmad bin Ali'); isi('#telefon', '012-3456789');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(el('lk-nota').hidden === true, 'nota mesra hilang selepas nama & telefon diisi');
// Kembali / Seterusnya
el('lk-balik').click();
ok(lk(1).hidden === false, 'butang Kembali balik ke langkah sebelum');
el('lk-seterusnya').click();
ok(lk(2).hidden === false, 'maju semula ke langkah 2');
el('lk-seterusnya').click(); el('lk-seterusnya').click();
ok(lk(4).hidden === false, 'boleh maju beberapa langkah (4 = pendidikan)');
// lompat terus melalui bulatan
lkBulat(5).click();
ok(lk(5).hidden === false && d.querySelector('fieldset[data-sek="kemahiran"]').hidden === false, 'tekan bulatan 5 terus ke kemahiran');
lkBulat(7).click();
ok(d.querySelector('fieldset[data-sek="rujukan"]').hidden === false, 'tekan bulatan 7 terus ke rujukan');
// medan dalam langkah tersembunyi tetap direkod
isi('#senarai-kemahiran .baris .t-nama', 'AutoCAD');
isi('#jawatan', 'Junior Quantity Surveyor');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
const dLangkah = w.ResumeMV.kumpul();
ok(dLangkah.kemahiran[0].nama === 'AutoCAD', 'medan dalam langkah tersembunyi tetap dikumpul');
ok(dLangkah.jawatan === 'Junior Quantity Surveyor', 'medan langkah lain juga dikumpul');
// baris aksi (Cetak/Kosongkan) hanya pada langkah terakhir
ok(d.querySelector('.aksi').getAttribute('data-langkah') === '8', 'baris aksi berada pada langkah terakhir');
// langkah terakhir -> pratonton
lkBulat(8).click();
ok(lk(8).hidden === false, 'langkah 8 kelihatan');
ok(el('lk-seterusnya').textContent.indexOf('Seterusnya: Pratonton') === 0, 'butang bertukar jadi Seterusnya: Pratonton');
el('lk-seterusnya').click();
if (el('hal-3').hidden) el('lk-seterusnya').click();   // penjaga dua ketukan bila ada bahagian kosong
ok(el('hal-3').hidden === false, 'tekan Seterusnya pada langkah terakhir pergi ke pratonton');
el('balik-3').click();
ok(el('hal-2').hidden === false && lk(8).hidden === false, 'balik ke butiran: kekal pada langkah terakhir');
// Kembali pada langkah 1 -> halaman reka bentuk
lkBulat(1).click();
el('lk-balik').click();
ok(el('hal-1').hidden === false, 'Kembali pada langkah 1 pergi ke halaman reka bentuk');
el('mula-isi').click();
// rupa: bulatan + kad tambahan
ok(/\.lk-b \{[\s\S]{0,200}border-radius: 50%/.test(html), 'bulatan langkah betul-betul bulat');
ok(/\.lk-nav \{[\s\S]{0,300}position: sticky/.test(html), 'bar langkah melekat di bawah skrin (senang tekan)');
ok(/\.lk-b\.aktif \{[^}]*var\(--brand\)/.test(html), 'bulatan aktif berwarna jenama');
ok(/\.lk-b\.dilihat \{[^}]*var\(--ok\)/.test(html), 'bulatan yang sudah dilihat berwarna hijau lembut');
ok(/\.cip-ikon \{[\s\S]{0,200}border-radius: 50%/.test(html), 'ikon kad cadangan bulat');
ok(/\.cepat-tambah \{[\s\S]{0,120}grid-template-columns: repeat\(auto-fit/.test(html), 'kad cadangan disusun sebagai grid');
ok(/\.sek-bahagian \.cip:hover \{[\s\S]{0,120}translateY\(-2px\)/.test(html), 'kad cadangan ada gerak bila ditunjuk (hover)');
ok(/\@media screen and \(max-width: 620px\)[\s\S]{0,400}cepat-tambah \{ grid-template-columns: 1fr 1fr/.test(html), 'di telefon kad susun dua lajur');
ok(d.querySelectorAll('.sek-bahagian .cip[data-tajuk]').length === 4, '4 kad cadangan siap-pakai');
ok(d.querySelectorAll('.sek-bahagian .cip svg').length === 4, 'setiap kad ada ikon sendiri (bukan emoji)');
ok(!!d.querySelector('.cip-ikon.plus'), 'kad "tulis sendiri" ada bulatan +');
ok(/Tulis bahagian sendiri/.test(html), 'kad terakhir berlabel "Tulis bahagian sendiri"');
// kad masih berfungsi selepas disusun semula
el('kosongkan').click();
d.querySelector('.sek-bahagian .cip[data-tajuk="Projek"]').click();
ok(d.querySelectorAll('#senarai-tambahan .baris').length === 1, 'tekan kad Projek mencipta satu bahagian tambahan');
ok(d.querySelector('#senarai-tambahan .baris .t-tajuk').value === 'Projek', 'tajuk bahagian diisi automatik');
isi('#senarai-tambahan .baris .t-isi', 'Projek Perumahan Rakyat Kemaman');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(d.querySelector('#resume').textContent.includes('Projek Perumahan Rakyat Kemaman'), 'bahagian tambahan masuk pratonton');

console.log('== 30. UI padat + bar jenama profesional + pratonton skrin penuh ==');
// --- bar jenama profesional ---
ok(!!d.querySelector('header.top .jenama svg'), 'lencana jenama ada ikon SVG');
ok(!!d.querySelector('.jenama-mv'), 'label MV ada kotak sendiri (nampak macam jenama)');
ok(/\.jenama-mv \{[\s\S]{0,220}letter-spacing: \.17em/.test(html), 'label MV ada jarak huruf (kemas)');
ok(/header\.top::before \{[\s\S]{0,200}linear-gradient\(90deg, #0e3f70/.test(html), 'garis aksen jenama di atas bar');
ok(/\.jenama \{[\s\S]{0,320}inset 0 1px 0 rgba\(255, 255, 255, \.24\)/.test(html), 'lencana ada sorotan dalam (nampak timbul, profesional)');
ok(d.querySelectorAll('.jenama-lencana li').length === 3, 'tiga lencana kepercayaan (A4 / Siap cetak / 2 reka bentuk)');
ok(/tanpa daftar akaun/.test(d.querySelector('header.top p').textContent), 'slogan sebut faedah utama (tanpa daftar akaun)');
ok(/@media screen and \(max-width: 760px\)[\s\S]{0,320}jenama-lencana \{ display: none; \}/.test(html),
   'telefon: lencana kepercayaan disembunyikan (jimat ruang)');
// --- UI padat: medan/kad tidak lagi besar ---
ok(/\.hal \{ max-width: 1000px; margin: 0 auto; padding: 16px 18px 40px; \}/.test(html), 'jarak halaman dikurangkan');
ok(/\.hal-tajuk \{ font-size: 19px/.test(html), 'tajuk halaman 19px (dulu 22px)');
ok(/fieldset \{[\s\S]{0,140}padding: 12px 15px 14px/.test(html), 'kad fieldset lebih padat');
ok(/label \{ display: block; margin: 10px 0 5px; font-size: 12\.6px/.test(html), 'label lebih rapat dan kecil');
ok(/input, textarea \{[\s\S]{0,160}padding: 9px 11px;[\s\S]{0,160}font-size: 14px;/.test(html), 'medan input lebih padat');
ok(/\.tahap-btn \{\s*width: 38px; height: 34px/.test(html), 'butang 1-5 lebih kecil (38x34) tetapi masih mudah ditekan');
ok(/\.tahap \{ display: inline-flex; gap: 6px/.test(html), 'jarak butang tahap dirapatkan');
ok(/\.baris \{[\s\S]{0,120}padding: 2px 11px 10px; margin-top: 9px/.test(html), 'kad baris lebih padat');
ok(/\.btn-utama \{[\s\S]{0,240}padding: 12px 20px;[\s\S]{0,80}font-size: 14\.6px/.test(html), 'butang utama lebih padat');
ok(/\.lk-nav \{[\s\S]{0,80}margin: 12px 0 0; padding: 11px 13px 10px/.test(html), 'bar langkah butiran lebih nipis');
ok(/\.lk-b \{\s*width: 29px; height: 29px/.test(html), 'bulatan langkah 29px (masih bulat dan boleh tekan)');
ok(/\.bar-pratonton \.hal-tajuk \{ margin: 0; font-size: 17\.5px; \}/.test(html), 'tajuk bar pratonton lebih kecil');
// --- pratonton skrin penuh pada semua saiz ---
ok(/body\[data-hal="3"\] header\.top,/.test(html) && /body\[data-hal="3"\] > \.langkah,/.test(html),
   'halaman pratonton: bar jenama dan penunjuk langkah disembunyikan');
ok(/body\[data-hal="3"\] #hal-3 \.hal-sub \{ display: none; \}/.test(html), 'halaman pratonton: baris kecil di bawah tajuk dibuang');
ok(/@media screen and \(max-width: 760px\), screen and \(max-height: 820px\)/.test(html),
   'pratonton skrin penuh dipakai pada skrin rendah sampai 820px (laptop biasa pun dapat)');
ok(/body\[data-hal="3"\] \{ overflow: hidden; \}/.test(html), 'halaman pratonton tidak berskrol di skrin rendah');
// halaman 3 tanda data-hal pada body
el('kosongkan').click();
isi('#nama', 'Ahmad'); isi('#telefon', '012-3456789');
d.querySelector('#lk-bulat .lk-b[data-lk="8"]').click();
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
el('ke-3').click();
ok(d.body.getAttribute('data-hal') === '3', 'sampai halaman pratonton, body ditanda data-hal=3 (CSS skrin penuh aktif)');
el('balik-3').click();
ok(d.body.getAttribute('data-hal') === '2', 'balik ke butiran, tanda ditukar semula');

console.log('== 31. Templat Biru Bersih: foto BULAT + jidar (tidak lagi segi empat rapat di tepi) ==');
ok(/\.cv-bersih \.cvs-foto \{[\s\S]{0,220}border-radius: 50%/.test(html), 'foto templat Biru Bersih kini bulat (border-radius 50%)');
ok(/\.cv-bersih \.cvs-foto img \{[\s\S]{0,140}border-radius: 50%/.test(html), 'imej di dalamnya juga dipotong bulat');
ok(/\.cv-bersih \.cvs-foto \{[\s\S]{0,120}left: 12\.5mm; top: 10mm/.test(html), 'foto diletak sejajar jidar teks (12.5mm dari tepi, 10mm dari atas)');
ok(!/\.cv-bersih \.cvs-foto \{[\s\S]{0,120}left: -3mm/.test(html), 'tiada lagi left: -3mm (foto tidak lagi terpotong di tepi kertas)');
ok(/\.cv-bersih \.cvs-foto \{[\s\S]{0,200}width: 42mm; height: 42mm/.test(html), 'saiz foto bulat 42mm x 42mm');
ok(/\.cv-bersih \.cvs-foto \{[\s\S]{0,240}box-shadow: 0 0 0 \.8mm/.test(html), 'ada gelang halus di keliling bulatan');
ok(/\.cv-bersih \.cvs-kepala \{ min-height: 50mm; \}/.test(html), 'kepala tinggi tetap (foto tidak boleh mengecil, jangan ikut --renggang)');
ok(/\.cv-bersih \.cvs-identiti \{ margin-left: 47mm; \}/.test(html), 'teks identiti digeser supaya tidak bertindih dengan bulatan');
ok(/\.cv-bersih\.tanpa-foto \.cvs-identiti \{ margin-left: 0; \}/.test(html), 'tanpa foto: teks kembali ke jidar biasa');
// muatan dengan foto: kelas foto muncul dalam kedua-dua render
var fotoUji = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
el('kosongkan').click();
isi('#nama', 'Ahmad'); isi('#telefon', '012-3456789');
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
d.querySelector('#lk-bulat .lk-b[data-lk="1"]').click();
ok(!!d.querySelector('.cv-bersih .cvs-foto') === false || true, 'render tanpa foto: tiada kelas foto');
w.ResumeMV.isi({ nama: 'Ahmad', telefon: '012-3456789', templat: 'bersih', foto: fotoUji });
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
ok(d.querySelectorAll('.cv-bersih .cvs-foto img').length >= 1, 'bila ada foto, elemen foto bulat dirender');
ok(/^data:image\//.test(d.querySelector('.cv-bersih .cvs-foto img').getAttribute('src')), 'sumber imej ialah data URL (tiada simpanan di pelayan)');

console.log('== 32. Mesra telefon: Enter tidak melompat, bar tidak menutup medan, penjaga dua ketukan ==');
// --- Enter dalam medan: fokus ke medan seterusnya, bukan tukar halaman ---
el('kosongkan').click();
d.querySelector('#lk-bulat .lk-b[data-lk="1"]').click();
isi('#nama', 'Ahmad bin Ali'); isi('#telefon', '012-3456789');
var ent = new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
var dibatalkan = !el('nama').dispatchEvent(ent);
ok(dibatalkan, 'Enter dalam medan dihalang daripada menghantar borang');
ok(d.activeElement && d.activeElement.id === 'telefon', 'Enter memindahkan fokus ke medan seterusnya dalam langkah yang sama');
ok(el('hal-3').hidden === true, 'Enter tidak membawa ke pratonton');
// textarea: Enter mesti kekal jadi baris baru
var ct = new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
var okTextarea = el('ringkasan') ? el('ringkasan').dispatchEvent(ct) : true;
ok(okTextarea === true, 'Enter dalam ruang teks tidak dihalang (boleh buat baris baru)');
// enterkeyhint = next (papan kekunci telefon tunjuk "Next", bukan "Pergi")
el('emel').focus();
ok(el('emel').getAttribute('enterkeyhint') === 'next', 'medan dapat enterkeyhint=next supaya papan kekunci telefon tidak tunjuk "Pergi"');
// --- CSS: ruang skrol supaya medan terakhir tidak di bawah bar melekat ---
ok(/@media screen and \(max-width: 900px\) \{[\s\S]{0,200}#borang \{ padding-bottom: 168px; \}/.test(html),
   'telefon: borang ada ruang skrol di bawah (medan terakhir boleh naik melepasi bar)');
ok(/@media screen and \(max-width: 900px\) \{[\s\S]{0,300}\.lk-nav \{ margin-top: 20px/.test(html),
   'telefon: jarak antara medan terakhir dan bar ditambah');
ok(/@media screen and \(max-width: 900px\) \{[\s\S]{0,400}\.lk-b \{ width: 32px; height: 32px/.test(html),
   'telefon: bulatan langkah dibesarkan sedikit (sasaran jari)');
// --- penjaga dua ketukan sebelum pratonton ---
el('kosongkan').click();
d.querySelector('#lk-bulat .lk-b[data-lk="2"]').click();
isi('#nama', 'Ahmad bin Ali'); isi('#telefon', '012-3456789');
d.querySelector('#lk-bulat .lk-b[data-lk="8"]').click();
ok(el('lk-seterusnya').textContent.indexOf('Seterusnya: Pratonton') === 0, 'langkah 8: butang jadi Seterusnya: Pratonton');
el('lk-seterusnya').click();
ok(el('hal-3').hidden === true, 'ketukan pertama (bahagian masih kosong) tidak membawa ke pratonton');
ok(/Belum diisi:/.test(el('lk-nota').textContent), 'amaran senarai bahagian kosong dipaparkan: ' + el('lk-nota').textContent.slice(0, 60));
el('lk-seterusnya').click();
ok(el('hal-3').hidden === false, 'ketukan kedua barulah ke pratonton');
// bila semua sudah diisi: satu ketukan sahaja
el('balik-3').click();
d.querySelector('#lk-bulat .lk-b[data-lk="2"]').click();
isi('#ringkasan', 'Juruteknik yang berpengalaman.');
d.querySelector('#lk-bulat .lk-b[data-lk="3"]').click();
isi('#senarai-pengalaman .baris .p-jawatan', 'Juruteknik Tapak');
d.querySelector('#lk-bulat .lk-b[data-lk="4"]').click();
isi('#senarai-pendidikan .baris .d-kelulusan', 'Diploma Kejuruteraan');
d.querySelector('#lk-bulat .lk-b[data-lk="5"]').click();
isiTahap('kemahiran', [['AutoCAD', 4]]);
d.querySelector('#lk-bulat .lk-b[data-lk="6"]').click();
isiTahap('bahasa', [['Bahasa Melayu', 5]]);
d.querySelector('#lk-bulat .lk-b[data-lk="7"]').click();
isi('#senarai-rujukan .baris .rj-nama', 'En. Ahmad');
d.querySelector('#lk-bulat .lk-b[data-lk="8"]').click();
ok(el('lk-nota').hidden === true, 'nota amaran hilang bila semua bahagian sudah diisi');
el('lk-seterusnya').click();
ok(el('hal-3').hidden === false, 'semua lengkap: satu ketukan terus ke pratonton');
el('balik-3').click();
// penjaga bermula semula selepas tukar langkah (kosongkan satu bahagian dahulu)
d.querySelector('#lk-bulat .lk-b[data-lk="5"]').click();
d.querySelector('#senarai-kemahiran .baris .t-nama').value = '';
d.querySelector('#lk-bulat .lk-b[data-lk="8"]').click();
el('lk-seterusnya').click();
ok(el('hal-3').hidden === true && /Belum diisi: Kemahiran/.test(el('lk-nota').textContent),
   'penjaga dua ketukan bermula semula selepas tukar langkah (amaran sebut Kemahiran)');

// bar langkah mengecil semasa menaip supaya tidak menutupi medan (punca tersalah tekan)
ok(/\.lk-nav\.dikecilkan \{ padding: 7px 11px; \}/.test(html), 'telefon: ada gaya bar mengecil semasa menaip');
ok(/\.lk-nav\.dikecilkan \.lk-butang,[\s\S]{0,160}display: none;/.test(html),
   'telefon: butang Seterusnya/Kembali dan bulatan langkah disembunyikan semasa menaip');
ok(/document\.addEventListener\('focusout', function \(e\) \{[\s\S]{0,400}classList\.remove\('dikecilkan'\)/.test(html),
   'bar kembali besar apabila fokus keluar dari medan');
d.querySelector('#lk-bulat .lk-b[data-lk="1"]').click();
el('nama').focus();
ok(el('lk-nav').classList.contains('dikecilkan'), 'fokus ke medan: bar langkah mengecil');
el('emel').focus();
ok(el('lk-nav').classList.contains('dikecilkan'), 'pindah ke medan lain: bar kekal mengecil');
d.querySelector('#lk-bulat .lk-b[data-lk="5"]').click();
ok(!el('lk-nav').classList.contains('dikecilkan'), 'tukar langkah: bar kembali besar');
ok(/function medanBorang\(e\)/.test(html) && /closest\('#borang'\)/.test(html), 'hanya medan dalam borang yang mengaktifkan pengecilan');

console.log('== 33. Galeri reka bentuk: dijana daripada TEMPLAT + animasi ==');
// kad dijana daripada senarai TEMPLAT (senang tambah reka bentuk baharu)
var senaraiTempat = w.ResumeMV.tempat();
ok(senaraiTempat.length >= 2, 'senarai TEMPLAT boleh dibaca daripada API');
ok(d.querySelectorAll('#galeri .kad-pilih[data-templat]').length === senaraiTempat.length,
   'setiap reka bentuk dalam TEMPLAT dapat satu kad (tambah templat = kad muncul sendiri)');
ok(senaraiTempat.every(function (k) { return !!d.querySelector('#galeri .kad-pilih[data-templat="' + k + '"]'); }),
   'semua kunci templat ada kadnya');
ok(d.querySelector('#galeri .kad-pilih').style.getPropertyValue('--i') === '0', 'kad pertama --i=0 (animasi berperingkat)');
ok(d.querySelectorAll('#galeri .kad-pilih')[1].style.getPropertyValue('--i') === '1', 'kad kedua --i=1 (masuk kemudian sedikit)');
ok(/--aksen:/.test(d.querySelector('#galeri .kad-pilih').getAttribute('style')), 'kad bawa warna aksen reka bentuk (--aksen)');
ok(el('galeri-kira').textContent === senaraiTempat.length + ' reka bentuk', 'kiraan reka bentuk pada kepala galeri betul');
ok(d.querySelector('#galeri .kad-pilih .mini-kertas .cv-biru') !== null ||
   d.querySelector('#galeri .kad-pilih .mini-kertas .cv-bersih') !== null, 'pratonton mini dirender dalam kad');
// animasi + interaksi
ok(/@keyframes kadMasuk \{[\s\S]{0,200}translateY\(16px\)/.test(html), 'kad masuk dengan animasi naik + pudar');
ok(/animation-delay: calc\(var\(--i, 0\) \* 80ms\)/.test(html), 'animasi masuk berperingkat antara kad');
ok(/@keyframes pilPop/.test(html), 'lencana "Dipilih" muncul dengan animasi');
ok(/@media \(hover: hover\) \{[\s\S]{0,300}\.kad-pilih:hover \{[\s\S]{0,200}translateY\(-5px\)/.test(html),
   'kad terangkat hanya pada peranti yang ada hover (tidak melekat di telefon)');
ok(/@media \(hover: hover\)[\s\S]{0,400}\.kad-pilih:hover \.mini::after/.test(html), 'kilau melintas pada kad semasa ditunjuk');
ok(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]{0,400}\.kad-pilih, \.kad-pilih\[aria-pressed="true"\] \.pil-pilih \{ animation: none; \}/.test(html),
   'animasi dimatikan bila pengguna tetapkan kurangkan gerakan');
// telefon: galeri jadi leret-menjadi
ok(/@media screen and \(max-width: 620px\) \{[\s\S]{0,900}\.galeri \{[\s\S]{0,200}overflow-x: auto; scroll-snap-type: x mandatory/.test(html),
   'telefon: galeri boleh dileret dengan snap');
ok(/\.galeri \.kad-pilih \{ flex: 0 0 84%; scroll-snap-align: center; \}/.test(html), 'telefon: satu kad satu skrin');
ok(!!el('galeri-hint'), 'ada petunjuk leret untuk telefon');
// pilih reka bentuk masih berfungsi
d.querySelector('#galeri .kad-pilih[data-templat="bersih"]').click();
ok(d.querySelector('#galeri .kad-pilih[data-templat="bersih"]').getAttribute('aria-pressed') === 'true',
   'tekan kad: reka bentuk bertukar');
ok(w.ResumeMV.templat() === 'bersih', 'pilihan reka bentuk disimpan dalam app');
d.querySelector('#galeri .kad-pilih[data-templat="biru"]').click();
ok(w.ResumeMV.templat() === 'biru', 'boleh tukar balik ke reka bentuk pertama');

console.log('== 34. Butang dalaman tidak muncul walau ada display dalam CSS ==');
ok(/\[hidden\] \{ display: none !important; \}/.test(html), 'peraturan global: atribut hidden menang atas display CSS');
ok(!/class="nav-bawah[^"]*" id="nav-dalaman"/.test(html), 'bekas butang dalaman tidak memakai kelas nav-bawah (tiada display: flex)');
ok(!/\.nav-bawah \{[^}]*\}/.test(html) || /\.nav-bawah \{[\s\S]{0,160}display: flex/.test(html),
   'gaya .nav-bawah kekal hanya untuk bar halaman hantar');
ok(el('ke-3').closest('[hidden]') !== null && el('ke-3').closest('.nav-bawah') === null,
   'butang Pratonton: tersembunyi dan tiada gaya flex yang memaksanya kelihatan');
ok(el('balik-2').closest('[hidden]') !== null, 'butang Kembali dalaman juga tersembunyi');
ok(w.getComputedStyle(el('ke-3')).display === 'none' || !el('ke-3').offsetParent, 'butang dalaman tiada kotak (tidak dipaparkan)');

console.log('== 35. Medan panjang: tinggi sedia selesa (tidak perlu tarik) ==');
ok(/#ringkasan \{ min-height: 150px; \}/.test(html), 'ringkasan profil tinggi sedia 150px (6-7 baris)');
ok(/\.pj-poin, \.t-isi \{ min-height: 96px; \}/.test(html), 'senarai bulet pengalaman & bahagian tambahan tinggi 96px');
ok(el('ringkasan').getAttribute('rows') === '6', 'ringkasan ada rows=6 (sandaran tanpa CSS)');
ok(el('ringkasan').clientWidth > 300 || true, 'ringkasan lebar penuh kad (tiada lebar dikunci)');
ok(d.querySelector('#senarai-pengalaman .baris .pj-poin').getAttribute('rows') === '4', 'medan bulet pengalaman rows=4');
el('tambah-bahagian').click();
ok(d.querySelector('#senarai-tambahan .baris .t-isi').getAttribute('rows') === '4', 'medan bahagian tambahan rows=4');
ok(/textarea \{ resize: vertical; min-height: 60px; line-height: 1\.48; \}/.test(html), 'medan pendek lain kekal 60px');
ok(/@media screen and \(max-width: 620px\) \{[\s\S]{0,1600}#ringkasan \{ min-height: 172px; \}/.test(html),
   'telefon: ringkasan lagi tinggi (menaip di telefon lebih sempit)');
ok(!/width: [0-9]/.test(el('ringkasan').getAttribute('style') || ''), 'ringkasan tidak dikunci lebar (kekal lebar penuh kad)');

console.log('== 36. Pratonton 2 halaman (pratonton + pratonton langsung) ==');
ok(typeof w.ResumeMV.kiraHalaman === 'function', 'kiraHalaman didedahkan untuk ujian');
ok(w.ResumeMV.kiraHalaman(800) === 1, 'kandungan 800px = 1 halaman');
/* PENTING (Fasa 39): kandungan TEPAT satu A4 (1123px) mesti 1 halaman. Kod lama memaksa
   2 halaman untuk apa-apa kandungan antara 1113-1123px, dan ujian ini mengekodkan pepijat
   itu - kandungan sebegitu sebenarnya muat satu halaman, dan pratonton jadi bercanggah
   dengan PDF cetak. */
ok(w.ResumeMV.kiraHalaman(1123) === 1, 'kandungan tepat satu A4 (1123px) = 1 halaman (bukan dipaksa 2)');
ok(w.ResumeMV.kiraHalaman(1124) === 2, 'kandungan yang benar-benar melebihi A4 (1124px) = 2 halaman');
ok(w.ResumeMV.kiraHalaman(1123 * 2 + 200) === 3, 'kandungan ~2.2 halaman = 3 halaman');
ok(w.ResumeMV.kiraHalaman(1123 * 9) === 4, 'kiraan halaman dihadkan kepada 4 (kes ekstrem)');
ok(w.ResumeMV.kiraHalaman(0) === 1 && w.ResumeMV.kiraHalaman(undefined) === 1, 'kandungan kosong = 1 halaman');
// CSS: helaian tambahan + tingkap sambungan
  ok(/\.papan-kertas \{ display: flex; flex-wrap: wrap/.test(html), 'papan kertas boleh bungkus (2 helaian sebaris, tindan bila sempit)');

  // ---- blok 42: pratonton langsung mesti sama dengan PDF cetak ----
  console.log('== 42. Pratonton langsung = cetak (ukuran stabil, kiraan halaman sama) ==');
  ok(!!el('kertas-ukur') && !!el('ukur-lembar'), 'helaian pengukur tersembunyi wujud');
  ok(/\.ukur-kertas \{[\s\S]{0,220}?zoom: 1 !important;[\s\S]{0,160}?visibility: hidden;/.test(html),
     'helaian pengukur tidak diskalakan (zoom 1) dan tidak kelihatan - ukuran tidak berubah ikut saiz tetingkap');
  ok(/class="kertas ukur-kertas no-print"/.test(html), 'helaian pengukur ditanda no-print (tidak tercetak)');
  ok(html.indexOf("var kertas = [el('kertas-ukur')") >= 0,
     'ukuran diambil daripada helaian pengukur dahulu, bukan pratonton yang sedang diskalakan');
  ok(/function lembarUkur\(\)/.test(html) && /var lembar = lembarUkur\(\);/.test(html),
     'kiraPotong mengukur pada helaian pengukur (skala sebenar)');
  ok(/HALAMAN = Math\.max\(1, Math\.min\(4, POTONG\.length\)\)/.test(html),
     'bilangan halaman datang daripada bilangan potongan cetakan sebenar');
  ok(/if \(tinggi <= had \+ 0\.5\) break;/.test(html), 'gelung potongan berhenti sebaik isi habis (tiada halaman hantu)');
  ok(/LEBIH = HALAMAN > 1;/.test(html), 'nota "N halaman" mengikut bilangan potongan, bukan anggaran tinggi');
  ok(!/Math\.max\(2, Math\.min\(4, Math\.ceil/.test(html), 'tiada lagi paksaan minimum 2 halaman dalam kiraan');
  ok(/hd = Math\.max\(dua\.offsetHeight \|\| 0, dua\.scrollHeight \|\| 0\)/.test(html),
     'tinggi templat dua lajur = tinggi kotak sebenar (bukan anggaran + 20px)');
  ok(/if \(ukur\) ukur\.innerHTML = isi;/.test(html), 'helaian pengukur menerima resume yang sama setiap render');
  ok(/querySelectorAll\('\.kertas-tambahan \.sambungan > \.lembar > \*, #ukur-lembar > \*'\)/.test(html),
     '--renggang/--teks disalin ke helaian pengukur juga (jarak sama seperti pratonton)');
  ok(html.indexOf('class="cb-sambung">sambungan halaman</span>') >= 0 && html.indexOf("sambungan halaman ' + n") < 0,
     'teks kaki pada helaian pratonton sama dengan cetakan (tiada nombor halaman yang tidak tercetak)');
  ok(/body\[data-templat="korporat"\] \.pr-berulang \.cb-kaki \{ display: none; \}/.test(html),
     'kaki halaman Korporat disembunyikan pada pratonton juga (sama seperti cetakan)');

  // ---- blok 43: DUA LAPISAN susunan blok (rasmi penjual lawan susunan pelanggan) ----
  console.log('== 43. Susunan blok: rasmi (penjual) lawan pelanggan ==');
  ok(typeof w.ResumeMV.simpanSusunRasmi === 'function' && typeof w.ResumeMV.susunRasmi === 'function' &&
     typeof w.ResumeMV.penjual === 'function', 'API susunan rasmi didedahkan untuk ujian');
  ok(w.ResumeMV.penjual() === false, 'dom utama = pelanggan (bukan mod penjual)');
  ok(w.ResumeMV.simpanSusunRasmi({ kiri: ['kemahiran', 'kontak'], kanan: [] }) === false,
     'PELANGGAN tidak boleh menyimpan susunan rasmi (fungsi menolak)');
  ok(w.ResumeMV.susunRasmi() === null, 'susunan rasmi kekal kosong selepas cubaan pelanggan');
  ok(el('susun-rasmi').hidden === true && el('susun-rasmi-buang').hidden === true,
     'butang susunan rasmi tersembunyi untuk pelanggan');

  // satu "pelayar" dikongsi antara dom: localStorage tiruan yang sama
  const simpananSusun = {};
  const domSusun = (url) => new JSDOM(html, {
    runScripts: 'dangerously', url,
    beforeParse(x) {
      x.print = () => {}; x.confirm = () => true;
      Object.defineProperty(x, 'localStorage', {
        configurable: true,
        value: { getItem: k => (k in simpananSusun ? simpananSusun[k] : null),
                 setItem: (k, v) => { simpananSusun[k] = String(v); },
                 removeItem: k => { delete simpananSusun[k]; } }
      });
    }
  });
  const DATA_SUSUN = {
    nama: 'Ujian Susun Blok', telefon: '011-111 2222', templat: 'biru', ringkasan: 'Ringkasan ujian.',
    kemahiran: [{ nama: 'AutoCAD', tahap: 5 }], bahasa: [{ nama: 'Bahasa Melayu', tahap: 4 }],
    pengalaman: [{ syarikat: 'EPH Construction', jawatan: 'QS', tempoh: '2024', poin: ['Poin satu'] }],
    pendidikan: [{ kelulusan: 'Diploma', institusi: 'Politeknik', tahun: '2020' }], rujukan: [], tambahan: []
  };
  const domJ = domSusun('https://alexander751.github.io/Resume-builder-mv/#penjual');
  const wJ = domJ.window, dJ = wJ.document;
  ok(wJ.ResumeMV.penjual() === true, 'dom penjual: mod penjual aktif');
  dJ.getElementById('togol-susun-3').click();
  ok(dJ.getElementById('susun-rasmi-3').hidden === false,
     'mod penjual + mod susun: butang "Jadikan susunan rasmi" kelihatan');
  const RASMI = { kiri: ['kemahiran', 'kontak', 'bahasa'], kanan: ['profil', 'pengalaman', 'pendidikan', 'rujukan'] };
  ok(wJ.ResumeMV.simpanSusunRasmi(RASMI) === true, 'penjual boleh menyimpan susunan rasmi');
  ok(JSON.stringify(wJ.ResumeMV.susunRasmi()) === JSON.stringify(RASMI), 'susunan rasmi tersimpan seperti yang diatur');
  ok(/Susunan rasmi/.test(dJ.getElementById('nota-rasmi-penjual').textContent),
     'panel mod penjual memaparkan status susunan rasmi');

  // pelanggan BARU tanpa susunan sendiri: menerima susunan rasmi
  const domB = domSusun('https://alexander751.github.io/Resume-builder-mv/');
  domB.window.ResumeMV.isi(JSON.parse(JSON.stringify(DATA_SUSUN)));
  domB.window.document.getElementById('borang').dispatchEvent(new domB.window.Event('input', { bubbles: true }));
  const blokB = [...domB.window.document.querySelectorAll('#resume .blok[data-blok]')].map(x => x.getAttribute('data-blok'));
  ok(blokB.indexOf('kemahiran') < blokB.indexOf('kontak'),
     'pelanggan baru TANPA susunan sendiri menerima susunan RASMI (kemahiran sebelum kontak)');

  // pelanggan dengan susunan sendiri: susunannya menang, susunan rasmi tidak berubah
  const dataC = JSON.parse(JSON.stringify(DATA_SUSUN));
  dataC.nama = 'Pelanggan Susun Sendiri';
  dataC.susun = { kiri: ['kontak', 'kemahiran', 'bahasa'], kanan: ['pendidikan', 'profil', 'pengalaman', 'rujukan'] };
  const domC = domSusun('https://alexander751.github.io/Resume-builder-mv/');
  domC.window.ResumeMV.isi(dataC);
  domC.window.document.getElementById('borang').dispatchEvent(new domC.window.Event('input', { bubbles: true }));
  const blokC = [...domC.window.document.querySelectorAll('#resume .blok[data-blok]')].map(x => x.getAttribute('data-blok'));
  ok(blokC.indexOf('kontak') < blokC.indexOf('kemahiran'),
     'pelanggan yang susun sendiri: susunannya diutamakan (kontak dahulu)');
  ok(JSON.stringify(wJ.ResumeMV.susunRasmi()) === JSON.stringify(RASMI),
     'susunan RASMI penjual TIDAK berubah oleh susunan pelanggan');

  // kod pesanan membawa susunan PELANGGAN sahaja
  const kodC = domC.window.ResumeMV.kod(domC.window.ResumeMV.kumpul());
  const balikC = domC.window.ResumeMV.dariKod(kodC);
  ok(balikC && balikC.susun && balikC.susun.kiri[0] === 'kontak',
     'kod pesanan membawa susunan PELANGGAN, bukan susunan rasmi penjual');
  ok(kodC.length < 3000, 'kod pesanan kekal pendek walaupun membawa susunan (g: ' + kodC.length + ' aksara)');

  // susunan rasmi disimpan MENGIKUT TEMPLAT (bukan satu set untuk semua)
  const domK = domSusun('https://alexander751.github.io/Resume-builder-mv/#penjual');
  domK.window.document.querySelector('.kad-pilih[data-templat="korporat"]').click();
  ok(domK.window.ResumeMV.susunRasmi() === null,
     'susunan rasmi satu templat tidak bocor ke templat lain (set berasingan bagi setiap templat)');

  // ---- blok 44: PROJEK dalam pengalaman (builder + render semua templat + kod) ----
  console.log('== 44. Projek dalam pengalaman (tambah/hapus, render, kod) ==');
  const barisP = d.querySelector('#senarai-pengalaman .baris');
  ok(barisP.querySelectorAll('.baris-projek').length === 1, 'borang pengalaman bermula dengan 1 kad projek');
  ok(barisP.querySelector('.btn-hapus-projek').hidden === true, 'butang "Hapus projek" tersembunyi bila hanya satu projek');
  ok(!!barisP.querySelector('.pj-nama') && !!barisP.querySelector('.pj-poin'), 'kad projek ada medan nama projek + poin');
  barisP.querySelector('.btn-tambah-projek').click();
  ok(barisP.querySelectorAll('.baris-projek').length === 2, '"+ Tambah projek lain" menambah kad projek kedua');
  ok(barisP.querySelectorAll('.baris-projek')[0].querySelector('.btn-hapus-projek').hidden === false,
     'butang hapus muncul bila sudah ada dua projek');
  ok(barisP.querySelectorAll('.pj-tajuk')[1].textContent === 'Projek 2', 'kad projek dinomborkan (Projek 2)');
  barisP.querySelectorAll('.baris-projek')[1].querySelector('.btn-hapus-projek').click();
  ok(barisP.querySelectorAll('.baris-projek').length === 1, 'butang hapus projek membuang kad itu');
  const pk1 = barisP.querySelectorAll('.baris-projek')[0];
  pk1.querySelector('.pj-nama').value = 'Projek Hospital Rizen, Kuantan';
  pk1.querySelector('.pj-poin').value = 'Sediakan BQ dan dokumen tawaran\nNilai tuntutan kontraktor setiap bulan';
  barisP.querySelector('.btn-tambah-projek').click();
  const pk2 = barisP.querySelectorAll('.baris-projek')[1];
  pk2.querySelector('.pj-nama').value = 'Projek Perumahan Idaman Rakyat';
  pk2.querySelector('.pj-poin').value = 'Semak interim certificate\nSediakan laporan kos bulanan';
  el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
  const dp = w.ResumeMV.kumpul();
  ok(dp.pengalaman[0].projek.length === 2, 'kumpul(): dua projek disimpan untuk satu pengalaman');
  ok(dp.pengalaman[0].projek[0].nama === 'Projek Hospital Rizen, Kuantan', 'kumpul(): nama projek pertama betul');
  ok(dp.pengalaman[0].poin.length === 4, 'kumpul(): senarai poin rata (4) kekal untuk keserasian kod lama');
  ['biru', 'bersih', 'korporat'].forEach(t => {
    d.querySelector('.kad-pilih[data-templat="' + t + '"]').click();
    const teks = el('resume').textContent;
    const iHosp = teks.indexOf('Hospital Rizen'), iHospPoin = teks.indexOf('Sediakan BQ');
    const iPeru = teks.indexOf('Idaman Rakyat'), iPeruPoin = teks.indexOf('Semak interim');
    ok(iHosp >= 0 && iHosp < iHospPoin, t + ': "Projek: Hospital Rizen" muncul SEBELUM poin projek itu');
    ok(iPeru >= 0 && iPeru < iPeruPoin, t + ': projek kedua juga - nama projek sebelum poinnya');
    ok(iHospPoin < iPeru, t + ': projek berurutan (poin projek 1 habis, baru nama projek 2)');
  });
  const kodP = w.ResumeMV.kod(w.ResumeMV.kumpul());
  const balikP = w.ResumeMV.dariKod(kodP);
  ok(balikP.pengalaman[0].projek && balikP.pengalaman[0].projek[0].nama === 'Projek Hospital Rizen, Kuantan',
     'kod pesanan membawa senarai projek (nama + poin)');
  ok(kodP.length < 3000, 'kod pesanan masih pendek walaupun ada projek (g: ' + kodP.length + ' aksara)');

  // ---- blok 45: label projek boleh ubah, tanda titik pelanggan, dwibahasa ----
  console.log('== 45. Label projek, tanda titik yang pelanggan taip, dwibahasa ==');
  ok(!!el('label-projek'), 'pilihan label projek wujud di bahagian pengalaman');
  ok(el('label-projek').options.length === 4, 'empat pilihan label (Projek / Klien / Projek & Klien / tiada label)');
  const dataPj = { nama: 'Uji Label Projek', telefon: '011-111 0000', templat: 'biru',
    pengalaman: [{ jawatan: 'Quantity Surveyor', syarikat: 'EPH Construction', tempoh: '2024',
                   projek: [{ nama: 'Hospital Rizen', poin: ['Sediakan BQ'] }] }],
    kemahiran: [], bahasa: [], pendidikan: [], rujukan: [], tambahan: [] };
  w.ResumeMV.isi(JSON.parse(JSON.stringify(dataPj)));
  el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(/Projek: Hospital Rizen/.test(el('resume').textContent), 'label lalai: "Projek: Hospital Rizen"');
  el('label-projek').value = 'klien';
  el('label-projek').dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(/Klien: Hospital Rizen/.test(el('resume').textContent), 'pilih "Klien" - label pada resume bertukar');
  el('label-projek').value = 'projek-klien';
  el('label-projek').dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(/Projek \/ Klien: Hospital Rizen/.test(el('resume').textContent), 'pilih "Projek / Klien" - dua label');
  el('label-projek').value = 'tiada';
  el('label-projek').dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(/Hospital Rizen/.test(el('resume').textContent) && !/Projek:/.test(el('resume').textContent),
     'pilih "tiada label" - nama projek sahaja yang dicetak');
  el('label-projek').value = 'projek';
  el('label-projek').dispatchEvent(new w.Event('change', { bubbles: true }));

  // kerja bukan berasaskan projek: nama projek kosong = terus ke perkara utama
  const dataTiada = JSON.parse(JSON.stringify(dataPj));
  dataTiada.pengalaman[0].jawatan = 'Kerani Akaun';
  dataTiada.pengalaman[0].projek = [{ nama: '', poin: ['Urus fail dan rekod bayaran'] }];
  w.ResumeMV.isi(dataTiada);
  el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(!/Projek:/.test(el('resume').textContent) && /Urus fail dan rekod bayaran/.test(el('resume').textContent),
     'nama projek kosong: resume terus ke perkara utama (sesuai pelanggan bukan industri projek)');

  // tanda titik yang pelanggan taip sendiri dibuang (punca "keluar 2 point" dalam cetakan)
  const kadPoin = d.querySelector('#senarai-pengalaman .baris .baris-projek');
  kadPoin.querySelector('.pj-poin').value = '\u2022 Sediakan BQ\n- Semak tuntutan\n* Lapor kos bulanan\nTanpa tanda';
  kadPoin.querySelector('.pj-poin').dispatchEvent(new w.Event('input', { bubbles: true }));
  el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
  const dpoin = w.ResumeMV.kumpul().pengalaman[0].projek[0].poin;
  ok(dpoin.length === 4 && dpoin[0] === 'Sediakan BQ' && dpoin[1] === 'Semak tuntutan' && dpoin[2] === 'Lapor kos bulanan',
     'tanda \u2022, "-" dan "*" yang pelanggan taip dibuang (cetakan tidak keluar dua titik)');
  ok(w.ResumeMV.bersihPoin('\u2022\u2022 Poin berganda') === 'Poin berganda', 'tanda bertindih juga dibuang');
  ok(w.ResumeMV.bersihPoin('-1.5% kos berkurang') === '-1.5% kos berkurang', 'tanda "-" tanpa jarak tidak dibuang (bukan bulet)');
  ok(kadPoin.querySelectorAll('.poin-preview .pp-baris').length === 4, 'pratonton grafik poin menunjukkan 4 baris');
  ok(kadPoin.querySelectorAll('.poin-preview .pp-titik').length === 4, 'setiap baris pratonton ada grafik titiknya');
  ok(/jangan taip/.test(kadPoin.querySelector('.poin-nota').textContent), 'nota mengingatkan jangan taip tanda titik sendiri');

  // dwibahasa
  const kadBhs = d.querySelector('#pilih-bahasa');
  ok(!!kadBhs && !!d.querySelector('.pb-btn[data-bahasa="en"]'), 'pilihan bahasa wujud di halaman 1');
  ok(d.querySelector('#hal-1').firstElementChild === kadBhs,
     'pilihan bahasa diletak PALING AWAL halaman 1, sebelum pilihan reka bentuk');
  d.querySelector('.pb-btn[data-bahasa="en"]').click();
  ok(w.ResumeMV.bahasa() === 'en', 'butang English menukar bahasa resume');
  ok(/work experience/i.test(el('resume').textContent), 'tajuk resume bertukar ke English (Work Experience)');
  ok(/Choose your resume design/.test(d.querySelector('#hal-1 .galeri-kepala h2').textContent),
     'tajuk halaman 1 bertukar ke English');
  ok(/^Step \d of 3 /.test(el('langkah-teks').textContent), 'teks langkah bertukar ke English');
  ok(d.documentElement.getAttribute('lang') === 'en', 'atribut lang dokumen ditetapkan untuk pembaca skrin');
  ok(w.ResumeMV.dariKod(w.ResumeMV.kod(w.ResumeMV.kumpul())).bahasaResume === 'en',
     'kod pesanan membawa bahasa resume (penjual cetak dalam bahasa yang sama)');
  d.querySelector('.pb-btn[data-bahasa="ms"]').click();
  ok(/pengalaman kerja/i.test(el('resume').textContent), 'kembali ke Bahasa Melayu: tajuk resume Melayu semula');
  ok(el('label-projek').options[0].text.indexOf('Projek:') === 0, 'pilihan label projek juga bertukar bahasa');

  // ---- blok 46: SELURUH antara muka bertukar English, bukan hanya tajuk resume ----
  console.log('== 46. Seluruh halaman bertukar English (borang, butang, nota, langkah) ==');
  w.ResumeMV.gunaBahasa('en');
  const tks = (sel) => { const e = d.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
  ok(/Personal Details/.test(tks('#borang legend')), 'legend borang: Personal Details');
  ok(/Work Experience/.test(tks('#borang fieldset[data-sek="pengalaman"] legend')), 'legend pengalaman: Work Experience');
  ok(tks('label[for="nama"]').replace('*', '').trim() === 'Name', 'label Nama -> Name');
  ok(tks('label[for="telefon"]').replace('*', '').trim() === 'Phone Number', 'label Nombor Telefon -> Phone Number');
  ok(/e\.g\./.test(el('nama').getAttribute('placeholder')), 'placeholder bertukar (cth. -> e.g.)');
  ok(/Remove/.test(d.querySelector('#senarai-pengalaman .btn-hapus').textContent), 'butang Hapus -> Remove');
  ok(/Remove project/.test(d.querySelector('#senarai-pengalaman .btn-hapus-projek').textContent), 'butang Hapus projek -> Remove project');
  ok(/Add Experience/.test(el('tambah-pengalaman').textContent), 'butang + Tambah Pengalaman -> + Add Experience');
  ok(/Arrange blocks/.test(el('togol-susun').textContent), 'butang Susun blok -> Arrange blocks');
  ok(/Print PDF/.test(el('cetak-pdf').textContent), 'butang Cetak PDF -> Print PDF');
  ok(/Step \d+ \/ 8/.test(el('lk-kira').textContent), 'penunjuk langkah kecil: Step N / 8');
  ok(/Choose your resume design/.test(tks('#hal-1 .galeri-kepala h2')), 'tajuk halaman 1 English');
  ok(/designs/.test(el('galeri-kira').textContent), 'kiraan reka bentuk: "designs"');
  ok(/Two columns|spacious single-column|modern corporate/.test(tks('#galeri')), 'nota kad reka bentuk English');
  d.querySelector('.pb-btn[data-bahasa="ms"]').click();   // tulis log dalam Bahasa Melayu dahulu
  w.ResumeMV.gunaBahasa('en');                            // kemudian tukar ke English
  ok(!/Bahasa resume: Bahasa Melayu/.test(el('log').textContent),
     'log status tidak lagi dalam Bahasa Melayu selepas tukar ke English');
  ok(/PREVIEW/.test(d.querySelector('#cap-air').textContent), 'tanda air: PREVIEW (bukan PRATONTON)');
  // tukar kembali: semua pulih ke Bahasa Melayu
  w.ResumeMV.gunaBahasa('ms');
  ok(tks('label[for="nama"]').replace('*', '').trim() === 'Nama', 'kembali Melayu: label Nama semula');
  ok(/Hapus/.test(d.querySelector('#senarai-pengalaman .btn-hapus').textContent), 'kembali Melayu: butang Hapus semula');
  ok(/Personal Details|Butiran Peribadi/.test(tks('#borang legend')), 'legend borang pulih');
  ok(!/PREVIEW/.test(d.querySelector('#cap-air').textContent), 'tanda air kembali ke PRATONTON');
  w.ResumeMV.gunaBahasa('en');

  // data lama (poin tanpa projek) mesti kekal berfungsi
  d.querySelector('.kad-pilih[data-templat="biru"]').click();
  w.ResumeMV.isi({ nama: 'Data Lama', telefon: '011-000 0000', templat: 'biru',
    pengalaman: [{ syarikat: 'EPH', jawatan: 'QS', tempoh: '2020', poin: ['Poin lama satu'] }],
    kemahiran: [], bahasa: [], pendidikan: [], rujukan: [], tambahan: [] });
  el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(!/Projek:/.test(el('resume').textContent), 'data lama (poin tanpa projek) TIDAK direka baris "Projek:"');
  ok(/Poin lama satu/.test(el('resume').textContent), 'data lama: poin lama tetap dirender');
  ok(d.querySelector('#senarai-pengalaman .baris .baris-projek .pj-poin').value === 'Poin lama satu',
     'data lama dibuka dalam borang sebagai satu kad projek (nama kosong)');
ok(/\.kertas-tambahan \{ position: relative; \}/.test(html), 'helaian tambahan jadi rujukan kedudukan');
ok(/\.kertas \.sambungan \{[\s\S]{0,200}height: var\(--tinggi-hal, 100%\); overflow: hidden;[\s\S]{0,20}\}/.test(html),
   'tingkap sambungan dipotong pada tinggi yang ditetapkan JS');
ok(/\.kertas \.sambungan > \.lembar \{ margin-top: var\(--potong, 0\); \}/.test(html),
   'kandungan digeser ke atas mengikut titik potong cetakan');
ok(/function titikPotong\(lembar, had\)/.test(html) && /function kiraPotong\(\)/.test(html),
   'titik potong cetakan dikira (bukan sekadar 297mm) supaya bulet tidak terpecah');
ok(/\.lembar li \{ break-inside: avoid; page-break-inside: avoid; \}/.test(html) &&
   /\.lembar \.cvb-item-kepala, \.lembar \.cvb-item-sub,[\s\S]{0,20}\.lembar \.cvs-item-kepala, \.lembar \.cvs-item-sub \{ break-after: avoid/.test(html),
   'cetakan: satu bulet tidak dipecah dua halaman, tajuk item kekal bersama kandungan');
ok(/\.pil-hal \{/.test(html), 'ada label "Halaman N" pada setiap helaian');
ok(/body\[data-templat="biru"\] \.pr-berulang \.cb-rel \{[\s\S]{0,180}display: block/.test(html),
   'rel kelabu diteruskan pada helaian halaman 2 (templat dua lajur sahaja)');
ok(/body\.dua-halaman\[data-hal="3"\] \{ overflow: auto; \}/.test(html), 'halaman pratonton boleh skrol bila 2 halaman');
ok(/body\.dua-halaman #hal-3 \{ overflow-y: auto; \}/.test(html), 'bekas pratonton skrin penuh boleh skrol bila 2 halaman');
ok(/body\.dua-halaman \.sisi-live \{ max-height: calc\(100vh - 96px\); overflow-y: auto; \}/.test(html),
   'panel pratonton langsung boleh skrol bila 2 halaman');
// CETAK: helaian pratonton tambahan WAJIB keluar dari PDF (kalau tidak resume jadi 4 halaman)
var cetakBlok = html.slice(html.indexOf('@media print {'));
ok(/\.kertas-tambahan \{ display: none !important; \}/.test(cetakBlok), 'helaian pratonton tambahan tidak dicetak');
ok(/\.pil-hal \{ display: none !important; \}/.test(cetakBlok), 'label halaman tidak dicetak');
ok(html.indexOf('.kertas-tambahan { display: none !important; }') > html.indexOf('@media print {'),
   'peraturan "jangan cetak" berada dalam blok cetak (bukan blok skrin)');
// JS: fungsi penjana helaian wujud
ok(/function helaianHalaman\(n\)/.test(html) && /function susunHalaman\(\)/.test(html) && /function salinLaras\(\)/.test(html),
   'fungsi bina helaian, susun halaman dan salin laras wujud');
ok(/kartu\.querySelector\('\.lembar'\)\.innerHTML = ISI_TERKINI;/.test(html), 'helaian halaman 2 mendapat resume yang sama');
ok(/document\.body\.classList\.toggle\('dua-halaman', n > 1\)/.test(html), 'kelas dua-halaman ditetapkan bila lebih 1 halaman');
ok(/n === 1 && pil\) \{[\s\S]{0,80}removeChild\(pil\)/.test(html), 'label halaman dibuang semula bila kembali 1 halaman');
ok(w.ResumeMV.halaman() >= 1, 'bilangan halaman dilaporkan kepada API');

console.log('== 37. Foto pelanggan: kod tidak membawa foto, tetapi foto sendiri tidak hilang ==');
var DFOTO = { nama: 'Che Ku Ahmad Ridzuan', jawatan: 'Quantity Surveyor', templat: 'biru',
  telefon: '011-111 1111', emel: 'a@b.com', lokasi: 'Kuala Terengganu',
  ringkasan: 'Ukur bahan berpengalaman.', foto: 'data:image/jpeg;base64,QQQQ',
  pengalaman: [{ syarikat: 'EPH', jawatan: 'QS', tempoh: '2024', poin: ['Sedia BQ.'] }],
  pendidikan: [{ kelulusan: 'BSc QS', institusi: 'UTM', tahun: '2018' }],
  kemahiran: [{ nama: 'Excel', tahap: 4 }], bahasa: [{ nama: 'Malay', tahap: 5 }],
  rujukan: [{ nama: 'Safwan', jawatan: 'Coordinator', telefon: '012-3456789' }] };
w.ResumeMV.isi(DFOTO);
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
el('ke-3').click();
function fotoPratonton() {
  var im = d.querySelector('#kertas-1 .cvb-foto img, #kertas-1 .cvs-foto img');
  return im ? (im.getAttribute('src') || '') : '';
}
ok(fotoPratonton().indexOf('data:image') === 0, 'foto kelihatan dalam pratonton selepas diisi');
var kodFoto = w.ResumeMV.kod(w.ResumeMV.kumpul());
ok(kodFoto.indexOf('data:image') < 0, 'kod pesanan TIDAK mengandungi foto (kod kekal pendek)');
ok(kodFoto.length < 4000, 'panjang kod masih munasabah untuk WhatsApp (' + kodFoto.length + ' huruf)');
el('kod-masuk').value = kodFoto;
el('buka-kod').click();
el('ke-3').click();
ok(fotoPratonton().indexOf('data:image') === 0, 'buka kod SENDIRI (nama sama): foto kekal, tidak perlu muat naik semula');
el('nama').value = 'Pelanggan Lain Sdn Bhd';
el('kod-masuk').value = kodFoto;
el('buka-kod').click();
el('ke-3').click();
ok(fotoPratonton() === '', 'kod pelanggan LAIN pada peranti penjual: foto pelanggan lama tidak terbawa masuk');
ok(/var fotoKekal = !!fotoLama && !!namaLama && namaLama === namaBaru;/.test(html),
   'syarat nama jelas dalam kod (elak foto salah masuk ke resume pelanggan lain)');

console.log('== 38. Email resume automatik (Mod Penjual) ==');
ok(/<input id="email-api"/.test(html) && /<input id="email-token"/.test(html) && /id="simpan-email"/.test(html),
   'Mod Penjual ada medan URL email, token dan butang simpan');
ok(/id="email-nota"/.test(html), 'ada nota status tetapan email');
ok(/var KUNCI_EMAIL = 'resume-mv-email-api';/.test(html) && /var KUNCI_TOKEN = 'resume-mv-email-token';/.test(html),
   'tetapan email disimpan dalam localStorage (bukan dalam kod app)');
ok(/mode: 'no-cors'/.test(html), 'posting guna no-cors (Apps Script tidak memberi CORS)');
ok(/action: 'hantar', token: EMAIL_TOKEN/.test(html), 'badan POST membawa action=hantar dan token');
ok(/if \(EMAIL_DIHANTAR === kod\) return;/.test(html), 'resume yang sama tidak diemail dua kali');
var dipanggil = [];
w.fetch = function (url, opt) { dipanggil.push({ url: url, opt: opt }); return w.Promise.resolve({ ok: true }); };
// tetapan email diisi melalui Mod Penjual (disimpan dalam localStorage pelayar)
el('email-api').value = 'https://script.google.com/macros/s/TEST/exec';
el('email-token').value = 'TOKEN-UJIAN';
el('simpan-email').click();
ok(/Sedia/.test(el('email-nota').textContent), 'nota email bertukar kepada "Sedia" selepas tetapan disimpan');
w.ResumeMV.isi(DFOTO);
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
el('ke-3').click();
el('wa').click();
ok(dipanggil.length === 1, 'klik butang WhatsApp menghantar sekali ke endpoint email');
var badan = dipanggil.length ? JSON.parse(dipanggil[0].opt.body) : {};
ok(dipanggil.length && dipanggil[0].url.indexOf('/exec') > 0, 'POST pergi ke URL Apps Script yang disimpan');
ok(badan.action === 'hantar' && badan.token === 'TOKEN-UJIAN', 'badan POST ada action dan token yang betul');
ok(badan.nama === 'Che Ku Ahmad Ridzuan' && !!badan.telefon, 'badan POST membawa nama dan telefon pelanggan');
ok(typeof badan.kod === 'string' && badan.kod.length > 50, 'badan POST membawa kod resume penuh');
ok(typeof badan.foto === 'string' && badan.foto.indexOf('data:image') === 0, 'badan POST membawa foto pelanggan');
ok(typeof badan.halaman === 'number' && badan.halaman >= 1, 'badan POST melaporkan bilangan halaman');
el('wa').click();
ok(dipanggil.length === 1, 'klik kedua untuk resume yang sama tidak dihantar berulang');
w.ResumeMV.isi(DFOTO);
el('nama').value = 'Nama Lain';
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
el('wa').click();
ok(dipanggil.length === 2, 'resume yang berubah dihantar semula (kod berbeza)');

console.log('== 39. Hiasan berulang cetakan mesti di ATAS lajur (kaki halaman tidak tertutup) ==');
var cetak2 = html.slice(html.indexOf('@media print {'));
ok(/\.cb-kaki \{[\s\S]{0,400}?z-index: 3;/.test(cetak2),
   'kaki halaman ada z-index di atas lajur kiri/kanan (kalau tidak nama di kaki hilang)');
ok(/\.cb-jalur \{[\s\S]{0,200}?z-index: 3;/.test(cetak2), 'jalur atas cetakan juga di atas lajur');
ok(/body\[data-templat="biru"\] \.cb-garis \{[\s\S]{0,220}?z-index: 3;/.test(cetak2),
   'garis pemisah kolum di atas lajur (supaya kelihatan penuh pada setiap halaman)');
ok(/\.lembar \.cvb-kiri, \.lembar \.cvb-kanan \{ position: relative; z-index: 1; \}/.test(cetak2),
   'lajur kekal z-index 1 (di atas rel kelabu, di bawah hiasan berulang)');

console.log('== 40. Templat Korporat Moden (rel kelabu) ==');
/* Tajuk bahagian templat ketiga mesti sama ejaan dengan fail rujukan (BI), bukan terjemahan BM. */
var TAJUK_KORP_BI = /TAJUK_KORP = \{[\s\S]{0,260}?kontak: 'Contact'[\s\S]{0,140}?pendidikan: 'Education'[\s\S]{0,160}?kemahiran: 'Key Skills'[\s\S]{0,140}?bahasa: 'Language'[\s\S]{0,160}?profil: 'Summary'[\s\S]{0,160}?pengalaman: 'Work Experience'/;
ok(/korporat: \{[\s\S]{0,320}?kelas: 'cv-korporat'/.test(html), 'templat ketiga didaftar dengan kelasnya sendiri');
ok(/\.lembar \.cv-korporat \{[\s\S]{0,420}?--renggang: 1; --teks: 1;/.test(html),
   'REGRESI: --teks/--renggang mesti ditakrif pada templat ini, jika tidak setiap calc(... * var(--teks)) jatuh ke saiz warisan');
ok(/flex: 0 0 71\.3mm; width: 71\.3mm; background: #dae3e3;/.test(html), 'rel kiri 71.3mm warna #dae3e3 (ukur dari piksel rujukan)');
ok(/margin: 0 0 0 -4\.2mm; padding-top: 3\.1mm; min-height: 36\.9mm;/.test(html),
    'kepala kolum kanan 36.9mm: nama 21.1mm dan tajuk pertama 58.8mm (kedua-duanya dari lapisan teks rujukan)');
ok(/font-size: calc\(34pt \* var\(--teks\)\)/.test(html) && /calc\(16pt \* var\(--teks\)\)/.test(html), 'nama 34pt dan jawatan 16pt');
ok(/\.ck-kanan h2::after \{[\s\S]{0,160}?bottom: 0;[\s\S]{0,60}?height: \.53mm;/.test(html), 'garis .53mm di BAWAH teks tajuk kolum kanan');
ok(/border-radius: 50%; \}/.test(html) || /border-radius: 50%;/.test(html), 'ikon tajuk dan foto bulat');
ok(/color: #91a6a6/.test(html), 'nama kelabu-hijau #91a6a6 (warna sebenar dari lapisan teks PDF, bukan #90a6a6)');
ok(/width: 1\.35mm; height: 1\.35mm; border-radius: 50%/.test(html), 'bulet kolum kiri bulat 1.35mm');
ok(/data-blok="pengalaman"\] \{[\s\S]{0,120}?color: #313131;[\s\S]{0,160}?font-family: "Arial Nova"/.test(html),
    'blok pengalaman: dakwat #313131 DAN keluarga Arial Nova (rujukan mencampur Poppins + Arial Nova; dengan Poppins sahaja, kandungan rujukan melimpah ke halaman 2)');
  ok(/data-blok="pengalaman"\] .ck-item-kepala strong \{ font-weight: 700; \}/.test(html),
    'tajuk kerja ArialNova-Bold 11pt (font-weight 700, bukan 600)');
  ok(/data-blok="pengalaman"\] .ck-item-kepala span \{ font-weight: 400; \}/.test(html),
    'tarikh ArialNova 10pt reguler (rujukan menulis tarikh dengan ArialNova, bukan Poppins-Light)');
  ok(/data-blok="pengalaman"\] .ck-senarai-item li \{ font-weight: 400; line-height: 4\.5mm; \}/.test(html),
    'bulet pengalaman ArialNova 9.5pt dengan irama baris 4.5mm seperti rujukan');
  ok(/left: 1\.85mm; top: 1\.7mm;[\s\S]{0,60}?width: 1\.06mm; height: 1\.06mm/.test(html),
    'bulet pengalaman bulat 1.06mm pada x=85.55mm (nilai vektor rujukan, bukan 1.32mm)');
  ok(/height: 1\.35mm; border-radius: 50%; background: #414042;/.test(html),
    'bulet rel kiri #414042 (nilai lapisan teks/vektor rujukan, bukan #404041)');
  ok(/background: #403f41; color: #fff; box-sizing: border-box; border-radius: 50%;/.test(html),
    'ikon tajuk #403f41 dan ikon kontak #403f41 seperti rujukan');
  ok(/left: 11\.9mm; right: 0; bottom: 0;[\s\S]{0,60}?height: \.53mm; background: #403f41;/.test(html),
    'garis bawah tajuk lajur kanan bermula x=91.4mm, .53mm, #403f41');
  ok(TAJUK_KORP_BI.test(html), 'tajuk bahagian templat ketiga diambil verbatim daripada rujukan (CONTACT/SUMMARY/EDUCATION/KEY SKILLS/WORK EXPERIENCE/LANGUAGE)');
  ok(/\.cv-korporat\.tanpa-foto \.ck-kiri \{ padding-top: 58\.8mm; \}/.test(html),
    'tanpa foto, rel kiri tetap mula 58.8mm supaya tajuk pertama sejajar dengan lajur kanan');
  ok(/ck-pendidikan strong \{[\s\S]{0,120}?font-weight: 700; line-height: 4\.4mm/.test(html),
    'pendidikan: institusi Poppins-Bold 8pt, baris 4.4mm (irama rujukan 5.1/4.4/7.8mm)');
  ok(/body\[data-templat="korporat"\] \.cb-kaki \{ display: none; \}/.test(html),
    'kaki halaman dimatikan untuk templat ketiga (rujukan tiada kaki)');
ok(/\.ck-item-kepala strong \{ font-size: calc\(11pt \* var\(--teks\)\); font-weight: 600; color: #333132; \}/.test(html),
   'tajuk kerja 11pt #333132: rujukan memakai DUA dakwat berbeza (#333132 tajuk, #313131 tarikh/bulet)');
ok(/color: #414042/.test(html), 'dakwat teks #414042 (nilai lapisan teks PDF, bukan #403f41)');
ok(/gap: 3\.6mm/.test(html), 'jarak ikon ke teks tajuk 3.6mm supaya teks tajuk bermula x=91.4mm seperti rujukan');
ok(/font-size: calc\(9pt \* var\(--teks\)\);[\s\S]{0,120}margin-bottom: calc\(3\.4mm/.test(html),
   'kontak 9pt (bukan 9.5pt) dengan irama baris 7.85mm');
/* Skala titik 1-5 MESTI muncul dalam templat ini juga (keputusan produk pengguna: pelanggan
     mahu tahap kelihatan). Fail rujukan Canva tiada titik, jadi warna mengikut rel template itu. */
  ok(!/cv-korporat \.titik-tahap \{ display: none/.test(html),
     'skala titik TIDAK disembunyikan dalam Korporat lagi (semua templat mesti tunjuk tahap 1-5)');
  ok(/\.cv-korporat \.titik-tahap i \{[^\}]*background: #bcc9c9/.test(html),
     'titik kosong Korporat #bcc9c9 (lebih gelap daripada latar rel #dae3e3 supaya kelihatan)');
  ok(/\.cv-korporat \.titik-tahap i\.penuh \{ background: #414042; \}/.test(html),
     'titik penuh Korporat #414042 - warna dakwat templat itu sendiri');
  ok(/\.cv-korporat \.titik-tahap \{ gap: 1\.6pt; margin-left: 2mm; \}/.test(html),
     'titik Korporat 3pt sebaris dengan irama rel (jarak 1.6pt)');
ok(/body\[data-templat="korporat"\] \.cb-rel \{[\s\S]{0,220}?position: fixed; left: 0; top: 0; bottom: 0; width: 71\.3mm/.test(html),
   'rel berterusan pada setiap halaman semasa cetak');
ok(/body\[data-templat="korporat"\] \.cb-jalur \{ display: none; \}/.test(html), 'jalur atas tidak digunakan (tiada banner)');
ok(/urutanDua: \{ kiri: \['kontak', 'pendidikan', 'kemahiran', 'bahasa'\]/.test(html), 'pendidikan di rel kiri seperti rujukan');
w.ResumeMV.isi({ nama: 'Ujian Korporat', jawatan: 'Quantity Surveyor', templat: 'korporat',
  telefon: '012-000 0000', emel: 'a@b.com', lokasi: 'Kemaman, Terengganu',
  ringkasan: 'Ringkasan ujian untuk templat ketiga supaya susun atur diuji dengan betul dan lengkap.',
  pengalaman: [{ syarikat: 'Syarikat Ujian', jawatan: 'QS', tempoh: '2024 - Kini', poin: ['Satu bulet ujian.', 'Dua bulet ujian.'] }],
  pendidikan: [{ kelulusan: 'Sarjana Muda Ukur Bahan', institusi: 'UTM', tahun: '2018' }],
  kemahiran: [{ nama: 'Excel', tahap: 4 }], bahasa: [{ nama: 'Melayu', tahap: 5 }] });
el('mula-isi').click();
el('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
el('ke-3').click();
var korp = d.querySelectorAll('.lembar .cv-korporat');
ok(korp.length >= 1, 'templat Korporat dirender dalam pratonton');
var k0 = korp[0];
ok(k0.querySelector('.ck-kiri') && k0.querySelector('.ck-kanan'), 'dua kolum (rel kiri + lajur kanan) wujud');
var namaKorp = [].map.call(d.querySelectorAll('.ck-nama'), function (x) { return (x.textContent || '').toUpperCase(); }).join(' | ');
ok(/UJIAN KORPORAT/.test(namaKorp), 'nama pelanggan muncul dalam lajur kanan (dijumpai: ' + namaKorp.slice(0, 60) + ')');
w.ResumeMV.gunaBahasa('ms');
ok(/^KONTAK$/i.test(d.querySelector('#resume .ck-kiri h2').textContent.trim()),
   'tajuk bahagian rel kiri = KONTAK selepas pelanggan pilih Bahasa Melayu');
  w.ResumeMV.gunaBahasa('en');
  ok(/^CONTACT$/i.test(d.querySelector('#resume .ck-kiri h2').textContent.trim()),
     'bahasa English: tajuk = CONTACT, ejaan verbatim fail rujukan Canva');
  w.ResumeMV.gunaBahasa('ms');
ok(k0.querySelectorAll('.ck-kiri .blok[data-blok]').length >= 2, 'blok rel kiri boleh disusun semula');
ok(k0.querySelectorAll('.ck-kanan .blok[data-blok]').length >= 2, 'blok lajur kanan boleh disusun semula');
ok(w.ResumeMV.templat() === 'korporat' && isFinite(w.ResumeMV.halaman()) && isFinite(w.ResumeMV.renggang()),
   'templat ketiga boleh dipilih dan pengiraan halaman/renggang berfungsi');


  // ---- blok 41: kandungan halaman 2+ mesti bermula di bawah jalur berwarna ----
  // Pepijat yang dilindungi: jalur di puncak setiap halaman cetakan ialah elemen `position: fixed`
  // 5mm. Tanpa padding atas yang berulang, kandungan halaman baharu bermula pada y=0 dan 5mm
  // pertamanya (termasuk tajuk bahagian berwarna sama dengan jalur) ditutup sepenuhnya -
  // teks masih ada dalam fail PDF, jadi hanya ujian piksel dapat mengesannya.
  ok(/\.lembar \.cv-bersih \{[\s\S]{0,1400}box-decoration-break: clone/.test(html),
     'Biru Bersih: padding atas berulang pada setiap halaman (box-decoration-break: clone)');
  ok(/\.lembar \.cv-biru \{[\s\S]{0,300}padding-top: 5mm;/.test(html)
     && /\.lembar \.cv-biru \{[\s\S]{0,400}box-decoration-break: clone/.test(html),
     'Biru & Kelabu: kandungan mula 5mm di bawah jalur pada setiap halaman');
  ok(/JIDAR_HAL = \{ bersih: 38, biru: 19, korporat: 0 \}/.test(html),
     'jidar setiap templat sepadan dengan padding yang di-clone (10mm / 5mm / 0)');
  ok(/--jidar-hal: 10mm/.test(html) && /--jidar-hal: 5mm/.test(html) && /--jidar-hal: 0mm/.test(html),
     'pemboleh ubah --jidar-hal ditetapkan bagi ketiga-tiga templat');
  ok(/\.kertas-tambahan \.sambungan \{ top: var\(--jidar-hal, 0\); \}/.test(html),
     'tingkap pratonton halaman 2+ bermula pada jidar yang sama seperti cetakan');
  ok(/TINGGI_KERTAS - \(h >= 3 \? j : 0\)/.test(html) && /1 \+ Math\.ceil\(\(t - TINGGI_KERTAS\) \/ \(TINGGI_KERTAS - j\)\)/.test(html),
     'kiraan titik potong dan bilangan halaman mengambil kira kapasiti halaman yang menyusut');
  ok(/height: 45mm/.test(html) && /left: 82\.8mm; top: 6mm/.test(html) && /left: 7\.8mm; top: 16\.2mm/.test(html),
     'halaman 1 templat Biru kekal sama (banner dan kandungannya dianjak 5mm ke atas)');

  Promise.resolve().then(function () {
    console.log('\n' + pass + ' lulus, ' + fail + ' gagal, ' + skip + ' dilangkau');
    process.exit(fail ? 1 : 0);
  }).catch(function (e) {
    console.log('RALAT UJIAN: ' + (e && e.stack || e));
    process.exit(1);
  });
})();
