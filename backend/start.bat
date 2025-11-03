@echo off
echo ========================================
echo 보아스 AutoML 예측 API 서버 시작
echo ========================================
echo.

REM 가상환경 활성화
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo [OK] 가상환경 활성화 완료
) else (
    echo [ERROR] 가상환경이 없습니다. 먼저 설치를 진행하세요.
    echo python -m venv venv
    echo venv\Scripts\activate
    echo pip install -r requirements.txt
    pause
    exit /b 1
)

echo.
echo [INFO] 서버를 시작합니다...
echo [INFO] API 문서: http://localhost:8000/docs
echo [INFO] 헬스 체크: http://localhost:8000/health
echo.

REM 서버 실행
python main.py

pause
