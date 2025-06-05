@echo off
echo CogniFlow ERP - Heroku Deployment Script
echo ========================================

echo.
echo Step 1: Login to Heroku (this will open your browser)
heroku login

echo.
echo Step 2: Create Heroku app (replace 'your-app-name' with your desired name)
set /p APP_NAME="Enter your app name (must be unique): "
heroku create %APP_NAME%

echo.
echo Step 3: Add PostgreSQL database
heroku addons:create heroku-postgresql:mini

echo.
echo Step 4: Set environment variables
heroku config:set NODE_ENV=production
set /p SESSION_SECRET="Enter a session secret (or press Enter for auto-generated): "
if "%SESSION_SECRET%"=="" (
    heroku config:set SESSION_SECRET=auto-generated-secret-key-12345
) else (
    heroku config:set SESSION_SECRET=%SESSION_SECRET%
)

echo.
echo Step 5: Deploy to Heroku
git push heroku main

echo.
echo Step 6: Run database migrations
heroku run npm run migrate

echo.
echo Step 7: Open your app
heroku open

echo.
echo Deployment complete! Your app should now be running on Heroku.
pause