# 📋 DarkniusX Optimizer Changelogs

All notable changes, improvements, and fixes to **DarkniusX Optimizer** (formerly RaffOptimizer) are documented in this file.

---

## [v1.5] - Rebranding to DarkniusX Optimizer & Advanced Performance Engine

### 🚀 Major Highlights & Rebranding
- **Rebranding to DarkniusX Optimizer**: Fully rebranded the module ID (`DarkniusXOptimizer`), module name (`DarkniusX Optimizer`), data paths (`/data/adb/darkniusx/`), and unified CLI entry points (`darknius`, `dx`, with backward-compatible `raff` alias).
- **Automated Data & State Migration**: Upgraded `customize.sh` with seamless auto-migration of debloat lists, whitelist configurations, and runtime state from `/data/adb/raffoptimizer/` to `/data/adb/darkniusx/`.

### ✨ New Performance Features
- **Pixel LOD Scaler (Grafik MC)**:
  - Added `darknius-lod` CLI and WebUI controls to toggle ANGLE driver texture LOD offset (+4) (`CompileJobIsThreadSafe:LinkJobIsThreadSafe:ForceTextureLodOffset4`).
  - Supports targeted per-package overrides (Free Fire, Free Fire MAX, Mobile Legends, PUBG / BGMI, custom package names) or system-wide global mode.
- **Darknius Thermal Killer**:
  - Added `darknius-thermal` CLI and WebUI switch to terminate vendor thermal throttling daemons (`mi_thermald`, `thermal-engine`, `thermald`) and unconstrain thermal zone governors for sustained peak CPU/GPU clock frequencies without fps drops.
- **Universal Storage Fstrim**:
  - Added `darknius-fstrim` multi-partition trimming tool to clean dirty storage blocks across `/data`, `/cache`, and `/system`, maintaining peak NAND flash read/write performance.
- **Smart GMS Doze & Screen-Off Deep Sleep**:
  - Implemented universal sysconfig XML patcher in `customize.sh` for Android 10 through Android 17+, allowing Google Play Services to natively sleep without aggressive `pm disable` CPU storms (resolving the 100% CPU lockup found in older GMS doze modules).
  - Event-driven screen-off deep sleep daemon (`darknius-doze`) that engages deep idle (`cmd deviceidle force-idle deep`) with zero disk I/O spam and an 8-second grace period.
- **Custom RAM Flush Whitelist**:
  - Added protected package whitelist (`/data/adb/darkniusx/config/whitelist.list`) integrated into `darknius-flush` to protect critical background apps (music players, messengers, active games) during aggressive or extreme RAM flushes.
  - Interactive chip-based whitelist manager in the WebUI with instant add and remove actions.
- **Kernel VM & ZRAM Tuning**:
  - Added `darknius-vm` with 3 dynamic tuning presets: `gaming` (ZRAM swappiness 160, VFS cache pressure 50), `balance` (swappiness 60, pressure 100), and `multitasking` (swappiness 120, pressure 80).

### 🎨 WebUI Enhancements
- **Extended System Status Grid**: Real-time monitoring of ZRAM / Swap usage, SoC temperatures, Pixel LOD status, Thermal Killer status, Kernel VM profile, and Deep Sleep daemon state.
- **Safety Indicators**: Added visual safety badges (🟢 Safe, 🟡 Caution, 🔴 Critical) for both Freeze and Debloat lists to prevent accidental disablement of critical Android framework components.
- **Auto-Cleaner Scheduler Settings**: User-configurable cleanup thresholds (500MB, 1GB, 2GB, 3GB) and cron intervals (3h, 6h, 12h, 24h) directly from the WebUI.
- **Aesthetic Refinements**: True AMOLED pitch-black background with dark red accents and uniform button grid alignments (`.button-grid-3`).

---

## [v1.4] - AMOLED Dark Red Theme & WebUI Bug Fix

### 🐛 Fixed
- **Instant WebUI Accent Loading**: Fixed an issue where entering the WebUI caused a brief dark/black flash before applying the accent. Removed the broken `AccentColor` keyword fallback that resolved to pitch black in Android WebView.
- **Accurate Accent Initialization**: Added synchronous early theme initialization from `localStorage` in `<head>` so the UI paints immediately in the selected palette on first frame.
- **Stats Refresh Speed**: Removed redundant `settings get secure theme_customization_overlay_packages` shell execution in `stats` calls, eliminating lag on WebUI status refresh.

### 🎨 UI & Aesthetic Polish
- **AMOLED Dark Red Theme**: Switched the default theme to true AMOLED pitch-black (`#000000`) paired with a vivid, high-contrast dark red accent (`#e53935`), tuned for OLED screens with AAA text readability.
- **Code & Comment Hygiene**: Cleaned up AI-slop comments, removed decorative separators, and streamlined script logic across the module.

---

## [v1.3] - Build System & Automated Releases

