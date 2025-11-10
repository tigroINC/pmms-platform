$migrationsPath = "c:\Users\User\boaz\frontend\prisma\migrations"

Get-ChildItem -Path $migrationsPath -Filter "*.sql" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # DATETIME -> TIMESTAMP
    $content = $content -replace 'DATETIME', 'TIMESTAMP'
    
    # TEXT NOT NULL PRIMARY KEY -> TEXT PRIMARY KEY
    $content = $content -replace 'TEXT NOT NULL PRIMARY KEY', 'TEXT PRIMARY KEY'
    
    # AUTOINCREMENT -> (제거)
    $content = $content -replace 'AUTOINCREMENT', ''
    
    Set-Content -Path $_.FullName -Value $content
    Write-Host "Converted: $($_.Name)"
}

Write-Host "`nConversion complete!"
