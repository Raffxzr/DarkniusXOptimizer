# ⚡ DarkniusX Optimizer

[![Build](https://github.com/Raffxzr/DarkniusXOptimizer/actions/workflows/build.yml/badge.svg)](https://github.com/Raffxzr/DarkniusXOptimizer/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/Raffxzr/DarkniusXOptimizer)](https://github.com/Raffxzr/DarkniusXOptimizer/releases/latest)

**DarkniusX Optimizer** (formerly *RaffOptimizer*) is a comprehensive, low-overhead device maintenance and gaming performance suite for **Magisk, KernelSU, KernelSU-Next, and APatch**.

It combines advanced gaming graphics scaling, thermal unthrottling, universal GMS deep sleep, storage fstrim, kernel virtual memory tuning, multi-mode RAM flushing with custom whitelisting, cache cleaning, multi-user APK freezing/debloating, and a sleek **AMOLED Dark Red Material You (M3) WebUI**.

---

## ✨ Key Features

- **🎮 Pixel LOD Scaler (Grafik MC)**:
  - Dynamically forces the ANGLE OpenGL/Vulkan driver texture Level of Detail offset (+4) for massive GPU load reduction and sustained FPS in heavy 3D titles (Free Fire, Free Fire MAX, Mobile Legends, PUBG Mobile / BGMI, or any custom app package).
  - Supports targeted per-package overrides or global system-wide enforcement.
- **🔥 Darknius Thermal Killer**:
  - Terminates restrictive vendor thermal throttling daemons (`mi_thermald`, `thermal-engine`, `thermald`) and unconstrains thermal zone governors to prevent thermal frequency drops during extended gaming sessions.
- **⚡ Smart GMS Doze & Screen-Off Deep Sleep**:
  - Universal sysconfig XML patcher supporting **Android 10 up to Android 17+**, treating Google Play Services as a standard battery-optimized application.
  - Fixes the notorious 100% CPU lockup and battery drain caused by older GMS doze scripts upon device wake-up.
  - Event-driven screen-off deep sleep daemon (`darknius-doze`) that engages `cmd deviceidle force-idle deep` with an 8-second grace period and zero disk I/O.
- **🧹 Universal Storage Fstrim**:
  - Trims dirty and discarded flash storage blocks across `/data`, `/cache`, and `/system` to maintain optimal NAND flash read/write speeds and reduce I/O wait times.
- **⚙️ Kernel VM & ZRAM Tuner**:
  - Quick-switch Linux virtual memory presets: `gaming` (ZRAM swappiness 160, cache pressure 50), `balance` (swappiness 60, pressure 100), and `multitasking` (swappiness 120, pressure 80).
- **🛡️ Custom RAM Flush Whitelist**:
  - Free up memory before gaming using 4 flushing profiles (`safe`, `aggressive`, `extreme`, `custom`).
  - Whitelist custom background apps (`/data/adb/darkniusx/config/whitelist.list`) such as music players, discord, or messengers to keep them running during deep memory purges.
- **🧼 Auto & Manual Cache Cleaner**:
  - Clean app `cache` and `code_cache` directories on demand or automatically via background service with customizable size thresholds (500MB, 1GB, 2GB, 3GB) and cron intervals.
- **❄️ Multi-User APK Freezer & Debloater**:
  - Freeze (`disable-user`) or debloat system and user apps across all profiles (`User 0`, `User 10` Work Profile / Dual Apps) with color-coded safety indicators (🟢 Safe, 🟡 Caution, 🔴 Critical).
- **🎨 AMOLED Dark Red Material You WebUI**:
  - True pitch-black AMOLED UI (`#000000`) with high-contrast dark red accents (`#e53935`), dynamic auto-marquee text scrolling, and real-time execution consoles.
  - Operates via native root bridge (`window.ksu.exec`) in KernelSU/APatch/MMRL or via the built-in HTTP CGI server at `http://127.0.0.1:8899`.

---

## 💻 Terminal Commands (`su`)

| Feature | Command | Description |
| :--- | :--- | :--- |
| **Main Menu** | `su -c darknius` (or `dx`) | Show interactive helper and status summary |
| **Pixel LOD Scaler** | `su -c darknius-lod enable [pkg]` | Enable LOD offset +4 (Grafik MC) for specific pkg or `all` |
| **Pixel LOD Revert** | `su -c darknius-lod disable` | Restore stock texture LOD settings |
| **Thermal Killer** | `su -c darknius-thermal enable` | Terminate thermal throttling daemons |
| **Thermal Restore** | `su -c darknius-thermal disable` | Restart stock vendor thermal daemons |
| **Storage Fstrim** | `su -c darknius-fstrim` | Trim `/data`, `/cache`, and `/system` partitions |
| **Kernel VM Tuner** | `su -c darknius-vm set <gaming\|balance\|multitasking>` | Apply kernel swappiness & VFS cache pressure |
| **Deep Sleep Daemon** | `su -c darknius-doze <start\|stop\|status>` | Manage screen-off smart deep sleep daemon |
| **Flush RAM** | `su -c darknius-flush [mode]` | Modes: `safe`, `aggressive`, `extreme`, `custom` |
| **Clean Cache** | `su -c cleaner` | Clean all application caches immediately |
| **Freeze App** | `su -c darknius-freeze freeze <pkg> --user all` | Freeze app for `all` users or specific user ID |
| **Unfreeze App** | `su -c darknius-freeze unfreeze <pkg> --user all` | Restore frozen app |
| **Debloat App** | `su -c darknius-debloat remove <pkg> --user all --systemless` | Debloat app with systemless `.replace` masking |
| **Restore App** | `su -c darknius-debloat restore <pkg> --user all` | Restore removed debloated system app |
| **Open WebUI** | `su -c darknius-webui open` | Start and launch the WebUI in your default browser |

*Note: Backward-compatible command aliases (`raff`, `raff-flush`, `raff-freeze`, `raff-debloat`, `raff-webui`) remain available.*

---

## 📦 Installation

1. Download `DarkniusXOptimizer-v1.5.zip` from **Releases**.
2. Flash the zip via **Magisk**, **KernelSU**, or **APatch** Manager.
   - *Automatic Data Migration*: Upgrading from older `RaffOptimizer` versions automatically migrates your configs and debloat lists.
3. Reboot your device.
4. Launch the **WebUI** via your Root Manager (Action button) or execute `su -c darknius-webui open`.

---

## 🛠️ Building from Source

Requirements: `bash`, `zip`, and `unzip`.

```bash
git clone https://github.com/Raffxzr/DarkniusXOptimizer.git
cd DarkniusXOptimizer
./build.sh
```

The flashable module zip is output to `dist/DarkniusXOptimizer-<version>.zip`.

### Repository Structure

```text
DarkniusXOptimizer/
├── build.sh                  # Single entry point packaging pipeline
├── module.prop               # Module metadata (id=DarkniusXOptimizer)
├── update.json               # Auto-update manifest for Magisk/KernelSU
├── customize.sh              # Installer & universal GMS sysconfig patcher
├── service.sh / action.sh    # Boot services and action button hooks
├── scripts/                  # Sources for darknius CLI binaries
├── cleaner/                  # Cache cleaner service & inotify daemon
├── webroot/                  # AMOLED Dark Red Material You WebUI
├── system/priv-app/          # Bundled ShowToast.apk notification helper
├── system/xbin/              # 32-bit flush binaries
├── META-INF/                 # Flashable zip installer metadata
└── .github/workflows/        # CI build & automated release pipelines
```

---

## 👤 Credits & License

- **Developer**: [Raffxzr](https://github.com/Raffxzr)
- **Base Components**: Flush RAM Reborn (`@WeAreRavenS`), Cache Cleaner (`@taamarin`), and GMS Doze logic contributors.
