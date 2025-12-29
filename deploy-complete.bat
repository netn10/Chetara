@echo off
echo ========================================
echo   Complete Heroku Deployment Workflow
echo   App: chetara
echo ========================================
echo.

echo Step 1: Login to Heroku
echo ------------------------
echo Opening browser for authentication...
echo After logging in, press any key to continue.
call heroku login
if errorlevel 1 (
    echo ERROR: Heroku login failed
    pause
    exit /b 1
)
echo.

echo Step 2: Configure Heroku App
echo -----------------------------
echo Setting NODE_ENV...
call heroku config:set NODE_ENV=production -a chetara
echo.
echo IMPORTANT: Set your MongoDB URI manually:
echo   heroku config:set MONGODB_URI=your_mongodb_connection_string -a chetara
echo.
pause
echo.

echo Verifying configuration...
call heroku config -a chetara
echo.

echo Step 3: Prepare and Deploy
echo ---------------------------
echo Adding changes to git...
git add .
git status
echo.

set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Deploy to Heroku - %date% %time%

echo Committing with message: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"
echo.

echo Pushing to GitHub (origin/main)...
git push origin main
if errorlevel 1 (
    echo.
    echo WARNING: Push to GitHub failed!
    echo Continuing with Heroku deployment...
)
echo.

echo Pushing to Heroku (this will take a few minutes)...
git push heroku main
if errorlevel 1 (
    echo.
    echo ERROR: Deployment failed!
    echo Check the error messages above.
    pause
    exit /b 1
)
echo.

echo Step 4: Opening App
echo --------------------
start https://chetara.herokuapp.com
echo.

echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your app is live at: https://chetara.herokuapp.com
echo.
echo Useful commands:
echo   heroku logs --tail -a chetara    (View live logs)
echo   heroku open -a chetara           (Open app in browser)
echo   heroku restart -a chetara        (Restart app)
echo.
pause
