# -*- coding: utf-8 -*-
"""
resume_pdf_helper.py  --  Helper PC PENJUAL untuk Resume Builder MV
====================================================================

APA YANG DIBUAT OLEH FAIL INI
------------------------------
Pelanggan menekan butang WhatsApp di dalam app (index.html). App menghantar data
resume pelanggan ke Google Apps Script (GAS). GAS menyimpannya sebagai "kerja".

Helper ini (yang berjalan di PC penjual) akan:
  1. POLL GAS setiap SELA_SAAT saat untuk kerja baru.
  2. Render PDF resume SEBENAR menggunakan Chrome headless + APP YANG SAMA
     (index.html tempatan). Jadi PDF ini sama dengan apa yang pelanggan lihat,
     bukan lukisan sendiri.
  3. Hantar PDF itu kembali ke GAS. GAS akan email PDF kepada penjual.

Fikirkan ia sebagai "pejabat belakang". Selagi tetingkap ini terbuka, resume
pelanggan akan siap sendiri tanpa penjual buat apa-apa.

CARA PAKAI (mudah)
------------------
  Klik dua kali mula-email-resume.bat
  atau, dari baris perintah:
      python resume_pdf_helper.py

UJIAN (WAJIB sebelum guna sebenar)
----------------------------------
      python resume_pdf_helper.py --uji-tempat
  -> menjana PDF daripada data contoh yang ditanam dalam fail ini (TANPA rangkaian).
     Kalau keluar "UJIAN TEMPAT LULUS", perkakasan PC ini sudah bersedia.

      python resume_pdf_helper.py --sekali
  -> satu kitaran polling sahaja, kemudian berhenti (untuk ujian).

TIDAK PERLUKAN PEMASANGAN PAKEJ
-------------------------------
  Modul piawai Python sahaja + `pymupdf` (kalau ada) untuk SAHKAN PDF.
  Kalau pymupdf tiada, helper cuma beri amaran dan teruskan (tidak mati).
"""

import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request

# ============================================================================
#  KONFIGURASI  (boleh ubah terus di sini, atau buat fail config_email.json)
# ============================================================================

# URL Web App Google Apps Script anda. Ia MESTI berakhir dengan /exec
GAS_URL = 'TUKAR-DENGAN-URL-GAS-ANDA'

# Token kongsi. Mesti SAMA dengan token dalam skrip GAS.
TOKEN = 'TUKAR-TOKEN-INI'

# Laluan penuh fail app Resume Builder MV di PC ini.
# Helper akan salin fail ini + suntik skrip auto-isi untuk render PDF.
LALUAN_APP = 'C:/Users/ADMIN/Documents/Resume-builder-mv/index.html'

# Berapa saat untuk tunggu antara setiap kitaran polling.
SELA_SAAT = 20

# Folder simpan salinan PDF yang sudah dihantar (disimpan 7 hari).
FOLDER_KELUARAN = 'outbox'

# Berapa kerja diambil setiap kali poll (GAS menandanya 'Diproses' serta-merta).
HAD_POLLING = 5

# Laluan Chrome di PC ini (kalau kosong, helper akan cuba cari sendiri).
LALUAN_CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

# ============================================================================
#  PEMALAR DALAMAN (biasanya tidak perlu diubah)
# ============================================================================

DIR_SKRIP = os.path.dirname(os.path.abspath(__file__))
NAMA_CONFIG = 'config_email.json'
LALUAN_CONFIG = os.path.join(DIR_SKRIP, NAMA_CONFIG)
LALUAN_LOG = os.path.join(DIR_SKRIP, 'helper.log')
LALUAN_DIPROSES = os.path.join(DIR_SKRIP, 'diproses.json')

MASA_LIMIT_HTTP = 60          # saat: had masa setiap permintaan HTTP ke GAS
MASA_LIMIT_CHROME = 180       # saat: had masa render Chrome (spesifikasi minta >= 120)
BUDGET_MASA_MAYA = 16000      # ms: masa maya Chrome untuk app selesai melukis
CUBAAN_HANTAR = 3             # kali cuba hantar PDF ke GAS sebelum langkau
SIMPAN_SALINAN_HARI = 7       # hari: berapa lama simpan PDF dalam outbox

# Nama contoh untuk mod --uji-tempat (mesti muncul dalam PDF yang dijana).
NAMA_CONTOH = 'Che Ku Ahmad Ridzuan'

