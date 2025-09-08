@echo off
title SISTEMA EMISSOR DE LAUDOS - DOCKER

echo ============================================
echo    SISTEMA EMISSOR DE LAUDOS - DOCKER
echo ============================================
echo.

d:
cd "General Truck System\5. Emissor de Laudos - Inspetor"

echo Diretorio: %CD%
echo.

echo Parando containers existentes...
docker-compose down

echo.
echo Construindo e iniciando containers...
docker-compose up --build -d

echo.
echo ============================================
echo    SISTEMA INICIADO COM DOCKER!
echo ============================================
echo.
echo URLs de acesso:
echo - https://inspetor.terpens.com.br:9444
echo - http://inspetor.terpens.com.br:3001
echo - https://177.126.153.190:9444
echo.
echo Para parar: docker-compose down
echo Para ver logs: docker-compose logs -f
echo.
pause
