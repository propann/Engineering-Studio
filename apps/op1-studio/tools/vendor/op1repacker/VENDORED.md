# Vendored op1repacker

This directory contains the local `op1repacker` 0.2.6 engine and its mod assets.

- Upstream: https://github.com/op1hacks/op1repacker
- License: MIT
- Purpose: inspect, unpack, apply documented mods, and repack original OP-1 firmware.
- Source: local `aaspinwall-retro-pack` environment, version 0.2.6.

The application must invoke this engine through the local bridge only. It must never
write to a connected OP-1 without an explicit backup, validation, and confirmation.
Firmware binaries and user backups are intentionally not vendored here.