# Foto contoh (JPEG 64x64 kelabu-biru, base64 tanpa prefix) untuk mod ujian.
FOTO_CONTOH = (
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYF'
    'BgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoK'
    'CgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wgARCABAAEAD'
    'AREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAVAQEBAAAAAAAAAAAAAAAAAAAABf/a'
    'AAwDAQACEAMQAAABoi1HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/8QAFBABAAAAAAAAAAAAAAAA'
    'AAAAYP/aAAgBAQABBQIB/8QAFBEBAAAAAAAAAAAAAAAAAAAAYP/aAAgBAwEBPwEB/8QAFBEBAAAA'
    'AAAAAAAAAAAAAAAAYP/aAAgBAgEBPwEB/8QAFBABAAAAAAAAAAAAAAAAAAAAYP/aAAgBAQAGPwIB'
    '/8QAFBABAAAAAAAAAAAAAAAAAAAAYP/aAAgBAQABPyEB/9oADAMBAAIAAwAAABAAAAAAAAAAAAAA'
    'AAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAABg/9oACAEDAQE/EAH/xAAUEQEAAAAA'
    'AAAAAAAAAAAAAABg/9oACAECAQE/EAH/xAAUEAEAAAAAAAAAAAAAAAAAAABg/9oACAEBAAE/EAH/'
    '2Q=='
)

# Data resume contoh untuk --uji-tempat (tiada rangkaian diperlukan).
DATA_CONTOH = {
    'templat': 'biru',
    'nama': NAMA_CONTOH,
    'telefon': '019-778 4521',
    'emel': 'ahmad.ridzuan@contoh.my',
    'lokasi': 'Kuala Terengganu, Terengganu',
    'jawatan': 'Penyelia Projek Pembinaan',
    'ringkasan': (
        'Penyelia projek dengan 9 tahun pengalaman dalam pembinaan bangunan kediaman '
        'dan komersial. Berpengalaman memimpin pasukan 20 orang, mengurus jadual kerja '
        'dan memastikan projek siap mengikut spesifikasi serta bajet.'
    ),
    'kemahiran': [
        {'nama': 'Pengurusan Projek', 'tahap': 5},
        {'nama': 'AutoCAD', 'tahap': 4},
        {'nama': 'Microsoft Project', 'tahap': 4},
        {'nama': 'Penyeliaan Tapak', 'tahap': 5},
    ],
    'bahasa': [
        {'nama': 'Bahasa Melayu', 'tahap': 5},
        {'nama': 'Bahasa Inggeris', 'tahap': 4},
    ],
    'pengalaman': [
        {
            'jawatan': 'Penyelia Projek',
            'syarikat': 'Syarikat Bina Jaya Sdn Bhd',
            'tempoh': '2019 - Kini',
            'poin': [
                'Menyelia 6 projek kediaman bernilai RM2 juta hingga RM12 juta.',
                'Mengurangkan masa siap projek sebanyak 12% melalui penjadualan kerja.',
                'Memimpin pasukan 20 pekerja dan 4 sub-kontraktor.',
            ],
        },
        {
            'jawatan': 'Penolong Penyelia Tapak',
            'syarikat': 'Kontraktor Maju Terengganu',
            'tempoh': '2016 - 2019',
            'poin': [
                'Menjalankan pemeriksaan kualiti kerja konkrit dan pemasangan bata.',
                'Menyediakan laporan kemajuan mingguan untuk pihak pelanggan.',
            ],
        },
    ],
    'pendidikan': [
        {'kelulusan': 'Diploma Kejuruteraan Awam', 'institusi': 'Politeknik Kuala Terengganu', 'tahun': '2016'},
        {'kelulusan': 'Sijil Pelajaran Malaysia', 'institusi': 'SMK Sultan Sulaiman', 'tahun': '2013'},
    ],
    'rujukan': [
        {'nama': 'Encik Rosli bin Hamid', 'jawatan': 'Pengurus Projek, Syarikat Bina Jaya', 'telefon': '019-223 8890'},
        {'nama': 'Puan Norhayati binti Salleh', 'jawatan': 'Pensyarah, Politeknik Kuala Terengganu', 'telefon': '013-556 7712'},
    ],
    'tambahan': [],
    'buang': [],
    'susun': None,
    'foto': 'data:image/jpeg;base64,' + FOTO_CONTOH,
}


# ============================================================================
#  LOG  (ke skrin DAN ke fail helper.log)
# ============================================================================

def cap_masa():
    return time.strftime('%Y-%m-%d %H:%M:%S')


def log(mesej):
    """Cetak ke skrin dengan cap masa, dan simpan juga ke helper.log."""
    baris = '[%s] %s' % (cap_masa(), mesej)
    try:
        print(baris, flush=True)
    except Exception:
        pass
    try:
        with open(LALUAN_LOG, 'a', encoding='utf-8') as f:
            f.write(baris + '\n')
    except Exception:
        # Log ke fail gagal pun tidak boleh mematikan helper.
        pass


def log_amaran(mesej):
    log('AMARAN: ' + mesej)


def log_ralat(mesej):
    log('RALAT: ' + mesej)


