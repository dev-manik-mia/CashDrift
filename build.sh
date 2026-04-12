#!/bin/bash

# HSC ICT PRO - Minimal Size Android Build Script
# This script builds an optimized, minimal-size APK for Android

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
ANDROID_DIR="$PROJECT_ROOT/android"
OUTPUT_DIR="$ANDROID_DIR/app/build/outputs/apk/release"
DESKTOP_DIR="$HOME/Desktop"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║                CASH Drift - Minimal Build Script           ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Android directory exists
if [ ! -d "$ANDROID_DIR" ]; then
    echo -e "${RED}❌ Error: Android directory not found!${NC}"
    echo -e "${YELLOW}Run 'npx expo prebuild' first to generate native projects.${NC}"
    exit 1
fi

# Display current configuration
echo -e "${BLUE}📋 Build Configuration:${NC}"
echo -e "  ${GREEN}✓${NC} Resource Shrinking: Enabled"
echo -e "  ${GREEN}✓${NC} Code Minification: Enabled"
echo -e "  ${GREEN}✓${NC} ProGuard Optimization: Enabled"
echo -e "  ${GREEN}✓${NC} Architecture: arm64-v8a (APK) / Universal (AAB)"
echo -e "  ${GREEN}✓${NC} PNG Compression: Enabled"
echo -e "  ${GREEN}✓${NC} Bundle Compression: Enabled"
echo ""

# Ask user what to build
echo -e "${CYAN}Select build type:${NC}"
echo -e "  ${GREEN}1${NC} - APK (arm64-v8a only) - For direct installation"
echo -e "  ${GREEN}2${NC} - AAB (Android App Bundle) - For Play Store upload"
echo -e "  ${GREEN}3${NC} - Both APK and AAB"
echo ""
read -p "$(echo -e ${CYAN}"Enter choice (1/2/3): "${NC})" -n 1 -r BUILD_CHOICE
echo
echo ""

case $BUILD_CHOICE in
    1)
        BUILD_TYPE="apk"
        echo -e "${YELLOW}⚠️  Building APK (arm64-v8a only) - ~25-30 MB${NC}"
        ;;
    2)
        BUILD_TYPE="aab"
        echo -e "${YELLOW}⚠️  Building AAB (Android App Bundle) for Play Store${NC}"
        ;;
    3)
        BUILD_TYPE="both"
        echo -e "${YELLOW}⚠️  Building both APK and AAB${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice. Build cancelled.${NC}"
        exit 1
        ;;
esac

echo ""
read -p "$(echo -e ${CYAN}"Continue? (y/n): "${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Build cancelled.${NC}"
    exit 1
fi

echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1/3: Building optimized release...${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}This may take 1-3 minutes...${NC}"
echo ""

cd "$ANDROID_DIR"

# Build based on user choice
BUILD_SUCCESS=false

if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "${BLUE}Building APK...${NC}"
    if ./gradlew assembleRelease; then
        echo -e "${GREEN}✓ APK build completed${NC}"
        BUILD_SUCCESS=true
    else
        echo -e "${RED}❌ APK build failed${NC}"
        exit 1
    fi
    echo ""
fi

if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "${BLUE}Building AAB...${NC}"
    if ./gradlew bundleRelease; then
        echo -e "${GREEN}✓ AAB build completed${NC}"
        BUILD_SUCCESS=true
    else
        echo -e "${RED}❌ AAB build failed${NC}"
        exit 1
    fi
    echo ""
fi

