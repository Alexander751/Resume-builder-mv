
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(fs.readFileSync('_diag.html', 'utf8'), { runScripts:'dangerously', url:'https://x/', beforeParse(w){ w.print=()=>{}; w.confirm=()=>true; } });
console.log('dariKod ->', JSON.stringify(dom.window.ResumeMV.dariKod(process.argv[2])));
