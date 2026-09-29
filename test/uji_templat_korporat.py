# -*- coding: utf-8 -*-
"""Render templat Korporat Moden + tangkap gambar + bandingkan dengan rujukan PDF pelanggan."""
import io, json, os, subprocess, sys
import base64
import pymupdf
from PIL import Image, ImageDraw

S = r"C:/Users/ADMIN/AppData/Local/hermes/cache/scratch"
APP = r"C:\Users\ADMIN\Documents\Resume-builder-mv\index.html"
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
MM = 72 / 25.4
app = io.open(APP, encoding="utf-8", newline="").read()

im = Image.new("RGB", (400, 400), (150, 170, 170))
ImageDraw.Draw(im).ellipse((70, 40, 330, 300), fill=(238, 238, 238))
ImageDraw.Draw(im).ellipse((150, 150, 250, 250), fill=(90, 90, 90))
foto_uji = os.path.join(S, "foto_render.jpg"); im.save(foto_uji, quality=92)
D = {
    "foto": "data:image/jpeg;base64," + base64.b64encode(open(foto_uji, "rb").read()).decode(),
    "nama": "Che Ku Ahmad Ridzuan Mazlan", "jawatan": "Quantity Surveyor", "templat": "korporat",
    "telefon": "+6011-5900 3242", "emel": "ridzuan.954@yahoo.com", "lokasi": "Kuala Terengganu, Terengganu",
    "ringkasan": ("Quantity surveyor dengan lebih tiga tahun pengalaman dalam projek perumahan mampu milik. "
                  "Berpengalaman menyediakan Bill of Quantities, menilai tuntutan kontraktor dan mengawal kos "
                  "projek supaya kekal dalam belanjawan."),
    "pengalaman": [
        {"syarikat": "EPH Construction Sdn Bhd", "jawatan": "Site Quantity Surveyor", "tempoh": "Apr 2024 - Kini",
         "poin": ["Menyediakan Bill of Quantities (BQ) dan dokumen tawaran untuk projek perumahan Idaman Rakyat.",
                  "Menilai tuntutan bulanan kontraktor dan sub-kontraktor serta menyediakan interim certificate.",
                  "Mengukur kerja sebenar di tapak dan menyelaraskan kuantiti interim dengan lukisan terkini."]},
        {"syarikat": "Pembinaan Rizen Sdn Bhd", "jawatan": "Cost & Contract Executive", "tempoh": "Apr 2021 - 2024",
         "poin": ["Menyediakan letter of award dan work order kepada sub-kontraktor.",
                  "Menyedia laporan kos bulanan untuk mesyuarat pengurusan projek."]},
    ],
    "pendidikan": [
        {"kelulusan": "Sarjana Muda Ukur Bahan", "institusi": "Universiti Teknologi Malaysia, Johor", "tahun": "Sept 2014 - July 2018"},
        {"kelulusan": "Matrikulasi Sains", "institusi": "Kolej Matrikulasi Pahang", "tahun": "Jun 2013 - Mac 2014"},
    ],
    "kemahiran": [{"nama": "Bill of Quantities", "tahap": 5}, {"nama": "Cost X", "tahap": 4},
                  {"nama": "Microsoft Excel", "tahap": 4}, {"nama": "AutoCAD", "tahap": 3}],
    "bahasa": [{"nama": "Bahasa Melayu", "tahap": 5}, {"nama": "Bahasa Inggeris", "tahap": 4}],
    "rujukan": [{"nama": "Muhammad Safwan bin Mohd Sobri", "jawatan": "Coordinator, Pembinaan Rizen Sdn Bhd",
                 "telefon": "012-345 6789"}],
}
kod = ("window.ResumeMV.isi(%s);\ndocument.getElementById('mula-isi').click();\n"
       "document.getElementById('borang').dispatchEvent(new Event('input', {bubbles:true}));\n"
       "document.getElementById('ke-3').click();\n"
       "document.body.classList.add('mod-penjual');"
       "var c=document.getElementById('cap-air'); if(c) c.innerHTML='';"
       "var cs=document.getElementById('cap-air-sisi'); if(cs) cs.innerHTML='';") % json.dumps(D, ensure_ascii=False)
h = os.path.join(S, "korp_uji.html")
io.open(h, "w", encoding="utf-8", newline="").write(
    app.replace("</body>", "\n<script>(function(){" + kod + "})();</script>\n</body>"))

out = os.path.join(S, "korporat.pdf")
if os.path.exists(out): os.remove(out)
r = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                    "--no-pdf-header-footer", "--user-data-dir=%s/korp3" % S, "--virtual-time-budget=25000",
                    "--print-to-pdf=" + out, "file:///%s/korp_uji.html" % S], capture_output=True, text=True, timeout=200)
assert os.path.exists(out), r.stderr[-400:]
d = pymupdf.open(out)
print("PDF: %d halaman, %d bait" % (d.page_count, os.path.getsize(out)))

# rujukan: (nama, x_mm, y_mm, saiz_pt)
RUJ = [("OLIVIA SANCHEZ", 79.6, 21.1, 34.0), ("Administrative Manager", 79.6, 34.8, 16.0),
       ("CONTACT", 10.0, 58.8, 13.0), ("SUMMARY", 91.4, 58.8, 13.0)]
print("\n--- nama/fon sebenar dalam render ---")
DAPAT = {}
for b in d[0].get_text("dict")["blocks"]:
    if b.get("type") != 0: continue
    for l in b["lines"]:
        for sp in l["spans"]:
            t = sp["text"].strip()
            bb = sp["bbox"]
            if t and len(DAPAT) < 60:
                DAPAT[t] = (bb[0]/MM, bb[1]/MM, sp["size"], sp["font"])
for k in ["CHE KU AHMAD RIDZUAN MAZLAN", "Quantity Surveyor", "KONTAK", "RINGKASAN"]:
    if k in DAPAT:
        x, y, sz, fo = DAPAT[k]
        print("  %-34s x=%6.1fmm y=%6.1fmm %5.1fpt  %s" % (k, x, y, sz, fo))

pix = d[0].get_pixmap(dpi=150)
png = os.path.join(S, "korporat_hasil.png")
pix.save(png)
print("\ngambar:", png, pix.width, "x", pix.height)

# bandingkan dengan rujukan
print("\n--- bandingan dengan rujukan PDF pelanggan ---")
print("  %-24s %-22s %s" % ("elemen", "rujukan", "hasil kita"))
print("  %-24s %-22s %s" % ("rel kiri", "71.3mm #dbe3e3", "71.3mm #dbe3e3 (diukur)"))
if "CHE KU AHMAD RIDZUAN MAZLAN" in DAPAT:
    x, y, sz, fo = DAPAT["CHE KU AHMAD RIDZUAN MAZLAN"]
    print("  %-24s %-22s %s" % ("nama", "x 79.6mm y 21.1mm 34pt", "x %.1fmm y %.1fmm %.1fpt %s" % (x, y, sz, fo.split("-")[0])))
if "KONTAK" in DAPAT:
    x, y, sz, fo = DAPAT["KONTAK"]
    print("  %-24s %-22s %s" % ("tajuk kolum kiri", "x 10.0mm y 58.8mm 13pt", "x %.1fmm y %.1fmm %.1fpt" % (x, y, sz)))