# ============================================================================
#  KONFIGURASI DARI FAIL  config_email.json
# ============================================================================

def muat_konfig():
    """Baca config_email.json kalau wujud (penjual boleh ubah tanpa edit kod)."""
    global GAS_URL, TOKEN, LALUAN_APP, SELA_SAAT, FOLDER_KELUARAN, HAD_POLLING, LALUAN_CHROME

    if not os.path.exists(LALUAN_CONFIG):
        return False
    try:
        with open(LALUAN_CONFIG, 'r', encoding='utf-8-sig') as f:
            cfg = json.load(f)
    except Exception as e:
        log_amaran('Gagal baca %s (%s). Guna pemalar dalam fail Python.' % (NAMA_CONFIG, e))
        return False

    if not isinstance(cfg, dict):
        log_amaran('%s tidak sah (bukan objek JSON). Guna pemalar dalam fail Python.' % NAMA_CONFIG)
        return False

    if cfg.get('GAS_URL'):
        GAS_URL = str(cfg['GAS_URL']).strip()
    if cfg.get('TOKEN'):
        TOKEN = str(cfg['TOKEN']).strip()
    if cfg.get('LALUAN_APP'):
        LALUAN_APP = str(cfg['LALUAN_APP']).strip()
    if cfg.get('SELA_SAAT'):
        try:
            SELA_SAAT = max(3, int(cfg['SELA_SAAT']))
        except Exception:
            pass
    if cfg.get('FOLDER_KELUARAN'):
        FOLDER_KELUARAN = str(cfg['FOLDER_KELUARAN']).strip()
    if cfg.get('HAD_POLLING'):
        try:
            HAD_POLLING = max(1, min(20, int(cfg['HAD_POLLING'])))
        except Exception:
            pass
    if cfg.get('LALUAN_CHROME'):
        LALUAN_CHROME = str(cfg['LALUAN_CHROME']).strip()

    log('Config dibaca daripada %s' % NAMA_CONFIG)
    return True


def folder_keluaran_penuh():
    """Laluan penuh folder outbox. Laluan relatif dikira dari folder skrip ini."""
    if os.path.isabs(FOLDER_KELUARAN):
        return FOLDER_KELUARAN
    return os.path.join(DIR_SKRIP, FOLDER_KELUARAN)


# ============================================================================
#  HTTP KE GOOGLE APPS SCRIPT  (had masa 60 saat, tidak pernah lempar ke atas
#  tanpa ditangkap - pemanggil yang uruskan)
# ============================================================================

HDR_UMUM = {'User-Agent': 'ResumeMV-Helper/1.0 (+PC penjual)'}


def http_get(url_penuh):
    req = urllib.request.Request(url_penuh, headers=HDR_UMUM, method='GET')
    with urllib.request.urlopen(req, timeout=MASA_LIMIT_HTTP) as r:
        return r.read().decode('utf-8', 'replace')


def http_post_json(url_penuh, obj):
    badan = json.dumps(obj, ensure_ascii=False).encode('utf-8')
    hdr = dict(HDR_UMUM)
    hdr['Content-Type'] = 'application/json; charset=utf-8'
    req = urllib.request.Request(url_penuh, data=badan, headers=hdr, method='POST')
    with urllib.request.urlopen(req, timeout=MASA_LIMIT_HTTP) as r:
        return r.read().decode('utf-8', 'replace')


def poll_kerja():
    """GET '<URL>?action=kerja&token=..&had=5'  ->  senarai kerja.

    GAS menukar status setiap kerja kepada 'Diproses' semasa ia memulangkan
    senarai ini, jadi setiap kerja dihantar SEKALI sahaja.
    """
    url = '%s?action=kerja&token=%s&had=%d' % (
        GAS_URL, urllib.parse.quote(str(TOKEN), safe=''), HAD_POLLING)
    teks = http_get(url)
    try:
        j = json.loads(teks)
    except Exception:
        raise RuntimeError('Jawapan GAS bukan JSON: %s' % teks[:200])
    if not isinstance(j, dict) or not j.get('ok'):
        raise RuntimeError('GAS balas ok=false: %s' % teks[:200])
    kerja = j.get('kerja') or []
    if not isinstance(kerja, list):
        raise RuntimeError('Medan "kerja" bukan senarai: %s' % teks[:200])
    return kerja


def semak_kuota():
    """GET '<URL>?action=uji&token=..'  ->  nombor kuota (atau None)."""
    url = '%s?action=uji&token=%s' % (GAS_URL, urllib.parse.quote(str(TOKEN), safe=''))
    teks = http_get(url)
    j = json.loads(teks)
    if not isinstance(j, dict) or not j.get('ok'):
        raise RuntimeError('GAS balas ok=false pada action=uji: %s' % teks[:200])
    return j.get('kuota')


