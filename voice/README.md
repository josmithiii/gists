# voice

Voice-to-text transcription using OpenAI Whisper, with integrations for AI coding assistants and Emacs.

## Requirements

- [openai-whisper](https://github.com/openai/whisper): `pip install openai-whisper`
- [sox](http://sox.sourceforge.net/): `brew install sox` (for the `rec` command)
- ffmpeg: `brew install ffmpeg`

## Installation

```bash
curl -o ~/.local/bin/voice https://gist.githubusercontent.com/josmithiii/607f6090dd9599763d6cc109280abe63/raw/voice
chmod +x ~/.local/bin/voice
```

## Usage

**TLDR:** Use `voice -l -c` in an iTerm2 pane, then paste into claude/codex/gemini panes, or Emacs., etc.

```bash
voice                 # Record and print transcription
voice -c              # Record and copy to clipboard
voice 10              # Record for 10 seconds
voice claude          # Record and send to Claude Code
voice -l -c           # Loop mode with clipboard (Ctrl+G toggles, Ctrl+C exits)
voice -l emacs        # Loop mode inserting into Emacs at point
voice -l org          # Loop mode capturing to org-mode
voice -l log          # Loop mode appending to a log file
```

## Targets

| Target  | Description                          |
|---------|--------------------------------------|
| claude  | Send to Claude Code                  |
| codex   | Send to Codex                        |
| gemini  | Send to Gemini                       |
| aider   | Send to Aider                        |
| gpt     | Send to GPT                          |
| emacs   | Insert at point (requires server)    |
| org     | Capture as org-mode voice note       |
| log     | Append to `VOICE_LOG_FILE`           |
| stdout  | Force stdout output (default)        |

## Environment Variables

- `WHISPER_MODEL`: Whisper model to use (default: `base`). Options: `tiny`, `base`, `small`, `medium`, `large`
- `WHISPER_LANG`: Language code (default: `en`)
- `VOICE_LOG_FILE`: Log file for `log` target (default: `/tmp/voice.log`)
- `VOICE_EMACS_VERBOSE`: Show `emacsclient` output/errors (set to `1`)

## Single-Shot Controls

- **Ctrl+G**: Stop recording and transcribe
- **Ctrl+C**: Abort without transcribing

## Loop Mode Controls

- **Ctrl+G**: Toggle recording on/off
- **Ctrl+C**: Exit
- Loop mode requires a TTY (interactive terminal)

## Emacs Integration

Add to your init file:
```elisp
(setq server-socket-dir "~/.emacs.d/server")
(unless (display-graphic-p)
  (server-start))
```

For org-capture support, add:
```elisp
(setq org-capture-templates
      '(("v" "Voice note" entry (file+headline "~/org/voice.org" "Voice Notes")
         "* %U\n%i%?\n" :empty-lines 1)))
```
