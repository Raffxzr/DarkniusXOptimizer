# DarkniusX Optimizer Changelog

## [v1.6] - Chrome WebUI Layout Fix & Full Thermal Killer Engine

### Fixed
- Fixed Chrome WebUI card headers collapsing titles and descriptions into single-character vertical columns when status badges exceeded narrow viewports.
- Added missing `target`, `profile`, and `interval` query parameter handling in `webroot/cgi-bin/api.sh`, fixed cron glob expansion during URL parsing, and aligned `darknius-vm` CLI arguments across KSU bridge and CGI.
- Fixed Thermal Killer restore failing to restart dynamically discovered init thermal services or clear sysfs locks.

### Changed
- Replaced basic thermal on/off script with full `Auto` (per-app) and `Static` thermal engine: supports Aggressive mode, Disable Thermal HAL (bind mount), Thermal Zone (`Spoof 30°C` / `Kill`), Policy selector, Disable Kernel Panic, Fast Charge bypass, per-app overrides, and automatic target game detection on install.
- Shortened WebUI button and dropdown labels to fit narrow mobile viewports cleanly.
- Removed decorative emojis across docs, release titles, and UI safety badges.

---

## [v1.5] - Rebrand to DarkniusX Optimizer

### Added
- Rebranded module ID (`DarkniusXOptimizer`), name (`DarkniusX Optimizer`), data paths (`/data/adb/darkniusx/`), and CLI commands (`darknius`, `dx`, with legacy `raff` aliases), with automatic config migration from `/data/adb/raffoptimizer/`.
- Pixel LOD Scaler (`darknius-lod`) using ANGLE driver flags (`ForceTextureLodOffset4`) per package or globally.
- Darknius Thermal Killer (`darknius-thermal`), Storage Fstrim (`darknius-fstrim`), Kernel VM & ZRAM presets (`darknius-vm`), and RAM Flush custom whitelist (`/data/adb/darkniusx/config/whitelist.list`).
- Universal GMS Doze XML patcher (Android 10-17+) and event-driven screen-off deep sleep daemon (`darknius-doze`).
- WebUI cards for ZRAM, temperature, LOD, thermal, VM tuning, deep sleep, flush whitelist, cleaner scheduler settings, and safety badges (`Safe`, `Caution`, `Critical`).

---

## [v1.4] - AMOLED Theme & WebUI Fixes

### Fixed
- Fixed the black flash before loading the accent color in WebUI by initializing CSS `--active-accent` synchronously from `localStorage` and replacing `AccentColor` with `#e53935`.
- Removed redundant `settings get secure theme_customization_overlay_packages` execution during stats refreshes.

### Changed
- Switched default palette to pitch-black AMOLED (`#000000`) with dark red accents (`#e53935`).
- Cleaned up comments and redundant shell code.

---

## [v1.3] - Build Pipeline & Release Automation

### Added
- Single-source `build.sh` packaging script copying `scripts/` into `system/bin/` with permission and file checks.
- GitHub Actions `Build` and `Release` workflows for syntax validation, zip packaging, GitHub Releases, and `update.json` updates.

### Changed
- Consolidated previous module releases into one source tree and removed duplicate checked-in binaries.

---

## [v1.2] - WebUI Marquee & Layout Fixes

### Added
- Auto-marquee scrolling for overflowing labels inside buttons, navigation items, terminal headers, selects, and input placeholders.
- Custom `.m3-field-wrap` wrappers for selects and inputs.

### Fixed
- Rebuilt header and 4-column nav bar alignment, fixed horizontal overflow with `minmax(0, 1fr)` grids, unified button dimensions, and cleaned up HTML/CSS rules.

---

## [v1.1] - Material You WebUI & Live Consoles

### Added
- Material Design 3 WebUI layout with monochrome SVG icons and dynamic accent switching.
- Embedded execution consoles on Optimizer, Freeze APK, and Debloat APK tabs plus log clearing.

### Fixed
- Unified package row button sizing, added stdout fallback to `cleaner.service`, synced user selector dropdowns, and stripped ANSI escapes in logs.

---

## [v1.0] - Initial Release

### Added
- Multi-mode RAM Flusher (`safe`, `aggressive`, `extreme`, `custom`).
- Manual and scheduled `crond` cache cleaner.
- Multi-user APK Freezer (`raff-freeze`) and Systemless `.replace` APK Debloater (`raff-debloat`).
- Dual-mode WebUI supporting KernelSU bridge and local BusyBox CGI (`127.0.0.1:8899`).
- Toast notifications via bundled `ShowToast.apk`.
