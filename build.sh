#!/usr/bin/env bash
# BabbyPaint build script
# Builds a debug or release APK/AAB for Android.
# Capacitor builds require a local Android SDK (devcontainer has this).
# Cordova builds require Docker.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${CYAN}[info]${NC} $*"; }
success() { echo -e "${GREEN}[ok]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC} $*"; }
die()     { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --capacitor        Build the Capacitor app (app/)  [default]
  --cordova          Build the Cordova app (src/) - requires Docker

  --apk              Output APK  [default]
  --aab              Output AAB (Android App Bundle)

  --debug            Debug build, no signing required  [default]
  --release          Release build, requires keystore options

  --keystore <path>  Path to .jks keystore file
  --ks-pass  <pass>  Keystore password
  --key-pass <pass>  Key password
  --alias    <name>  Key alias  (default: uploadkey)

  -h, --help         Show this help

Examples:
  ./build.sh                                         # interactive
  ./build.sh --capacitor --apk --debug
  ./build.sh --capacitor --apk --release --keystore ~/my.jks --ks-pass secret --key-pass secret
  ./build.sh --cordova --apk --debug
EOF
}

# ── Defaults ─────────────────────────────────────────────────────────────────
FRAMEWORK=""
OUTPUT="apk"
VARIANT="debug"
KEYSTORE=""
KS_PASS=""
KEY_PASS=""
ALIAS="uploadkey"

# ── Argument parsing ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --capacitor) FRAMEWORK="capacitor"; shift ;;
        --cordova)   FRAMEWORK="cordova";   shift ;;
        --apk)       OUTPUT="apk";          shift ;;
        --aab)       OUTPUT="aab";          shift ;;
        --debug)     VARIANT="debug";       shift ;;
        --release)   VARIANT="release";     shift ;;
        --keystore)  KEYSTORE="$2";         shift 2 ;;
        --ks-pass)   KS_PASS="$2";          shift 2 ;;
        --key-pass)  KEY_PASS="$2";         shift 2 ;;
        --alias)     ALIAS="$2";            shift 2 ;;
        -h|--help)   usage; exit 0 ;;
        *) die "Unknown option: $1\nRun $(basename "$0") --help for usage." ;;
    esac
done

# ── Interactive prompts if needed ─────────────────────────────────────────────
if [[ -z "$FRAMEWORK" ]]; then
    echo ""
    echo "Select framework:"
    echo "  1) Capacitor  (app/)        - uses local Android SDK"
    echo "  2) Cordova    (src/)        - uses Docker"
    read -rp "Choice [1]: " _fw
    case "${_fw:-1}" in
        2) FRAMEWORK="cordova" ;;
        *) FRAMEWORK="capacitor" ;;
    esac
fi

# ── Validation ────────────────────────────────────────────────────────────────
if [[ "$VARIANT" == "release" ]]; then
    [[ -z "$KEYSTORE" ]] && die "--release requires --keystore <path>"
    [[ -z "$KS_PASS"  ]] && die "--release requires --ks-pass <pass>"
    [[ -z "$KEY_PASS" ]] && die "--release requires --key-pass <pass>"
    [[ -f "$KEYSTORE" ]] || die "Keystore not found: $KEYSTORE"
fi

echo ""
info "Framework : $FRAMEWORK"
info "Output    : $OUTPUT"
info "Variant   : $VARIANT"
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# CAPACITOR BUILD
# ══════════════════════════════════════════════════════════════════════════════
build_capacitor() {
    APP_DIR="$SCRIPT_DIR/app"

    [[ -d "$APP_DIR" ]] || die "app/ directory not found. Is the Capacitor project initialised?"
    command -v node >/dev/null 2>&1 || die "node not found. Install Node.js or open the devcontainer."

    if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
        die "ANDROID_HOME / ANDROID_SDK_ROOT not set. Run inside the devcontainer or set the variable."
    fi

    # Ensure apksigner is on PATH (lives in build-tools, not platform-tools)
    SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
    APKSIGNER_BIN="$(find "$SDK_ROOT/build-tools" -name "apksigner" 2>/dev/null | sort -rV | head -1)"
    if [[ -z "$APKSIGNER_BIN" ]]; then
        die "apksigner not found under $SDK_ROOT/build-tools. Install Android build-tools."
    fi
    export PATH="$(dirname "$APKSIGNER_BIN"):$PATH"

    info "Syncing web assets..."
    (cd "$APP_DIR" && npm install --silent && npx cap sync android 2>&1 | grep -v "^$")

    GRADLEW="$APP_DIR/android/gradlew"
    chmod +x "$GRADLEW"

    if [[ "$OUTPUT" == "apk" ]]; then
        GRADLE_TASK="assemble$(tr '[:lower:]' '[:upper:]' <<< "${VARIANT:0:1}")${VARIANT:1}"
    else
        if [[ "$VARIANT" == "debug" ]]; then
            die "AAB output is only available for --release builds."
        fi
        GRADLE_TASK="bundle$(tr '[:lower:]' '[:upper:]' <<< "${VARIANT:0:1}")${VARIANT:1}"
    fi

    info "Running Gradle task: $GRADLE_TASK"
    (cd "$APP_DIR/android" && ./gradlew "$GRADLE_TASK" --quiet)

    if [[ "$OUTPUT" == "apk" ]]; then
        if [[ "$VARIANT" == "release" ]]; then
            UNSIGNED="$APP_DIR/android/app/build/outputs/apk/release/app-release-unsigned.apk"
            SIGNED="$APP_DIR/android/app/build/outputs/apk/release/babbypaint-release.apk"
            info "Signing APK..."
            apksigner sign \
                --ks "$KEYSTORE" \
                --ks-key-alias "$ALIAS" \
                --ks-pass "pass:$KS_PASS" \
                --key-pass "pass:$KEY_PASS" \
                --out "$SIGNED" \
                "$UNSIGNED"
            apksigner verify --verbose "$SIGNED"
            success "APK ready: $SIGNED"
        else
            SRC="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
            DEST="$APP_DIR/android/app/build/outputs/apk/debug/babbypaint-debug.apk"
            mv "$SRC" "$DEST"
            success "APK ready: $DEST"
        fi
    else
        AAB_SRC="$APP_DIR/android/app/build/outputs/bundle/release/app-release.aab"
        AAB="$APP_DIR/android/app/build/outputs/bundle/release/babbypaint-release.aab"
        info "Signing AAB..."
        jarsigner \
            -verbose \
            -keystore "$KEYSTORE" \
            -storepass "$KS_PASS" \
            -keypass "$KEY_PASS" \
            "$AAB_SRC" "$ALIAS"
        mv "$AAB_SRC" "$AAB"
        success "AAB ready: $AAB"
    fi
}

