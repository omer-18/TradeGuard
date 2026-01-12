# PowerShell script to set up your own GitHub repository
# Run this after creating your GitHub repo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Repository Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get GitHub username
$username = Read-Host "Enter your GitHub username"

# Get repository name
$repoName = Read-Host "Enter your repository name (or press Enter for 'kalshi-insider-trading')"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "kalshi-insider-trading"
}

$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "Repository URL: $repoUrl" -ForegroundColor Yellow
Write-Host ""

# Confirm
$confirm = Read-Host "Is this correct? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Setup cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Removing old remote..." -ForegroundColor Green
git remote remove origin

Write-Host "Adding new remote..." -ForegroundColor Green
git remote add origin $repoUrl

Write-Host ""
Write-Host "Verifying remote..." -ForegroundColor Green
git remote -v

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Make sure your GitHub repo exists at: $repoUrl" -ForegroundColor Yellow
Write-Host "2. Run: git push -u origin main" -ForegroundColor Yellow
Write-Host "3. If you get auth errors, use a Personal Access Token" -ForegroundColor Yellow
Write-Host ""
Write-Host "To push now, run:" -ForegroundColor Green
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host ""
