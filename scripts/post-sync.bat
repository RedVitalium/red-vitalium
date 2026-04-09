@echo off
echo Applying post-sync fixes...

powershell -Command "(Get-Content android\app\capacitor.build.gradle) -replace 'VERSION_21', 'VERSION_17' | Set-Content android\app\capacitor.build.gradle"

echo Done!
