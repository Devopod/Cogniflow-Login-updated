Write-Host "🔧 Fixing Git Line Ending Issues..." -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

# Set Git configuration to prevent line ending warnings
Write-Host "📝 Setting Git configuration..." -ForegroundColor Green
git config core.autocrlf false
git config core.safecrlf false
git config core.eol lf
git config core.precomposeUnicode false
git config core.trustctime false

# Apply globally for all repositories
Write-Host "🌍 Applying globally..." -ForegroundColor Green
git config --global core.autocrlf false
git config --global core.safecrlf false

# Remove Salesforce CLI files from tracking if they exist
Write-Host "🗑️ Removing Salesforce CLI files from Git tracking..." -ForegroundColor Green
try {
    git rm -r --cached .sfdx/ 2>$null
    Write-Host "Removed .sfdx folder from Git tracking" -ForegroundColor Blue
} catch {
    Write-Host "No .sfdx folder to remove" -ForegroundColor Blue
}

# Re-normalize the repository
Write-Host "🔄 Re-normalizing repository..." -ForegroundColor Green
git add --renormalize .

Write-Host ""
Write-Host "✅ Git line ending configuration fixed!" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Current Git configuration:" -ForegroundColor Cyan
git config --list | Select-String "core\."

Write-Host ""
Write-Host "🧪 Testing git add . (should work without warnings):" -ForegroundColor Cyan
git add . 2>&1

Write-Host ""
Write-Host "📊 Final git status:" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "🚀 You can now run 'git add .' and 'git commit' without warnings!" -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")