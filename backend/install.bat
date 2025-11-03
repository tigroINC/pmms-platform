@echo off
echo ========================================
echo 보아스 AutoML 백엔드 설치
echo ========================================
echo.

REM Python 버전 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python이 설치되어 있지 않습니다.
    echo Python 3.9 이상을 설치해주세요.
    pause
    exit /b 1
)

echo [OK] Python 설치 확인 완료
echo.

REM 가상환경 생성
echo [1/4] 가상환경 생성 중...
python -m venv venv
if errorlevel 1 (
    echo [ERROR] 가상환경 생성 실패
    pause
    exit /b 1
)
echo [OK] 가상환경 생성 완료
echo.

REM 가상환경 활성화
echo [2/4] 가상환경 활성화 중...
call venv\Scripts\activate.bat
echo [OK] 가상환경 활성화 완료
echo.

REM 패키지 설치
echo [3/4] Python 패키지 설치 중... (시간이 걸릴 수 있습니다)
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] 패키지 설치 실패
    pause
    exit /b 1
)
echo [OK] 패키지 설치 완료
echo.

REM 환경변수 파일 생성
echo [4/4] 환경변수 파일 설정 중...
if not exist .env (
    copy .env.example .env
    echo [OK] .env 파일 생성 완료
    echo [INFO] .env 파일을 열어서 DATABASE_URL을 수정해주세요.
) else (
    echo [INFO] .env 파일이 이미 존재합니다.
)
echo.

echo ========================================
echo 설치 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. .env 파일을 열어서 DATABASE_URL 수정
echo 2. start.bat 실행하여 서버 시작
echo.
pause
