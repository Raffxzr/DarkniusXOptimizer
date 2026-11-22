#!/system/bin/sh
MODDIR="/data/adb/modules/RaffOptimizer"
VERSION=$(sed -n 's/^version=//p' "$MODDIR/module.prop" 2>/dev/null | tr -d '\r')
[ -z "$VERSION" ] && VERSION="v1.4"

echo "=========================================="
echo "       RaffOptimizer $VERSION by Raffxzr      "
echo "=========================================="

echo "[1/3] Running Cache Cleaner..."
if [ -x "/system/bin/cleaner" ]; then
  /system/bin/cleaner
elif [ -f "/data/adb/modules/RaffOptimizer/system/bin/cleaner" ]; then
  sh /data/adb/modules/RaffOptimizer/system/bin/cleaner
fi

echo ""
echo "[2/3] Running RAM Flush (Safe Mode)..."
if [ -x "/system/bin/raff-flush" ]; then
  /system/bin/raff-flush safe
elif [ -f "/data/adb/modules/RaffOptimizer/system/bin/raff-flush" ]; then
  sh /data/adb/modules/RaffOptimizer/system/bin/raff-flush safe
fi

echo ""
echo "[3/3] Ensuring Local WebUI Server is active..."
if [ -x "/system/bin/raff-webui" ]; then
  /system/bin/raff-webui open
elif [ -f "/data/adb/modules/RaffOptimizer/system/bin/raff-webui" ]; then
  sh /data/adb/modules/RaffOptimizer/system/bin/raff-webui open
fi

echo "=========================================="
echo "Done! WebUI is also available at http://127.0.0.1:8899"
sleep 2
