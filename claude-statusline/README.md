# Claude Code status line — context usage

A custom status line for [Claude Code](https://claude.com/claude-code) that
shows the model name, percentage of the 1M-token context window consumed
(color-coded green/yellow/red), exact token counts, 5-hour-session and
weekly rate-limit usage (Pro/Max plans), the session ID, plus the familiar
`user@host:dir (branch)` prefix.

Example output:

```
jos@laptop:myproj (master) Opus 4.7 (1M context) | context used 12.3% - (123,456/1,000,000) | 5h 18% (2.4h) | weekly 43% (3.0d)
session: 0f3c…
```

## Install

1. Drop both files in `~/.claude/`:

   ```bash
   GIST=https://gist.githubusercontent.com/josmithiii/72bb219437e881521e72028bf01bb99a/raw
   curl -o ~/.claude/statusline.js          $GIST/statusline.js
   curl -o ~/.claude/statusline-wrapper.js  $GIST/statusline-wrapper.js
   chmod +x ~/.claude/statusline.js ~/.claude/statusline-wrapper.js
   ```

2. Wire it up in `~/.claude/settings.json`:

   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "~/.claude/statusline-wrapper.js",
       "padding": 0
     }
   }
   ```

3. Start a new Claude Code session — the bar appears at the bottom.

## How it works

- `statusline-wrapper.js` (a bash script despite the `.js` name — Claude
  Code only cares that it's executable) prepends `user@host:dir (branch)`
  and then pipes the original stdin JSON into `statusline.js`.
- `statusline.js` walks the session transcript from the tail, finds the
  newest main-context assistant message with non-zero usage (skipping
  sidechains, synthetic messages, API errors, and "no response requested"
  turns), and reports `input + output + cache_read + cache_creation` as
  a percentage of the 1M-token window.
- 5-hour-session and weekly usage are read straight from the
  `rate_limits.five_hour` and `rate_limits.seven_day` blocks that Claude
  Code pipes into the status line on stdin. The fields only appear for
  Claude.ai Pro/Max subscribers, and only after the session's first API
  response — before then each segment is silently omitted.
  See: <https://code.claude.com/docs/en/statusline.md#rate-limit-usage>

## Tweaks

- Change `CONTEXT_WINDOW` in `statusline.js` if you're on a non-1M model.
- Adjust the color thresholds (90% red, 70% yellow) in `color()`.
- Drop the wrapper and point `statusLine.command` straight at
  `statusline.js` if you don't want the user/host/branch prefix.

## License

MIT
