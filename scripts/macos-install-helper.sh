#!/bin/bash

# ErgoSense macOS Installation Helper
# This script removes the quarantine flag that prevents unsigned apps from running

echo "🔧 ErgoSense macOS Installation Helper"
echo "======================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only."
    exit 1
fi

# Common installation locations
LOCATIONS=(
    "/Applications/ErgoSense.app"
    "$HOME/Applications/ErgoSense.app"
    "$HOME/Downloads/ErgoSense.app"
    "$HOME/Desktop/ErgoSense.app"
)

APP_PATH=""

# Find the app
echo "🔍 Looking for ErgoSense.app..."
for location in "${LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
        APP_PATH="$location"
        echo "✅ Found: $APP_PATH"
        break
    fi
done

# If not found in common locations, ask user
if [ -z "$APP_PATH" ]; then
    echo "⚠️  Could not find ErgoSense.app in common locations."
    echo ""
    echo "Please drag and drop the ErgoSense.app here, then press Enter:"
    read -r USER_PATH
    
    # Remove potential quotes and trim whitespace
    USER_PATH=$(echo "$USER_PATH" | sed "s/['\"]//g" | xargs)
    
    if [ -d "$USER_PATH" ]; then
        APP_PATH="$USER_PATH"
        echo "✅ Found: $APP_PATH"
    else
        echo "❌ App not found at: $USER_PATH"
        exit 1
    fi
fi

echo ""
echo "🔓 Removing quarantine flag..."

# Remove the quarantine attribute
if xattr -cr "$APP_PATH" 2>/dev/null; then
    echo "✅ Success! ErgoSense is now ready to use."
    echo ""
    echo "You can now open ErgoSense normally from:"
    echo "  $APP_PATH"
    echo ""
    echo "💡 Tip: You can also open it by double-clicking or using Spotlight (Cmd+Space, type 'ErgoSense')"
else
    echo "❌ Failed to remove quarantine flag."
    echo "Please try running with sudo:"
    echo "  sudo xattr -cr \"$APP_PATH\""
    exit 1
fi
