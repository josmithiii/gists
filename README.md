# Gists

A collection of standalone utilities and scripts.

## Contents

### voice/

Voice-to-text transcription using OpenAI Whisper, with integrations for AI coding assistants and Emacs.

**Dependencies:** `openai-whisper`, `sox`, `ffmpeg`

```bash
voice                 # Record and print transcription
voice -c              # Copy to clipboard
voice 10              # Record for 10 seconds
voice claude          # Send directly to Claude Code
voice -l emacs        # Loop mode, insert into Emacs
```

**Environment variables:**
- `WHISPER_MODEL`: tiny/base/small/medium/large (default: base)
- `WHISPER_LANG`: Language code (default: en)

## License

MIT
