@echo off
echo ============================================
echo   UTKARSH TOSS BOOK - Auto Deploy Script
echo ============================================
echo.

echo [1/3] Staging all changes...
git add .
if %errorlevel% neq 0 (
    echo Error staging changes
    pause
    exit /b 1
)

echo.
echo [2/3] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Auto-commit from push script
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo Error committing changes
    pause
    exit /b 1
)

echo.
echo [3/3] Pushing to git...
git push
if %errorlevel% neq 0 (
    echo Error pushing to git
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Successfully pushed to git!
echo ============================================
echo.
echo Backend URL: https://ut-0hem.onrender.com
echo Frontend will need manual build/deploy
echo.
echo To deploy backend to Render:
echo 1. Go to: https://dashboard.render.com/
echo 2. Find service: ut-0hem
echo 3. Click "Manual Deploy" -^> "Clear build cache ^& deploy"
echo.
pause