def hantar_selesai(id_kerja, pdf_bytes, cubaan=CUBAAN_HANTAR):
    """POST PDF ke GAS. Cuba semula sehingga `cubaan` kali. Pulangkan True kalau ok."""
    b64 = base64.b64encode(pdf_bytes).decode('ascii')
    badan = {'action': 'selesai', 'token': TOKEN, 'id': id_kerja, 'pdf': b64}
    for i in range(1, cubaan + 1):
        try:
            teks = http_post_json(GAS_URL, badan)
            try:
                j = json.loads(teks)
            except Exception:
                j = {}
            if isinstance(j, dict) and j.get('ok'):
                return True
            log_amaran('GAS tolak hantar #%s (ok bukan true): %s' % (id_kerja, teks[:200]))
        except Exception as e:
            log_amaran('Hantar #%s gagal (cubaan %d/%d): %s' % (id_kerja, i, cubaan, e))
        if i < cubaan:
            time.sleep(5)
    return False


# ============================================================================
#  RENDER PDF DENGAN CHROME HEADLESS
# ============================================================================

def cari_chrome():
    """Cari chrome.exe. Guna LALUAN_CHROME kalau ada, kalau tidak cuba lokasi biasa."""
    calon = [
        LALUAN_CHROME,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        os.path.join(os.environ.get('LOCALAPPDATA', ''),
                     'Google/Chrome/Application/chrome.exe'),
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ]
    for c in calon:
        if c and os.path.exists(c):
            return c
    # Chrome portable di tepi skrip ini?
    for nama in ('chrome.exe', 'GoogleChromePortable.exe'):
        c = os.path.join(DIR_SKRIP, nama)
        if os.path.exists(c):
            return c
    return None


def data_dari_kod(kod):
    """Sandaran Python: nyahkod kod resume (base64url JSON) tanpa pelayar.

    Ini HANYA sandaran - jalan utama menggunakan window.ResumeMV.dariKod() di
    dalam pelayar supaya penukaran data sama 100% dengan app sebenar.
    """
    if not kod:
        return None
    try:
        b64 = str(kod).replace('-', '+').replace('_', '/')
        b64 += '=' * (-len(b64) % 4)
        o = json.loads(base64.b64decode(b64).decode('utf-8'))

        def senarai_tahap(kunci):
            keluar = []
            for x in (o.get(kunci) or []):
                if isinstance(x, dict):
                    keluar.append({'nama': x.get('n') or '', 'tahap': int(x.get('p') or 0)})
            return keluar

        rujukan = []
        for x in (o.get('u') or []):
            if isinstance(x, dict):
                rujukan.append({
                    'nama': x.get('n') or x.get('nama') or '',
                    'jawatan': x.get('j') or x.get('jawatan') or '',
                    'telefon': x.get('t') or x.get('telefon') or '',
                })
        return {
            'templat': o.get('s') or 'biru',
            'nama': o.get('n') or '',
            'telefon': o.get('t') or '',
            'emel': o.get('e') or '',
            'lokasi': o.get('l') or '',
            'jawatan': o.get('j') or '',
            'ringkasan': o.get('g') or '',
            'kemahiran': senarai_tahap('k'),
            'bahasa': senarai_tahap('b'),
            'rujukan': rujukan,
            'pengalaman': o.get('p') if isinstance(o.get('p'), list) else [],
            'pendidikan': o.get('d') if isinstance(o.get('d'), list) else [],
            'tambahan': o.get('a') if isinstance(o.get('a'), list) else [],
            'buang': o.get('x') if isinstance(o.get('x'), list) else [],
            'susun': o.get('y') if isinstance(o.get('y'), dict) else None,
        }
    except Exception:
        return None


def _js_saster(s):
    """Sasterakan rentetan untuk masuk ke dalam <script> (elak </script> terputus)."""
    keluaran = json.dumps(s, ensure_ascii=False)
    return keluaran.replace('</', '<\\/')


