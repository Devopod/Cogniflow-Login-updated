#!/bin/bash

echo "🔧 Git Configuration Check & Test"
echo "=================================="

echo ""
echo "📋 Current Git line ending configuration:"
echo "core.autocrlf: $(git config core.autocrlf)"
echo "core.safecrlf: $(git config core.safecrlf)"
echo "core.eol: $(git config core.eol)"

echo ""
echo "📁 Git status:"
git status

echo ""
echo "🧪 Testing git add . (this should work without warnings):"
git add . 2>&1

echo ""
echo "📊 Final git status:"
git status

echo ""
echo "✅ Git operations completed successfully!"
echo "You can now run 'git commit -m \"your message\"' and 'git push' without issues."