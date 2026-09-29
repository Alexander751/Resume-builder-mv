# -*- coding: utf-8 -*-
"""Ujian minimum: adakah tajuk bahagian hilang bila ia jatuh pada pemisah halaman?

Halaman kecil ini meniru CSS cetakan app (h2 dengan break-after: avoid + border-bottom,
li dengan break-inside: avoid) tanpa sebarang JS. Baris pengisi ditambah satu demi satu
supaya tajuk 'Bahasa' bergerak melintasi pemisah halaman.
"""
import io, os, subprocess
import pymupdf

S = r"C:/Users/ADMIN/AppData/Local/hermes/cache/scratch"
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"

TOPO = """<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; }
.lembar { padding: 10mm 12.5mm 14mm 12.5mm; font: 10.5pt/1.36 Arial, sans-serif; color: #1e1e1e; }
h2 { font-size: 12pt; font-weight: 700; color: #00366d; letter-spacing: .02em; text-transform: uppercase;
     margin: 4.2mm 0 0; padding-bottom: 2.1mm; border-bottom: 1pt solid #00366d;
     break-after: avoid; page-break-after: avoid; }
p { margin: 0 0 2mm; }
ul { list-style: none; margin: 2.4mm 0 0; padding: 0; }
li { padding-left: 6.3mm; margin-bottom: 1.1mm; break-inside: avoid; page-break-inside: avoid; }
.baris { height: 5.0mm; }
</style></head><body><div class="lembar">
<p>Ringkasan profil.</p>
__FILLER__
<div class="blok"><h2>Bahasa</h2><ul><li>Malay</li><li>English</li></ul></div>
<div class="blok"><h2>Kemahiran</h2><ul><li>Microsoft Office</li><li>Cost X</li></ul></div>
</div></body></html>"""


def render(nama, filler):
    h = os.path.join(S, nama + ".html")
    io.open(h, "w", encoding="utf-8", newline="").write(TOPO.replace("__FILLER__", filler))
    out = os.path.join(S, nama + ".pdf")
    if os.path.exists(out): os.remove(out)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                    "--no-pdf-header-footer", "--user-data-dir=%s/mini" % S, "--virtual-time-budget=6000",
                    "--print-to-pdf=" + out, "file:///%s/%s.html" % (S, nama)],
                   capture_output=True, text=True, timeout=120)
    return pymupdf.open(out) if os.path.exists(out) else None


def mana(d, teks):
    for i, pg in enumerate(d):
        for b in pg.get_text("dict")["blocks"]:
            if b.get("type") != 0: continue
            for l in b["lines"]:
                for sp in l["spans"]:
                    if teks.lower() in sp["text"].lower():
                        return i + 1, round(sp["bbox"][1] / 2.8346, 1)
    return None, None


print("%-5s %-5s %-6s %s" % ("baris", "hlm", "BAHASA", "kesan"))
hilang = 0
for n in range(34, 46):
    filler = "".join('<p class="baris">baris pengisi %d</p>' % i for i in range(n))
    d = render("mini_%d" % n, filler)
    if d is None:
        print("  render gagal", n); continue
    hb = mana(d, "BAHASA")
    ml = mana(d, "Malay")
    km = mana(d, "KEMAHIRAN")
    nota = ""
    if hb[0] is None:
        nota = ">>> TAJUK BAHASA HILANG (Malay di hlm %s, Kemahiran di hlm %s)" % (ml[0], km[0])
        hilang += 1
    elif ml[0] is not None and hb[0] != ml[0]:
        nota = "tajuk hlm %d, item hlm %d (terpisah)" % (hb[0], ml[0])
    print("%-5d %-5d %-6s %s" % (n, d.page_count, ("hlm %d y=%.1f" % hb) if hb[0] else "TIADA", nota))
print("\nkes tajuk hilang: %d" % hilang)
