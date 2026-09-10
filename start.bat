@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   ============================================
echo    CYBER-OS 本地预览
echo.
echo    地址： http://localhost:8080
echo    停止： 按 Ctrl + C
echo.
echo    提示：直接双击 index.html 是打不开数据的
echo          （浏览器安全策略会拦住 fetch），
echo          所以开发时请用这个脚本启动。
echo   ============================================
echo.
start "" "http://localhost:8080"
python -m http.server 8080
