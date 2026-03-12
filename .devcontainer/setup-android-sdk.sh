#!/bin/bash
set -e

# Android SDK setup for devcontainer
ANDROID_SDK_ROOT="/opt/android-sdk"
CMDLINE_TOOLS_VERSION="11076708"  # latest command-line tools

# # Skip if already installed
# if [ -d "$ANDROID_SDK_ROOT/cmdline-tools/latest" ]; then
#     echo "Android SDK already installed, skipping."
#     exit 0
# fi

echo "Installing Android SDK..."

sudo mkdir -p "$ANDROID_SDK_ROOT"
sudo chown -R "$(whoami)" "$ANDROID_SDK_ROOT"

# Download and extract command-line tools
cd /tmp
curl -fsSL "https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip" -o cmdline-tools.zip
unzip -q cmdline-tools.zip -d "$ANDROID_SDK_ROOT"
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools/latest"
mv "$ANDROID_SDK_ROOT/cmdline-tools/bin" "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin"
mv "$ANDROID_SDK_ROOT/cmdline-tools/lib" "$ANDROID_SDK_ROOT/cmdline-tools/latest/lib"
[ -f "$ANDROID_SDK_ROOT/cmdline-tools/NOTICE.txt" ] && mv "$ANDROID_SDK_ROOT/cmdline-tools/NOTICE.txt" "$ANDROID_SDK_ROOT/cmdline-tools/latest/"
[ -f "$ANDROID_SDK_ROOT/cmdline-tools/source.properties" ] && mv "$ANDROID_SDK_ROOT/cmdline-tools/source.properties" "$ANDROID_SDK_ROOT/cmdline-tools/latest/"
rm -f cmdline-tools.zip

# Set environment variables
export ANDROID_SDK_ROOT="$ANDROID_SDK_ROOT"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

# Accept licenses and install essential packages
yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager --install \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0"

# Persist environment variables for future terminal sessions
PROFILE="/home/$(whoami)/.bashrc"
{
    echo ""
    echo "# Android SDK"
    echo "export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"
    echo "export ANDROID_HOME=$ANDROID_SDK_ROOT"
    echo 'export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"'
} >> "$PROFILE"

echo "Android SDK installed successfully."
