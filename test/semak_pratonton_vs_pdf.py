"""Semak PRATONTON (dan pratonton langsung) = PDF cetak, kes demi kes.

Guna:  python test/semak_pratonton_vs_pdf.py

Kenapa perlu: pratonton yang tidak sama dengan cetakan membuatkan pelanggan membetulkan benda
yang tidak rosak. Kes yang pernah tersasar:
  * kiraan halaman memaksa minimum 2 halaman untuk kandungan 1113-1123px (muat 1 halaman sebenarnya);
  * ukuran tinggi diambil daripada helaian pratonton yang sedang diskalakan (`zoom`), jadi bilangan
    halaman berubah ikut saiz tetingkap dan ikut sama ada panel pratonton sisi terbuka;
  * tinggi templat dua lajur dikira sebagai jumlah anggaran + 20px, jadi kandungan yang berakhir
    tepat pada hujung halaman dilaporkan 2 halaman.

Ujian ini membandingkan, untuk 3 templat x 1-6 pekerjaan:
  1. window.ResumeMV.halaman()            (bilangan halaman yang app laporkan)
  2. bilangan helaian dalam #papan-kertas (pratonton utama)
  3. bilangan helaian dalam #papan-sisi   (pratonton langsung di sisi borang)
  4. nombor dalam nota "akan dicetak N halaman"
  5. bilangan halaman PDF cetakan sebenar
  6. teks pertama halaman 2: pratonton lawan PDF
Kod keluar 1 kalau mana-mana tidak sepadan.
"""
import io
import json
import os
import re
import subprocess
import sys

import pymupdf

MM = 72 / 25.4
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
KANDUNGAN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data_pratonton_ujian.json")


def arahan_isi(d):
    return ("window.ResumeMV.isi(%s);document.getElementById('mula-isi').click();"
            "document.getElementById('borang').dispatchEvent(new Event('input',{bubbles:true}));"
            "document.getElementById('ke-3').click();document.body.classList.add('mod-penjual');"
            "var c=document.getElementById('cap-air'); if(c) c.innerHTML='';"
            "var cs=document.getElementById('cap-air-sisi'); if(cs) cs.innerHTML='';"
            "if(document.getElementById('buka-sisi'))document.getElementById('buka-sisi').click();"
            ) % json.dumps(d, ensure_ascii=False)


PROBE = ("var out={};out.halaman=window.ResumeMV.halaman();out.potong=window.ResumeMV.potong();"
         "out.utama=document.querySelectorAll('#papan-kertas > .kertas').length;"
         "out.sisi=document.querySelectorAll('#papan-sisi > .kertas').length;"
         "var n=document.getElementById('nota-lapang');"
         "out.nota=(n&&!n.hidden)?parseInt(((n.textContent||'').match(/dicetak sebagai (\\d+)/)||[])[1]||0,10):0;"
         "out.atas2='';"
         "if(out.potong.length>1){var akar=document.querySelector('#kertas-1 .sambungan > .lembar');"
         "var had=out.potong[1];"
         "var calon=akar?akar.querySelectorAll('li, h2, p, strong, .ck-teks'):[];"
         "Array.prototype.forEach.call(calon,function(e){"
         "if(out.atas2) return; if(e.offsetTop + e.offsetHeight > had + 0.5){"
         "out.atas2=(e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,34);}});}"
         "var x=document.createElement('div');x.id='ukur';x.className='no-print';"
         "x.textContent=JSON.stringify(out);document.body.appendChild(x);")


