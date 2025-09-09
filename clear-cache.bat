@echo off
echo Limpiando TODOS los caches para resolver Jest worker error...

echo Matando procesos Node.js existentes...
taskkill /F /IM node.exe 2>nul

echo Eliminando .next...
if exist .next (
    rmdir /s /q .next
)

echo Eliminando node_modules/.cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
)

echo Eliminando archivos temporales...
if exist out (
    rmdir /s /q out
)

echo Eliminando cache de npm...
npm cache clean --force

echo Cache completamente limpiado. Iniciando servidor...
npm run dev