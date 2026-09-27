// Ujian Fasa 1: elemen borang wujud + butang Jana PDF benar-benar berfungsi
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let fail = 0, pass = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS  ' + msg); }
  else { fail++; console.log('  FAIL  ' + msg); }
}

let printCalls = 0;
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  beforeParse(w) { w.print = () => { printCalls++; }; }
});
const w = dom.window, d = w.document;

console.log('== 1. Elemen wujud ==');
const nama = d.getElementById('nama');
const tel = d.getElementById('telefon');
const btn = d.getElementById('jana');
const form = d.getElementById('borang');
ok(!!nama, 'input #nama wujud');
ok(!!tel, 'input #telefon wujud');
ok(!!btn, 'butang #jana wujud');
ok(!!form, 'form #borang wujud');
ok(nama && nama.tagName === 'INPUT', '#nama ialah <input>');
ok(tel && tel.tagName === 'INPUT', '#telefon ialah <input>');
ok(btn && btn.textContent.trim() === 'Jana PDF', 'teks butang = "Jana PDF"');
ok(btn && btn.type === 'submit', 'butang type = submit');

console.log('== 2. Label boleh dilihat ==');
const labels = [...d.querySelectorAll('label')].map(l => l.textContent.trim());
ok(labels.includes('Nama'), 'label "Nama" ada');
ok(labels.includes('Nombor Telefon'), 'label "Nombor Telefon" ada');
ok(labels.filter(l => l === 'Nama').length === 1 && (form.querySelector('label[for="nama"]') || {}).textContent === 'Nama',
   'label "Nama" memaut ke input #nama');

console.log('== 3. Klik dengan borang kosong ==');
printCalls = 0;
btn.click();
ok(d.getElementById('log').textContent.includes('Sila isi'), 'ralat dipaparkan bila kosong');
ok(printCalls === 0, 'PDF tidak dijana bila data kosong');

console.log('== 4. Klik dengan data sebenar ==');
nama.value = 'Ahmad bin Ali';
tel.value = '012-3456789';
printCalls = 0;
btn.click();
const out = d.getElementById('output').textContent;
ok(out.includes('Ahmad bin Ali'), 'Nama masuk ke output');
ok(out.includes('012-3456789'), 'Nombor Telefon masuk ke output');
ok(d.getElementById('log').textContent === '', 'tiada ralat selepas isi lengkap');
ok(printCalls === 1, 'window.print() dipanggil sekali (jana PDF)');

console.log('\n' + pass + ' lulus, ' + fail + ' gagal');
process.exit(fail ? 1 : 0);
