# -*- coding: utf-8 -*-
"""Sahkan pembetulan visual templat Korporat Moden: foto bulat, ikon bulat, warna, dakwat."""
import base64, io, json, os, subprocess
import pymupdf
from PIL import Image, ImageDraw

S = r"C:/Users/ADMIN/AppData/Local/hermes/cache/scratch"
APP = r"C:\Users\ADMIN\Documents\Resume-builder-mv\index.html"
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
MM = 72 / 25.4
app = io.open(APP, encoding="utf-8", newline="").read()

# gambar ujian: merah pejal supaya bulatan vs segi empat tidak boleh disalah tafsir
im = Image.new("RGB", (400, 400), (220, 30, 30))
ImageDraw.Draw(im).ellipse((60, 60, 340, 340), fill=(250, 220, 40))
f = os.path.join(S, "foto_uji.jpg"); im.save(f, quality=90)
foto = "data:image/jpeg;base64," + base64.b64encode(open(f, "rb").read()).decode()

D = {"nama": "Che Ku Ahmad Ridzuan Mazlan", "jawatan": "Quantity Surveyor", "templat": "korporat",
     "foto": foto, "telefon": "011-5900 3242", "emel": "ridzuan.954@yahoo.com", "lokasi": "Kemaman, Terengganu",
     "ringkasan": "Quantity surveyor berpengalaman dalam penyediaan Bill of Quantities, penilaian tuntutan dan kawalan kos projek perumahan.",
     "pengalaman": [{"syarikat": "EPH Construction", "jawatan": "Site Quantity Surveyor", "tempoh": "2024 - Kini",
                     "poin": ["Menyediakan BQ dan dokumen tawaran projek perumahan Idaman Rakyat.",
                              "Menilai tuntutan bulanan kontraktor dan sub-kontraktor."]}]}
kod = ("window.ResumeMV.isi(%s);document.getElementById('mula-isi').click();"
       "document.getElementById('borang').dispatchEvent(new Event('input',{bubbles:true}));"
       "document.getElementById('ke-3').click();document.body.classList.add('mod-penjual');"
       "var c=document.getElementById('cap-air'); if(c) c.innerHTML='';"
       "var cs=document.getElementById('cap-air-sisi'); if(cs) cs.innerHTML='';") % json.dumps(D, ensure_ascii=False)
h = os.path.join(S, "korp_visual.html")
io.open(h, "w", encoding="utf-8", newline="").write(app.replace("</body>", "\n<script>(function(){" + kod + "})();</script>\n</body>"))
out = os.path.join(S, "korporat_visual.pdf")
if os.path.exists(out): os.remove(out)
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", "--no-pdf-header-footer",
                "--user-data-dir=%s/korp5" % S, "--virtual-time-budget=22000", "--print-to-pdf=" + out,
                "file:///%s/korp_visual.html" % S], capture_output=True, text=True, timeout=200)
d = pymupdf.open(out)
print("PDF: %d halaman, %d bait" % (d.page_count, os.path.getsize(out)))
pix = d[0].get_pixmap(dpi=200)
img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
px_per_mm = pix.width / 210.0
def warna_at(xmm, ymm):
    return "#%02x%02x%02x" % img.getpixel((int(xmm*px_per_mm), int(ymm*px_per_mm)))

print("\n--- foto (kotak 15.7-52.4mm, 14.1-50.8mm) ---")
print("  tengah  :", warna_at(34.0, 32.5), "(patut merah/kuning = gambar)")
for nama, x, y in [("sudut kiri atas", 16.2, 14.6), ("sudut kanan atas", 51.9, 14.6),
                   ("sudut kiri bawah", 16.2, 50.3), ("sudut kanan bawah", 51.9, 50.3)]:
    print("  %-16s: %s (patut #dae3e3 = rel, kalau segi empat akan jadi merah)" % (nama, warna_at(x, y)))

print("\n--- ikon tajuk kolum kanan (bulatan 8.3mm di x 79.5mm) ---")
# cari ketinggian tajuk RINGKASAN dari span
y_tajuk = None
for b in d[0].get_text("dict")["blocks"]:
    if b.get("type") != 0: continue
    for l in b["lines"]:
        for sp in l["spans"]:
            if sp["text"].strip().upper().startswith("RINGKASAN"):
                y_tajuk = sp["bbox"][1]/MM
            if sp["text"].strip().upper().startswith("CHE KU"):
                print("  nama: warna span = %s | saiz = %.1fpt | fon = %s" %
                      ("#%06x" % sp["color"], sp["size"], sp["font"]))
print("  tajuk pada y = %.1fmm" % (y_tajuk or 0))
if y_tajuk:
    yc = y_tajuk + 4.15
    print("  tengah ikon    :", warna_at(83.6, yc), "(patut gelap #403f40)")
    print("  sudut ikon     :", warna_at(80.0, yc - 3.9), warna_at(87.2, yc - 3.9), "(patut putih, kalau segi empat akan gelap)")

print("\n--- warna teks yang diukur dari PDF ---")
def warna_teks(cari):
    for b in d[0].get_text("dict")["blocks"]:
        if b.get("type") != 0: continue
        for l in b["lines"]:
            for sp in l["spans"]:
                if sp["text"].strip().upper().startswith(cari):
                    return "#%06x" % sp["color"], round(sp["size"],1), sp["font"][:22]
    return None
for k in ["CHE KU", "QUANTITY SURVEYOR", "KONTAK", "RINGKASAN", "EPH CONSTRUCTION", "2024"]:
    print("  %-20s -> %s" % (k, warna_teks(k)))
