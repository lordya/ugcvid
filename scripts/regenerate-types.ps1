# PowerShell script to regenerate Supabase TypeScript types
# Usage: .\scripts\regenerate-types.ps1 [project-id]

param(
    [string]$ProjectId = "bnmnohmyvsukrwsqvdci"
)

Write-Host "Regenerating Supabase TypeScript types..." -ForegroundColor Cyan
Write-Host "Using project ID: $ProjectId" -ForegroundColor Gray

npx supabase gen types typescript --project-id $ProjectId > src/types/supabase.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Types regenerated successfully!" -ForegroundColor Green
    Write-Host "📁 Output: src/types/supabase.ts" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to regenerate types" -ForegroundColor Red
    exit 1
}

