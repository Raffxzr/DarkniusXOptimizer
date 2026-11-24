#!/sbin/sh
SKIPUNZIP=1
ASH_STANDALONE=1

VERSION=$(sed -n 's/^version=//p' "$MODPATH/module.prop" 2>/dev/null | tr -d '\r')
[ -z "$VERSION" ] && VERSION="v1.5"

print_banner() {
  ui_print "************************************************"
  ui_print "            DarkniusX Optimizer ${VERSION}      "
  ui_print "              Author : Raffxzr                  "
  ui_print "************************************************"
}

if [ "$BOOTMODE" != true ]; then
  ui_print "! Please install via Magisk / KernelSU / APatch app"
  abort "! Installation from Recovery is not supported."
fi

if [ "$API" -lt 21 ]; then
  abort "! Minimum Android SDK 21 (Android 5.0+) required"
fi

print_banner

ui_print "- Extracting DarkniusX Optimizer module files..."
unzip -o "$ZIPFILE" -x 'META-INF/*' '.git/*' -d "$MODPATH" >&2

# Seamless migration from old RaffOptimizer data
if [ -d "/data/adb/raffoptimizer" ] && [ ! -d "/data/adb/darkniusx" ]; then
  ui_print "- Migrating data from RaffOptimizer to DarkniusX..."
  mv /data/adb/raffoptimizer /data/adb/darkniusx 2>/dev/null || cp -af /data/adb/raffoptimizer/. /data/adb/darkniusx/ 2>/dev/null
fi
rm -rf /data/adb/modules/RaffOptimizer /data/adb/modules_update/RaffOptimizer 2>/dev/null

# Setup persistent directory in /data/adb/darkniusx
mkdir -p /data/adb/darkniusx/cleaner /data/adb/darkniusx/run /data/adb/darkniusx/config
cp -af "$MODPATH/cleaner/"* /data/adb/darkniusx/cleaner/

# Migrate legacy thermal flag into new thermal.conf
if [ ! -f "/data/adb/darkniusx/config/thermal.conf" ]; then
  LEGACY_EN=0
  [ -f "/data/adb/darkniusx/config/thermal_killer_active" ] && LEGACY_EN=1
  cat > /data/adb/darkniusx/config/thermal.conf <<EOF
ENABLED=${LEGACY_EN}
MODE=static
AGGRESSIVE=0
DISABLE_HAL=0
DISABLE_PANIC=0
ZONE_MODE=spoof
ZPOLICY=
FAST_CHARGE=0
EOF
  rm -f /data/adb/darkniusx/config/thermal_killer_active
fi

# Populate default thermal target games on fresh install
if [ ! -s "/data/adb/darkniusx/config/thermal_apps.list" ]; then
  GAME_REGEX="com\.dts\.freefireth|com\.dts\.freefiremax|com\.mobile\.legends|com\.tencent\.ig|com\.pubg\.imobile|com\.pubg\.krmobile|com\.vng\.pubgmobile|com\.activision\.callofduty\.shooter|com\.garena\.game\.codm|com\.miHoYo\.GenshinImpact|com\.HoYoverse\.Nap|com\.HoYoverse\.hkrpgoversea|com\.kurogame\.wutheringwaves\.global|com\.riotgames\.league\.wildrift|com\.roblox\.client|com\.axlebolt\.standoff2|com\.HoYoverse\.bh3oversea|com\.proxima\.game|com\.proximabeta\.mf\.uamo|com\.levelinfinite\.sgameGlobal"
  pm list packages --user 0 2>/dev/null | cut -d: -f2 | grep -E "^(${GAME_REGEX})$" > /data/adb/darkniusx/config/thermal_apps.list 2>/dev/null || true
fi

# Copy flush binaries to system/bin so both paths work
if [ -d "$MODPATH/system/xbin" ]; then
  cp -af "$MODPATH/system/xbin/"* "$MODPATH/system/bin/" 2>/dev/null
  [ ! -d /system/xbin ] && rm -rf "$MODPATH/system/xbin"
fi

# ---------------------------------------------------------------------------
# Universal GMS Doze XML Patcher (Android 10 - 17+)
# Removes hardcoded battery optimization exemptions for Google Play Services
# ---------------------------------------------------------------------------
ui_print "- Patching system XMLs for Universal GMS Doze..."
GMS_STR1="allow-in-power-save package=\"com.google.android.gms\""
GMS_STR2="allow-in-data-usage-save package=\"com.google.android.gms\""
GMS_STR3="allow-unthrottled-location package=\"com.google.android.gms\""

for p in /system /system_ext /product /vendor /odm; do
  [ -d "$p" ] || continue
  xmls=$(find "$p/etc/sysconfig" "$p/etc/permissions" -type f -name '*.xml' 2>/dev/null)
  for f in $xmls; do
    if grep -qE "$GMS_STR1|$GMS_STR2|$GMS_STR3" "$f" 2>/dev/null; then
      target="$MODPATH$f"
      # In Magisk, files under /product, /vendor, /system_ext map under $MODPATH/system/<part>
      case "$f" in
        /product/*|/vendor/*|/system_ext/*|/odm/*)
          target="$MODPATH/system$f"
          ;;
      esac
      mkdir -p "$(dirname "$target")"
      cp -af "$f" "$target"
      sed -i "/$GMS_STR1/d;/$GMS_STR2/d;/$GMS_STR3/d" "$target"
    fi
  done
done

ui_print "- Setting permissions..."
set_perm_recursive "$MODPATH" 0 0 0755 0644
set_perm_recursive "$MODPATH/system/bin" 0 0 0755 0755
[ -d "$MODPATH/system/xbin" ] && set_perm_recursive "$MODPATH/system/xbin" 0 0 0755 0755
set_perm_recursive "$MODPATH/cleaner" 0 0 0755 0755
set_perm_recursive "/data/adb/darkniusx" 0 0 0755 0755
set_perm "$MODPATH/service.sh" 0 0 0755
set_perm "$MODPATH/action.sh" 0 0 0755
set_perm "$MODPATH/uninstall.sh" 0 0 0755
set_perm "$MODPATH/webroot/cgi-bin/api.sh" 0 0 0755

ui_print "- DarkniusX Optimizer ${VERSION} installation complete! Please reboot your device."