def bina_html_sementara(data, kod, laluan_html):
    """Salin index.html dan suntik blok <script> SEBELUM </body> untuk auto-isi.

    Corak yang terbukti dalam harness ujian projek ini:
       ResumeMV.isi(data) -> #mula-isi diklik -> #borang 'input' -> #ke-3 diklik

    Nota penting: blok ini juga menghidupkan MOD PENJUAL (sama seperti laluan
    '#penjual' / '#kod=' dalam app). Ini WAJIB kerana mod penjual mematikan tanda
    air "PRATONTON - BELUM DIBAYAR" - PDF yang diemail kepada pelanggan mesti bersih.
    """
    if not os.path.exists(LALUAN_APP):
        raise RuntimeError('Fail app tidak dijumpai: %s' % LALUAN_APP)

    with open(LALUAN_APP, 'r', encoding='utf-8', errors='replace') as f:
        mentah = f.read()

    pos = mentah.rfind('</body>')
    if pos < 0:
        raise RuntimeError('Fail app tiada </body>: %s' % LALUAN_APP)

    js_data = _js_saster(data)
    js_kod = _js_saster(kod or '')

    skrip = (
        '\n<!-- blok suntikan helper PDF: mod penjual + auto-isi resume + buka pratonton -->\n'
        '<script>\n'
        '(function () {\n'
        '  var KOD = ' + js_kod + ';\n'
        '  var DATA = ' + js_data + ';\n'
        '  var D = null;\n'
        '  try {\n'
        '    if (window.ResumeMV && window.ResumeMV.dariKod && KOD) {\n'
        '      D = window.ResumeMV.dariKod(KOD);\n'
        '    }\n'
        '  } catch (e) { D = null; }\n'
        '  if (!D || !D.nama) { D = DATA; }\n'
        '  try {\n'
        '    /* mod penjual: tanda air "PRATONTON/BELUM DIBAYAR" dimatikan */\n'
        '    document.body.classList.add("mod-penjual");\n'
        '    ["cap-air", "cap-air-sisi"].forEach(function (id) {\n'
        '      var k = document.getElementById(id);\n'
        '      if (k) { k.innerHTML = ""; k.style.display = "none"; }\n'
        '    });\n'
        '    window.ResumeMV.isi(D);\n'
        '    document.getElementById("mula-isi").click();\n'
        '    document.getElementById("borang").dispatchEvent(new Event("input", { bubbles: true }));\n'
        '    document.getElementById("ke-3").click();\n'
        '    document.title = "SIAP-RENDER";\n'
        '  } catch (e) {\n'
        '    document.title = "RALAT-RENDER: " + e.message;\n'
        '  }\n'
        '})();\n'
        '</script>\n'
    )
    kandungan = mentah[:pos] + skrip + mentah[pos:]
    with open(laluan_html, 'w', encoding='utf-8') as f:
        f.write(kandungan)
    return laluan_html


def jana_pdf(data, kod, laluan_pdf, tanda=''):
    """Jana satu PDF. Pulangkan laluan folder temp supaya pemanggil boleh padam.

    Kalau `kod` ada, URL dibuka dengan '#kod=<kod>' - laluan masuk rasmi app yang
    memuatkan resume pelanggan DAN menghidupkan mod penjual (PDF bersih).
    """
    chrome = cari_chrome()
    if not chrome:
        raise RuntimeError('chrome.exe tidak dijumpai. Set LALUAN_CHROME dalam config.')

    folder_temp = tempfile.mkdtemp(prefix='resumemv_')
    laluan_html = os.path.join(folder_temp, 'resume_%s.html' % (tanda or 'jadi'))
    profil = os.path.join(folder_temp, 'profil-chrome')

    bina_html_sementara(data, kod, laluan_html)

    url = 'file:///' + os.path.abspath(laluan_html).replace('\\', '/')
    if kod:
        url += '#kod=' + urllib.parse.quote(str(kod), safe='')
    else:
        url += '#penjual'
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--hide-scrollbars',
        '--no-pdf-header-footer',
        '--user-data-dir=' + profil,
        '--virtual-time-budget=%d' % BUDGET_MASA_MAYA,
        '--print-to-pdf=' + os.path.abspath(laluan_pdf),
        url,
    ]
    hasil = subprocess.run(cmd, capture_output=True, timeout=MASA_LIMIT_CHROME)
    if hasil.returncode != 0:
        ekor = (hasil.stderr or b'').decode('utf-8', 'replace')[-500:]
        raise RuntimeError('Chrome keluar dengan kod %d. %s' % (hasil.returncode, ekor))

    if not os.path.exists(laluan_pdf) or os.path.getsize(laluan_pdf) == 0:
        raise RuntimeError('Chrome tidak menghasilkan PDF (fail kosong/tidak wujud).')
    return folder_temp


def pdf_periksa(laluan_pdf, nama):
    """Sahkan PDF dengan PyMuPDF.

    Pulangkan dict: {'bil': int|None, 'sah': bool|None, 'teks': str, 'tanda_air': bool}
    'bil' = None bermakna pymupdf tiada, jadi PDF tidak dapat disahkan.
    """
    hasil = {'bil': None, 'sah': None, 'teks': '', 'tanda_air': False, 'panjang': 0}
    try:
        import pymupdf
    except Exception:
        return hasil
    try:
        doc = pymupdf.open(laluan_pdf)
    except Exception as e:
        raise RuntimeError('PDF tidak boleh dibuka oleh PyMuPDF: %s' % e)
    try:
        hasil['bil'] = doc.page_count
        keping = []
        for i in range(min(doc.page_count, 4)):
            keping.append(doc[i].get_text())
        teks = '\n'.join(keping)
    finally:
        doc.close()

    hasil['teks'] = teks[:1200]
    normal = ''.join(teks.split()).lower()
    hasil['panjang'] = len(normal)
    nama_normal = ''.join(str(nama).split()).lower()
    hasil['sah'] = bool(nama_normal) and (nama_normal in normal)
    # Tanda air pratinjau app: kalau ini muncul dalam PDF yang diemail kepada
    # pelanggan, mod penjual gagal dihidupkan.
    hasil['tanda_air'] = ('belumdibayar' in normal) or ('pratonton·' in normal)
    return hasil


