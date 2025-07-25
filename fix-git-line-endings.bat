@echo off
echo 🔧 Fixing Git Line Ending Issues...
echo ====================================

REM Set Git configuration to prevent line ending warnings
echo 📝 Setting Git configuration...
git config core.autocrlf false
git config core.safecrlf false
git config core.eol lf
git config core.precomposeUnicode false
git config core.trustctime false

REM Apply globally for all repositories
echo 🌍 Applying globally...
git config --global core.autocrlf false
git config --global core.safecrlf false

REM Remove Salesforce CLI files from tracking if they exist
echo 🗑️ Removing Salesforce CLI files from Git tracking...
git rm -r --cached .sfdx/ 2>nul || echo No .sfdx folder to remove

REM Re-normalize the repository
echo 🔄 Re-normalizing repository...
git add --renormalize .

echo ✅ Git line ending configuration fixed!
echo 
echo 📋 Current Git configuration:
git config --list | findstr "core\."

echo 
echo 🚀 You can now run 'git add .' without warnings!
pause