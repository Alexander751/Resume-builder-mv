"""Audit ketepatan templat Korporat Moden terhadap PDF rujukan pelanggan.

Guna:  python test/semak_ketepatan_korporat.py ["laluan/PDF rujukan.pdf"]

Kaedah: kandungan resume diambil TERUS daripada lapisan teks PDF rujukan (bukan data rekaan),
dirender melalui app sebenar (Chrome headless + suntikan ResumeMV.isi), kemudian setiap sauh
dibandingkan. Audit ini mengukur KESETIAAN kepada fail rujukan, bukan kesihatan umum app.

Hierarki bukti yang dipakai:
  * lapisan teks PDF (`get_text("dict")`) = pihak berkuasa untuk TEKS: saiz, warna hex, x.
    Anggaran piksel tersasar 1 unit pada warna (#90a6a6 lawan #91a6a6, #404041 lawan #414042)
    dan 0.5-1pt pada saiz badan - jangan ambil nilai teks daripada laporan visual/tangkapan skrin.
  * `get_drawings()` = pihak berkuasa untuk BENTUK dan saiz bulet (bulat lawan segi empat sama
    menghasilkan kotak sempadan yang sama, jadi bentuk dibaca daripada jenis lengkung/garis).
  * kedudukan `y` = dilaporkan, bukan diuji untuk setiap seksyen. Rujukan meletakkan seksyen rel
    pada kedudukan tetap dengan jarak tidak seragam (7.0 / 13.1 / 17.7mm), manakala templat app
    mengalir supaya boleh menampung apa-apa panjang kandungan. Hanya irama dalam blok pengalaman
    diuji (6.6mm tajuk->tarikh, ~43.3mm tajuk->tajuk) kerana itu laluan berulang yang boleh diukur.

Kod keluar 1 kalau ada sauh/ukuran menyimpang.
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
RUJUKAN = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
    "~/Downloads/Minimalist Professional Corporate ATS Resume.pdf")


def hex_warna(c):
    return "#%02x%02x%02x" % ((c >> 16) & 255, (c >> 8) & 255, c & 255)


def hex_fill(d):
    c = d.get("fill")
    if not c:
        return "-"
    return "#%02x%02x%02x" % tuple(int(round(v * 255)) for v in c)


def span_sauh(dok, cari):
    """Span pertama yang mengandungi teks carian: saiz, warna, x, y, font."""
    for pg in dok:
        for b in pg.get_text("dict")["blocks"]:
            if b.get("type") != 0:
                continue
            for ln in b["lines"]:
                for s in ln["spans"]:
                    if cari.lower() in s["text"].lower():
                        return {"saiz": round(s["size"], 1), "warna": hex_warna(s["color"]),
                                "x": round(s["bbox"][0] / MM, 1), "y": round(s["bbox"][1] / MM, 1),
                                "font": s["font"]}
    return None


def y_(dok, cari):
    s = span_sauh(dok, cari)
    return s["y"] if s else -999


def baca_kandungan_rujukan(dok):
    """Bina objek kandungan app daripada lapisan teks + penanda bulet rujukan."""
    sp = []
    for b in dok[0].get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for ln in b["lines"]:
            for s in ln["spans"]:
                if s["text"].strip():
                    sp.append(s)
    y = lambda s: s["bbox"][1] / MM
    x = lambda s: s["bbox"][0] / MM
    z = lambda s: round(s["size"], 1)
    penanda = [d["rect"].y0 / MM for d in dok[0].get_drawings()
               if d["rect"].width / MM < 1.5 and d["rect"].x0 / MM > 80]
    kontak = [s["text"].strip() for s in sorted([s for s in sp if z(s) == 9.0 and x(s) < 60], key=y)]
    didik = sorted([s for s in sp if z(s) == 8.0], key=y)
    k10 = sorted([s for s in sp if z(s) == 10.0 and x(s) < 60], key=y)
    baris_bhs = [y(s) for s in sp if s["text"].strip() == "LANGUAGE"]
    baris_bhs = baris_bhs[0] if baris_bhs else 9999
    tajuk = sorted([s for s in sp if z(s) == 11.0], key=y)
    tarikh = sorted([s for s in sp if z(s) == 10.0 and x(s) > 60], key=y)
    poin_baris = sorted([s for s in sp if z(s) == 9.5], key=y)
    pengalaman = []
    for n, t in enumerate(tajuk):
        atas = y(t)
        bawah = y(tajuk[n + 1]) if n + 1 < len(tajuk) else 9999
        p = [m for m in penanda if atas < m < bawah]
        poin = []
        for j, m in enumerate(p):
            had = p[j + 1] if j + 1 < len(p) else bawah
            teks = [s["text"].strip() for s in poin_baris if m - 2.2 < y(s) < had - 2.2]
            if teks:
                poin.append(" ".join(teks))
        jt = t["text"].split(",", 1)
        pengalaman.append({"jawatan": jt[0].strip(), "syarikat": (jt[1] if len(jt) > 1 else "").strip(),
                           "tempoh": tarikh[n]["text"].strip(), "poin": poin})
    return {
        "nama": " ".join(s["text"].strip() for s in sp if z(s) == 34.0),
        "jawatan": " ".join(s["text"].strip() for s in sp if z(s) == 16.0),
        "templat": "korporat",
        "telefon": kontak[0] if len(kontak) > 0 else "",
        "emel": kontak[1] if len(kontak) > 1 else "",
        "lokasi": kontak[2] if len(kontak) > 2 else "",
        "ringkasan": " ".join(s["text"].strip() for s in sorted(
            [s for s in sp if z(s) == 9.0 and x(s) > 60], key=y)),
        "pengalaman": pengalaman,
        "pendidikan": [{"institusi": didik[i]["text"].strip(), "kelulusan": didik[i + 1]["text"].strip(),
                        "tahun": didik[i + 2]["text"].strip()} for i in range(0, len(didik) - 2, 3)],
        "kemahiran": [{"nama": s["text"].strip(), "tahap": 0} for s in k10 if y(s) < baris_bhs],
        "bahasa": [{"nama": s["text"].strip(), "tahap": 0} for s in k10 if y(s) > baris_bhs],
        "rujukan": [], "tambahan": [],
        "susun": {"kiri": ["kontak", "pendidikan", "kemahiran", "bahasa"],
                  "kanan": ["profil", "pengalaman"]},
    }


def render_korporat(data, folder):
    """Render index.html dengan data rujukan melalui Chrome headless -> PDF cetakan."""
    app = io.open(os.path.join(AKAR, "index.html"), encoding="utf-8", newline="").read().replace("\r\n", "\n")
    # Fail rujukan Canva berbahasa Inggeris, jadi audit ini MESTI merender dalam mod English
    # supaya tajuk templat sama ejaan dengan rujukan (Fasa 43 menambah pilihan bahasa BM/English).
    arahan = ("window.ResumeMV.isi(%s);document.getElementById('mula-isi').click();"
              "document.getElementById('borang').dispatchEvent(new Event('input',{bubbles:true}));"
              "window.ResumeMV.gunaBahasa('en');"
              "document.getElementById('ke-3').click();document.body.classList.add('mod-penjual');"
              "var c=document.getElementById('cap-air'); if(c) c.innerHTML='';"
              "var cs=document.getElementById('cap-air-sisi'); if(cs) cs.innerHTML='';"
              ) % json.dumps(data, ensure_ascii=False)
    html = os.path.join(folder, "audit_korporat.html")
    io.open(html, "w", encoding="utf-8", newline="").write(app.replace(
        "</body>", "\n<script>(function(){try{" + arahan +
        "}catch(e){document.title='RALAT '+e.message}})();</script>\n</body>"))
    keluar = os.path.join(folder, "audit_korporat.pdf")
    if os.path.exists(keluar):
        os.remove(keluar)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                    "--no-pdf-header-footer", "--user-data-dir=" + os.path.join(folder, "data"),
                    "--virtual-time-budget=16000", "--print-to-pdf=" + keluar,
                    "file:///" + html.replace("\\", "/")], capture_output=True, text=True, timeout=240)
    return pymupdf.open(keluar)


def bulet(dok, xmin, xmax):
    """Bulet kecil dalam julat x: (x, saiz, warna) disusun mengikut kedudukan.

    Tapisan mesti ketat: dalam julat yang sama terdapat juga glyph putih DI DALAM ikon tajuk
    dan garis dalaman ikon kontak (saiz < 1.5mm juga). Bulet sebenar ialah bulatan penuh
    berdakwat gelap, jadi tapis pada warna isian gelap DAN bentuk bulat (lebar == tinggi).

    Bilangan bulet SENGAJA tidak dibandingkan: Chrome menggabungkan bulatan serupa menjadi satu
    objek laluan, jadi satu senarai 15 bulet boleh muncul sebagai 8 + 3 objek. Yang diuji ialah
    geometri bulet pertama (saiz, x, warna). Bilangan sebenar disahkan dengan piksel.
    """
    hasil = []
    for d in dok[0].get_drawings():
        r = d["rect"]
        w, h = r.width / MM, r.height / MM
        warna = hex_fill(d)
        if not (xmin < r.x0 / MM < xmax and w < 1.6 and abs(w - h) < 0.2):
            continue
        if warna in ("-", "#ffffff", "#fdfdfd", "#fefefe"):
            continue
        hasil.append((round(r.x0 / MM, 2), round(w, 2), warna))
    return sorted(hasil)


def main():
    ref = pymupdf.open(RUJUKAN)
    data = baca_kandungan_rujukan(ref)
    ren = render_korporat(data, tempfile.mkdtemp(prefix="audit-korporat-"))
    gagal = 0

    print("RUJUKAN : %s" % RUJUKAN)
    print("RENDER  : %d halaman | rujukan %d halaman | bulet setiap kerja %s (rujukan [3, 4, 4, 4])\n"
          % (ren.page_count, ref.page_count, [len(p["poin"]) for p in data["pengalaman"]]))

    SAUH = [("nama", "OLIVIA"), ("jawatan", "Administrative Manager"),
            ("tajuk CONTACT", "CONTACT"), ("tajuk SUMMARY", "SUMMARY"),
            ("tajuk EDUCATION", "EDUCATION"), ("tajuk KEY SKILLS", "KEY SKILLS"),
            ("tajuk LANGUAGE", "LANGUAGE"), ("tajuk WORK EXPERIENCE", "WORK EXPERIENCE"),
            ("kontak", data["telefon"]), ("ringkasan", "Detail-oriented"),
            ("kemahiran", data["kemahiran"][0]["nama"]), ("bahasa", data["bahasa"][0]["nama"]),
            ("pendidikan", data["pendidikan"][0]["institusi"]),
            ("tahun pendidikan", data["pendidikan"][-1]["tahun"]),
            ("tajuk kerja", data["pengalaman"][0]["jawatan"]),
            ("tarikh kerja", data["pengalaman"][0]["tempoh"]),
            ("bulet kerja", data["pengalaman"][0]["poin"][0][:24])]
    print("%-20s | %-34s | %-34s | beza" % ("sauh (teks)", "RUJUKAN", "RENDER"))
    for label, cari in SAUH:
        a, b = span_sauh(ref, cari), span_sauh(ren, cari)
        papar = lambda s: "-" if not s else "%.1fpt %s x=%.1f y=%.1f" % (s["saiz"], s["warna"], s["x"], s["y"])
        beza = []
        if not b:
            beza.append("TIADA DALAM RENDER")
        elif a:
            if abs(a["saiz"] - b["saiz"]) > 0.1:
                beza.append("saiz %.1f->%.1f" % (a["saiz"], b["saiz"]))
            if a["warna"] != b["warna"]:
                beza.append("warna %s->%s" % (a["warna"], b["warna"]))
            if abs(a["x"] - b["x"]) > 0.6:
                beza.append("x %.1f->%.1f" % (a["x"], b["x"]))
        if beza:
            gagal += 1
        print("%-20s | %-34s | %-34s | %s" % (label, papar(a), papar(b), "OK" if not beza else "; ".join(beza)))

    print("\n%-20s | %-34s | %-34s | beza" % ("sauh (bentuk)", "RUJUKAN", "RENDER"))
    for label, xmin, xmax in (("bulet pengalaman", 80, 95), ("bulet rel kiri", 11.6, 12.2)):
        a, b = bulet(ref, xmin, xmax), bulet(ren, xmin, xmax)
        if not a or not b:
            print("%-20s | %-34s | %-34s | TIADA" % (label, len(a), len(b)))
            gagal += 1
            continue
        beza = []
        if abs(a[0][1] - b[0][1]) > 0.12:
            beza.append("saiz %.2f->%.2fmm" % (a[0][1], b[0][1]))
        if abs(a[0][0] - b[0][0]) > 0.6:
            beza.append("x %.2f->%.2fmm" % (a[0][0], b[0][0]))
        if a[0][2] != b[0][2]:
            beza.append("warna %s->%s" % (a[0][2], b[0][2]))
        if beza:
            gagal += 1
        print("%-20s | %-34s | %-34s | %s" % (
            label, "%d bulet %.2fmm @ x=%.2f %s" % (len(a), a[0][1], a[0][0], a[0][2]),
            "%d bulet %.2fmm @ x=%.2f %s" % (len(b), b[0][1], b[0][0], b[0][2]),
            "OK" if not beza else "; ".join(beza)))

    print("\n%-22s | %-10s | %-10s | %s" % ("irama blok pengalaman", "RUJUKAN", "RENDER", "beza"))
    k0, k1 = data["pengalaman"][0], data["pengalaman"][1]
    for label, a, b, tol in (("tajuk -> tarikh", y_(ref, k0["tempoh"]) - y_(ref, k0["jawatan"]),
                              y_(ren, k0["tempoh"]) - y_(ren, k0["jawatan"]), 0.6),
                             ("tajuk 1 -> tajuk 2", y_(ref, k1["jawatan"]) - y_(ref, k0["jawatan"]),
                              y_(ren, k1["jawatan"]) - y_(ren, k0["jawatan"]), 1.0)):
        tanda = "OK" if abs(a - b) <= tol else "MENYIMPANG"
        if tanda != "OK":
            gagal += 1
        print("%-22s | %-10.1f | %-10.1f | %s" % (label, a, b, tanda))

    print("\nEjaan tajuk bahagian (mesti verbatim daripada rujukan):")
    for t in ("CONTACT", "SUMMARY", "EDUCATION", "KEY SKILLS", "LANGUAGE", "WORK EXPERIENCE"):
        ada = span_sauh(ren, t) is not None
        if not ada:
            gagal += 1
        print("   %-18s %s" % (t, "ada" if ada else "TIADA (ejaan rujukan tidak diikut)"))

    print("\n%d sauh/ukuran menyimpang" % gagal)
    print("Nota: kedudukan menegak seksyen rel kiri tidak diuji - rujukan meletakkan seksyen pada "
          "kedudukan tetap dengan jarak tidak seragam, templat app mengalir.")
    return 1 if gagal else 0


if __name__ == "__main__":
    sys.exit(main())
