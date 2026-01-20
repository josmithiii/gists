# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of standalone gists/utilities. Currently contains `voice/` - a voice-to-text transcription tool using OpenAI Whisper.

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

### Architecture

- `voice/voice`: Main script with single-shot and loop modes
- `voice/archive/`: Historical versions showing evolution of the tool
- Loop mode uses `stty quit '^G'` to remap Ctrl+G for toggle recording
- Targets handled via case statement in `send_to_target()` function