# ============================================================================
#  FOLDER KELUARAN (outbox) - simpan salinan 7 hari
# ============================================================================

def bersih_outbox():
    """Padam PDF dalam outbox yang lebih lama daripada SIMPAN_SALINAN_HARI hari."""
    folder = folder_keluaran_penuh()
    if not os.path.isdir(folder):
        return
    had = time.time() - (SIMPAN_SALINAN_HARI * 24 * 3600)
    try:
        for nama in os.listdir(folder):
            f = os.path.join(folder, nama)
            try:
                if os.path.isfile(f) and os.path.getmtime(f) < had:
                    os.remove(f)
                    log('Salinan lama dipadam dari outbox: %s' % nama)
            except Exception:
                pass
    except Exception as e:
        log_amaran('Gagal bersihkan outbox: %s' % e)


def simpan_salinan(id_kerja, nama, pdf_bytes):
    try:
        folder = folder_keluaran_penuh()
        os.makedirs(folder, exist_ok=True)
        selamat = ''.join(c if (c.isalnum() or c in '-_ ') else '_' for c in str(nama or '')).strip()
        selamat = selamat[:50] or 'tanpa-nama'
        fail = os.path.join(folder, '%s_%s_%s.pdf' % (
            time.strftime('%Y%m%d-%H%M%S'), id_kerja, selamat))
        with open(fail, 'wb') as f:
            f.write(pdf_bytes)
        return fail
    except Exception as e:
        log_amaran('Gagal simpan salinan outbox: %s' % e)
        return None


# ============================================================================
#  REKOD KERJA YANG SUDAH DIPROSES (sandaran tambahan selain status GAS)
# ============================================================================

def muat_diproses():
    try:
        if os.path.exists(LALUAN_DIPROSES):
            with open(LALUAN_DIPROSES, 'r', encoding='utf-8') as f:
                d = json.load(f)
            if isinstance(d, list):
                return set(str(x) for x in d)
    except Exception as e:
        log_amaran('Gagal baca diproses.json: %s' % e)
    return set()


def simpan_diproses(senarai):
    try:
        satu = sorted(senarai)[-500:]      # simpan 500 id terakhir sahaja
        with open(LALUAN_DIPROSES, 'w', encoding='utf-8') as f:
            json.dump(satu, f, ensure_ascii=False, indent=1)
    except Exception as e:
        log_amaran('Gagal simpan diproses.json: %s' % e)


# ============================================================================
#  PROSES SATU KERJA
# ============================================================================

