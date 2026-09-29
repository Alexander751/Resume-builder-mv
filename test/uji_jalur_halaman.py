# -*- coding: utf-8 -*-
"""Sahkan selepas pembetulan: (1) tajuk yang jatuh pada pemisah halaman kini KELIHATAN,
(2) halaman 1 setiap templat kekal seperti sebelum ini, (3) kiraan halaman pratonton = cetakan.
"""
import io, json, os, re, subprocess
import pymupdf
from PIL import Image

S = r"C:/Users/ADMIN/AppData/Local/hermes/cache/scratch"
APP = r"C:\Users\ADMIN\Documents\Resume-builder-mv\index.html"
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
MM = 72 / 25.4
app = io.open(APP, encoding="utf-8", newline="").read()

def data(templat, bulet=5, kem=6, profil=1, jobs=2):
    D = {"nama": "Che Ku Ahmad Ridzuan Mazlan", "jawatan": "Quantity Surveyor", "templat": templat,
         "telefon": "011-5900 3242", "emel": "ridzuan.954@yahoo.com", "lokasi": "Kemaman, Terengganu",
         "ringkasan": " ".join(["Quantity surveyor berpengalaman dalam kawalan kos projek perumahan mampu milik dan penyediaan BQ."]*profil),
         "pengalaman": [
             {"syarikat": "EPH Construction Sdn Bhd", "jawatan": "Site Quantity Surveyor", "tempoh": "Apr 2024 - Kini",
              "poin": ["Menyediakan Bill of Quantities dan dokumen tawaran projek perumahan Idaman Rakyat.",
                       "Menilai tuntutan bulanan kontraktor dan sub-kontraktor serta interim certificate.",
                       "Mengukur kerja sebenar di tapak dan menyelaraskan kuantiti interim.",
                       "Menyelia kerja baki projek dan memantau kos berbanding belanjawan.",
                       "Menyedia laporan kos bulanan untuk mesyuarat pengurusan projek peringkat negeri."][:bulet]},
             {"syarikat": "Pembinaan Rizen Sdn Bhd", "jawatan": "Cost & Contract Executive", "tempoh": "Apr 2021 - 2024",
              "poin": ["Prepared monthly claim project and monthly claim for sub-contractor.",
                       "Conducted negotiation with supplier for price quotation.",
                       "Prepared costing budget for element - to assist director in making decision.",
                       "Prepared build up rate, variation order, and issues site memo.",
                       "Cost control for profit for project."][:bulet]},
         ] + [{"syarikat": "Syarikat Contoh %d Sdn Bhd" % (i+3), "jawatan": "Quantity Surveyor",
               "tempoh": "Jan 20%02d - Dis 20%02d" % (10+i, 13+i),
               "poin": ["Menyediakan Bill of Quantities untuk projek perumahan mampu milik negeri.",
                        "Menilai tuntutan bulanan kontraktor dan sub-kontraktor.",
                        "Mengukur kerja sebenar di tapak dan menyelaraskan kuantiti interim.",
                        "Menyediakan laporan kemajuan kos bulanan untuk mesyuarat projek.",
                        "Mengurus dokumen tender dan penilaian sebut harga sub-kontraktor."]} for i in range(max(0, jobs-2))],
         "pendidikan": [{"kelulusan": "Sarjana Muda Ukur Bahan", "institusi": "Universiti Teknologi Malaysia", "tahun": "2014 - 2018"}],
         "kemahiran": [{"nama": n, "tahap": 3 + (i % 3)} for i, n in enumerate(
             ["Microsoft Office", "Cost X", "IT Operation", "Bill of Quantities", "Cost Estimation",
              "Contract Admin", "Site Measurement", "Tender Document", "Rate Analysis", "AutoCAD"][:kem])],
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
           "var cs=document.getElementById('cap-air-sisi'); if(cs) cs.innerHTML='';"
           "setTimeout(function(){var h=window.ResumeMV.halaman();var el=document.createElement('div');"
           "el.style.cssText='font-size:6pt';el.textContent='HAL-APP:'+h;document.body.appendChild(el);},2000);") % json.dumps(D, ensure_ascii=False)
    h = os.path.join(S, nama + ".html")
    io.open(h, "w", encoding="utf-8", newline="").write(app.replace("</body>", "\n<script>(function(){" + kod + "})();</script>\n</body>"))
    out = os.path.join(S, nama + ".pdf")
    if os.path.exists(out): os.remove(out)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", "--no-pdf-header-footer",
                    "--user-data-dir=%s/hasil" % S, "--virtual-time-budget=15000", "--print-to-pdf=" + out,
                    "file:///%s/%s.html" % (S, nama)], capture_output=True, text=True, timeout=200)
    return pymupdf.open(out) if os.path.exists(out) else None

