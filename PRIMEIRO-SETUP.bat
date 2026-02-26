@echo off
title Cafeteria PDV - Primeiro Setup
color 0A

echo.
echo  ========================================
echo    CAFETERIA PDV - CONFIGURACAO INICIAL
echo  ========================================
echo.

cd /d "%~dp0"

:: Verifica Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERRO] Node.js nao encontrado!
    echo  Instale em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo  [1/4] Verificando dependencias...
if not exist "node_modules" (
    echo         Instalando... (pode demorar alguns minutos)
    call npm install
) else (
    echo         OK - dependencias ja instaladas
)
echo.

echo  [2/4] Criando banco de dados...
call npx prisma migrate dev --name init 2>nul
echo         OK - banco de dados criado
echo.

echo  [3/4] Inserindo dados iniciais...
call npx tsx prisma/seed.ts
echo.

echo  [4/4] Gerando build de producao...
call npm run build
echo.

echo  ========================================
echo    SETUP CONCLUIDO COM SUCESSO!
echo  ========================================
echo.
echo   Agora execute INICIAR-PDV.bat para
echo   iniciar o sistema.
echo.
echo   PINs de acesso:
echo     Admin: 1234
echo     Maria: 5678
echo.
pause
