
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(fs.readFileSync('../index.html','utf8'), { runScripts:'dangerously', url:'https://x/', beforeParse(w){ w.print=()=>{}; w.confirm=()=>true; } });
const w = dom.window, d = w.document;
w.ResumeMV.isi({nama:'Uji UI',telefon:'011',templat:'biru',pengalaman:[{jawatan:'QS',syarikat:'EPH',tempoh:'2024',projek:[{nama:'Hospital',poin:['BQ']}]}],kemahiran:[],bahasa:[],pendidikan:[],rujukan:[],tambahan:[]});
d.getElementById('borang').dispatchEvent(new w.Event('input',{bubbles:true}));
w.ResumeMV.gunaBahasa('en');
const q = (s) => { const e = d.querySelector(s); return e ? e.textContent.replace(/\s+/g,' ').trim() : 'TIADA'; };
console.log('label #nama   :', JSON.stringify(q('label[for="nama"]')));
console.log('legend pertama:', JSON.stringify(q('#borang legend')));
console.log('btn-hapus     :', JSON.stringify(q('#senarai-pengalaman .btn-hapus')));
console.log('btn rasmi     :', JSON.stringify(q('#susun-rasmi')));
console.log('kunci dalam kamus? Hapus, Nama ->', w.ResumeMV.bahasa());
w.ResumeMV.gunaBahasa('ms');
console.log('balik Melayu  : label', JSON.stringify(q('label[for="nama"]')), '| hapus', JSON.stringify(q('#senarai-pengalaman .btn-hapus')));