def pos(d, teks, semua=False):
    h = []
    for i, pg in enumerate(d):
        for b in pg.get_text("dict")["blocks"]:
            if b.get("type") != 0: continue
            for l in b["lines"]:
                for sp in l["spans"]:
                    if teks.lower() in sp["text"].strip().lower():
                        h.append((i+1, round(sp["bbox"][1]/MM, 1), sp["text"].strip()))
    return h if semua else (h[0] if h else (None, None, None))

def dakwat_dalam_jalur(d, hal, jalur, atas=0.3, bawah=4.7):
    pg = d[hal-1]
    pix = pg.get_pixmap(dpi=150)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    ppm = pix.width/210.0
    n = 0
    for y in range(int(atas*ppm), int(bawah*ppm)):
        for x in range(int(8*ppm), int(202*ppm)):
            r, g, b = im.getpixel((x, y))
            if (r+g+b)/3 < 150 and ((r-jalur[0])**2+(g-jalur[1])**2+(b-jalur[2])**2)**.5 > 55: n += 1
    return n

print("=== 1. kes pengguna: tajuk BAHASA yang jatuh pada pemisah halaman ===")
terbaik = None
for jobs in (3, 4, 5):
    for profil in range(1, 8):
        d = render("hasil_bersih_%d_%d" % (jobs, profil), data("bersih", 5, 6, profil, jobs))
        tp = pos(d, "BAHASA")
        if tp[0] and tp[0] >= 2:
            if terbaik is None or tp[1] < terbaik[1]:
                terbaik = (jobs * 10 + profil, tp[1], d)
                print("  calon: jobs=%d profil=%d -> BAHASA hlm %d y=%.1fmm" % (jobs, profil, tp[0], tp[1]))
assert terbaik, "tiada kes BAHASA jatuh pada halaman 2 dalam grid ini - perlu keluasan lain" 
print("  kes terpilih: profil=%s, BAHASA di halaman 2 pada y=%.1fmm" % (terbaik[0], terbaik[1]))
d = terbaik[2]
print("  halaman PDF: %d | jalur 5mm: dakwat dalam jalur = %d piksel (0 = selamat)"
      % (d.page_count, dakwat_dalam_jalur(d, 2, (0, 54, 109))))
m = re.search(r"HAL-APP:(\d)", "\n".join(p.get_text() for p in d))
print("  kiraan halaman app: %s | halaman cetakan: %d -> %s"
      % (m.group(1) if m else "?", d.page_count,
         "SEPADAN" if m and int(m.group(1)) == d.page_count else "TIDAK SEPADAN"))
# potong puncak halaman 2 sebagai bukti gambar
pg = d[1]
clip = pymupdf.Rect(0, 0, pg.rect.width, 70*MM)
pix = pg.get_pixmap(clip=clip, dpi=160)
pix.save(os.path.join(S, "bukti_halaman2_kini.png"))
print("  simpan bukti gambar: bukti_halaman2_kini.png")

print("\n=== 2. halaman 1 setiap templat (kedudukan mesti sama seperti rujukan) ===")
for templat in ("bersih", "biru", "korporat"):
    d = render("hasil_p1_%s" % templat, data(templat, 3, 3))
    if templat == "korporat":
        for t in ("KONTAK", "RINGKASAN"):
            print("  korporat: %-9s y=%.1fmm (rujukan 58.0)" % (t, pos(d, t)[1]))
    else:
        nama = pos(d, "Che Ku Ahmad Ridzuan")[1]
        print("  %-9s: baris pertama teks halaman 1 pada y=%.1fmm" % (templat, nama))
    if templat == "biru":
        pix = d[0].get_pixmap(dpi=100)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        ppm = pix.width/210.0
        print("     warna di y=1mm: %s (jalur/banner navy #323b4c dijangka)" % (im.getpixel((int(100*ppm), int(1*ppm))),))
