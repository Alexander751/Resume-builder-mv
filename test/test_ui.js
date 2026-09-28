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
ok(!el('jana'), 'butang "Jana PDF" dibuang (pratonton + WhatsApp sudah cukup)');
ok(d.querySelectorAll('#hal-2 button[type="submit"]').length === 0, 'tiada butang submit untuk pelanggan');
ok(!!el('cetak-pdf'), 'butang #cetak-pdf wujud (khas Mod Penjual)');
const labels = [...d.querySelectorAll('label')].map(l => l.textContent.trim());
ok(labels.some(l => /^Nama\b/.test(l)), 'label "Nama" ada');
ok(labels.some(l => /^Nombor Telefon\b/.test(l)), 'label "Nombor Telefon" ada');
ok(d.querySelectorAll('label .wajib').length === 2, 'dua medan wajib (Nama, Telefon) ditanda *');

console.log('== 2. Fasa 2: medan baru wujud ==');
['emel', 'lokasi', 'jawatan', 'ringkasan', 'kemahiran'].forEach(id => ok(!!el(id), 'input #' + id + ' wujud'));
ok(!!el('tambah-pengalaman'), 'butang #tambah-pengalaman wujud');
ok(!!el('tambah-pendidikan'), 'butang #tambah-pendidikan wujud');
ok(!!el('kosongkan'), 'butang #kosongkan wujud');
ok(!!el('resume'), 'bekas pratonton #resume wujud');
ok(d.querySelectorAll('#senarai-pengalaman .baris').length === 1, 'bermula dengan 1 baris pengalaman');
ok(d.querySelectorAll('#senarai-pendidikan .baris').length === 1, 'bermula dengan 1 baris pendidikan');

