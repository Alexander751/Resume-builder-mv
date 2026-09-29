"""Semak ketepatan templat Korporat Moden terhadap PDF rujukan pelanggan.

Guna:  python test/semak_ketepatan_korporat.py ["laluan/PDF rujukan.pdf"]

Cetak jadual saiz/warna/x/y setiap sauh (nama, jawatan, tajuk, teks, kontak, kemahiran, pendidikan)
bagi RUJUKAN lawan TEMPLAT, dan ringkasan lulus/gagal.

PENTING (pengajaran Fasa 37): lapisan teks PDF menyimpan saiz, warna dan kedudukan yang TEPAT.
Laporan visual (anggaran piksel) memadai untuk BENTUK (bulat/segi, bujur) tetapi TIDAK untuk warna:
rujukan sebenar memakai #91a6a6 / #414042 / #333132, bukan #90a6a6 / #403f41 / #313132.
Sauh kedudukan menegak rel kiri SENGAJA tidak diuji: rujukan meletakkan seksyen rel pada kedudukan
tetap (jarak 22mm/5mm/8.6mm) manakala templat app mengalir untuk menampung kandungan apa-apa panjang.
"""
import io
import json
import os
import subprocess
import sys
import tempfile

import pymupdf

MM = 72 / 25.4
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
RUJUKAN = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/Minimalist Professional Corporate ATS Resume.pdf")

# Sauh: (label, teks dicari, saiz dijangka, x dijangka). None = jangan uji.
SAUH = [
    ("nama",          "Olivia",               34.0, 79.5),
    ("jawatan",       "Administrative Manager", 16.0, 79.5),
    ("tajuk rel",     "Kontak",               13.0, 10.0),
    ("tajuk kanan",   "Ringkasan",            13.0, 91.4),
    ("teks ringkasan", "Detail-oriented",      9.0, 83.7),
    ("kontak",        "123-456-7890",          9.0, 15.0),
    ("kemahiran",     "Client Acquisition",   10.0, 16.0),
    ("pendidikan",    "Borcelle University",   8.0, 10.0),
    ("tajuk kerja",   "Accounting Executive", 11.0, 83.7),
    ("tarikh kerja",  "Jan 2024",             10.0, 83.7),
    ("bulet kerja",   "Implemented cost",      9.5, 89.4),
]

DATA = {
    "nama": "Olivia Sanchez", "jawatan": "Administrative Manager", "templat": "korporat",
    "telefon": "123-456-7890", "emel": "hello@reallygreatsite.com", "lokasi": "123 Anywhere St., Any City",
    "ringkasan": "Detail-oriented administrative professional with over three years of experience providing "
                 "comprehensive administrative support. Skilled in office operations and problem-solving.",
    "pengalaman": [{"syarikat": "Borcelle Industries", "jawatan": "Accounting Executive",
                    "tempoh": "Jan 2024 - Present",
                    "poin": ["Implemented cost-control measures that reduced operational expenses.",
                             "Streamlined financial reporting processes, improving accuracy by 20%."]},
                   {"syarikat": "Timmerman Industries", "jawatan": "Accountant", "tempoh": "Jun 2022 - Jan 2024",
                    "poin": ["Managed month-end close processes efficiently."]}],
    "pendidikan": [{"kelulusan": "Bachelor of Business Management", "institusi": "Borcelle University",
                    "tahun": "2020 - 2023"}],
    "kemahiran": [{"nama": n, "tahap": 0} for n in ["Client Acquisition", "B2B Sales", "Negotiation",
                  "Relationship Management", "Market Analysis"]],
    "bahasa": [{"nama": n, "tahap": 0} for n in ["English (Fluent)", "Malay (Fluent)"]],
}


def render(keluar):
    """Render app dalam Chrome headless -> PDF."""
    app = io.open(os.path.join(AKAR, "index.html"), encoding="utf-8", newline="").read()
    kod = ("window.ResumeMV.isi(%s);document.getElementById('mula-isi').click();"
           "document.getElementById('borang').dispatchEvent(new Event('input',{bubbles:true}));"
           "document.getElementById('ke-3').click();document.body.classList.add('mod-penjual');"
           "var c=document.getElementById('cap-air'); if(c) c.innerHTML='';"
           "var cs=document.getElementById('cap-air-sisi'); if(cs) cs.innerHTML='';") % json.dumps(DATA, ensure_ascii=False)
    html = keluar + ".html"
    io.open(html, "w", encoding="utf-8", newline="").write(
        app.replace("</body>", "\n<script>(function(){" + kod + "})();</script>\n</body>"))
    if os.path.exists(keluar):
        os.remove(keluar)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                    "--no-pdf-header-footer", "--user-data-dir=" + keluar + ".d", "--virtual-time-budget=16000",
                    "--print-to-pdf=" + keluar, "file:///" + html.replace("\\", "/")],
                   capture_output=True, text=True, timeout=200)
    return pymupdf.open(keluar)


def sauh(dok, teks):
    for pg in dok:
        for b in pg.get_text("dict")["blocks"]:
            if b.get("type") != 0:
                continue
            for ln in b["lines"]:
                for sp in ln["spans"]:
                    if teks.lower() in sp["text"].lower():
                        c = sp["color"]
                        return (round(sp["size"], 1),
                                "#%02x%02x%02x" % ((c >> 16) & 255, (c >> 8) & 255, c & 255),
                                round(sp["bbox"][0] / MM, 1), round(sp["bbox"][1] / MM, 1))
    return None


def main():
    keluar = os.path.join(tempfile.gettempdir(), "ketepatan_korporat.pdf")
    ref, tam = pymupdf.open(RUJUKAN), render(keluar)
    print("RUJUKAN : %s" % RUJUKAN)
    print("TEMPLAT : %s (%d halaman)\n" % (keluar, tam.page_count))
    print("%-16s | %-30s | %-30s | %s" % ("sauh", "RUJUKAN (saiz,warna,x,y)", "TEMPLAT", "beza"))
    lulus = gagal = 0
    for label, teks, saiz, x in SAUH:
        a, t = sauh(ref, teks), sauh(tam, teks)
        if not t:
            print("%-16s | %-30s | %-30s | TIADA" % (label, a or "-", "-"))
            gagal += 1
            continue
        beza = []
        if abs(t[0] - saiz) > 0.1:
            beza.append("saiz %.1f->%.1f" % (saiz, t[0]))
        if a and a[1] != t[1]:
            beza.append("warna %s->%s" % (a[1], t[1]))
        if abs(t[2] - x) > 0.6:
            beza.append("x %.1f->%.1f" % (x, t[2]))
        if beza:
            gagal += 1
        else:
            lulus += 1
        print("%-16s | %-30s | %-30s | %s" % (label, "%.1fpt %s x=%.1f y=%.1f" % a if a else "-",
                                              "%.1fpt %s x=%.1f y=%.1f" % t, "OK" if not beza else ", ".join(beza)))
    print("\n%d padan, %d menyimpang" % (lulus, gagal))
    print("Nota: kedudukan menegak rel kiri tidak diuji (rujukan meletakkan seksyen pada kedudukan tetap;")
    print("templat app mengalir). Rujuk README Fasa 37 untuk senarai penuh perbezaan yang tinggal.")
    return 1 if gagal else 0


if __name__ == "__main__":
    sys.exit(main())
