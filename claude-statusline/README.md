# Claude Code status line -- context and plan usage

A custom status line for [Claude Code](https://claude.com/claude-code) that
shows the model name and current effort level, percentage of the context
window consumed (color-coded green/yellow/red), exact token counts, whether
the prompt cache is warm, the *remaining* rate-limit percentages with time until each window resets
(whichever of the 5-hour and weekly windows your plan has), the API-equivalent
session cost, a second line with the session name, PR number and session ID,
plus the familiar `user@host:path (branch)` prefix.

Example output:

```
jos@laptop:~/myproj (main) Fable 5.1 high | context 31.9% - (318,911/1M) - Cached - remaining: 5h 62% (2.2h) | weekly 69% (5.3d) | ~$12.88 if API
session: Fix the cache label | PR #123 | e4b7d145-4fc2-472c-b14e-d02eeeea3589
```

Rendered (the `user@host:path (branch)` prefix comes from the wrapper;
everything from the model name onward is shown in the screenshot below):

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

Everything is read from the JSON that Claude Code pipes to the status-line
command on stdin (documented at
<https://code.claude.com/docs/en/statusline.md>); no transcript parsing.

- `statusline-wrapper.js` (a bash script despite the `.js` name -- Claude
  Code only cares that it's executable) prepends `user@host:path (branch)`
  and then pipes the original stdin JSON into `statusline.js`. The path is
  the full directory, shortened through any symlink in `/` that points at
  one of its parents (`/Users/jos/w/gists` shows as `/w/gists` when `/w` is
  such a link), and then with `$HOME` as `~`.
- The effort level after the model name (`Fable 5.1 high`) is the
  `effort.level` field -- one of `low`, `medium`, `high`, `xhigh`, `max`,
  tracking `/effort` live. The whole `effort` block is omitted for models
  that don't support effort levels, and the status line then shows the bare
  model name. Note that `ultracode` reports as `xhigh`, its underlying
  effort level.
- `context N% - (used/size)` comes from the `context_window` block:
  `current_usage` is the usage record of the newest main-context API
  response, and the script reports `input + cache_read + cache_creation` as
  a percentage of `context_window_size`. That is the same input-only formula
  as Claude Code's `used_percentage`, kept here for its decimal place.
  The size is shown compactly (`1M`, `200K`), so the script adapts to
  whichever model is active. Before the first response the segment reads
  `context usage starts after your first question.`, and just after
  `/compact` it reads `context updates after the next response.`
- `Cached` / `Uncached` is `prompt_cache.warm`: whether the cached prefix is
  still within its TTL. Claude Code re-runs the status line when a warm cache
  expires, so it flips to `Uncached` while the session is idle. The block is
  absent after `--continue` or `--resume` until the first response, even
  though the cache outlives the process, so the script keeps each session's
  `expires_at` in `~/.claude/statusline-cache.json` (self-pruning) and shows
  `Cached` across the restart. That is a prediction from the saved expiry: a
  resumed session sitting idle past it keeps showing `Cached` until the next
  update, and a changed system prompt or tool list still misses.
- The `remaining: 5h N% (…h) | weekly N% (…d)` segments are read from the
  `rate_limits.five_hour` and `rate_limits.seven_day` blocks. Each shows the
  percentage *remaining* in that window (100 minus `used_percentage`)
  followed by the time until the window resets; the green/yellow/red color
  still tracks usage, so the number turns red as it approaches 0%
  remaining. A `spend N%` segment is added only when Claude Code supplies
  `rate_limits.spend_limit` (Claude apps gateway users).
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
- The second line is `session_name`, then `pr.number` (`PR #123`, or
  `MR !123` for a GitLab merge request) unless the name already contains that
  number, then `session_id`.
- **Any field Claude Code does not supply is omitted**, along with its
  separator. Which rate-limit windows exist depends on the plan (Ultra has no
  `5h` window, for example), they arrive only after the session's first API
  response, and non-subscribers get none, so the line adapts rather than
  flagging them. The tradeoff is that a usage-service outage also just makes
  those segments disappear.

## Tweaks

- Adjust the color thresholds (90% red, 70% yellow) in `color()`.
- Recolor the effort label (bright blue, `\x1b[94m`) or drop it entirely by
  setting `effort` to `""` near the top of `statusline.js`.
- Other fields Claude Code puts on stdin but this script ignores:
  `fast_mode`, `thinking.enabled`, `output_style.name`, `vim.mode`,
  `agent.name`, `worktree`, `workspace.repo`, `pr.review_state`,
  `cost.total_lines_added`, `cost.total_lines_removed`,
  `cost.total_duration_ms`, and the rest of `prompt_cache` (`hit_ratio`,
  `expires_at`, `recache_tokens_if_cold`, `last_miss_cause`).
- Drop the wrapper and point `statusLine.command` straight at
  `statusline.js` if you don't want the user/host/branch prefix.

## License

MIT
