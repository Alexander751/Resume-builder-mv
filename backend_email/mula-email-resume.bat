@echo off
REM ================================================================
REM  Helper EMAIL RESUME  -  Resume Builder MV   (PC PENJUAL)
REM
REM  Klik dua kali fail ini. Dua tetingkap akan terbuka:
REM    1) "Email Resume (JANGAN TUTUP)" -> helper ini. Ia poll kerja
REM       dari Google Apps Script, render PDF resume pelanggan, dan
REM       hantar PDF itu kembali (GAS akan email kepada anda).
REM    2) Folder "outbox" -> salinan PDF yang sudah dihantar.
REM
REM  *** JANGAN TUTUP TETINGKAP "Email Resume (JANGAN TUTUP)" ***
REM  Selagi tetingkap itu terbuka, resume pelanggan akan siap sendiri.
REM  Untuk MATIKAN: tutup tetingkap itu (atau tekan Ctrl+C di dalamnya).
REM
REM  SEBELUM GUNA KALI PERTAMA
REM    - Sunting config_email.json: isi GAS_URL (mesti berakhir /exec)
REM      dan TOKEN (mesti sama dengan token dalam skrip GAS).
REM      Kalau fail itu tiada, helper guna nilai dalam resume_pdf_helper.py.
REM    - Uji perkakasan dahulu (tiada rangkaian diperlukan):
REM        python resume_pdf_helper.py --uji-tempat
REM      Kalau keluar "UJIAN TEMPAT LULUS", PC ini sudah bersedia.
REM
REM  Log penuh: helper.log
REM ================================================================
cd /d "%~dp0"

echo ================================================================
echo   Helper Email Resume - Resume Builder MV
echo ================================================================
echo.

REM Guna Python 3.13 yang dipasang di PC ini kalau ada, jika tidak 'python'.
set "PYEXE=python"
if exist "C:\Users\ADMIN\AppData\Local\Programs\Python\Python313\python.exe" set "PYEXE=C:\Users\ADMIN\AppData\Local\Programs\Python\Python313\python.exe"

if not exist "config_email.json" (
  echo [AMARAN] config_email.json tiada.
  echo          Helper akan guna GAS_URL dan TOKEN dalam resume_pdf_helper.py.
  echo          Pastikan kedua-duanya sudah diisi, kalau tidak tiada kerja
  echo          dapat diambil dari Google Apps Script.
  echo.
)

if not exist "outbox" mkdir "outbox"

echo Membuka helper... tetingkap "Email Resume (JANGAN TUTUP)" akan muncul.
echo.

start "Email Resume (JANGAN TUTUP)" cmd /k ""%PYEXE%" resume_pdf_helper.py"

timeout /t 2 /nobreak >nul
start "" explorer "%cd%\outbox"

echo.
echo ================================================================
echo   Helper sedang berjalan.
echo   JANGAN tutup tetingkap "Email Resume (JANGAN TUTUP)".
echo   Untuk berhenti: tutup tetingkap itu.
echo   Log: %cd%\helper.log
echo ================================================================
pause
