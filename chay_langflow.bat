@echo off
chcp 65001 >nul
echo ---------------------------------------------------
echo DANG KHOI DONG LANGFLOW...
echo ---------------------------------------------------
echo.
call .\VENV_NAME\Scripts\activate
langflow run --port 7861
pause