### ✨ Added
- **Single-source build pipeline**: New `build.sh` stages a clean module tree and produces `dist/RaffOptimizer-<version>.zip`. CLI scripts now live only in `scripts/` and are copied to `system/bin/` during the build.
- **Automated GitHub releases**: Added the `Release` workflow. Pushing a `v*` tag validates `module.prop`, builds the zip, creates or updates the GitHub release, and commits the new `update.json` so OTA clients pick the release up immediately.
- **CI build checks**: Added the `Build` workflow, which packages the module and validates shell syntax on every push and pull request.
- **Verified packaging**: The build normalises file permissions and fails if a required runtime file is missing from the final zip.

### 🔧 Changed
- **Repository restructure**: Consolidated `RaffOptimizer-v1.0`, `v1.1`, `v1.1-fixed`, and the standalone `v1.2.zip` into one `RaffOptimizer/` source tree.
- **Removed duplicated scripts**: Deleted the tracked `system/bin/` mirror and the unused `common/system.prop`; `system/bin/` is now generated from `scripts/` at build time.
- **Installer cleanup**: Dropped the stale `$MODPATH/scripts` permission pass from `customize.sh`, since `scripts/` is no longer shipped inside the module.
- **Documentation**: The README now documents the build, repository, and release workflow.

### 🐛 Fixed
- Removed the stale duplicate changelog that stopped at v1.1 and could make OTA users think v1.1 was the latest version.

---

## [v1.2] - WebUI Marquee & Layout Polish

### ✨ Added
- **Auto-Marquee for Overflowing Text**: Long labels now scroll automatically with a smooth ping-pong animation and edge fade instead of being clipped. Applied to action buttons, navigation items, terminal titles, dropdown values, and input placeholders, with animation speed adapting to text length. Marquees recalculate on tab switch, window resize, package list render, and dropdown change.
- **Select & Input Overlay Wrappers**: Added `.m3-field-wrap` wrappers with a custom SVG dropdown arrow, transparent native select text, and placeholder overlays that hide on focus or when the field has a value.

### 🎨 UI Fixes
- **Header & Layout Restructure**: Split the header into a top bar (eyebrow, bridge badge, accent button) and a title group; unified badge and icon-button sizing at 34px and tightened spacing.
- **Navigation Bar Alignment**: Four equal `minmax(0, 1fr)` columns with taller 54px stacked icon + label layout, preventing overlap on narrow screens.
- **Anti-Overflow Hardening**: `overflow-x: hidden` on the body, `minmax(0, 1fr)` grids, and `min-width: 0` / `overflow-wrap: anywhere` on cards, buttons, and package info.
- **Button Sizing Consistency**: Transparent 1.5px borders for uniform metrics, a `.full-btn` full-width variant, fixed 100px package action buttons, and centered marquee text.
- **Logs Tab Actions**: Moved Refresh/Clear into a full-width equal button row with clearer labels ("Refresh Logs" / "Clear All Logs").

### 🔧 Fixed
- **Accessibility & Markup**: Added `type="button"` to all buttons, removed inconsistent focus outlines, fixed unescaped `&` entities, and added missing trailing newlines.
- **Cleanup**: Removed unused `.header-btn-group` and `.terminal-container.full-height` rules.

---

## [v1.1] - Material You WebUI & Live Console Update

### ✨ Added
- **Material You (M3) WebUI Redesign**: Overhauled the WebUI using Android Material Design 3 guidelines with tonal surfaces, pill navigation, and monochrome SVG icons.
- **Dynamic System Accent Synchronization**: Detection of Android Monet seed color with a built-in Material You color preset switcher in the header.
- **Live Execution Consoles**: Real-time script output in the Optimizer, Freeze APK, and Debloat APK tabs.
- **Clear All Logs Action**: Added a one-tap Clear All button in the Logs tab.

### 🔧 Fixed & Improved
- **Uniform Button Sizing**: Fixed button dimensions across manual input bars and package list.
- **Cleaner Service Output**: Added stdout fallback to `cleaner.service` logging.
- **Multi-User Dropdown Sync**: Connected user select change listener dynamically.
- **ANSI Escape Stripping**: Filtered ANSI escape sequences in API and UI.

---

## [v1.0] - Initial Release

### 🎉 Initial Features
- **Multi-Mode RAM Flusher**: Memory flushing profiles (`safe`, `aggressive`, `extreme`, `custom`).
- **Auto & Manual Cache Cleaner**: Instant cleanup for app `cache` and `code_cache`.
- **Multi-User App Freezer**: Freeze and unfreeze apps across all Android users.
- **Systemless & PM APK Debloater**: Uninstall bloatware with Magisk `.replace` support.
- **Dual-Mode WebUI**: Root bridge and HTTP CGI mode support.
- **Toast Notifications**: Bundled `ShowToast.apk` support.
