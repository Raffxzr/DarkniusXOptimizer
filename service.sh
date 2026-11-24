#!/system/bin/sh
MODDIR=${0%/*}

(
  until [ "$(getprop sys.boot_completed)" = "1" ]; do
    sleep 5
  done

  mkdir -p /data/adb/darkniusx/run /data/adb/darkniusx/config

  # 1. Start Auto Cache Cleaner service & inotify watcher
  if [ -f "/data/adb/darkniusx/cleaner/start.sh" ]; then
    chmod 0755 /data/adb/darkniusx/cleaner/*
    /data/adb/darkniusx/cleaner/start.sh &
  fi

  # 2. Start Local HTTP/CGI WebUI Server (127.0.0.1:8899)
  if [ -x "/system/bin/raff-webui" ]; then
    /system/bin/raff-webui start >/dev/null 2>&1 &
  elif [ -f "${MODDIR}/system/bin/raff-webui" ]; then
    sh "${MODDIR}/system/bin/raff-webui" start >/dev/null 2>&1 &
  fi

  # 3. Apply saved Kernel VM Tuning profile
  if [ -x "/system/bin/darknius-vm" ]; then
    /system/bin/darknius-vm apply-saved >/dev/null 2>&1 &
  fi

  # 4. Start Smart GMS Doze & Screen-Off Deep Sleep
  if [ -x "/system/bin/darknius-doze" ]; then
    /system/bin/darknius-doze start >/dev/null 2>&1 &
  fi

  # 5. Restore Thermal Killer if previously active
  if [ -x "/system/bin/darknius-thermal" ]; then
    /system/bin/darknius-thermal boot >/dev/null 2>&1 &
  fi

  # 6. Restore Pixel LOD Scaler (Grafik MC) if previously active
  if [ -f "/data/adb/darkniusx/config/lod.conf" ] && [ -x "/system/bin/darknius-lod" ]; then
    target=$(cat /data/adb/darkniusx/config/lod.conf 2>/dev/null)
    /system/bin/darknius-lod enable "$target" >/dev/null 2>&1 &
  fi
)&