# ══════════════════════════════════════════════════════════════════════════════
# CORDOVA BUILD  (Docker)
# ══════════════════════════════════════════════════════════════════════════════
build_cordova() {
    command -v docker >/dev/null 2>&1 || die "Docker not found. Install Docker to build the Cordova app."

    DOCKER_IMAGE="ghcr.io/alexjyong/babbypaint:main"
    info "Pulling Docker image: $DOCKER_IMAGE"
    docker pull "$DOCKER_IMAGE"

    if [[ "$VARIANT" == "release" ]]; then
        KS_ABS="$(cd "$(dirname "$KEYSTORE")" && pwd)/$(basename "$KEYSTORE")"

        if [[ "$OUTPUT" == "apk" ]]; then
            info "Building signed release APK..."
            docker run --rm -i \
                -v "$SCRIPT_DIR:/workspace" \
                -v "$KS_ABS:/keystore.jks:ro" \
                -w /workspace \
                --privileged \
                "$DOCKER_IMAGE" sh -c "
                    cd src &&
                    rm -rf platforms/android plugins &&
                    cordova platform add android --verbose &&
                    cordova plugin add cordova-custom-config &&
                    cordova plugin add cordova-plugin-screen-pinning --verbose &&
                    cordova build android --release -- \
                        --keystore=/keystore.jks \
                        --storePassword='$KS_PASS' \
                        --alias='$ALIAS' \
                        --password='$KEY_PASS' \
                        --packageType=apk &&
                    apksigner sign \
                        --ks /keystore.jks \
                        --ks-key-alias '$ALIAS' \
                        --ks-pass 'pass:$KS_PASS' \
                        --key-pass 'pass:$KEY_PASS' \
                        /workspace/src/platforms/android/app/build/outputs/apk/release/app-release.apk &&
                    apksigner verify --verbose \
                        /workspace/src/platforms/android/app/build/outputs/apk/release/app-release.apk
                "
            success "APK ready: src/platforms/android/app/build/outputs/apk/release/app-release.apk"
        else
            info "Building signed release AAB..."
            docker run --rm -i \
                -v "$SCRIPT_DIR:/workspace" \
                -v "$KS_ABS:/keystore.jks:ro" \
                -w /workspace \
                --privileged \
                "$DOCKER_IMAGE" sh -c "
                    cd src &&
                    rm -rf platforms/android plugins &&
                    cordova platform add android --verbose &&
                    cordova plugin add cordova-custom-config &&
                    cordova plugin add cordova-plugin-screen-pinning --verbose &&
                    cordova build android --release -- \
                        --keystore=/keystore.jks \
                        --storePassword='$KS_PASS' \
                        --alias='$ALIAS' \
                        --password='$KEY_PASS' \
                        --packageType=bundle &&
                    jarsigner -verbose \
                        -keystore /keystore.jks \
                        -storepass '$KS_PASS' \
                        -keypass '$KEY_PASS' \
                        /workspace/src/platforms/android/app/build/outputs/bundle/release/app-release.aab '$ALIAS'
                "
            success "AAB ready: src/platforms/android/app/build/outputs/bundle/release/app-release.aab"
        fi
    else
        # Debug build
        if [[ "$OUTPUT" == "aab" ]]; then
            warn "AAB output is uncommon for debug builds; proceeding anyway."
        fi
        info "Building debug $OUTPUT..."
        docker run --rm -i \
            -v "$SCRIPT_DIR:/workspace" \
            -w /workspace \
            --privileged \
            "$DOCKER_IMAGE" sh -c "
                cd src &&
                rm -rf platforms/android plugins &&
                cordova platform add android --verbose &&
                cordova plugin add cordova-custom-config &&
                cordova plugin add cordova-plugin-screen-pinning --verbose &&
                cordova build android --verbose
            "
        success "APK ready: src/platforms/android/app/build/outputs/apk/debug/app-debug.apk"
    fi
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
case "$FRAMEWORK" in
    capacitor) build_capacitor ;;
    cordova)   build_cordova ;;
esac
