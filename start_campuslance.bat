@echo off
echo Starting CampusLance Backend Server...
:: Use pythonw to run the process without a command window
start "" pythonw app.py

echo Waiting for backend to initialize...
timeout /t 2 /nobreak > NUL

echo Opening CampusLance in your browser...
start "" "index.html"

echo.
echo CampusLance is now running! 
echo The backend server (app.py) is running in the background.
echo To stop it completely later, you can use Task Manager and end the "Python" process.
pause