def proses_satu(kerja, sudah_diproses):
    """Render + sahkan + hantar SATU kerja. Tidak pernah lempar pengecualian ke atas."""
    id_kerja = str(kerja.get('id', '')).strip() or '?'
    nama = str(kerja.get('nama') or '').strip()
    kod = str(kerja.get('kod') or '').strip()
    emel = str(kerja.get('emel') or '').strip()
    foto_b64 = str(kerja.get('foto') or '').strip()
    try:
        halaman_dijangka = int(kerja.get('halaman') or 0)
    except Exception:
        halaman_dijangka = 0

    # 1) Jangan proses kerja yang sama dua kali (sandaran tambahan).
    if id_kerja in sudah_diproses:
        log_amaran('Kerja #%s sudah diproses dahulu - dilangkau.' % id_kerja)
        return 'langkau'

    log('Kerja baru #%s - %s (%d halaman)' % (id_kerja, nama or '(tiada nama)', halaman_dijangka))

    folder_temp = None
    try:
        # 2) Bina data: utamakan kod (app nyahkod sendiri), sandaran Python juga ada.
        data = data_dari_kod(kod)
        if not data or not data.get('nama'):
            data = {'nama': nama, 'emel': emel, 'templat': 'biru'}
        if not data.get('nama'):
            data['nama'] = nama
        if foto_b64:
            data['foto'] = 'data:image/jpeg;base64,' + foto_b64

        if not data.get('nama'):
            raise RuntimeError('Kerja tiada nama - tidak boleh disahkan.')

        # 3) Render PDF dengan Chrome headless.
        laluan_pdf = os.path.join(tempfile.gettempdir(), 'resume_mv_%s_%d.pdf' % (
            id_kerja, int(time.time())))
        folder_temp = jana_pdf(data, kod, laluan_pdf, tanda='kerja%s' % id_kerja)
        saiz = os.path.getsize(laluan_pdf)

        # 4) Sahkan PDF dengan PyMuPDF sebelum hantar (elak email PDF kosong).
        semak = pdf_periksa(laluan_pdf, data.get('nama'))
        if semak['bil'] is None:
            log_amaran('pymupdf tiada - PDF dihantar TANPA pengesahan.')
        else:
            if semak['bil'] < 1:
                raise RuntimeError('PDF tidak ada halaman.')
            if not semak['sah']:
                raise RuntimeError('Nama "%s" tidak dijumpai dalam teks PDF '
                                   '(teks: %s)' % (data.get('nama'),
                                                   ' '.join(semak['teks'].split())[:160]))
            if semak['panjang'] < 150:
                raise RuntimeError('Teks PDF terlalu pendek (%d aksara) - kemungkinan '
                                   'resume tidak dirender.' % semak['panjang'])
            log('PDF disahkan: nama "%s" dijumpai, %d aksara teks.' % (
                data.get('nama'), semak['panjang']))
            if semak['tanda_air']:
                log_amaran('PDF #%s masih ada tanda air PRATONTON/BELUM DIBAYAR! '
                           'Semak bahawa app masih menyokong mod penjual.' % id_kerja)

        log('PDF siap: %d halaman, %d KB' % (semak['bil'] or halaman_dijangka or 1,
                                             max(1, round(saiz / 1024.0))))

        with open(laluan_pdf, 'rb') as f:
            pdf_bytes = f.read()

        # 5) Hantar ke GAS.
        if hantar_selesai(id_kerja, pdf_bytes):
            log('Email dihantar ke GAS untuk #%s' % id_kerja)
            simpan_salinan(id_kerja, data.get('nama'), pdf_bytes)
            sudah_diproses.add(id_kerja)
            simpan_diproses(sudah_diproses)
            return 'selesai'
        else:
            log_ralat('Gagal hantar #%s ke GAS selepas %d cubaan - dilangkau (tidak '
                      'tersekat). Salinan disimpan dalam outbox.' % (id_kerja, CUBAAN_HANTAR))
            simpan_salinan('GAGAL-' + id_kerja, data.get('nama'), pdf_bytes)
            sudah_diproses.add(id_kerja)
            simpan_diproses(sudah_diproses)
            return 'gagal-hantar'

    except Exception as e:
        log_ralat('Kerja #%s gagal: %s' % (id_kerja, e))
        log('   ' + traceback.format_exc().replace('\n', '\n   ').strip())
        # Tanda sebagai diproses supaya ia tidak berulang tanpa henti.
        sudah_diproses.add(id_kerja)
        simpan_diproses(sudah_diproses)
        return 'gagal'

    finally:
        if folder_temp:
            shutil.rmtree(folder_temp, ignore_errors=True)
        try:
            if 'laluan_pdf' in locals() and os.path.exists(laluan_pdf):
                os.remove(laluan_pdf)
        except Exception:
            pass


# ============================================================================
#  KITARAN POLLING
# ============================================================================

def satu_kitaran(sudah_diproses):
    """Satu kitaran: poll -> proses semua kerja. Pulangkan bilangan kerja."""
    try:
        kerja = poll_kerja()
    except urllib.error.HTTPError as e:
        log_amaran('GAS balas HTTP %s. Teruskan kitaran seterusnya.' % e.code)
        return 0
    except Exception as e:
        log_amaran('Rangkaian gagal semasa poll: %s. Teruskan kitaran seterusnya.' % e)
        return 0

    if not kerja:
        log('Tiada kerja baru, tunggu %d saat...' % SELA_SAAT)
        return 0

    log('Dapat %d kerja baru.' % len(kerja))
    for k in kerja:
        if isinstance(k, dict):
            proses_satu(k, sudah_diproses)
        else:
            log_amaran('Entri kerja tidak sah (bukan objek): %s' % str(k)[:120])
    return len(kerja)


