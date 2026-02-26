@echo off
title Cafeteria PDV - Servidor
color 0E

echo.
echo  ========================================
echo       CAFETERIA PDV - INICIANDO...
echo  ========================================
echo.

cd /d "%~dp0"

:: Verifica se o banco existe
if not exist "prisma\dev.db" (
    echo  [!] Banco de dados nao encontrado.
    echo  [!] Execute PRIMEIRO-SETUP.bat antes.
    echo.
    pause
    exit /b 1
)

:: Verifica se o build existe
if not exist ".next" (
    echo  [*] Gerando build de producao...
    call npm run build
    echo.
)

:: Pega o IP da rede
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
)
set IP=%IP: =%

echo  [OK] Servidor iniciado com sucesso!
echo.
echo  ----------------------------------------
echo   Acesse no navegador:
echo.
echo   Neste PC:     http://localhost:3000
echo   Na rede:      http://%IP%:3000
echo  ----------------------------------------
echo.
echo   PIN Admin: 1234  ^|  PIN Maria: 5678
echo.
echo  ----------------------------------------
echo   NAO FECHE ESTA JANELA!
echo   O sistema fica rodando aqui.
echo  ----------------------------------------
echo.

npm start
