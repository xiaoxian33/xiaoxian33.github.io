@echo off
chcp 65001 >nul
title 后端 site-server（关掉这个窗口 = 关掉后端）

rem 切到"这个脚本所在的文件夹"（%~dp0），这样两台电脑都能用
cd /d "%~dp0"

echo ============================================================
echo   正在启动后端 site-server ...
echo.
echo   * 第一次启动会比较慢（要编译 + 连数据库），请耐心等
echo   * 看到下面这句话就是成功了：
echo       Started SiteServerApplication in xx.xxx seconds
echo   * 然后就可以刷新 index.html 看页面了
echo.
echo   * 这个窗口不要关！关了后端就停了
echo ============================================================
echo.

cd server
call mvnw.cmd spring-boot:run

echo.
echo ============================================================
echo   后端已经停止（如果是有报错，往上翻看红色的字）
echo   按任意键关闭这个窗口
echo ============================================================
pause >nul
