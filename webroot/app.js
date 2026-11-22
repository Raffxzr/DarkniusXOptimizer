(() => {
  const M3_ACCENTS = ['#e53935', '#ff3344', '#d32f2f', '#c62828', '#ff5252', '#b71c1c'];
  const STORAGE_KEY = 'darknius_accent';
  const DEFAULT_ACCENT = '#e53935';

  function getStoredAccent() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_ACCENT;
    } catch (_) {
      return DEFAULT_ACCENT;
    }
  }

  function setStoredAccent(hex) {
    try {
      localStorage.setItem(STORAGE_KEY, hex);
    } catch (_) {}
  }

  function applyAccentColor(hexOrColor) {
    if (!hexOrColor || hexOrColor === 'AccentColor') {
      hexOrColor = DEFAULT_ACCENT;
    }
    const formatted = /^[0-9a-fA-F]{6}$/.test(hexOrColor) ? `#${hexOrColor}` : hexOrColor;
    document.documentElement.style.setProperty('--active-accent', formatted);
  }

  let currentAccent = getStoredAccent();
  let accentIndex = M3_ACCENTS.indexOf(currentAccent);
  if (accentIndex === -1) accentIndex = 0;
  applyAccentColor(currentAccent);

  let pkgState = {
    system: [],
    user: [],
    frozen: new Set(),
    removed: new Set()
  };

  function hasKsuBridge() {
    return typeof window.ksu !== 'undefined' && typeof window.ksu.exec === 'function';
  }

  function stripAnsi(str) {
    return (str || '').replace(/\x1b\[[0-9;]*m/g, '');
  }

  function nowTime() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
  }

  function wrapSpanWithMarquee(spanEl) {
    if (!spanEl || spanEl.classList.contains('marquee-clip') || spanEl.querySelector('.marquee-track')) return;
    const text = spanEl.textContent;
    spanEl.classList.add('marquee-clip');
    spanEl.textContent = '';
    const track = document.createElement('span');
    track.className = 'marquee-track';
    track.textContent = text;
    spanEl.appendChild(track);
  }

  function setupMarqueeElements() {
    document.querySelectorAll('.m3-btn > span, .nav-item > span, .terminal-title > span:last-child').forEach(wrapSpanWithMarquee);

    document.querySelectorAll('select.m3-select').forEach((sel) => {
      if (sel.parentElement && sel.parentElement.classList.contains('select-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'm3-field-wrap select-wrap';
      sel.parentNode.insertBefore(wrap, sel);
      wrap.appendChild(sel);

      const overlay = document.createElement('div');
      overlay.className = 'select-marquee-overlay';
      overlay.innerHTML = `<span class="marquee-clip"><span class="marquee-track"></span></span>`;
      wrap.appendChild(overlay);

      sel.addEventListener('change', () => syncSelectOverlay(sel));
      syncSelectOverlay(sel);
    });

    document.querySelectorAll('input.m3-input[placeholder]').forEach((inp) => {
      if (inp.parentElement && inp.parentElement.classList.contains('input-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'm3-field-wrap input-wrap';
      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(inp);

      const overlay = document.createElement('div');
      overlay.className = 'input-placeholder-overlay';
      const placeholderText = inp.getAttribute('placeholder') || '';
      overlay.innerHTML = `<span class="marquee-clip"><span class="marquee-track"></span></span>`;
      overlay.querySelector('.marquee-track').textContent = placeholderText;
      wrap.appendChild(overlay);

      const updateInputState = () => {
        wrap.classList.toggle('has-value', inp.value.length > 0);
      };
      inp.addEventListener('input', updateInputState);
      inp.addEventListener('focus', () => wrap.classList.add('is-focused'));
      inp.addEventListener('blur', () => {
        wrap.classList.remove('is-focused');
        updateInputState();
      });
      updateInputState();
    });

    refreshAllMarquees();
  }

  function syncSelectOverlay(sel) {
    if (!sel || !sel.parentElement) return;
    const track = sel.parentElement.querySelector('.select-marquee-overlay .marquee-track');
    if (!track) return;
    const opt = sel.options[sel.selectedIndex] || sel.options[0];
    track.textContent = opt ? opt.textContent : '';
    requestAnimationFrame(refreshAllMarquees);
  }

  function refreshAllMarquees() {
    document.querySelectorAll('.marquee-clip').forEach((clip) => {
      const track = clip.querySelector('.marquee-track');
      if (!track) return;
      clip.classList.remove('is-overflowing');
      clip.style.removeProperty('--scroll-dist');
      clip.style.removeProperty('--marquee-duration');

      const clipWidth = clip.clientWidth;
      const trackWidth = track.scrollWidth;
      if (clipWidth > 0 && trackWidth > clipWidth + 2) {
        const dist = -(trackWidth - clipWidth + 6);
        const duration = Math.max(4.5, Math.min(12, Math.abs(dist) / 22 + 3.5));
        clip.style.setProperty('--scroll-dist', `${dist}px`);
        clip.style.setProperty('--marquee-duration', `${duration.toFixed(1)}s`);
        clip.classList.add('is-overflowing');
      }
    });
  }

  window.addEventListener('resize', () => {
    requestAnimationFrame(refreshAllMarquees);
  });

  function writeTerm(termId, dotId, message, isBusy = false) {
    const term = document.getElementById(termId);
    const dot = document.getElementById(dotId);
    if (dot) dot.classList.toggle('busy', isBusy);
    if (!term) return;
    const cleanMsg = stripAnsi(message).trim();
    if (cleanMsg) {
      term.textContent += `\n[${nowTime()}] ${cleanMsg}`;
      term.scrollTop = term.scrollHeight;
    }
  }

  function runShell(cmd) {
    return new Promise((resolve) => {
      if (hasKsuBridge()) {
        const cbName = 'ksu_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        window[cbName] = (errno, stdout, stderr) => {
          delete window[cbName];
          resolve((stdout || '') + (stderr ? '\n' + stderr : ''));
        };
        try {
          window.ksu.exec(cmd, '{}', cbName);
        } catch (e) {
          resolve('Error: ' + e.message);
        }
      } else {
        resolve(null);
      }
    });
  }

  async function apiCall(action, params = {}) {
    if (hasKsuBridge()) {
      if (action === 'stats') {
        const mem = await runShell("awk '/MemTotal/ {t=$2} /MemAvailable/ {a=$2} END {if(t>0) printf \"%d / %d MB (%d%%)\", (t-a)/1024, t/1024, ((t-a)*100)/t}' /proc/meminfo");
        const zram = await runShell("awk '/SwapTotal/ {st=$2} /SwapFree/ {sf=$2} END {if(st>0) printf \"%d / %d MB (%d%%)\", (st-sf)/1024, st/1024, ((st-sf)*100)/st; else print \"Off\"}' /proc/meminfo");
        const temp = await runShell("awk '{printf \"%.1f°C\", $1/1000}' /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo '38.0°C'");
        const users = await runShell("pm list users 2>/dev/null | grep 'UserInfo{' | sed -E 's/.*UserInfo\\{([0-9]+):([^:]+):.*/\\1:\\2/' | tr '\\n' ',' | sed 's/,$//'");
        const service = await runShell("ps -ef 2>/dev/null | grep -E 'crond -c /data/adb/darkniusx/run|cleaner' | grep -v grep | awk '{print $2}' | head -n 1");
        const lodProp = await runShell("getprop debug.angle.feature_overrides_enabled 2>/dev/null");
        const lod = lodProp.includes('ForceTextureLodOffset4') ? 'Active (LOD +4)' : 'Inactive';
        const thermPid = await runShell("pidof mi_thermald thermal-engine thermald 2>/dev/null");
        const thermal = thermPid.trim() ? 'Stock Active' : 'Killed (Disabled)';
        const swappiness = await runShell("cat /proc/sys/vm/swappiness 2>/dev/null");
        const sVal = parseInt(swappiness.trim(), 10) || 60;
        const vm = sVal >= 150 ? 'Gaming' : sVal >= 100 ? 'Multitask' : 'Balance';
        const dozePid = await runShell("ps -ef 2>/dev/null | grep 'darknius-doze' | grep -v grep | awk '{print $2}' | head -n 1");
        const doze = dozePid.trim() ? `Active (PID: ${dozePid.trim()})` : 'Inactive';

        return {
          status: 'ok',
          mem: mem.trim() || 'N/A',
          zram: zram.trim() || 'Off',
          temp: temp.trim() || '38.0°C',
          service: service.trim() ? 'Running (PID: ' + service.trim() + ')' : 'Stopped',
          users: users.trim() || '0:Owner',
          lod,
          thermal,
          vm,
          doze
        };
      }
      if (action === 'lod_toggle') {
        const cmd = params.mode === 'enable'
          ? `/system/bin/darknius-lod enable "${params.target || 'global'}"`
          : `/system/bin/darknius-lod disable`;
        const out = await runShell(cmd);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'thermal_toggle') {
        const cmd = params.mode === 'enable'
          ? `/system/bin/darknius-thermal enable`
          : `/system/bin/darknius-thermal disable`;
        const out = await runShell(cmd);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'fstrim') {
        const out = await runShell(`/system/bin/darknius-fstrim`);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'vm_set') {
        const out = await runShell(`/system/bin/darknius-vm set "${params.profile || 'balance'}"`);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'doze_toggle') {
        const cmd = params.mode === 'start'
          ? `/system/bin/darknius-doze start`
          : `/system/bin/darknius-doze stop`;
        const out = await runShell(cmd);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'whitelist_get') {
        const out = await runShell("cat /data/adb/darkniusx/config/whitelist.list 2>/dev/null | grep -v '^[[:space:]]*#' | grep -v '^[[:space:]]*$' | tr '\\n' ','");
        return { status: 'ok', whitelist: out.trim() };
      }
      if (action === 'whitelist_add') {
        const pkg = (params.pkg || '').trim();
        await runShell(`mkdir -p /data/adb/darkniusx/config; if ! grep -q "^${pkg}$" /data/adb/darkniusx/config/whitelist.list 2>/dev/null; then echo "${pkg}" >> /data/adb/darkniusx/config/whitelist.list; fi`);
        return { status: 'ok', output: `Whitelisted ${pkg}` };
      }
      if (action === 'whitelist_remove') {
        const pkg = (params.pkg || '').trim();
        await runShell(`sed -i "/^${pkg}$/d" /data/adb/darkniusx/config/whitelist.list 2>/dev/null`);
        return { status: 'ok', output: `Removed ${pkg} from whitelist` };
      }
      if (action === 'cleaner_config_get') {
        const limit = await runShell("cat /data/adb/darkniusx/config/cleaner_limit.conf 2>/dev/null || echo 1024000");
        const cron = await runShell("crontab -l 2>/dev/null | grep 'cleaner' | awk '{print $1,$2,$3,$4,$5}' || echo '0 */6 * * *'");
        return { status: 'ok', limit: limit.trim() || '1024000', cron: cron.trim() || '0 */6 * * *' };
      }
      if (action === 'cleaner_config_set') {
        const limit = params.limit || '1024000';
        const interval = params.interval || '0 */6 * * *';
        await runShell(`mkdir -p /data/adb/darkniusx/config; echo "${limit}" > /data/adb/darkniusx/config/cleaner_limit.conf; (crontab -l 2>/dev/null | grep -v 'cleaner'; echo "${interval} /system/bin/cleaner >/dev/null 2>&1") | crontab -`);
        return { status: 'ok', output: `Scheduler updated (Threshold: ${limit}KB, Cron: ${interval})` };
      }
      if (action === 'flush') {
        const out = await runShell(`/system/bin/darknius-flush ${params.mode || 'safe'}`);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'clean') {
        const out = await runShell(`/system/bin/cleaner`);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'service_toggle') {
        const out = await runShell(`/data/adb/darkniusx/cleaner/cleaner.service ${params.mode || 'start'}`);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'packages') {
        const u = (!params.user || params.user === 'all') ? '0' : params.user;
        const sys = await runShell(`pm list packages -s --user ${u} 2>/dev/null | cut -d: -f2 | sort | tr '\n' ','`);
        const usr = await runShell(`pm list packages -3 --user ${u} 2>/dev/null | cut -d: -f2 | sort | tr '\n' ','`);
        const frz = await runShell(`pm list packages -d --user ${u} 2>/dev/null | cut -d: -f2 | sort | tr '\n' ','`);
        const rem = await runShell(`cat /data/adb/darkniusx/config/debloated_apps.list 2>/dev/null | cut -d'|' -f1 | tr '\n' ','`);
        return {
          status: 'ok',
          system: sys.trim(),
          user: usr.trim(),
          frozen: frz.trim(),
          removed: rem.trim()
        };
      }
      if (action === 'freeze' || action === 'unfreeze') {
        const out = await runShell(`/system/bin/darknius-freeze ${action} "${params.pkg}" --user "${params.user || 'all'}"`);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'remove') {
        const flag = params.mode === 'systemless' ? '--systemless' : '';
        const out = await runShell(`/system/bin/darknius-debloat remove "${params.pkg}" --user "${params.user || 'all'}" ${flag}`);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'restore') {
        const out = await runShell(`/system/bin/darknius-debloat restore "${params.pkg}" --user "${params.user || 'all'}"`);
        return { status: 'ok', output: stripAnsi(out).trim() };
      }
      if (action === 'logs') {
        const c = await runShell(`cat /data/adb/darkniusx/run/cleaner.log 2>/dev/null | tail -n 30`);
        const f = await runShell(`cat /data/adb/darkniusx/run/flush.log 2>/dev/null | tail -n 20`);
        const d = await runShell(`cat /data/adb/darkniusx/run/debloat.log /data/adb/darkniusx/run/freeze.log 2>/dev/null | tail -n 30`);
        return { status: 'ok', cleaner_log: stripAnsi(c), flush_log: stripAnsi(f), apk_log: stripAnsi(d) };
      }
      if (action === 'clear_logs') {
        await runShell(`> /data/adb/darkniusx/run/cleaner.log; > /data/adb/darkniusx/run/flush.log; > /data/adb/darkniusx/run/debloat.log; > /data/adb/darkniusx/run/freeze.log; > /data/adb/darkniusx/run/doze.log 2>/dev/null`);
        return { status: 'ok', output: 'All module logs cleared.' };
      }
    } else {
      const qs = new URLSearchParams({ action, ...params }).toString();
      try {
        const res = await fetch(`/cgi-bin/api.sh?${qs}`);
        return await res.json();
      } catch (e) {
        return {
          status: 'error',
          output: 'Failed to reach CGI server. Run "su -c darknius-webui" or open via KernelSU/APatch/MMRL WebUI.'
        };
      }
    }
  }

  function getPackageSafety(pkg, isSystem) {
    if (!isSystem) return { level: 'safety-safe', label: '🟢 Safe' };

    const criticals = [
      'android',
      'com.android.systemui',
      'com.android.settings',
      'com.android.phone',
      'com.android.server.telecom',
      'com.google.android.packageinstaller',
      'com.android.packageinstaller',
      'com.android.permissioncontroller',
      'com.google.android.permissioncontroller',
      'com.android.keyguard',
      'com.android.providers.telephony',
      'com.android.providers.settings'
    ];
    if (criticals.includes(pkg)) {
      return { level: 'safety-critical', label: '🔴 Critical' };
    }

    const cautions = [
      'com.google.android.gms',
      'com.android.vending',
      'com.google.android.inputmethod.latin',
      'com.android.inputmethod.latin',
      'com.android.dialer',
      'com.google.android.dialer',
      'com.android.contacts',
      'com.google.android.contacts',
      'com.android.calculator',
      'com.android.providers.media',
      'com.android.providers.downloads',
      'com.google.android.webview'
    ];
    if (cautions.includes(pkg)) {
      return { level: 'safety-caution', label: '🟡 Caution' };
    }

    const bloatPatterns = /facebook|instagram|tiktok|netflix|spotify|amazon|analytics|telemetry|feedback|gamecenter|browser|weather|music|video|bloat|retail|lens|youtube|chrome|gmail|maps|docs|drive/i;
    if (bloatPatterns.test(pkg)) {
      return { level: 'safety-safe', label: '🟢 Safe' };
    }

    return { level: 'safety-caution', label: '🟡 Caution' };
  }

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById('tab-' + tabId).classList.add('active');

      requestAnimationFrame(refreshAllMarquees);

      if ((tabId === 'freeze' || tabId === 'debloat') && pkgState.system.length === 0 && pkgState.user.length === 0) {
        loadPackages();
      } else if (tabId === 'logs') {
        loadLogs();
      }
    });
  });

  document.getElementById('accent-cycle-btn').addEventListener('click', () => {
    accentIndex = (accentIndex + 1) % M3_ACCENTS.length;
    const chosen = M3_ACCENTS[accentIndex];
    applyAccentColor(chosen);
    setStoredAccent(chosen);
  });

  document.querySelectorAll('.term-clear-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) target.textContent = `[${nowTime()}] Console cleared.`;
    });
  });

  function populateUserDropdowns(usersStr) {
    const entries = usersStr.split(',').filter(Boolean);
    ['freeze-user-select', 'debloat-user-select'].forEach((selId) => {
      const sel = document.getElementById(selId);
      const current = sel.value || 'all';
      sel.innerHTML = `<option value="all">Target: All Users (${entries.map((e) => e.split(':')[0]).join(', ')})</option>`;
      entries.forEach((item) => {
        const [id, name] = item.split(':');
        if (id) {
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = `Target: User ${id} (${name || 'Profile'})`;
          sel.appendChild(opt);
        }
      });
      if (!entries.some((e) => e.startsWith('10:'))) {
        const opt10 = document.createElement('option');
        opt10.value = '10';
        opt10.textContent = 'Target: User 10 (Work / Clone)';
        sel.appendChild(opt10);
      }
      sel.value = current;
      syncSelectOverlay(sel);
    });
  }

  async function loadStats() {
    document.getElementById('bridge-mode').textContent = hasKsuBridge() ? 'Native Root Bridge' : 'HTTP CGI Bridge';
    const data = await apiCall('stats');
    if (data && data.status === 'ok') {
      document.getElementById('stat-ram').textContent = data.mem || 'N/A';
      document.getElementById('stat-zram').textContent = data.zram || 'Off';
      document.getElementById('stat-temp').textContent = data.temp || '38.0°C';
      document.getElementById('stat-service').textContent = data.service || 'Stopped';
      document.getElementById('stat-users').textContent = data.users ? data.users.replace(/,/g, ', ') : '0:Owner';

      const lodEl = document.getElementById('stat-lod');
      if (lodEl) lodEl.textContent = data.lod || 'Inactive';

      const thermEl = document.getElementById('stat-thermal');
      if (thermEl) thermEl.textContent = data.thermal || 'Stock Active';

      const vmEl = document.getElementById('stat-vm');
      if (vmEl) vmEl.textContent = data.vm || 'Balance';

      const dozeEl = document.getElementById('stat-doze');
      if (dozeEl) dozeEl.textContent = data.doze || 'Inactive';

      populateUserDropdowns(data.users || '0:Owner');
    }
  }

  async function loadWhitelist() {
    const res = await apiCall('whitelist_get');
    const container = document.getElementById('whitelist-chips');
    if (!container) return;

    if (res && res.status === 'ok') {
      const pkgs = (res.whitelist || '').split(',').map((p) => p.trim()).filter(Boolean);
      if (pkgs.length === 0) {
        container.innerHTML = `<span style="font-size:0.78rem; color:var(--md-text-muted);">No whitelisted packages.</span>`;
        return;
      }
      container.innerHTML = '';
      pkgs.forEach((pkg) => {
        const chip = document.createElement('span');
        chip.className = 'whitelist-chip';
        chip.innerHTML = `<span>${pkg}</span><button type="button" class="chip-remove-btn" title="Remove">&times;</button>`;
        chip.querySelector('.chip-remove-btn').addEventListener('click', async () => {
          await apiCall('whitelist_remove', { pkg });
          loadWhitelist();
        });
        container.appendChild(chip);
      });
    }
  }

  async function loadCleanerConfig() {
    const res = await apiCall('cleaner_config_get');
    if (res && res.status === 'ok') {
      const limitSel = document.getElementById('cleaner-limit-select');
      const cronSel = document.getElementById('cleaner-cron-select');
      if (limitSel && res.limit) {
        limitSel.value = res.limit;
        syncSelectOverlay(limitSel);
      }
      if (cronSel && res.cron) {
        cronSel.value = res.cron;
        syncSelectOverlay(cronSel);
      }
    }
  }

  document.getElementById('btn-refresh-status').addEventListener('click', () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', 'Refreshing system status...', false);
    loadStats();
  });

  const lodSelect = document.getElementById('lod-target-select');
  const lodCustomInput = document.getElementById('lod-custom-pkg');
  if (lodSelect && lodCustomInput) {
    lodSelect.addEventListener('change', () => {
      lodCustomInput.style.display = lodSelect.value === 'custom' ? 'block' : 'none';
      syncSelectOverlay(lodSelect);
    });
  }

  document.getElementById('btn-lod-enable').addEventListener('click', async () => {
    let target = lodSelect.value;
    if (target === 'custom') {
      target = (lodCustomInput.value || '').trim();
      if (!target) {
        writeTerm('opt-terminal-body', 'opt-term-dot', 'Error: Please specify target package for Pixel LOD.');
        return;
      }
    }
    writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-lod enable ${target}\nEnabling Pixel LOD Scaler (Grafik MC)...`, true);
    const res = await apiCall('lod_toggle', { mode: 'enable', target });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Pixel LOD enabled.', false);
    loadStats();
  });

  document.getElementById('btn-lod-disable').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-lod disable\nDisabling Pixel LOD Scaler...`, true);
    const res = await apiCall('lod_toggle', { mode: 'disable' });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Pixel LOD disabled.', false);
    loadStats();
  });

  document.getElementById('btn-thermal-enable').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-thermal enable\nActivating Darknius Thermal Killer...`, true);
    const res = await apiCall('thermal_toggle', { mode: 'enable' });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Thermal throttling killed.', false);
    loadStats();
  });

  document.getElementById('btn-thermal-disable').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-thermal disable\nRestoring stock thermal daemons...`, true);
    const res = await apiCall('thermal_toggle', { mode: 'disable' });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Thermal throttler restored.', false);
    loadStats();
  });

  document.querySelectorAll('.btn-vm-preset').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.mode;
      writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-vm set ${mode}\nApplying Kernel VM profile...`, true);
      const res = await apiCall('vm_set', { profile: mode });
      writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Kernel VM tuned.', false);
      loadStats();
    });
  });

  document.getElementById('btn-run-fstrim').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-fstrim\nTrimming filesystem blocks (/data, /cache, /system)...`, true);
    const res = await apiCall('fstrim');
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Storage Fstrim finished.', false);
  });

  document.getElementById('btn-doze-start').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-doze start\nStarting Smart GMS Doze & Deep Sleep daemon...`, true);
    const res = await apiCall('doze_toggle', { mode: 'start' });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Deep sleep daemon active.', false);
    loadStats();
  });

  document.getElementById('btn-doze-stop').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-doze stop\nStopping Deep Sleep daemon...`, true);
    const res = await apiCall('doze_toggle', { mode: 'stop' });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Deep sleep daemon stopped.', false);
    loadStats();
  });

  document.getElementById('btn-add-whitelist').addEventListener('click', async () => {
    const input = document.getElementById('whitelist-pkg-input');
    const pkg = (input.value || '').trim();
    if (!pkg) {
      writeTerm('opt-terminal-body', 'opt-term-dot', 'Error: Enter package name to whitelist.');
      return;
    }
    const res = await apiCall('whitelist_add', { pkg });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || `Whitelisted ${pkg}`, false);
    input.value = '';
    loadWhitelist();
  });

  document.getElementById('btn-save-cleaner-config').addEventListener('click', async () => {
    const limit = document.getElementById('cleaner-limit-select').value;
    const interval = document.getElementById('cleaner-cron-select').value;
    writeTerm('opt-terminal-body', 'opt-term-dot', `Saving Auto-Cleaner settings (Limit: ${limit}KB, Cron: ${interval})...`, true);
    const res = await apiCall('cleaner_config_set', { limit, interval });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Scheduler settings saved.', false);
  });

  document.querySelectorAll('.action-flush').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.mode;
      writeTerm('opt-terminal-body', 'opt-term-dot', `$ darknius-flush ${mode}\nRunning RAM Flush (${mode} profile)...`, true);
      const res = await apiCall('flush', { mode });
      writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'RAM Flush completed!', false);
      loadStats();
    });
  });

  document.getElementById('btn-clean-now').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', '$ /system/bin/cleaner\nCleaning application caches...', true);
    const res = await apiCall('clean');
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Caches cleaned successfully!', false);
    loadStats();
  });

  document.getElementById('btn-start-cleaner').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', '$ cleaner.service start\nStarting Auto Cache Cleaner service...', true);
    const res = await apiCall('service_toggle', { mode: 'start' });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Auto-Cleaner service started.', false);
    loadStats();
  });

  document.getElementById('btn-stop-cleaner').addEventListener('click', async () => {
    writeTerm('opt-terminal-body', 'opt-term-dot', '$ cleaner.service stop\nStopping Auto Cache Cleaner service...', true);
    const res = await apiCall('service_toggle', { mode: 'stop' });
    writeTerm('opt-terminal-body', 'opt-term-dot', res.output || 'Auto-Cleaner service stopped.', false);
    loadStats();
  });

  async function loadPackages(selectedUser) {
    const user = (typeof selectedUser === 'string' && selectedUser)
      ? selectedUser
      : (document.getElementById('freeze-user-select').value || '0');
    const res = await apiCall('packages', { user });
    if (res && res.status === 'ok') {
      pkgState.system = (res.system || '').split(',').filter(Boolean);
      pkgState.user = (res.user || '').split(',').filter(Boolean);
      pkgState.frozen = new Set((res.frozen || '').split(',').filter(Boolean));
      pkgState.removed = new Set((res.removed || '').split(',').filter(Boolean));
      renderFreezeList();
      renderDebloatList();
    }
  }

  function renderFreezeList() {
    const filter = document.getElementById('freeze-filter-select').value;
    const q = (document.getElementById('freeze-search').value || '').toLowerCase().trim();
    const container = document.getElementById('freeze-pkg-list');

    let items = [];
    if (filter === 'all' || filter === 'user' || filter === 'frozen') {
      pkgState.user.forEach((p) => items.push({ pkg: p, type: 'user', frozen: pkgState.frozen.has(p) }));
    }
    if (filter === 'all' || filter === 'system' || filter === 'frozen') {
      pkgState.system.forEach((p) => items.push({ pkg: p, type: 'system', frozen: pkgState.frozen.has(p) }));
    }
    if (filter === 'frozen') {
      items = items.filter((i) => i.frozen);
    }
    if (q) {
      items = items.filter((i) => i.pkg.toLowerCase().includes(q));
    }

    if (items.length === 0) {
      container.innerHTML = `<div class="pkg-item"><span class="pkg-name">No matching packages found.</span></div>`;
      return;
    }

    container.innerHTML = '';
    items.slice(0, 250).forEach((item) => {
      const row = document.createElement('div');
      row.className = 'pkg-item';
      const btnClass = item.frozen ? 'tonal' : 'tonal-primary';
      const btnText = item.frozen ? 'Unfreeze' : 'Freeze';
      const safety = getPackageSafety(item.pkg, item.type === 'system');

      row.innerHTML = `
        <div class="pkg-info">
          <span class="pkg-name">${item.pkg}</span>
          <div class="pkg-badges">
            <span class="pkg-tag">${item.type === 'system' ? 'System' : 'User'}</span>
            <span class="pkg-tag ${safety.level}">${safety.label}</span>
            ${item.frozen ? '<span class="pkg-tag frozen">Frozen</span>' : ''}
          </div>
        </div>
        <button type="button" class="m3-btn pkg-action-btn ${btnClass}">
          <span class="marquee-clip"><span class="marquee-track">${btnText}</span></span>
        </button>
      `;

      row.querySelector('button').addEventListener('click', () => {
        doFreezeAction(item.frozen ? 'unfreeze' : 'freeze', item.pkg);
      });
      container.appendChild(row);
    });
    requestAnimationFrame(refreshAllMarquees);
  }

  async function doFreezeAction(action, pkg) {
    const user = document.getElementById('freeze-user-select').value || 'all';
    writeTerm('freeze-terminal-body', 'freeze-term-dot', `$ darknius-freeze ${action} ${pkg} --user ${user}`, true);
    const res = await apiCall(action, { pkg, user });
    writeTerm('freeze-terminal-body', 'freeze-term-dot', res.output || 'Done!', false);
    if (action === 'freeze') pkgState.frozen.add(pkg);
    else pkgState.frozen.delete(pkg);
    renderFreezeList();
  }

  document.getElementById('btn-manual-freeze').addEventListener('click', () => {
    const pkg = (document.getElementById('freeze-manual-pkg').value || '').trim();
    if (!pkg) return writeTerm('freeze-terminal-body', 'freeze-term-dot', 'Error: Please enter a package name first!');
    doFreezeAction('freeze', pkg);
  });

  document.getElementById('btn-manual-unfreeze').addEventListener('click', () => {
    const pkg = (document.getElementById('freeze-manual-pkg').value || '').trim();
    if (!pkg) return writeTerm('freeze-terminal-body', 'freeze-term-dot', 'Error: Please enter a package name first!');
    doFreezeAction('unfreeze', pkg);
  });

  function renderDebloatList() {
    const filter = document.getElementById('debloat-filter-select').value;
    const q = (document.getElementById('debloat-search').value || '').toLowerCase().trim();
    const container = document.getElementById('debloat-pkg-list');

    let items = [];
    if (filter === 'removed') {
      pkgState.removed.forEach((p) => items.push({ pkg: p, type: 'removed' }));
    } else {
      if (filter === 'all' || filter === 'system') {
        pkgState.system.forEach((p) => items.push({ pkg: p, type: 'system' }));
      }
      if (filter === 'all' || filter === 'user') {
        pkgState.user.forEach((p) => items.push({ pkg: p, type: 'user' }));
      }
    }
    if (q) {
      items = items.filter((i) => i.pkg.toLowerCase().includes(q));
    }

    if (items.length === 0) {
      container.innerHTML = `<div class="pkg-item"><span class="pkg-name">No packages to display.</span></div>`;
      return;
    }

    container.innerHTML = '';
    items.slice(0, 250).forEach((item) => {
      const row = document.createElement('div');
      row.className = 'pkg-item';
      const isRemoved = item.type === 'removed';
      const btnClass = isRemoved ? 'tonal' : 'filled-danger';
      const btnText = isRemoved ? 'Restore' : 'Remove';
      const safety = getPackageSafety(item.pkg, item.type === 'system');

      row.innerHTML = `
        <div class="pkg-info">
          <span class="pkg-name">${item.pkg}</span>
          <div class="pkg-badges">
            <span class="pkg-tag ${isRemoved ? 'frozen' : ''}">${item.type === 'system' ? 'System' : isRemoved ? 'Removed' : 'User'}</span>
            <span class="pkg-tag ${safety.level}">${safety.label}</span>
          </div>
        </div>
        <button type="button" class="m3-btn pkg-action-btn ${btnClass}">
          <span class="marquee-clip"><span class="marquee-track">${btnText}</span></span>
        </button>
      `;

      row.querySelector('button').addEventListener('click', () => {
        doDebloatAction(isRemoved ? 'restore' : 'remove', item.pkg);
      });
      container.appendChild(row);
    });
    requestAnimationFrame(refreshAllMarquees);
  }

  async function doDebloatAction(action, pkg) {
    const user = document.getElementById('debloat-user-select').value || 'all';
    const mode = document.getElementById('debloat-mode-select').value || 'systemless';
    const flagStr = action === 'remove' && mode === 'systemless' ? ' --systemless' : '';
    writeTerm('debloat-terminal-body', 'debloat-term-dot', `$ darknius-debloat ${action} ${pkg} --user ${user}${flagStr}`, true);
    const res = await apiCall(action, { pkg, user, mode });
    writeTerm('debloat-terminal-body', 'debloat-term-dot', res.output || 'Done!', false);
    if (action === 'remove') pkgState.removed.add(pkg);
    else pkgState.removed.delete(pkg);
    loadPackages();
  }

  document.getElementById('btn-manual-remove').addEventListener('click', () => {
    const pkg = (document.getElementById('debloat-manual-pkg').value || '').trim();
    if (!pkg) return writeTerm('debloat-terminal-body', 'debloat-term-dot', 'Error: Please enter a package name first!');
    doDebloatAction('remove', pkg);
  });

  document.getElementById('btn-manual-restore').addEventListener('click', () => {
    const pkg = (document.getElementById('debloat-manual-pkg').value || '').trim();
    if (!pkg) return writeTerm('debloat-terminal-body', 'debloat-term-dot', 'Error: Please enter a package name first!');
    doDebloatAction('restore', pkg);
  });

  document.getElementById('freeze-user-select').addEventListener('change', (e) => loadPackages(e.target.value));
  document.getElementById('freeze-filter-select').addEventListener('change', renderFreezeList);
  document.getElementById('freeze-search').addEventListener('input', renderFreezeList);
  document.getElementById('btn-reload-freeze').addEventListener('click', () => {
    writeTerm('freeze-terminal-body', 'freeze-term-dot', 'Reloading package list...', false);
    loadPackages(document.getElementById('freeze-user-select').value);
  });

  document.getElementById('debloat-user-select').addEventListener('change', (e) => loadPackages(e.target.value));
  document.getElementById('debloat-filter-select').addEventListener('change', renderDebloatList);
  document.getElementById('debloat-search').addEventListener('input', renderDebloatList);
  document.getElementById('btn-reload-debloat').addEventListener('click', () => {
    writeTerm('debloat-terminal-body', 'debloat-term-dot', 'Reloading package list...', false);
    loadPackages(document.getElementById('debloat-user-select').value);
  });

  async function loadLogs() {
    const res = await apiCall('logs');
    if (res && res.status === 'ok') {
      document.getElementById('log-cleaner').textContent = res.cleaner_log || 'No logs yet.';
      document.getElementById('log-flush').textContent = res.flush_log || 'No logs yet.';
      document.getElementById('log-apk').textContent = res.apk_log || 'No logs yet.';
    }
  }

  document.getElementById('btn-refresh-logs').addEventListener('click', loadLogs);
  document.getElementById('btn-clear-logs').addEventListener('click', async () => {
    await apiCall('clear_logs');
    loadLogs();
  });

  window.addEventListener('DOMContentLoaded', () => {
    setupMarqueeElements();
    loadStats();
    loadWhitelist();
    loadCleanerConfig();
  });
})();
