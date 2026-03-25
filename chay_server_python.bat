@echo off
chcp 65001 >nul
echo ---------------------------------------------------
echo DANG KHOI DONG SERVER NHAN FILE (CONG 8000)...
echo ---------------------------------------------------
echo.

call .\VENV_NAME\Scripts\activate
echo Dang cai dat thu vien API (FastAPI, Uvicorn, Multipart, Python-docx)...
pip install fastapi uvicorn python-multipart python-docx >nul 2>&1

echo Khoi dong server tai http://127.0.0.1:8000 ...
python server.py
pause
