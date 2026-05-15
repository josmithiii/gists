# Gists

A collection of standalone utilities and scripts.

## Contents

### statusline/

Claude Code custom status line showing model name, percentage of the 1M
context window used (color-coded), exact token counts, session ID, and a
`user@host:dir (branch)` prefix.

**Gist:** https://gist.github.com/josmithiii/72bb219437e881521e72028bf01bb99a

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
