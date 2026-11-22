#!/system/bin/sh
echo "Content-Type: application/json"
echo "Access-Control-Allow-Origin: *"
echo ""

urldecode() {
  echo -e "$(echo "$1" | sed 's/+/ /g;s/%/\\x/g')"
}

action=""
param1=""
param2=""
param3=""
val_limit=""
val_sched=""

IFS='&'
for pair in $QUERY_STRING; do
  key=$(echo "$pair" | cut -d= -f1)
  val=$(urldecode "$(echo "$pair" | cut -d= -f2-)")
  case "$key" in
    action) action="$val" ;;
    pkg) param1="$val" ;;
    user) param2="$val" ;;
    mode) param3="$val" ;;
    limit) val_limit="$val" ;;
    sched) val_sched="$val" ;;
  esac
done
unset IFS

DATA_DIR="/data/adb/darkniusx"
[ ! -d "$DATA_DIR" ] && DATA_DIR="/data/adb/raffoptimizer"
RUN_DIR="${DATA_DIR}/run"
CONFIG_DIR="${DATA_DIR}/config"
mkdir -p "${RUN_DIR}" "${CONFIG_DIR}"

json_escape() {
  sed -e 's/\x1b\[[0-9;]*m//g' \
      -e 's/\\/\\\\/g' \
      -e 's/"/\\"/g' \
      -e ':a;N;$!ba;s/\n/\\n/g' \
      -e 's/\r//g'
}

