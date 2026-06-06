# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a meta-project that tracks all of JOS's GitHub gists. Each subdirectory (e.g., `voice/`) is a standalone mini-project with its own purpose. The `sync-gists.sh` script pushes local files to their corresponding GitHub gists via `gh gist edit`. New gists should be added as subdirectories here and registered in `sync-gists.sh`.

The repo also doubles as a **Claude Code plugin marketplace** (`.claude-plugin/marketplace.json`); see `faust-skill/` below.

## Single source of truth via symlinks

This repo is the canonical copy of each file it tracks. The "live" location where a tool is actually used is a **symlink into this repo**, so editing the repo copy is the only thing needed — there is no second copy to keep in sync. The repo must hold the real files (never the symlink), so a fresh clone is self-contained.

| Live location (symlink) | → Real file (here) |
|-------------------------|--------------------|
| `/w/scripts/voice` (on PATH) | `voice/voice` |
| `~/.claude/skills/faust` (Claude Code skill) | `faust-skill/skills/faust/` |
| `~/.claude/statusline.js` | `claude-statusline/statusline.js` |
| `~/.claude/statusline-wrapper.js` | `claude-statusline/statusline-wrapper.js` |

`~/.claude/settings.json` points `statusLine.command` at `~/.claude/statusline-wrapper.js` (a symlink); Claude Code follows it fine. `claude-statusline/` stays a plain gist rather than a plugin: plugins cannot contribute a main `statusLine` (only `agent` / `subagentStatusLine` settings keys), so it is installed manually or symlinked as above.

To wire up a new one: keep the real file in the repo, then `rm` the live copy and `ln -s <repo-path> <live-path>`.

## faust-skill/ - FAUST DSP Claude Code skill

A skill (`skills/faust/`) packaged as a Claude Code plugin. `primer.md` is the language reference, `examples.md` holds compile-clean idiomatic programs, and `SKILL.md` adds a verify-with-the-compiler workflow. Published via the repo-root marketplace; install with `/plugin marketplace add josmithiii/gists` then `/plugin install faust@josmithiii-gists`. JOS edits it in place — `~/.claude/skills/faust` symlinks here (see above). The companion `faust-to-cpp` skill (JOS's private `jos_dsp` C++ conventions) lives only in `~/.claude/skills/`, not in this repo.

## voice/ - Voice Transcription Utility

A bash script for voice-to-text using Whisper with integrations for AI coding assistants (Claude Code, Codex, Gemini, Aider, GPT) and Emacs.

### Dependencies

- `openai-whisper` (pip install)
- `sox` (provides `rec` command)
- `ffmpeg`

### Usage

```bash
voice                 # Record and print transcription
voice -c              # Copy to clipboard
voice 10              # Record for 10 seconds
voice claude          # Send directly to Claude Code
voice -l emacs        # Loop mode, insert into Emacs
```

### Environment Variables

- `WHISPER_MODEL`: Model selection (tiny/base/small/medium/large, default: base)
- `WHISPER_LANG`: Language code (default: en)

### Sync

`voice/voice` is the real file; `/w/scripts/voice` (on PATH) is a symlink to it (see "Single source of truth via symlinks"). Edit `voice/voice` directly — there is no second copy to update.

### Architecture

- `voice/voice`: Main script with single-shot and loop modes
- `voice/archive/`: Historical versions showing evolution of the tool
- Loop mode uses `stty quit '^G'` to remap Ctrl+G for toggle recording
- Targets handled via case statement in `send_to_target()` function
