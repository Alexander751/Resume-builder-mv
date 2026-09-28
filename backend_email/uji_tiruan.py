# -*- coding: utf-8 -*-
"""
uji_tiruan.py  --  PELAYAN GAS TIRUAN untuk menguji resume_pdf_helper.py
=========================================================================

Tujuan: menguji KITARAN PENUH (poll -> render PDF -> hantar balik) TANPA
GAS sebenar dan TANPA internet.

Cara guna:
    python uji_tiruan.py

Apa yang berlaku:
  1. Skrip ini memulakan pelayan HTTP tiruan pada 127.0.0.1 (port bebas).
  2. Ia tulis config_email.json sementara supaya helper menunjuk ke pelayan
     tiruan itu (config asal disandarkan dan dipulihkan semula di akhir).
  3. Ia jalankan `resume_pdf_helper.py --sekali` (satu kitaran sahaja).
  4. Ia sahkan bahawa POST "action=selesai" diterima dan medan "pdf" boleh
     dinyahkod menjadi PDF sebenar yang mengandungi nama pelanggan.

Keluar dengan kod 0 kalau semua lulus, bukan 0 kalau gagal.
"""

import base64
import http.server
import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.parse

DIR = os.path.dirname(os.path.abspath(__file__))
HELPER = os.path.join(DIR, 'resume_pdf_helper.py')
CONFIG = os.path.join(DIR, 'config_email.json')
PY = sys.executable

TOKEN = 'TOKEN-UJIAN-123'

NAMA_PELANGGAN = 'Siti Nurhaliza binti Othman'

# Foto JPEG kecil (base64, TANPA prefix 'data:image/jpeg;base64,') - sama seperti
# yang GAS akan hantar dalam medan 'foto'.
FOTO_B64 = (
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

# Data resume pelanggan contoh, dalam bentuk RINGKAS yang sama seperti fungsi
# kodDari() dalam app (kunci pendek: s,n,t,e,l,j,g,k,b,u,p,d,a,x,y).
RINGKAS = {
    's': 'bersih',
    'n': NAMA_PELANGGAN,
    't': '012-667 9012',
    'e': 'siti.othman@contoh.my',
    'l': 'Shah Alam, Selangor',
    'j': 'Eksekutif Pemasaran Digital',
    'g': ('Eksekutif pemasaran digital dengan 6 tahun pengalaman mengurus kempen '
          'Meta Ads dan Google Ads, membina kandungan, serta menganalisis prestasi '
          'kempen untuk perniagaan runcit dan perkhidmatan.'),
    'k': [
        {'n': 'Meta Ads', 'p': 5},
        {'n': 'Google Analytics 4', 'p': 4},
        {'n': 'Penulisan Kandungan', 'p': 4},
        {'n': 'Canva', 'p': 5},
    ],
    'b': [
        {'n': 'Bahasa Melayu', 'p': 5},
        {'n': 'Bahasa Inggeris', 'p': 4},
    ],
    'u': [
        {'n': 'Cik Farah binti Ismail', 'j': 'Pengurus Pemasaran, Nadi Runcit Sdn Bhd', 't': '017-332 8890'},
    ],
    'p': [
        {
            'jawatan': 'Eksekutif Pemasaran Digital',
            'syarikat': 'Nadi Runcit Sdn Bhd',
            'tempoh': '2021 - Kini',
            'poin': [
                'Menguruskan bajet iklan bulanan RM45,000 dengan pulangan ROAS 4.2x.',
                'Meningkatkan trafik laman web sebanyak 68% dalam tempoh 12 bulan.',
                'Membina 120 kandungan media sosial sebulan bersama pasukan kreatif.',
            ],
        },
        {
            'jawatan': 'Penolong Eksekutif Pemasaran',
            'syarikat': 'Warisan Digital',
            'tempoh': '2019 - 2021',
            'poin': [
                'Menjalankan kempen e-mel dengan kadar buka 34%.',
                'Menyediakan laporan prestasi mingguan kepada pihak pengurusan.',
            ],
        },
    ],
    'd': [
        {'kelulusan': 'Sarjana Muda Pentadbiran Perniagaan', 'institusi': 'UiTM Shah Alam', 'tahun': '2019'},
        {'kelulusan': 'Diploma Pemasaran', 'institusi': 'Kolej Poly-Tech MARA', 'tahun': '2016'},
    ],
    'a': [],
    'x': [],
    'y': None,
}


def bina_kod(ringkas):
    """Sama seperti kodDari() dalam app: base64url JSON UTF-8 tanpa '=' di hujung."""
    mentah = json.dumps(ringkas, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    return base64.b64encode(mentah).decode('ascii').replace('+', '-').replace('/', '_').rstrip('=')


KOD = bina_kod(RINGKAS)

# Id unik setiap kali ujian dijalankan, supaya rekod 'diproses.json' (yang
# menyimpan id kerja yang sudah diproses) tidak pernah melangkau kerja ujian ini.
ID_KERJA = int(time.time())

KERJA = [{
    'id': ID_KERJA,
    'nama': NAMA_PELANGGAN,
    'emel': 'siti.othman@contoh.my',
    'kod': KOD,
    'halaman': 1,
    'foto': FOTO_B64,
}]

REKOD = {'poll': 0, 'ujian': 0, 'selesai': [], 'token_salah': 0}


class Pengendali(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *a):
        pass

    def _balas(self, obj, kod=200):
        badan = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(kod)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(badan)))
        self.end_headers()
        self.wfile.write(badan)

    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        act = (q.get('action') or [''])[0]
        tok = (q.get('token') or [''])[0]
        if tok != TOKEN:
            REKOD['token_salah'] += 1
            return self._balas({'ok': False, 'ralat': 'token salah'}, 403)
        if act == 'kerja':
            REKOD['poll'] += 1
            # Seperti GAS: kerja dihantar SEKALI sahaja (selepas itu status 'Diproses').
            kerja = KERJA if REKOD['poll'] == 1 else []
            return self._balas({'ok': True, 'kerja': kerja})
        if act == 'uji':
            REKOD['ujian'] += 1
            return self._balas({'ok': True, 'kuota': 87})
        return self._balas({'ok': False, 'ralat': 'action tidak dikenali'}, 404)

    def do_POST(self):
        panjang = int(self.headers.get('Content-Length') or 0)
        mentah = self.rfile.read(panjang)
        try:
            j = json.loads(mentah.decode('utf-8'))
        except Exception as e:
            REKOD['selesai'].append({'RALAT_JSON': str(e)})
            return self._balas({'ok': False, 'ralat': 'JSON tidak sah'}, 400)
        if j.get('token') != TOKEN:
            REKOD['token_salah'] += 1
            return self._balas({'ok': False, 'ralat': 'token salah'}, 403)
        if j.get('action') == 'selesai':
            REKOD['selesai'].append(j)
            return self._balas({'ok': True})
        return self._balas({'ok': False, 'ralat': 'action tidak dikenali'}, 400)


