# 측정이력 데이터 삭제 스크립트
Write-Host "🗑️  측정이력 데이터 삭제 시작..." -ForegroundColor Yellow

Set-Location "C:\Users\User\boaz\frontend"

# .env 파일이 있는지 확인
if (Test-Path ".env") {
    npx tsx scripts/delete-measurements.ts
} else {
    Write-Host "❌ .env 파일이 없습니다. 개발 서버를 통해 삭제하거나 .env 파일을 생성하세요." -ForegroundColor Red
    Write-Host ""
    Write-Host "또는 다음 명령어로 Prisma Studio를 열어서 수동으로 삭제할 수 있습니다:" -ForegroundColor Cyan
    Write-Host "  npx prisma studio" -ForegroundColor Green
}