case "$action" in
  stats)
    mem=$(awk '/MemTotal/ {t=$2} /MemAvailable/ {a=$2} END {if(t>0) printf "%d / %d MB (%d%%)", (t-a)/1024, t/1024, ((t-a)*100)/t}' /proc/meminfo 2>/dev/null)
    zram=$(awk '/SwapTotal/ {st=$2} /SwapFree/ {sf=$2} END {if(st>0) printf "%d / %d MB (%d%%)", (st-sf)/1024, st/1024, ((st-sf)*100)/st; else print "Disabled"}' /proc/meminfo 2>/dev/null)
    
    # Battery & SoC Temperature
    temp_info="N/A"
    if [ -f /sys/class/power_supply/battery/temp ]; then
      btemp=$(cat /sys/class/power_supply/battery/temp 2>/dev/null)
      temp_info=$(awk -v t="$btemp" 'BEGIN {printf "%.1f°C", t/10}')
    elif [ -f /sys/class/thermal/thermal_zone0/temp ]; then
      ztemp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null)
      temp_info=$(awk -v t="$ztemp" 'BEGIN {printf "%.1f°C", t/1000}')
    fi

    users=$(pm list users 2>/dev/null | grep "UserInfo{" | sed -E 's/.*UserInfo\{([0-9]+):([^:]+):.*/\1:\2/' | tr '\n' ',' | sed 's/,$//')
    cleaner_pid=$(ps -ef 2>/dev/null | grep -E "crond -c /data/adb/(darkniusx|raffoptimizer)/run" | grep -v grep | awk '{print $2}' | head -n 1)
    svc_status="Stopped"
    [ -n "$cleaner_pid" ] && svc_status="Running (PID: $cleaner_pid)"
    
    lod_st=$(/system/bin/darknius-lod status 2>/dev/null | sed 's/Pixel LOD Scaler (Grafik MC): //' | tr -d '\r\n')
    thermal_st=$(/system/bin/darknius-thermal status 2>/dev/null | sed 's/Darknius Thermal Killer: //' | tr -d '\r\n')
    vm_st=$(/system/bin/darknius-vm status 2>/dev/null | tr -d '\r\n')
    doze_st=$(/system/bin/darknius-doze status 2>/dev/null | sed 's/Smart Deep Sleep & GMS Doze: //' | tr -d '\r\n')

    printf '{"status":"ok","mem":"%s","zram":"%s","temp":"%s","users":"%s","service":"%s","lod":"%s","thermal":"%s","vm":"%s","doze":"%s"}' \
      "$mem" "$zram" "$temp_info" "$users" "$svc_status" "$lod_st" "$thermal_st" "$vm_st" "$doze_st"
    ;;
  flush)
    out=$(/system/bin/raff-flush "${param3:-safe}" 2>&1 | json_escape)
    printf '{"status":"ok","output":"%s"}' "$out"
    ;;
  clean)
    out=$(/system/bin/cleaner 2>&1 | json_escape)
    printf '{"status":"ok","output":"%s"}' "$out"
    ;;
  service_toggle)
    svc_script="${DATA_DIR}/cleaner/cleaner.service"
    if [ "$param3" = "stop" ]; then
      out=$($svc_script stop 2>&1 | json_escape)
    else
      out=$($svc_script start 2>&1 | json_escape)
    fi
    printf '{"status":"ok","output":"%s"}' "$out"
    ;;
  lod_toggle)
    out=$(/system/bin/darknius-lod "${param3:-enable}" "$param1" 2>&1 | json_escape)
    st=$(/system/bin/darknius-lod status 2>/dev/null | sed 's/Pixel LOD Scaler (Grafik MC): //' | tr -d '\r\n')
    printf '{"status":"ok","output":"%s","lod_status":"%s"}' "$out" "$st"
    ;;
  thermal_toggle)
    out=$(/system/bin/darknius-thermal "${param3:-enable}" 2>&1 | json_escape)
    st=$(/system/bin/darknius-thermal status 2>/dev/null | sed 's/Darknius Thermal Killer: //' | tr -d '\r\n')
    printf '{"status":"ok","output":"%s","thermal_status":"%s"}' "$out" "$st"
    ;;
  fstrim)
    out=$(/system/bin/darknius-fstrim 2>&1 | json_escape)
    printf '{"status":"ok","output":"%s"}' "$out"
    ;;
  vm_set)
    out=$(/system/bin/darknius-vm "$param3" 2>&1 | json_escape)
    st=$(/system/bin/darknius-vm status 2>/dev/null | tr -d '\r\n')
    printf '{"status":"ok","output":"%s","vm_status":"%s"}' "$out" "$st"
    ;;
  doze_toggle)
    out=$(/system/bin/darknius-doze "$param3" 2>&1 | json_escape)
    st=$(/system/bin/darknius-doze status 2>/dev/null | sed 's/Smart Deep Sleep & GMS Doze: //' | tr -d '\r\n')
    printf '{"status":"ok","output":"%s","doze_status":"%s"}' "$out" "$st"
    ;;
  whitelist_get)
    wl_content=$(cat "${CONFIG_DIR}/whitelist.list" 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    printf '{"status":"ok","whitelist":"%s"}' "$wl_content"
    ;;
  whitelist_add)
    if [ -n "$param1" ]; then
      touch "${CONFIG_DIR}/whitelist.list"
      grep -qxF "$param1" "${CONFIG_DIR}/whitelist.list" 2>/dev/null || echo "$param1" >> "${CONFIG_DIR}/whitelist.list"
    fi
    wl_content=$(cat "${CONFIG_DIR}/whitelist.list" 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    printf '{"status":"ok","whitelist":"%s","output":"Added to whitelist: %s"}' "$wl_content" "$param1"
    ;;
  whitelist_remove)
    if [ -n "$param1" ] && [ -f "${CONFIG_DIR}/whitelist.list" ]; then
      sed -i "/^${param1}$/d" "${CONFIG_DIR}/whitelist.list" 2>/dev/null
    fi
    wl_content=$(cat "${CONFIG_DIR}/whitelist.list" 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    printf '{"status":"ok","whitelist":"%s","output":"Removed from whitelist: %s"}' "$wl_content" "$param1"
    ;;
  cleaner_config_get)
    lim=$(cat "${CONFIG_DIR}/cache_limit_kb" 2>/dev/null || echo "1024000")
    sch=$(cat "${CONFIG_DIR}/cron_schedule" 2>/dev/null || echo "0 */6 * * *")
    printf '{"status":"ok","limit_kb":"%s","cron":"%s"}' "$lim" "$sch"
    ;;
  cleaner_config_set)
    [ -n "$val_limit" ] && echo "$val_limit" > "${CONFIG_DIR}/cache_limit_kb"
    [ -n "$val_sched" ] && echo "$val_sched" > "${CONFIG_DIR}/cron_schedule"
    # Re-apply crond schedule
    "${DATA_DIR}/cleaner/cleaner.service" start >/dev/null 2>&1 &
    printf '{"status":"ok","output":"Auto-cleaner configuration updated."}'
    ;;
  packages)
    u="${param2:-0}"
    [ "$u" = "all" ] && u="0"
    sys_pkgs=$(pm list packages -s --user "$u" 2>/dev/null | cut -d: -f2 | sort | tr '\n' ',' | sed 's/,$//')
    usr_pkgs=$(pm list packages -3 --user "$u" 2>/dev/null | cut -d: -f2 | sort | tr '\n' ',' | sed 's/,$//')
    frz_pkgs=$(pm list packages -d --user "$u" 2>/dev/null | cut -d: -f2 | sort | tr '\n' ',' | sed 's/,$//')
    rem_pkgs=$(cat "${CONFIG_DIR}/debloated_apps.list" 2>/dev/null | cut -d'|' -f1 | tr '\n' ',' | sed 's/,$//')
    printf '{"status":"ok","system":"%s","user":"%s","frozen":"%s","removed":"%s"}' "$sys_pkgs" "$usr_pkgs" "$frz_pkgs" "$rem_pkgs"
    ;;
  freeze)
    out=$(/system/bin/raff-freeze freeze "$param1" --user "${param2:-all}" 2>&1 | json_escape)
    printf '{"status":"ok","output":"%s"}' "$out"
    ;;
  unfreeze)
    out=$(/system/bin/raff-freeze unfreeze "$param1" --user "${param2:-all}" 2>&1 | json_escape)
    printf '{"status":"ok","output":"%s"}' "$out"
    ;;
  remove)
    if [ "$param3" = "systemless" ]; then
      out=$(/system/bin/raff-debloat remove "$param1" --user "${param2:-all}" --systemless 2>&1 | json_escape)
    else
      out=$(/system/bin/raff-debloat remove "$param1" --user "${param2:-all}" 2>&1 | json_escape)
    fi
    printf '{"status":"ok","output":"%s"}' "$out"
    ;;
  restore)
    out=$(/system/bin/raff-debloat restore "$param1" --user "${param2:-all}" 2>&1 | json_escape)
    printf '{"status":"ok","output":"%s"}' "$out"
    ;;
  logs)
    c_log=$(cat "${RUN_DIR}/cleaner.log" 2>/dev/null | tail -n 30 | json_escape)
    f_log=$(cat "${RUN_DIR}/flush.log" "${RUN_DIR}/fstrim.log" 2>/dev/null | tail -n 30 | json_escape)
    d_log=$(cat "${RUN_DIR}/debloat.log" "${RUN_DIR}/freeze.log" 2>/dev/null | tail -n 30 | json_escape)
    printf '{"status":"ok","cleaner_log":"%s","flush_log":"%s","apk_log":"%s"}' "$c_log" "$f_log" "$d_log"
    ;;
  clear_logs)
    > "${RUN_DIR}/cleaner.log" 2>/dev/null
    > "${RUN_DIR}/flush.log" 2>/dev/null
    > "${RUN_DIR}/fstrim.log" 2>/dev/null
    > "${RUN_DIR}/debloat.log" 2>/dev/null
    > "${RUN_DIR}/freeze.log" 2>/dev/null
    printf '{"status":"ok","output":"All module logs cleared."}'
    ;;
  *)
    printf '{"status":"error","message":"Unknown action"}'
    ;;
esac
