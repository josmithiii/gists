# Repository Guidelines

## Project Structure & Module Organization
- `voice` is the primary Bash script and the only executable entry point; it handles CLI parsing, recording, transcription, and target integrations.
- `README.md` documents installation, usage, and targets.
- `archive/` contains older experimental scripts kept for reference, not active development.

## Build, Test, and Development Commands
- `./voice --help` prints CLI options and environment variables.
- `./voice` records until stopped and prints the transcription.
- `./voice 10` records for 10 seconds.
- `./voice -l` enables loop mode (Ctrl+G toggles recording).
- `WHISPER_MODEL=small WHISPER_LANG=en ./voice` overrides Whisper settings.

## Coding Style & Naming Conventions
- Bash (`#!/bin/bash`) with 4-space indentation.
- Use `snake_case` for functions (e.g., `record_and_transcribe`) and `UPPER_CASE` for constants or env defaults.
- Quote variables and prefer `local` inside functions to avoid global bleed.

## Testing Guidelines
- No automated tests are included.
- Manual smoke checks: run `./voice --help`, then `./voice 2` and confirm a transcription appears.
- If touching integrations, verify the relevant target (e.g., `./voice -c` for clipboard, `./voice emacs` for Emacs).

## Commit & Pull Request Guidelines
- Commit messages follow `scope: short summary` (examples from history: `main: README.md`, `test: testing and debugging`).
- PRs should include a concise description, any dependencies or setup changes, and the manual checks run.

## Configuration & Runtime Dependencies
- Required tools: `whisper`, `rec` (sox), and `ffmpeg`.
- Optional tools: `pbcopy` for clipboard, `emacsclient` for Emacs/Org targets.
- Environment variables: `WHISPER_MODEL` and `WHISPER_LANG`.