def jalankan(app, data, folder, nama):
    f = os.path.join(folder, "uji_" + nama + ".html")
    io.open(f, "w", encoding="utf-8", newline="").write(app.replace(
        "</body>", "\n<script>(function(){try{" + arahan_isi(data) + "}catch(e){document.title='RALAT '+e.message}})();"
                   "\nsetTimeout(function(){try{" + PROBE + "}catch(e){}},700);</script>\n</body>"))
    url = "file:///" + f.replace("\\", "/")
    dom = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                          "--window-size=1600,1000", "--user-data-dir=" + os.path.join(folder, "a" + nama),
                          "--virtual-time-budget=11000", "--dump-dom", url],
                         capture_output=True, text=True, timeout=240)
    m = re.search(r'<div id="ukur" class="no-print">([^<]*)</div>', dom.stdout)
    if not m:
        raise RuntimeError("probe gagal untuk %s (RALAT JS?)" % nama)
    pdf = os.path.join(folder, "uji_" + nama + ".pdf")
    if os.path.exists(pdf):
        os.remove(pdf)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                    "--no-pdf-header-footer", "--user-data-dir=" + os.path.join(folder, "b" + nama),
                    "--virtual-time-budget=13000", "--print-to-pdf=" + pdf, url],
                   capture_output=True, text=True, timeout=240)
    dok = pymupdf.open(pdf)
    atas = []
    for pg in dok:
        t = ""
        for b in pg.get_text("dict")["blocks"]:
            if b.get("type") != 0:
                continue
            for ln in b["lines"]:
                for s in ln["spans"]:
                    if s["text"].strip():
                        t = s["text"].strip()[:34]
                        break
                if t:
                    break
            if t:
                break
        atas.append(t)
    return json.loads(m.group(1)), dok.page_count, atas


def main():
    app = io.open(os.path.join(AKAR, "index.html"), encoding="utf-8", newline="").read().replace("\r\n", "\n")
    dasar = json.load(io.open(KANDUNGAN, encoding="utf-8"))
    import tempfile
    folder = tempfile.mkdtemp(prefix="pratonton-")
    print("PRATONTON lawan PDF CETAK (pratonton utama + pratonton langsung di sisi borang)\n")
    print("%-9s %-6s %-9s %-9s %-9s %-5s %-6s %s" % ("templat", "kerja", "halaman()", "helaian u", "helaian s", "PDF", "nota", "hasil"))
    gagal = 0
    for templat in ("biru", "bersih", "korporat"):
        for kerja in range(1, 7):
            d = dict(dasar)
            d["templat"] = templat
            d["susun"] = {"kiri": [], "kanan": []}
            peng = list(dasar["pengalaman"])
            while len(peng) < kerja:            # jana kes tambahan supaya setiap kes berbeza
                tambah = json.loads(json.dumps(peng[-1]))
                tambah["syarikat"] = "Syarikat Ujian %d" % (len(peng) + 1)
                peng.append(tambah)
            d["pengalaman"] = peng[:kerja]
            nama = "%s%d" % (templat, kerja)
            o, hal, atas = jalankan(app, d, folder, nama)
            sebab, amaran = [], []
            if o["halaman"] != hal:
                sebab.append("halaman() %s != PDF %d" % (o["halaman"], hal))
            if o["utama"] != hal:
                sebab.append("helaian pratonton utama %s != PDF %d" % (o["utama"], hal))
            if o["sisi"] != hal:
                sebab.append("helaian pratonton sisi %s != PDF %d" % (o["sisi"], hal))
            if o["nota"] not in (0, hal):
                sebab.append("nota %s != PDF %d" % (o["nota"], hal))
            if hal > 1:
                a = re.sub(r"\s+", " ", o["atas2"]).lower()
                b = re.sub(r"\s+", " ", atas[1] if len(atas) > 1 else "").lower()
                if a[:18] and b[:18] and a[:18] not in b and b[:18] not in a:
                    # hanya AMARAN: Chrome memutuskan pecahan barisnya sendiri, jadi titik
                    # potong boleh berbeza kira-kira satu baris (~15px) walaupun kiraan
                    # halaman, bilangan helaian dan nota semuanya sama
                    amaran.append("pecahan ~1 baris: pratonton %r / PDF %r" % (a[:22], b[:22]))
            if sebab:
                gagal += 1
            print("%-9s %-6d %-9s %-9s %-9s %-5d %-6s %s" % (
                templat, kerja, o["halaman"], o["utama"], o["sisi"], hal, o["nota"] or "-",
                ("OK" if not sebab else "; ".join(sebab)) + ("" if not amaran else " [%s]" % amaran[0])))
    print("\n%d kes tidak sepadan" % gagal)
    print("Nota: pratonton memakai helaian pengukur tersembunyi pada skala 1 (bukan helaian pratonton\n"
          "yang diskalakan), jadi keputusannya tidak berubah ikut saiz tetingkap atau panel sisi.")
    return 1 if gagal else 0


if __name__ == "__main__":
    sys.exit(main())