def port_bebas():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    p = s.getsockname()[1]
    s.close()
    return p


def main():
    lulus = []
    gagal = []

    def semak(syarat, mesej):
        (lulus if syarat else gagal).append(mesej)
        print(('  [LULUS] ' if syarat else '  [GAGAL] ') + mesej)

    port = port_bebas()
    pelayan = http.server.ThreadingHTTPServer(('127.0.0.1', port), Pengendali)
    t = threading.Thread(target=pelayan.serve_forever, daemon=True)
    t.start()
    url = 'http://127.0.0.1:%d/exec' % port
    print('Pelayan GAS tiruan berjalan di %s' % url)

    sandaran = None
    if os.path.exists(CONFIG):
        with open(CONFIG, 'rb') as f:
            sandaran = f.read()

    kod_keluar = None
    try:
        with open(CONFIG, 'w', encoding='utf-8') as f:
            json.dump({'GAS_URL': url, 'TOKEN': TOKEN, 'SELA_SAAT': 5}, f, indent=2)
        print('config_email.json sementara ditulis (menunjuk ke pelayan tiruan).')
        print('Menjalankan helper: python resume_pdf_helper.py --sekali')
        print('-' * 62)

        hasil = subprocess.run([PY, HELPER, '--sekali'], capture_output=True, timeout=300)
        keluaran = (hasil.stdout or b'').decode('utf-8', 'replace')
        print(keluaran)
        if hasil.stderr:
            print('--- stderr helper ---')
            print((hasil.stderr or b'').decode('utf-8', 'replace'))
        kod_keluar = hasil.returncode
    finally:
        print('-' * 62)
        try:
            pelayan.shutdown()
        except Exception:
            pass
        if sandaran is None:
            if os.path.exists(CONFIG):
                os.remove(CONFIG)
        else:
            with open(CONFIG, 'wb') as f:
                f.write(sandaran)

    print('')
    print('=' * 62)
    print('HASIL PENGESAHAN UJIAN TIRUAN')
    print('=' * 62)

    semak(kod_keluar == 0, 'Helper tamat dengan kod 0 (dapat %s)' % kod_keluar)
    semak(REKOD['token_salah'] == 0, 'Tiada permintaan dengan token salah')
    semak(REKOD['poll'] >= 1, 'GAS tiruan menerima poll action=kerja (%d kali)' % REKOD['poll'])
    semak(len(REKOD['selesai']) == 1, 'GAS tiruan menerima TEPAT 1 POST action=selesai (dapat %d)'
          % len(REKOD['selesai']))
    semak('PDF siap' in keluaran, 'Log helper menunjukkan "PDF siap"')
    semak('Email dihantar ke GAS' in keluaran, 'Log helper menunjukkan "Email dihantar ke GAS"')
    semak('Tiada tanda air' in keluaran or 'tanda air' not in keluaran,
          'PDF dijana dalam mod penjual (tiada amaran tanda air)')

    if REKOD['selesai']:
        j = REKOD['selesai'][0]
        semak(j.get('action') == 'selesai', 'Medan action = "selesai"')
        semak(j.get('token') == TOKEN, 'Medan token betul')
        semak(str(j.get('id')) == str(ID_KERJA), 'Medan id = %s (dapat %s)' % (ID_KERJA, j.get('id')))
        b64 = j.get('pdf') or ''
        semak(bool(b64) and 'data:' not in b64, 'Medan pdf ada dan TIADA prefix "data:"')
        try:
            pdf_bytes = base64.b64decode(b64, validate=True)
        except Exception as e:
            pdf_bytes = b''
            semak(False, 'Medan pdf boleh dinyahkod base64 (%s)' % e)
        if pdf_bytes:
            semak(pdf_bytes[:5] == b'%PDF-', 'Kandungan pdf bermula dengan %PDF-')
            fail = os.path.join(DIR, 'outbox', '_uji_tiruan_hasil.pdf')
            os.makedirs(os.path.dirname(fail), exist_ok=True)
            with open(fail, 'wb') as f:
                f.write(pdf_bytes)
            print('  PDF daripada POST disimpan sementara: %s (%d bait)' % (fail, len(pdf_bytes)))
            try:
                import pymupdf
                doc = pymupdf.open(fail)
                teks = ''.join(doc[i].get_text() for i in range(doc.page_count))
                bil = doc.page_count
                doc.close()
                normal = ''.join(teks.split()).lower()
                nama_n = ''.join(NAMA_PELANGGAN.split()).lower()
                semak(bil >= 1, 'PDF dalam POST ada %d halaman' % bil)
                semak(nama_n in normal, 'Nama pelanggan "%s" ADA dalam teks PDF' % NAMA_PELANGGAN)
                semak('belumdibayar' not in normal, 'PDF TIADA tanda air BELUM DIBAYAR')
                # Kandungan resume pelanggan benar-benar dirender (bukan helaian kosong):
                # nama syarikat + jumlah pengalaman dari data ujian.
                semak('nadiruncitsdnbhd' in normal,
                      'Nama syarikat "Nadi Runcit Sdn Bhd" ADA dalam PDF')
                semak('sarjanamudapentadbiranperniagaan' in normal,
                      'Kelulusan "Sarjana Muda Pentadbiran Perniagaan" ADA dalam PDF')
                print('  Saiz PDF diterima: %d bait' % len(pdf_bytes))
                print('  Panjang teks dinormalkan: %d aksara' % len(normal))
                print('  Teks halaman 1 (180 aksara): %s' % ' '.join(teks.split())[:180])
            except ImportError:
                print('  (pymupdf tiada - kandungan PDF tidak boleh disahkan)')
            os.remove(fail)

    print('')
    print('LULUS: %d   GAGAL: %d' % (len(lulus), len(gagal)))
    if gagal:
        print('UJIAN TIRUAN GAGAL:')
        for g in gagal:
            print('  - ' + g)
        return 1
    print('UJIAN TIRUAN LULUS: kitaran penuh poll -> PDF -> hantar berjaya.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
