#!/system/bin/sh
MODDIR="/data/adb/modules/DarkniusXOptimizer"
[ ! -d "$MODDIR" ] && MODDIR="/data/adb/modules/RaffOptimizer"
VERSION=$(sed -n 's/^version=//p' "$MODDIR/module.prop" 2>/dev/null | tr -d '\r')
[ -z "$VERSION" ] && VERSION="v1.6"

echo "=========================================================="
echo "          DarkniusX Optimizer $VERSION by Raffxzr         "
echo "=========================================================="

echo "[1/4] Running Cache Cleaner..."
/system/bin/cleaner 2>/dev/null || true

echo ""
echo "[2/4] Running RAM Flush (Safe Mode)..."
/system/bin/raff-flush safe 2>/dev/null || true

echo ""
echo "[3/4] Running Fstrim Storage..."
/system/bin/darknius-fstrim 2>/dev/null || true

echo ""
echo "[4/4] Ensuring WebUI Server is active..."
/system/bin/raff-webui open 2>/dev/null || true

echo "=========================================================="
echo "Done! WebUI is also available at http://127.0.0.1:8899"
sleep 2
