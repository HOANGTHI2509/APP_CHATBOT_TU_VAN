@echo off
chcp 65001 >nul
echo ---------------------------------------------------
echo DANG XOA SACH CODE VA DU LIEU. CHI GIU LAI LANGFLOW
echo ---------------------------------------------------
echo.
echo Dang xoa thu muc Code (admin_demo)...
rmdir /s /q admin_demo

echo Dang xoa Data Cua Bot (chroma, chroma_db)...
rmdir /s /q chroma
rmdir /s /q chroma_db

echo Dang xoa toan bo cac Script Python va file Rac...
del /q *.py
del /q *.txt
del /q *.exe
del /q *.ps1
del /q *.log
del /q *.png

echo.
echo ===================================================
echo DONE! DA XOA TRANG! 
echo Bay gio thu muc cua ban chi con lai VENV_NAME (Langflow) va PDF (Tai lieu).
echo Hay bat lai Terminal va go lenh mo Langflow thoi nhe!
echo ===================================================
pause
