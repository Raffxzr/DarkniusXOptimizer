#!/sbin/sh
SKIPUNZIP=1
ASH_STANDALONE=1

VERSION=$(sed -n 's/^version=//p' "$MODPATH/module.prop" 2>/dev/null | tr -d '\r')
[ -z "$VERSION" ] && VERSION="v1.4"

print_banner() {
  ui_print "************************************************"
  ui_print "              RaffOptimizer ${VERSION}           "
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

ui_print "- Extracting RaffOptimizer module files..."
unzip -o "$ZIPFILE" -x 'META-INF/*' '.git/*' -d "$MODPATH" >&2

# Setup persistent directory in /data/adb/raffoptimizer
mkdir -p /data/adb/raffoptimizer/cleaner /data/adb/raffoptimizer/run /data/adb/raffoptimizer/config
cp -af "$MODPATH/cleaner/"* /data/adb/raffoptimizer/cleaner/

# Copy flush binaries to system/bin so both paths work
if [ -d "$MODPATH/system/xbin" ]; then
  cp -af "$MODPATH/system/xbin/"* "$MODPATH/system/bin/" 2>/dev/null
  [ ! -d /system/xbin ] && rm -rf "$MODPATH/system/xbin"
fi

ui_print "- Setting permissions..."
set_perm_recursive "$MODPATH" 0 0 0755 0644
set_perm_recursive "$MODPATH/system/bin" 0 0 0755 0755
[ -d "$MODPATH/system/xbin" ] && set_perm_recursive "$MODPATH/system/xbin" 0 0 0755 0755
set_perm_recursive "$MODPATH/cleaner" 0 0 0755 0755
set_perm_recursive "/data/adb/raffoptimizer" 0 0 0755 0755
set_perm "$MODPATH/service.sh" 0 0 0755
set_perm "$MODPATH/action.sh" 0 0 0755
set_perm "$MODPATH/uninstall.sh" 0 0 0755
set_perm "$MODPATH/webroot/cgi-bin/api.sh" 0 0 0755

ui_print "- RaffOptimizer ${VERSION} installation complete! Please reboot your device."
