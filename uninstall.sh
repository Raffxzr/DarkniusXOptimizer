#!/system/bin/sh
/system/bin/darknius-thermal disable >/dev/null 2>&1 || true
pkill -f "httpd -p 127.0.0.1:8899" 2>/dev/null || true
pkill -f "crond -c /data/adb/darkniusx" 2>/dev/null || true
pkill -f "crond -c /data/adb/raffoptimizer" 2>/dev/null || true
pkill -f "darknius-doze" 2>/dev/null || true
pkill -f "darknius-thermal" 2>/dev/null || true
pkill -f "cleaner.inotify" 2>/dev/null || true
rm -rf /data/adb/darkniusx /data/adb/raffoptimizer 2>/dev/null

setprop debug.angle.feature_overrides_enabled "" 2>/dev/null || true
cmd settings delete global angle_gl_driver_all_angle 2>/dev/null || true
cmd settings delete global angle_gl_driver_selection_pkgs 2>/dev/null || true
cmd settings delete global angle_gl_driver_selection_values 2>/dev/null || true
