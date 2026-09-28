# -*- coding: utf-8 -*-
"""Ujian piksel: adakah teks kaki halaman di bahagian KIRI benar-benar tertutup oleh lajur kiri?
Banding kiri (dalam lajur kelabu) vs kanan (di luar lajur) pada jalur kaki."""
import sys, io
import pymupdf
from PIL import Image

f = sys.argv[1]
d = pymupdf.open(f)
pg = d[0]
lebar_pt, tinggi_pt = pg.rect.width, pg.rect.height
# jalur kaki: 9mm dari bawah
mm = 72 / 25.4
atas = tinggi_pt - 9 * mm
klip = pymupdf.Rect(0, atas, lebar_pt, tinggi_pt)
pix = pg.get_pixmap(clip=klip, dpi=200)
im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples).convert("L")
w, h = im.size
px = im.load()
def gelap(x0, x1, nama):
    n = 0
    for y in range(h):
        for x in range(x0, x1):
            if px[x, y] < 140:
                n += 1
    print("   %-34s piksel gelap (teks): %d" % (nama, n))
    return n
print("fail:", f, "| lebar jalur:", w, "px")
# lajur kiri dalam templat biru = 65mm daripada 210mm = 31%
sempadan = int(w * 0.31)
kiri = gelap(0, sempadan, "kiri (dalam lajur kelabu)")
kanan = gelap(sempadan, w, "kanan (luar lajur)")
import statistics
# warna latar di kiri vs kanan pada baris kosong
ys = h // 2
kiri_bg = statistics.mean(px[x, ys] for x in range(2, sempadan - 2))
kanan_bg = statistics.mean(px[x, ys] for x in range(sempadan + 2, w - 2))
print("   kecerahan latar kiri: %.0f | kanan: %.0f  (255 = putih)" % (kiri_bg, kanan_bg))
print("   NISBAH teks kiri/kanan: %.2f" % (kiri / max(1, kanan)))
