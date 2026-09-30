
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('C:/Users/ADMIN/Documents/Resume-builder-mv/index.html','utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', url:'https://x/', beforeParse(w){ w.print=()=>{}; w.confirm=()=>true; } });
const w = dom.window, d = w.document;
const C = w.ResumeMV.contohTemplat('hijau');
w.ResumeMV.isi(JSON.parse(JSON.stringify(C)));
d.querySelector('.kad-pilih[data-templat="hijau"]').click();
d.getElementById('borang').dispatchEvent(new w.Event('input', { bubbles: true }));
console.log('bahasa:', w.ResumeMV.bahasa(), '| templat:', w.ResumeMV.templat());
console.log('tajuk (ms):', [...d.querySelectorAll('#resume .cv-hijau h2')].map(x=>x.textContent.trim()).join(' | '));
w.ResumeMV.gunaBahasa('en');
console.log('tajuk (en):', [...d.querySelectorAll('#resume .cv-hijau h2')].map(x=>x.textContent.trim()).join(' | '));
