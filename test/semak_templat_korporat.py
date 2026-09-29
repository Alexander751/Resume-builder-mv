# -*- coding: utf-8 -*-
"""Ukur templat Minimalis Korporat yang baru dibina: geometri vs rujukan + pemeriksaan piksel."""
import io, json, os, re, subprocess, sys
import pymupdf
from PIL import Image

S = r"C:/Users/ADMIN/AppData/Local/hermes/cache/scratch"
APP = r"C:\Users\ADMIN\Documents\Resume-builder-mv\index.html"
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
app = io.open(APP, encoding="utf-8", newline="").read()
MM = 72 / 25.4

D = {
    "nama": "Che Ku Ahmad Ridzuan Mazlan", "jawatan": "Quantity Surveyor", "templat": "minimalis",
    "telefon": "+6011-5900 3242", "emel": "ridzuan.954@yahoo.com",
    "lokasi": "Kuala Terengganu, Terengganu",
    "ringkasan": ("Quantity surveyor dengan lebih tiga tahun pengalaman dalam projek perumahan mampu milik. "
                  "Berpengalaman menyediakan Bill of Quantities, menilai tuntutan kontraktor dan mengawal kos "
                  "projek supaya kekal dalam belanjawan. Kuat dalam pengukuran tapak dan dokumentasi kontrak."),
    "pengalaman": [
        {"syarikat": "EPH Construction Sdn Bhd", "jawatan": "Site Quantity Surveyor", "tempoh": "Apr 2024 - Kini",
         "poin": ["Menyediakan Bill of Quantities (BQ) dan dokumen tawaran untuk projek perumahan Idaman Rakyat.",
                  "Menilai tuntutan bulanan kontraktor dan sub-kontraktor serta menyediakan interim certificate.",
                  "Mengukur kerja sebenar di tapak dan menyelaraskan kuantiti interim dengan lukisan terkini.",
                  "Menyelia kerja baki projek dan memantau kos berbanding belanjawan yang diluluskan."]},
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
    "rujukan": [{"nama": "Muhammad Safwan bin Mohd Sobri", "jawatan": "Coordinator, Pembinaan Rizen Sdn Bhd", "telefon": "012-345 6789"}],
}
if "--foto" in sys.argv:
    D["foto"] = ("data:image/jpeg;base64," + __import__("base64").b64encode(
        open(os.path.join(S, "foto_contoh.jpg"), "rb").read()).decode()) if os.path.exists(os.path.join(S, "foto_contoh.jpg")) else ""

kod = ("window.ResumeMV.isi(%s);\ndocument.getElementById('mula-isi').click();\n"
       "document.getElementById('borang').dispatchEvent(new Event('input', { bubbles: true }));\n"
       "document.getElementById('ke-3').click();\n"
       "document.body.classList.add('mod-penjual');\n"
       "var c = document.getElementById('cap-air'); if (c) c.innerHTML = '';"
       "var cs = document.getElementById('cap-air-sisi'); if (cs) cs.innerHTML = '';") % json.dumps(D, ensure_ascii=False)

h = os.path.join(S, "min_uji.html")
io.open(h, "w", encoding="utf-8", newline="").write(
    app.replace("</body>", "\n<script>(function () {" + kod + "})();</script>\n</body>"))
out = os.path.join(S, "minimalis.pdf")
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
                "--user-data-dir=%s/min" % S, "--virtual-time-budget=18000",
                "--print-to-pdf=" + out, "file:///%s/min_uji.html" % S],
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

d = pymupdf.open(out)
print("PDF: %d halaman, %d bait" % (d.page_count, os.path.getsize(out)))
pg = d[0]
print("\n--- teks penting + kedudukan (mm) ---")
papar = ["CHE KU AHMAD", "QUANTITY SURVEYOR", "KONTAK", "PENDIDIKAN", "KEMAHIRAN", "BAHASA",
         "RINGKASAN", "PENGALAMAN", "EPH CONSTRUCTION", "RUJUKAN"]
for b in pg.get_text("dict")["blocks"]:
    if b.get("type") != 0: continue
    for l in b["lines"]:
        for sp in l["spans"]:
            t = sp["text"].strip()
            if any(t.upper().startswith(k[:12]) for k in papar):
                x0, y0 = sp["bbox"][0] / MM, sp["bbox"][1] / MM
                print("  %-34s x=%6.1fmm y=%6.1fmm  %4.1fpt %s" % (t[:34], x0, y0, sp["size"], sp["font"][:20]))

print("\n--- semakan piksel rel kelabu ---")
for i, p in enumerate(d):
    pix = p.get_pixmap(dpi=100)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    w, hh = im.size
    # sampel warna pada beberapa ketinggian dalam jalur 5-60mm dari tepi kiri
    y_cek = [int(hh * f) for f in (0.05, 0.35, 0.7, 0.95)]
    warna = []
    for y in y_cek:
        r, g, b = im.getpixel((int(w * 0.05), y))
        warna.append("#%02x%02x%02x" % (r, g, b))
    # teks dalam rel (piksel gelap pada 8-60mm, separuh atas-bawah)
    kiri = sum(1 for y in range(hh) for x in range(int(w*0.035), int(w*0.26)) if sum(im.getpixel((x, y)))/3 < 140)
    print("  hlm %d: warna rel pada 4 ketinggian: %s | piksel teks dalam rel: %d" % (i+1, " ".join(warna), kiri))

# kaki halaman: nama di kaki mesti kelihatan (ujian piksel yang sama seperti bug Fasa 34)
mm = 72 / 25.4
pg = d[0]
pix = pg.get_pixmap(clip=pymupdf.Rect(0, pg.rect.height - 9*mm, pg.rect.width, pg.rect.height), dpi=200)
im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples).convert("L")
w, hh = im.size; px = im.load()
kiri = sum(1 for y in range(hh) for x in range(int(w*0.35)) if px[x, y] < 140)
kanan = sum(1 for y in range(hh) for x in range(int(w*0.35), w) if px[x, y] < 140)
print("\n--- kaki halaman (teks) --- kiri: %d | kanan: %d" % (kiri, kanan))
