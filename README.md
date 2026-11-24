# DarkniusX Optimizer

<p align="center">
  <img src="DarkniusX%20Module.png" alt="DarkniusX Optimizer banner" width="1024" height="571">
</p>

[![Build](https://github.com/Raffxzr/DarkniusXOptimizer/actions/workflows/build.yml/badge.svg)](https://github.com/Raffxzr/DarkniusXOptimizer/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/Raffxzr/DarkniusXOptimizer)](https://github.com/Raffxzr/DarkniusXOptimizer/releases/latest)

System maintenance and performance module for Magisk, KernelSU, and APatch.

## Features

- **Pixel LOD Scaler (Grafik MC)**: Sets ANGLE `ForceTextureLodOffset4` per package or globally.
- **Darknius Thermal Killer**: Disables vendor thermal daemons and thermal zone limits, with Auto (per-app) or Static mode, zone spoofing/kill, policy selection, kernel panic disable, and fast charge bypass.
- **GMS Doze & Deep Sleep**: Patches Google Play Services sysconfig XMLs (Android 10-17+) and runs a screen-off `deviceidle` daemon.
- **Storage Fstrim**: Trims `/data`, `/cache`, `/system`, `/vendor`, and `/product` partitions.
- **Kernel VM & ZRAM**: Switches swappiness and VFS cache pressure presets (`gaming`, `balance`, `multitasking`).
- **RAM Flush & Whitelist**: Clears memory with four profiles (`safe`, `aggressive`, `extreme`, `custom`) while keeping whitelisted apps alive.
- **Cache Cleaner**: Cleans app `cache` and `code_cache` on demand or on a `crond` schedule with configurable threshold and interval.
- **Multi-User App Freezer & Debloater**: Disables or removes system/user apps across profiles, including Magisk `.replace` masking.
- **WebUI**: Runs through KernelSU/APatch native root bridge or the local HTTP CGI server at `http://127.0.0.1:8899`.

## Commands (`su`)

| Feature | Command | Notes |
| :--- | :--- | :--- |
| Main help | `su -c darknius` (or `dx`) | Command overview and status |
| Pixel LOD | `su -c darknius-lod enable [pkg\|all]` | Enable LOD offset +4; `disable` to revert |
| Thermal Killer | `su -c darknius-thermal enable\|disable` | Switch thermal killer on/off (`set` / `status` available) |
| Fstrim | `su -c darknius-fstrim` | Trim mounted partitions |
| Kernel VM | `su -c darknius-vm <gaming\|balance\|multitasking>` | Apply VM preset |
| Deep Sleep | `su -c darknius-doze <start\|stop\|status>` | Screen-off idle daemon |
| Flush RAM | `su -c darknius-flush [mode]` | `safe`, `aggressive`, `extreme`, `custom` |
| Clean Cache | `su -c cleaner` | Run cache cleanup immediately |
| Freeze / Unfreeze | `su -c darknius-freeze <freeze\|unfreeze> <pkg> --user all` | Toggle app state per user or all |
| Debloat / Restore | `su -c darknius-debloat <remove\|restore> <pkg> --user all` | Add `--systemless` for `.replace` |
| WebUI | `su -c darknius-webui open` | Start CGI server and open UI |

Legacy `raff*` command aliases remain supported.

## Installation

1. Download `DarkniusXOptimizer-v*.zip` from [Releases](https://github.com/Raffxzr/DarkniusXOptimizer/releases).
2. Flash it in Magisk, KernelSU, or APatch (configs from older `RaffOptimizer` installs migrate automatically).
3. Reboot, then open the WebUI from your root manager or at `http://127.0.0.1:8899`.

## Build

Requires `bash`, `zip`, and `unzip`.

```bash
git clone https://github.com/Raffxzr/DarkniusXOptimizer.git
cd DarkniusXOptimizer
./build.sh
```

Output zip is written to `dist/DarkniusXOptimizer-<version>.zip`.

## Credits

- Developer: [Raffxzr](https://github.com/Raffxzr)
- Flush RAM Reborn: [@WeAreRavenS](https://t.me/WeAreRavenS)
- Cache Cleaner: [taamarin/cleaner](https://github.com/taamarin/cleaner)
- Thermal Killer: Based on [Licking-Thermal](https://github.com/fuckyoustan/Licking-Thermal/releases) by [@fuckyoustan](https://github.com/fuckyoustan)
- GMS Doze: Based on [Extreme GMS Doze](https://github.com/Skyghost090/Extreme-Gms-Doze) by [@Skyghost090](https://github.com/Skyghost090) and [Universal GMS Doze](https://github.com/gloeyisk/universal-gms-doze) by [@gloeyisk](https://github.com/gloeyisk)