if [ "$BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
fi

echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2/3: Checking build details...${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check APK if built
if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    APK_FILE="$OUTPUT_DIR/app-arm64-v8a-release.apk"
    
    if [ -f "$APK_FILE" ]; then
        APK_SIZE=$(du -h "$APK_FILE" | cut -f1)
        APK_SIZE_BYTES=$(stat -f%z "$APK_FILE")
        APK_SIZE_MB=$(echo "scale=2; $APK_SIZE_BYTES / 1048576" | bc)
        
        echo -e "${GREEN}✓ APK found:${NC}"
        echo -e "  📱 File: app-arm64-v8a-release.apk"
        echo -e "  📦 Size: ${GREEN}${APK_SIZE_MB} MB${NC} (${APK_SIZE})"
        echo -e "  🏗️  Architecture: arm64-v8a only"
        echo -e "  📍 Location: $OUTPUT_DIR"
        echo ""
    else
        echo -e "${RED}❌ Error: APK file not found${NC}"
    fi
fi

# Check AAB if built
if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    AAB_DIR="$ANDROID_DIR/app/build/outputs/bundle/release"
    AAB_FILE="$AAB_DIR/app-release.aab"
    
    if [ -f "$AAB_FILE" ]; then
        AAB_SIZE=$(du -h "$AAB_FILE" | cut -f1)
        AAB_SIZE_BYTES=$(stat -f%z "$AAB_FILE")
        AAB_SIZE_MB=$(echo "scale=2; $AAB_SIZE_BYTES / 1048576" | bc)
        
        echo -e "${GREEN}✓ AAB found:${NC}"
        echo -e "  📱 File: app-release.aab"
        echo -e "  📦 Size: ${GREEN}${AAB_SIZE_MB} MB${NC} (${AAB_SIZE})"
        echo -e "  🏗️  Format: Android App Bundle (Universal)"
        echo -e "  📍 Location: $AAB_DIR"
        echo ""
    else
        echo -e "${RED}❌ Error: AAB file not found${NC}"
    fi
fi

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3/3: Copying to Desktop...${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Copy APK to Desktop if built
if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    if [ -f "$APK_FILE" ]; then
        DESKTOP_APK="$DESKTOP_DIR/HscICTPro.apk"
        if cp "$APK_FILE" "$DESKTOP_APK"; then
            echo -e "${GREEN}✓ APK copied to Desktop${NC}"
            echo -e "  📂 Desktop location: $DESKTOP_APK"
        else
            echo -e "${RED}❌ Failed to copy APK to Desktop${NC}"
        fi
    fi
fi

# Copy AAB to Desktop if built
if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    if [ -f "$AAB_FILE" ]; then
        DESKTOP_AAB="$DESKTOP_DIR/HscICTPro.aab"
        if cp "$AAB_FILE" "$DESKTOP_AAB"; then
            echo -e "${GREEN}✓ AAB copied to Desktop${NC}"
            echo -e "  📂 Desktop location: $DESKTOP_AAB"
        else
            echo -e "${RED}❌ Failed to copy AAB to Desktop${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║                  ✅ BUILD SUCCESSFUL! ✅                   ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Build summary
echo -e "${CYAN}📊 Build Summary:${NC}"

if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "  ${GREEN}✓${NC} APK Size: ${GREEN}${APK_SIZE_MB} MB${NC}"
    echo -e "  ${GREEN}✓${NC} Architecture: arm64-v8a (64-bit)"
fi

if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "  ${GREEN}✓${NC} AAB Size: ${GREEN}${AAB_SIZE_MB} MB${NC}"
    echo -e "  ${GREEN}✓${NC} Format: Android App Bundle (Universal)"
fi

echo -e "  ${GREEN}✓${NC} Optimizations: Enabled"
echo -e "  ${GREEN}✓${NC} Location: Desktop"
echo ""

if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "${CYAN}📱 APK Installation Instructions:${NC}"
    echo -e "  1️⃣  Transfer the APK to your Android device"
    echo -e "  2️⃣  Enable 'Install from Unknown Sources' in Settings"
    echo -e "  3️⃣  Open the APK file and tap 'Install'"
    echo -e "  4️⃣  Launch 'HSC ICT PRO' from your app drawer"
    echo ""
fi

if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "${CYAN}🏪 AAB Play Store Upload Instructions:${NC}"
    echo -e "  1️⃣  Go to Google Play Console (play.google.com/console)"
    echo -e "  2️⃣  Select your app or create a new one"
    echo -e "  3️⃣  Go to 'Production' or 'Testing' tracks"
    echo -e "  4️⃣  Create a new release and upload the AAB file"
    echo -e "  5️⃣  Fill in release notes and submit for review"
    echo ""
fi

echo -e "${CYAN}💡 Tips:${NC}"
echo -e "  • Works on Android 7.0+ (API 24+)"
echo -e "  • Compatible with 95%+ modern devices (2015+)"
echo -e "  • Optimized for minimal size and best performance"
if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "  • AAB format allows Play Store to optimize for each device"
    echo -e "  • Users typically download ~15-20% smaller apps with AAB"
fi
echo ""

echo -e "${YELLOW}📂 File Location(s):${NC}"
if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "  APK: ${DESKTOP_APK}"
fi
if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "  AAB: ${DESKTOP_AAB}"
fi
echo ""

# Ask if user wants to open Desktop
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "$(echo -e ${CYAN}"Open Desktop folder? (y/n): "${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$DESKTOP_DIR"
    fi
fi

echo -e "${GREEN}✨ Done!${NC}"
echo ""
