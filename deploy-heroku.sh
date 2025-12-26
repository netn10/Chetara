#!/bin/bash

echo "========================================"
echo "  Deploying Chess Magic to Heroku"
echo "  App: chetara"
echo "========================================"
echo ""

echo "[1/4] Checking git status..."
git status
echo ""

echo "[2/4] Adding and committing changes..."
git add .
git commit -m "Deploy to Heroku - $(date)"
if [ $? -ne 0 ]; then
    echo "No changes to commit or commit failed"
fi
echo ""

echo "[3/4] Pushing to Heroku..."
echo "This may take a few minutes while Heroku builds the app..."
git push heroku main
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Push to Heroku failed!"
    echo "Please check the error messages above."
    echo "You may need to run: heroku login"
    exit 1
fi
echo ""

echo "[4/4] Opening Heroku app..."
if command -v xdg-open > /dev/null; then
    xdg-open https://chetara-8df1a70b756d.herokuapp.com/play
elif command -v open > /dev/null; then
    open https://chetara-8df1a70b756d.herokuapp.com/play
fi
echo ""

echo "========================================"
echo "  Deployment Complete!"
echo "  URL: https://chetara-8df1a70b756d.herokuapp.com/play"
echo "========================================"
echo ""
echo "To view logs: heroku logs --tail -a chetara"
echo "To open app: heroku open -a chetara"
echo ""