def gelung_utama(sekali=False):
    log('=' * 62)
    log('Helper Email Resume MV bermula.')
    log('App   : %s' % LALUAN_APP)
    log('Chrome: %s' % (cari_chrome() or '(TIDAK DIJUMPAI!)'))
    log('GAS   : %s' % GAS_URL)
    log('Sela  : %d saat | Had polling: %d' % (SELA_SAAT, HAD_POLLING))
    if 'TUKAR' in str(GAS_URL) or 'TUKAR' in str(TOKEN):
        log_amaran('GAS_URL/TOKEN masih nilai contoh! Sunting config_email.json '
                   'sebelum guna sebenar.')
    log('=' * 62)

    bersih_outbox()
    sudah = muat_diproses()
    if sudah:
        log('%d id kerja pernah diproses akan dilangkau.' % len(sudah))

    # Semakan sihat GAS (action=uji). Gagal pun tidak mematikan helper.
    try:
        kuota = semak_kuota()
        log('Semakan sihat GAS: ok (kuota=%s)' % kuota)
    except Exception as e:
        log_amaran('Semakan sihat GAS gagal (%s) - teruskan juga.' % e)

    while True:
        try:
            satu_kitaran(sudah)
        except KeyboardInterrupt:
            log('Dihentikan oleh penjual (Ctrl+C).')
            return 0
        except Exception as e:
            # Jangan sekali-kali mati kerana satu kitaran bermasalah.
            log_ralat('Kitaran gagal: %s' % e)
            log('   ' + traceback.format_exc().replace('\n', '\n   ').strip())

        if sekali:
            log('Mod --sekali: berhenti selepas satu kitaran.')
            return 0

        try:
            time.sleep(SELA_SAAT)
        except KeyboardInterrupt:
            log('Dihentikan oleh penjual (Ctrl+C).')
            return 0


# ============================================================================
#  MOD UJIAN TEMPAT  (--uji-tempat): jana PDF daripada data contoh, TANPA rangkaian
# ============================================================================

def uji_tempat():
    log('=' * 62)
    log('UJIAN TEMPAT: menjana PDF daripada data contoh (tiada rangkaian).')
    log('App   : %s' % LALUAN_APP)
    chrome = cari_chrome()
    log('Chrome: %s' % (chrome or '(TIDAK DIJUMPAI!)'))

    if not os.path.exists(LALUAN_APP):
        log_ralat('Fail app tidak dijumpai: %s' % LALUAN_APP)
        return 1
    if not chrome:
        log_ralat('chrome.exe tidak dijumpai. Set LALUAN_CHROME dalam config_email.json.')
        return 1

    # Simpan PDF ujian dalam outbox (supaya penjual boleh lihat hasilnya).
    folder_keluar = folder_keluaran_penuh()
    try:
        os.makedirs(folder_keluar, exist_ok=True)
    except Exception:
        folder_keluar = tempfile.gettempdir()
    laluan_pdf = os.path.join(folder_keluar, 'UJIAN-TEMPAT_%s.pdf' % time.strftime('%Y%m%d-%H%M%S'))

    folder_temp = None
    try:
        folder_temp = jana_pdf(DATA_CONTOH, '', laluan_pdf, tanda='ujian')
        saiz = os.path.getsize(laluan_pdf)
        semak = pdf_periksa(laluan_pdf, NAMA_CONTOH)

        if semak['bil'] is None:
            log_amaran('pymupdf tiada - PDF dijana tetapi TIDAK dapat disahkan.')
            log('Fail ujian: %s' % laluan_pdf)
            print('UJIAN TEMPAT LULUS (tanpa pengesahan): %d bait' % saiz)
            return 0

        bil = semak['bil']
        log('PDF dijana: %d halaman, %d bait' % (bil, saiz))
        if bil < 1:
            log_ralat('PDF tiada halaman.')
            return 2
        if not semak['sah']:
            log_ralat('Nama contoh "%s" TIDAK dijumpai dalam teks PDF.' % NAMA_CONTOH)
            log('   Teks PDF (200 aksara pertama): %s' % ' '.join(semak['teks'].split())[:200])
            return 3

        log('Nama contoh "%s" dijumpai dalam teks PDF.' % NAMA_CONTOH)
        if semak['tanda_air']:
            log_amaran('PDF ujian MASIH ada tanda air PRATONTON/BELUM DIBAYAR - '
                       'mod penjual tidak berjaya dihidupkan.')
        else:
            log('Tiada tanda air PRATONTON/BELUM DIBAYAR - PDF bersih untuk pelanggan.')
        log('Fail ujian: %s' % laluan_pdf)
        print('UJIAN TEMPAT LULUS: %d halaman, %d bait' % (bil, saiz))
        return 0

    except Exception as e:
        log_ralat('Ujian tempat gagal: %s' % e)
        log('   ' + traceback.format_exc().replace('\n', '\n   ').strip())
        return 4
    finally:
        if folder_temp:
            shutil.rmtree(folder_temp, ignore_errors=True)


# ============================================================================
#  MULA
# ============================================================================

def main():
    argv = sys.argv[1:]
    muat_konfig()

    if '--uji-tempat' in argv:
        return uji_tempat()

    sekali = '--sekali' in argv
    return gelung_utama(sekali=sekali)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception:
        traceback.print_exc()
        sys.exit(9)