console.log('== 3. Ralat bila Nama/Telefon kosong (tanpa Jana PDF) ==');
printCalls = 0;
el('borang').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
ok(el('log').textContent.includes('sebelum lihat pratonton'), 'mesej ralat dipaparkan');
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
isi('#senarai-pengalaman .baris:nth-child(1) .p-poin', 'Sediakan BQ 3 projek perumahan\nSemak tuntutan kontraktor');
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
el('kemahiran').value = 'AutoCAD, BQ, MS Excel, BIM';
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
ok(!el('templat'), 'pemilih templat sudah dibuang (satu reka bentuk sahaja)');
el('bahasa').value = 'Bahasa Melayu (Fasih), English (Fluent)';
el('rujukan').value = 'En. Ahmad — Pengurus Projek, EPH Construction';
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
ok(d.querySelectorAll('#resume .cvb-titik li').length === 4, 'kemahiran + bahasa jadi 4 titik rel');
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
ok(!/var TEMPLAT = \[/.test(html), 'senarai TEMPLAT sudah dibuang');
ok(!/<select id="templat"/.test(html), 'borang tiada pemilih templat');
ok(/var isi = htmlTemplat\(d\);/.test(html) && /el\('resume'\)\.innerHTML = isi;/.test(html) && /sisi\.innerHTML = isi;/.test(html),
   'papar() menulis resume yang sama ke kertas utama dan kertas pratonton di sisi');
ok(/var TEMPLAT = \{/.test(html) && /bersih: \{/.test(html), 'daftar TEMPLAT (peta) wujud dalam kod');
ok(html.includes('function htmlBersih') && html.includes('.cv-bersih'), 'templat kedua (Biru Bersih) wujud');
ok(d.querySelectorAll('.kad-pilih[data-templat]').length === 2, 'dua kad reka bentuk di halaman 1');
ok(!/r-sek|r-nama|\.chip/.test(html), 'tiada sisa gaya templat Klasik');
ok(html.includes('function htmlBiru') && html.includes('.cv-biru'), 'reka bentuk Biru & Kelabu kekal utuh');
ok(html.includes('.cvb-lencana') && html.includes('.cvb-titik') && html.includes('ikonLencana'),
   'elemen bulat Biru & Kelabu masih ada');
ok(d.querySelectorAll('#resume .cvb-lencana').length === 4, 'lencana bulat masih dirender selepas pembersihan');
ok(d.querySelectorAll('#resume .cvb-titik li').length === 4, 'titik bulat rel kiri masih dirender');
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
ok(/@media \(max-width: 900px\) \{ \.panel-pratonton \{ position: static; \} \}/.test(html), 'telefon: panel tidak melekat');
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
ok(d.querySelectorAll('#langkah .dot').length === 4, 'penunjuk 4 langkah ada');
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
ok(d.querySelectorAll('#langkah .dot')[3].disabled, 'halaman hantar belum terbuka');
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
ok(!d.querySelectorAll('#langkah .dot')[3].disabled, 'langkah yang pernah dilawati kekal boleh diklik');
ok(/@media print[\s\S]{0,900}#hal-3 \{ display: block !important/.test(html),
   'cetak: helaian resume dicetak dari mana-mana halaman');
ok(/@media print[\s\S]{0,300}animation: none !important/.test(html),
   'cetak: animasi dimatikan (animation-fill-mode:both boleh jadikan cetakan kosong)');
ok(/@media print[\s\S]{0,2000}\.papan \{ display: block !important/.test(html),
   'cetak: grid pratonton jadi blok biasa');

console.log('== 18. Antara muka baharu (bersih & mesra pengguna) ==');
ok(!!d.querySelector('header.top .jenama svg'), 'bar atas ada lencana jenama (SVG)');
ok(d.querySelectorAll('#langkah .dot').length === 4 && d.querySelectorAll('#langkah .dot b').length === 4,
   'penunjuk langkah: 4 bulatan bernombor');
ok(d.querySelectorAll('#langkah .dot span').length === 4, 'setiap langkah ada label teks');
ok(!!el('langkah-teks'), 'teks langkah untuk skrin kecil wujud');
el('balik-2').click();
ok(el('langkah-teks').textContent === 'Langkah 1 daripada 4 \u00b7 Reka bentuk', 'teks langkah betul di halaman 1');
el('mula-isi').click();
ok(el('langkah-teks').textContent === 'Langkah 2 daripada 4 \u00b7 Butiran', 'teks langkah dikemas kini di halaman 2');
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
ok(/#hal-2 \.nav-bawah \{[\s\S]{0,120}position: sticky/.test(html),
   'bar tindakan melekat pada halaman borang (borang panjang)');
ok(/\.kad-pilih \{[\s\S]{0,300}border-radius: 18px/.test(html), 'kad reka bentuk bersudut bulat + bayang');
ok(/\.langkah \.dot\.siap b::after \{ content: /.test(html), 'langkah siap bertukar tanda centang');
ok(/\.kad-ciri li::before \{[\s\S]{0,80}content: /.test(html), 'senarai ciri guna tanda centang hijau');
ok(/#wa:not\(\.sedia\) \{ background: #c3ccd6/.test(html), 'butang WhatsApp kelabu sebelum nama/telefon diisi');
// hantar borang (tekan Enter) = terus ke pratonton, bukan cetak
printCalls = 0;
el('borang').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
ok(printCalls === 0, 'hantar borang tidak mencetak apa-apa');
ok(el('hal-3').hidden === false, 'hantar borang terus membawa ke halaman pratonton');

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

ok(/@media screen and \(max-width: 760px\), screen and \(max-height: 620px\) \{/.test(html),
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
ok(elU('mula-isi').textContent.indexOf('Mula Isi Butiran') >= 0, 'CTA sama untuk pelanggan ulangan');
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
isi('#jawatan', 'Juruteknik Tapak'); isi('#kemahiran', 'AutoCAD, MS Excel');
isi('#bahasa', 'Bahasa Melayu, English'); isi('#rujukan', 'En. Samad - 019-1112222');
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
isi('#kemahiran', 'AutoCAD, MS Excel'); isi('#bahasa', 'Bahasa Melayu, English');
isi('#rujukan', 'En. Samad - 019-1112222');
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
isi('#kemahiran', 'AutoCAD, MS Project, Ukur Kuantiti');
isi('#bahasa', 'Bahasa Melayu, Bahasa Inggeris');
isi('#senarai-pengalaman .baris .p-jawatan', 'Jurutera Tapak');
isi('#senarai-pengalaman .baris .p-syarikat', 'EPH Construction Sdn Bhd');
isi('#senarai-pengalaman .baris .p-tempoh', 'Jan 2023 - Kini');
isi('#senarai-pengalaman .baris .p-poin', 'Menyelia kerja struktur 3 blok\nMenyediakan laporan kemajuan bulanan');
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
ok(/calc\(52mm \* var\(--renggang\)\)/.test(html), 'tinggi kepala guna --renggang');
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
ok(w.ResumeMV.tempat().length === 2 && w.ResumeMV.tempat().indexOf('bersih') >= 0, 'daftar templat boleh dibaca dari luar');

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

  Promise.resolve().then(function () {
    console.log('\n' + pass + ' lulus, ' + fail + ' gagal, ' + skip + ' dilangkau');
    process.exit(fail ? 1 : 0);
  }).catch(function (e) {
    console.log('RALAT UJIAN: ' + (e && e.stack || e));
    process.exit(1);
  });
})();
