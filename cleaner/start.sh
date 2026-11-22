#!/system/bin/sh
moddir="/data/adb/modules/DarkniusXOptimizer"
[ ! -d "$moddir" ] && moddir="/data/adb/modules/RaffOptimizer"

scripts_dir="/data/adb/darkniusx/cleaner"
[ ! -d "$scripts_dir" ] && scripts_dir="/data/adb/raffoptimizer/cleaner"
log_file="/data/adb/darkniusx/run/cleaner.log"
service_log="/data/adb/darkniusx/run/service.log"

mkdir -p /data/adb/darkniusx/run

if [ ! -d "${moddir}" ] || [ ! -d "${scripts_dir}" ]; then
  echo "Error: RaffOptimizer directories not found" >&2
  exit 1
fi

start_cleaner() {
  "${scripts_dir}/cleaner.service" start > "${log_file}" 2> "${service_log}"
}

if [ ! -f "${scripts_dir}/manual" ]; then
  echo -n "" > "${log_file}"
  if [ ! -f "${moddir}/disable" ]; then
    start_cleaner
  fi
  if command -v inotifyd >/dev/null 2>&1; then
    inotifyd "${scripts_dir}/cleaner.inotify" "${moddir}" >/dev/null 2>&1 &
  fi
fi
