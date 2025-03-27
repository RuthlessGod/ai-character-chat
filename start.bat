@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo            AI Character Chat Startup
echo ===================================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=!SCRIPT_DIR:~0,-1!"

echo Working directory: %SCRIPT_DIR%
echo.

REM Change to the script directory
cd /d "%SCRIPT_DIR%"

REM Check Python installation
echo Checking Python installation...
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python not found in PATH.
    echo Please install Python and make sure it's in your PATH.
    goto error
)

python --version
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Creating one...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to create virtual environment.
        goto error
    )
    echo Virtual environment created.
)

REM Check if .env file exists
if not exist ".env" (
    echo .env file not found. Creating from sample...
    if exist ".env.sample" (
        copy ".env.sample" ".env"
        echo Created .env file from sample. Please edit it with your API keys.
    ) else (
        echo .env.sample file not found. Creating a basic .env file...
        (
            echo # API Keys
            echo OPENROUTER_API_KEY=
            echo # Model settings
            echo DEFAULT_MODEL=openai/gpt-3.5-turbo
            echo LOCAL_MODEL_URL=http://localhost:11434/api/generate
            echo # Flask settings
            echo DEBUG=True
            echo HOST=0.0.0.0
            echo PORT=5000
        ) > .env
        echo Created a basic .env file. Please edit it with your API keys.
    )
    echo.
    echo Press any key to continue...
    pause > nul
)

REM Check requirements.txt
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found.
    goto error
)

REM Activate virtual environment and install requirements if needed
echo Activating virtual environment...
call venv\Scripts\activate.bat
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to activate virtual environment.
    goto error
)

echo Checking dependencies...
if not exist "venv\Lib\site-packages\flask" (
    echo Installing requirements...
    pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install requirements.
        goto error
    )
    echo Requirements installed.
)

REM Check if app.py exists
if not exist "app.py" (
    echo ERROR: app.py not found.
    goto error
)

REM Start the application
echo.
echo ===================================================
echo Starting AI Character Chat...
echo ===================================================
echo.
echo Press Ctrl+C to stop the server.
echo.

python app.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Application crashed or failed to start.
    goto error
)

REM Deactivate virtual environment on exit
call venv\Scripts\deactivate.bat

goto end

:error
echo.
echo ===================================================
echo            ERROR OCCURRED
echo ===================================================
echo.
echo Please check the error messages above.
echo.
echo Press any key to exit...
pause > nul

:end
endlocal