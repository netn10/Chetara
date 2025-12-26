@echo off
echo ========================================
echo   Heroku App Configuration Setup
echo   App: chetara
echo ========================================
echo.

echo [1/5] Setting environment variables...
heroku config:set NODE_ENV=production -a chetara
heroku config:set MONGODB_URI=mongodb+srv://netn10:Aa203716329@cluster0.fpxktqt.mongodb.net/ -a chetara
if errorlevel 1 (
    echo ERROR: Failed to set environment variables
    echo Make sure you're logged in with: heroku login
    pause
    exit /b 1
)
echo.

echo [2/5] Viewing current config...
heroku config -a chetara
echo.

echo [3/5] Checking app info...
heroku apps:info -a chetara
echo.

echo [4/5] Setting buildpacks (if needed)...
heroku buildpacks:add heroku/nodejs -a chetara 2>nul
echo Node.js buildpack configured
echo.

echo [5/5] Configuration complete!
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Your Heroku app is now configured with:
echo   - NODE_ENV=production
echo   - MONGODB_URI (configured)
echo   - Node.js buildpack
echo.
echo Next steps:
echo   1. Run: deploy-heroku.bat
echo   2. Or run: npm run deploy
echo   3. Or run: git push heroku main
echo.
pause
