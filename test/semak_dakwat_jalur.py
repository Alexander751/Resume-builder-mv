# -*- coding: utf-8 -*-
"""Ujian kriteria sebenar: adakah DAKWAT (piksel teks) berada dalam jalur 5mm di puncak halaman?

Teks dalam lapisan PDF tidak membuktikan apa-apa (tajuk yang ditutup masih ada dalam fail).
Ujian ini merender setiap halaman pada 150 dpi dan mengira piksel yang bukan warna jalur dan bukan
putih di dalam jalur 0.3-4.7mm - itu bermakna ada teks yang sebenarnya kelihatan di kawasan yang
sepatutnya ditutup oleh jalur berwarna.
"""
import io, json, os, subprocess
import pymupdf
from PIL import Image

S = r"C:/Users/ADMIN/AppData/Local/hermes/cache/scratch"
APP = r"C:\Users\ADMIN\Documents\Resume-builder-mv\index.html"
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
MM = 72 / 25.4
app = io.open(APP, encoding="utf-8", newline="").read()
JALUR = {"bersih": (0, 54, 109), "biru": (50, 59, 76), "korporat": (0, 0, 0)}   # korporat: tiada jalur

NAMA_KEM = ["Microsoft Office", "Cost X", "IT Operation", "Bill of Quantities", "Cost Estimation",
            "Contract Admin", "Site Measurement", "Tender Document", "Rate Analysis", "AutoCAD",
            "MS Project", "Excel"]

def data(templat, bulet, kem):
    D = {"nama": "Che Ku Ahmad Ridzuan Mazlan", "jawatan": "Quantity Surveyor", "templat": templat,
         "telefon": "011-5900 3242", "emel": "ridzuan.954@yahoo.com", "lokasi": "Kemaman, Terengganu",
         "ringkasan": "Quantity surveyor berpengalaman dalam kawalan kos projek perumahan mampu milik dan penyediaan BQ.",
         "pengalaman": [
             {"syarikat": "EPH Construction Sdn Bhd", "jawatan": "Site Quantity Surveyor", "tempoh": "Apr 2024 - Kini",
              "poin": ["Menyediakan Bill of Quantities dan dokumen tawaran projek perumahan Idaman Rakyat.",
                       "Menilai tuntutan bulanan kontraktor dan sub-kontraktor serta interim certificate.",
                       "Mengukur kerja sebenar di tapak dan menyelaraskan kuantiti interim.",
                       "Menyelia kerja baki projek dan memantau kos berbanding belanjawan.",
                       "Menyedia laporan kos bulanan untuk mesyuarat pengurusan projek."][:bulet]},
             {"syarikat": "Pembinaan Rizen Sdn Bhd", "jawatan": "Cost & Contract Executive", "tempoh": "Apr 2021 - 2024",
              "poin": ["Prepared monthly claim project and monthly claim for sub-contractor.",
                       "Conducted negotiation with supplier for price quotation.",
                       "Prepared costing budget for element - to assist director in making decision.",
                       "Prepared build up rate, variation order, and issues site memo.",
                       "Cost control for profit for project."][:bulet]},
         ],
         "pendidikan": [{"kelulusan": "Sarjana Muda Ukur Bahan", "institusi": "Universiti Teknologi Malaysia", "tahun": "2014 - 2018"}],
         "kemahiran": [{"nama": n, "tahap": 3 + (i % 3)} for i, n in enumerate(NAMA_KEM[:kem])],
         "bahasa": [{"nama": "Malay", "tahap": 5}, {"nama": "English", "tahap": 4}],
         "rujukan": [{"nama": "Muhammad Safwan", "jawatan": "Coordinator", "telefon": "012-345 6789"}],
         "tambahan": [{"t": "Sijil & Latihan", "b": "Sijil Contoh Satu\nSijil Contoh Dua"}]}
    if templat == "bersih":
        D["susun"] = {"kiri": ["kontak", "profil", "pengalaman", "bahasa", "kemahiran", "t0"], "kanan": []}
    return D

def render(nama, D):
    kod = ("window.ResumeMV.isi(%s);document.getElementById('mula-isi').click();"
           "document.getElementById('borang').dispatchEvent(new Event('input',{bubbles:true}));"
           "document.getElementById('ke-3').click();document.body.classList.add('mod-penjual');"
           "var c=document.getElementById('cap-air'); if(c) c.innerHTML='';"
           "var cs=document.getElementById('cap-air-sisi'); if(cs) cs.innerHTML='';") % json.dumps(D, ensure_ascii=False)
    h = os.path.join(S, nama + ".html")
    io.open(h, "w", encoding="utf-8", newline="").write(app.replace("</body>", "\n<script>(function(){" + kod + "})();</script>\n</body>"))
    out = os.path.join(S, nama + ".pdf")
    if os.path.exists(out): os.remove(out)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", "--no-pdf-header-footer",
                    "--user-data-dir=%s/dakwat" % S, "--virtual-time-budget=15000", "--print-to-pdf=" + out,
                    "file:///%s/%s.html" % (S, nama)], capture_output=True, text=True, timeout=200)
    return pymupdf.open(out) if os.path.exists(out) else None

total_dakwat = 0
diuji = 0
for templat in ("bersih", "biru", "korporat"):
    for bulet in (4, 5, 6):
        for kem in (2, 6, 12):
            d = render("dak_%s_%d_%d" % (templat, bulet, kem), data(templat, bulet, kem))
            if d is None: continue
            diuji += 1
            jal = JALUR[templat]
            for i, pg in enumerate(d):
                pix = pg.get_pixmap(dpi=150)
                im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                ppm = pix.width / 210.0
                jum = 0
                for y in range(int(0.3*ppm), int(4.7*ppm)):
                    for x in range(int(8*ppm), int(202*ppm)):
                        r, g, b = im.getpixel((x, y))
                        L = (r+g+b)/3
                        if L < 150:                                   # ada dakwat
                            jauh_jalur = ((r-jal[0])**2 + (g-jal[1])**2 + (b-jal[2])**2) ** .5
                            if jauh_jalur > 55:                        # bukan warna jalur
                                jum += 1
                if jum > 20:
                    total_dakwat += jum
                    print("  >>> hlm %d %s_%d_%d: %d piksel dakwat dalam jalur 5mm" % (i+1, templat, bulet, kem, jum))
print("\nkonfigurasi: %d | jumlah piksel dakwat dalam jalur: %d" % (diuji, total_dakwat))
print("LULUS" if total_dakwat == 0 else "GAGAL")
