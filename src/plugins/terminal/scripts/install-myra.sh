#!/bin/bash
# Install Myra Deep Research Assistant in the Acode terminal
# Run this script from within the terminal after initial setup

set -e

MYRA_INSTALL_DIR="/usr/local/lib/myra"
MYRA_BIN="/usr/local/bin/myra"

echo "📦 Installing Myra Deep Research Assistant..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    if [ -f /etc/alpine-release ]; then
        apk add --no-cache nodejs npm
    elif [ -f /etc/debian_version ]; then
        apt-get update && apt-get install -y nodejs npm
    fi
fi

# Verify Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Failed to install Node.js"
    exit 1
fi

echo "✅ Node.js installed: $(node --version)"

# Create installation directory
mkdir -p "$MYRA_INSTALL_DIR"

# Extract Myra bundle
if [ -f "$PREFIX/assets/myra-bundle.tar.gz" ]; then
    tar -xzf "$PREFIX/assets/myra-bundle.tar.gz" -C "$MYRA_INSTALL_DIR"
    echo "✅ Myra extracted to $MYRA_INSTALL_DIR"
elif [ -f "/tmp/myra-bundle.tar.gz" ]; then
    tar -xzf "/tmp/myra-bundle.tar.gz" -C "$MYRA_INSTALL_DIR"
    echo "✅ Myra extracted to $MYRA_INSTALL_DIR"
else
    echo "❌ Myra bundle not found"
    exit 1
fi

# Install dependencies (if needed)
cd "$MYRA_INSTALL_DIR"
if [ -f "package.json" ]; then
    npm install --production 2>/dev/null || true
fi

# Create wrapper script
cat > "$MYRA_BIN" << 'EOF'
#!/bin/bash
node /usr/local/lib/myra/cli/index.js "$@"
EOF
chmod +x "$MYRA_BIN"

echo "✅ Myra installed successfully!"
echo "🚀 Run 'myra --help' to get started"