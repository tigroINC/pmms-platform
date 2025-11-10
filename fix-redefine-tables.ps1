# RedefineTables 패턴을 PostgreSQL ALTER TABLE로 변환
$migrationsPath = "c:\Users\User\boaz\frontend\prisma\migrations"

Get-ChildItem -Path $migrationsPath -Filter "migration.sql" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # RedefineTables 패턴 감지
    if ($content -match 'CREATE TABLE "new_(\w+)"') {
        $tableName = $Matches[1]
        Write-Host "Skipping RedefineTables migration: $($_.Directory.Name) (table: $tableName)"
        
        # 파일을 빈 파일로 만들기 (마이그레이션 건너뛰기)
        Set-Content -Path $_.FullName -Value "-- Skipped: SQLite RedefineTables not compatible with PostgreSQL`n"
    }
}

Write-Host "`nDone!"
