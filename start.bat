@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 가 필요합니다. https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)
echo 연이의 아틀리에 서버를 켭니다. 이 창을 닫으면 게임 서버도 꺼집니다.
start "" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:5280"
node tools\serve.mjs
pause