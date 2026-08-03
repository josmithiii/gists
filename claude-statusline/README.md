# Claude Code status line -- context and plan usage

A custom status line for [Claude Code](https://claude.com/claude-code) that
shows the model name and current effort level, percentage of the 1M-token
context window consumed (color-coded green/yellow/red), exact token counts,
the *remaining* 5-hour-session and weekly rate-limit percentages with time
until each window resets (Pro/Max plans), the API-equivalent session cost,
the session ID, plus the familiar `user@host:dir (branch)` prefix.

Example output:

```
jos@laptop:myproj (main) Opus 5 xhigh | context used 31.9% - (318,911/1,000,000) - remaining: 5h 62% (2.2h) | weekly 69% (5.3d) | ~$12.88 if API
```

Rendered (the `user@host:project` prefix comes from the wrapper; everything
from `(main)` onward is shown in the screenshot below):

![status line screenshot](https://raw.githubusercontent.com/josmithiii/gists/main/claude-statusline/statusline.png)

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

3. Start a new Claude Code session -- the bar appears at the bottom.

## How it works

- `statusline-wrapper.js` (a bash script despite the `.js` name -- Claude
  Code only cares that it's executable) prepends `user@host:dir (branch)`
  and then pipes the original stdin JSON into `statusline.js`.
- The effort level after the model name (`Opus 5 xhigh`) is the `effort.level`
  field Claude Code pipes in on stdin -- one of `low`, `medium`, `high`,
  `xhigh`, tracking `/effort` live. The whole `effort` block is omitted for
  models that don't support effort levels (Sonnet 4.5, Haiku 4.5, Opus 4.0/4.1,
  Claude 3.x), and the status line then shows the bare model name. Note that
  `ultracode` reports as `xhigh`, its underlying effort level.
- `statusline.js` walks the session transcript from the tail, finds the
  newest main-context assistant message with non-zero usage (skipping
  sidechains, synthetic messages, API errors, and "no response requested"
  turns), and reports `input + output + cache_read + cache_creation` as
  a percentage of the 1M-token window.
- The `remaining: 5h N% (…h) | weekly N% (…d)` segments are read straight
  from the `rate_limits.five_hour` and `rate_limits.seven_day` blocks that
  Claude Code pipes into the status line on stdin. Each shows the percentage
  *remaining* in that window (100 minus `used_percentage`) followed by the
  time until the window resets; the green/yellow/red color still tracks
  usage, so the number turns red as it approaches 0% remaining. The fields
  only appear for Claude.ai Pro/Max subscribers, and only after the
  session's first API response -- before then each segment is silently
  omitted.
  See: <https://code.claude.com/docs/en/statusline.md#rate-limit-usage>
- `~$1.23 if API` is the `cost.total_cost_usd` field -- Claude Code's
  client-side estimate of the current session's spend. It prices tokens at
  standard per-token API rates with no knowledge of the Max subscription, so
  read it as "what this session would cost at pay-as-you-go API rates" -- the
  on-demand bill Max avoids. It is a running dollar total (not a percentage),
  shown in neutral cyan, so the green/yellow/red usage scale does not apply.
  It is a client-side estimate and "may differ from your actual bill." Note
  that Claude Code exposes *no* remaining-credit balance to the status line;
  this session-cost estimate is the closest available signal.

## Tweaks

- Change `CONTEXT_WINDOW` in `statusline.js` if you're on a non-1M model.
- Adjust the color thresholds (90% red, 70% yellow) in `color()`.
- Recolor the effort label (bright blue, `\x1b[94m`) or drop it entirely by
  setting `effort` to `""` near the top of `statusline.js`.
- Other fields Claude Code puts on stdin but this script ignores:
  `fast_mode`, `thinking.enabled`, `output_style.name`, `vim.mode`,
  `agent.name`, `session_name`, `pr`, `worktree`, and a ready-made
  `context_window` block (`used_percentage`, `remaining_percentage`) that
  could replace the transcript walk on newer Claude Code versions.
- Drop the wrapper and point `statusLine.command` straight at
  `statusline.js` if you don't want the user/host/branch prefix.

## License

MIT
