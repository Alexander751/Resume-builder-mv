"""Diagnostik: resume PANJANG (3+ halaman) - adakah pratonton sama dengan PDF?

Guna:  python test/semak_halaman_panjang.py

KES YANG DIKETAHUI MENYIMPANG (Fasa 50, diukur 2026-09-29):

    kes                  halaman()  helaian u/s  PDF   padan?
    biru 6 pekerjaan      2          2/2          2     YA
    biru 9 pekerjaan      3          3/3          2     TIDAK  <- pratonton tunjuk 3, PDF 2
    korporat 9            2          2/2          2     YA
    bersih 9              3          2/2          3     TIDAK  <- helaian ke-3 tidak dibina
    korporat 12           3          3/3          3     YA

Puncanya: ukuran tinggi kandungan pada SKRIN lebih tinggi daripada susun atur CETAKAN (Chrome
mencetak lebih padat - font/line box berbeza sedikit), jadi model halaman app menganggar 1 halaman
lebih. Untuk templat dua lajur, `offsetHeight` kolum juga tidak boleh dipercayai kerana flex
`align-items: stretch` meregangkan kolum ke tinggi bekas.

Skrip ini mencetak jadual dan sentiasa keluar 0 (ia diagnostik, bukan pengawal regresi) supaya
penyimpangan ini kelihatan tanpa memecahkan suite utama.
"""
import io
import json
import os
import re
import subprocess
import sys
import tempfile

import pymupdf

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data_pratonton_ujian.json")
KES = [("biru", 6), ("biru", 9), ("biru", 12), ("bersih", 6), ("bersih", 9), ("korporat", 9), ("korporat", 12)]

PROBE = ("(function(){try{%s\n"
         "var x=document.createElement('div');x.id='ukur';x.className='no-print';x.textContent=JSON.stringify({"
         "halaman:window.ResumeMV.halaman(), tinggiIsi:Math.round(window.ResumeMV.tinggiIsi()),"
         "potong:window.ResumeMV.potong(),"
         "utama:document.querySelectorAll('#papan-kertas > .kertas').length,"
         "sisi:document.querySelectorAll('#papan-sisi > .kertas').length});document.body.appendChild(x);}catch(e){}})();")


def jalankan(app, data, folder, nama):
    isi = ("window.ResumeMV.isi(%s);document.getElementById('mula-isi').click();"
           "document.getElementById('borang').dispatchEvent(new Event('input',{bubbles:true}));"
           "document.body.classList.add('mod-penjual');"
           "var c=document.getElementById('cap-air'); if(c) c.innerHTML='';"
           "var cs=document.getElementById('cap-air-sisi'); if(cs) cs.innerHTML='';") % json.dumps(data, ensure_ascii=False)
    f = os.path.join(folder, "p_" + nama + ".html")
    io.open(f, "w", encoding="utf-8", newline="").write(app.replace("</body>", "\n<script>" + PROBE % isi + "</script>\n</body>"))
    url = "file:///" + f.replace("\\", "/")
    dom = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                          "--window-size=1600,1000", "--user-data-dir=" + os.path.join(folder, "d" + nama),
                          "--virtual-time-budget=14000", "--dump-dom", url], capture_output=True, text=True, timeout=240)
    m = re.search(r'<div id="ukur" class="no-print">([^<]*)</div>', dom.stdout)
    o = json.loads(m.group(1)) if m else {"halaman": None}
    f2 = os.path.join(folder, "c_" + nama + ".html")
    io.open(f2, "w", encoding="utf-8", newline="").write(app.replace(
        "</body>", "\n<script>(function(){try{" + isi + "document.getElementById('ke-3').click();}catch(e){}})();</script>\n</body>"))
    pdf = os.path.join(folder, "c_" + nama + ".pdf")
    if os.path.exists(pdf):
        os.remove(pdf)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                    "--no-pdf-header-footer", "--user-data-dir=" + os.path.join(folder, "e" + nama),
                    "--virtual-time-budget=14000", "--print-to-pdf=" + pdf,
                    "file:///" + f2.replace("\\", "/")], capture_output=True, text=True, timeout=240)
    return o, pymupdf.open(pdf).page_count


def main():
    app = io.open(os.path.join(AKAR, "index.html"), encoding="utf-8", newline="").read().replace("\r\n", "\n")
    dasar = json.load(io.open(DATA, encoding="utf-8"))
    folder = tempfile.mkdtemp(prefix="halaman-panjang-")
    print("KES PANJANG: pratonton lawan PDF cetak (diagnostik, bukan pengawal regresi)\n")
    print("%-10s %-6s %-9s %-10s %-6s %-9s %s" % ("templat", "kerja", "halaman()", "helaian u/s", "PDF", "tinggiIsi", "padan?"))
    gagal = 0
    for templat, kerja in KES:
        peng = list(dasar["pengalaman"])
        while len(peng) < kerja:
            t = json.loads(json.dumps(peng[-1]))
            t["syarikat"] = "Syarikat Ujian %d" % (len(peng) + 1)
            peng.append(t)
        d = dict(dasar)
        d["templat"] = templat
        d["susun"] = {"kiri": [], "kanan": []}
        d["pengalaman"] = peng[:kerja]
        o, hp = jalankan(app, d, folder, "%s%d" % (templat, kerja))
        padan = o.get("halaman") == hp and o.get("utama") == hp and o.get("sisi") == hp
        if not padan:
            gagal += 1
        print("%-10s %-6d %-9s %-10s %-6d %-9s %s" % (
            templat, kerja, o.get("halaman"), "%s/%s" % (o.get("utama"), o.get("sisi")), hp, o.get("tinggiIsi"),
            "ya" if padan else "TIDAK"))
    print("\n%d daripada %d kes panjang menyimpang (lihat docstring untuk punca)." % (gagal, len(KES)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
