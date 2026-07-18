---
name: git-replay
description: Replay recent commit messages one at a time, oldest to newest, like scrolling forward through the project's story. Use when JOS says "/git-replay", "replay commits", or "walk me through the history".
argument-hint: "[n | n{c|d|w|m}] [--resume] [--step] [--narrate] [--stat] [--newest-first] [--author X] [--since X] [--grep X] [--path X]"
allowed-tools: Bash(git log:*), Bash(git rev-list:*), Bash(git status:*), Bash(git branch:*), Bash(git show:*), Bash(git rev-parse:*), Bash(cat:*), Write
---

Replay commit messages one at a time, **oldest to newest**, so the reader moves
forward through the project's story. Faithful by default: show the real commit
messages, cleanly. Features are opt-in flags.

## Arguments

- **`n`** (optional positional integer): replay the last `n` commits.
  **Default: all commits on the current branch** (`git rev-list --count HEAD`).
- **`<n>c` / `<d>d` / `<w>w` / `<m>m` (unit span)**: bound the replay to a recent
  time span, then chapter it recursively as usual (leaf = groups of ≤`L`). The
  suffix picks the unit: `c` = commits (the default, so `5` and `5c` are
  identical), `d` = days, `w` = weeks, `m` = months (`q` = quarters, `y` = years
  also work). The space is optional (`5 c` == `5c`). Examples: `1m` = the last
  month; `2w` = the last two weeks; `30d` = the last 30 days. See *Span units*.
- **`--resume`**: re-enter the outline exactly where you left off last time
  (see *Resume*). Ignores `n` and the scoping flags -- it restores the saved
  position instead of starting a new replay.
- **`--step`**: interactive slideshow -- one commit per turn (see *Step mode*).
- **`--narrate`**: add a one-line connective thread between cards and a short
  closing "arc" retrospective in your own words.
- **`--stat`**: include per-commit files-changed / insertions / deletions.
- **`--newest-first`**: reverse the order (most recent first).
- **`--author X` / `--since X` / `--grep X` / `--path X`**: pass straight through
  to `git log` to scope the replay.

## Steps

1. **Resolve the set.** If `n` is given, replay the last `n`; else count all:
   `git rev-list --count HEAD`. Note the branch: `git branch --show-current`.

2. **Fetch the ordered commit spine once**, oldest-first, in one parse-safe
   call. Fields are `\x1f`-separated, commits `\x1e`-separated:
   ```
   git log -n <N> --reverse --date=short \
     --format='%H%x1f%h%x1f%an%x1f%ad%x1f%s%x1f%b%x1e' [--author=X --since=X --grep=X] [-- <path>]
   ```
   - `--reverse` after `-n N` gives the N most recent, shown oldest-first.
   - With `--newest-first`, drop `--reverse`.
   - With `--stat`, add a second pass per commit or append `--shortstat` on a
     `git log` variant -- keep the message fetch and the stat fetch separate so
     the delimiter format stays clean.
   - The `--author` / `--since` / `--grep` / `--path` args are the ONLY place a
     date window belongs -- they scope the whole spine up front.

   **⚠️ Select every chunk and leaf by HASH, never by re-windowing dates.**
   Do all bucketing (step 5) on the `%ad` field of this already-fetched spine.
   To render a node's commits, fetch them by their explicit hashes:
   ```
   git show -s --date=short --format='%h%x1f%an%x1f%ad%x1f%s%x1f%b%x1e' <hash> <hash> ...
   ```
   Do **not** re-slice with `git log --since=<day> --until=<nextday>`: those
   boundaries are timezone-sensitive and exclusive, so a per-day/-week window
   silently slides to the adjacent day and renders the wrong commits. A hash
   range (`A^..B`) also fails on the root commit (no parent) -- prefer an
   explicit hash list.

3. **Open with an overview** (a prologue, before any cards) that frames what
   the reader is about to walk through:
   - **Default case (all commits):** an intro to the *whole project* -- what it
     is, when it started (first commit date), how many commits over what span,
     and the broad arc of what got built. Read the repo's `README`/`CLAUDE.md`
     if a one-line "what is this" isn't obvious from the messages.
   - **Scoped case (`n`, `--author`, `--since`, `--grep`, `--path`):** summarize
     just *that* slice -- the date span, commit count, and the 2-4 dominant
     themes across those messages.
   - Keep it to a short paragraph (plus a header line like
     `── Replaying <N> commits · <first date> → <last date> ──`). Then the cards.

4. **Render one card per commit** (this is the "one at a time"), numbered
   `k/total` as a replay progress counter. Keep it monospace-terminal-clean:
   ```
   ▶ 3/57 · 2026-07-18 · Julius Smith
     598fa41  Slim CLAUDE.md; archive full history to ARCHITECTURE_NOTES.md

     CLAUDE.md had grown to ~169 KB of build-by-build changelog prose...
     (full body, wrapped; blank line preserved)
   ```
   - Always show the **full body**, not just the subject.
   - If the subject ends in a `(build-tag)` or starts with `branch:`, leave it
     as-is -- those conventions are meaningful in JOS's repos.
   - With `--stat`, add a compact ` └ 2 files · +172 −52` line.
   - With `--narrate`, add one italic connective line before the next card
     (e.g. *"...then the cleanup turned structural."*). Keep it to one line.

5. **Large sets → a recursive outline tree** (this replaces flat chapters).
   Two tunables: **leaf size `L` = 10**, **branch cap `B` = 10**.
   - **If a node has `L` or fewer commits, it is a leaf: render every commit as a
     full card** (step 4). This is the only place cards appear.
   - **Otherwise split the node into up to `B` child chunks** and show a numbered
     table of contents instead of cards -- do NOT descend automatically.
   - **How to split (grain ladder, coarse→fine):** pick the **finest calendar
     grain that yields between 2 and `B` non-empty buckets**, trying in order:
     **year → quarter → month → week → day**. (333 commits over 3 months → *month*
     gives 4 chunks; opening a busy month → *week*; opening a week → *day*.)
   - **If no calendar grain fits** (e.g. a single day with >`L` commits, so even
     `day` is one bucket): split the time-ordered list into `⌈size/L⌉` equal
     **contiguous count-groups** (labelled by their hash/time span), each ≤`L`.
   - **Recurse:** opening any chunk re-runs this rule on that chunk's commits, so
     chapters nest into sections into subsections until every leaf is ≤`L`.
   - **The overview (step 3) recurses too:** every chunk you open gets its own
     short prologue summarizing just that slice before its TOC or cards.
   - **Each TOC row:** `k) <span> · <count> commits · <one-line theme>`. Show a
     breadcrumb path at the top (`root › 2026-06 › week of 06-01`).

   **Outline navigation** (interactive, across turns):
   - `k` (a number) → descend into child `k`
   - `up` / `u` → back to the parent's TOC   ·   `top` / `root` → the top TOC
   - `next` / `prev` → sibling chunk at this level
   - `cards` → force-render this node's commits as cards even if >`L` (warn first
     if it's large); `all` at root = stream the whole tree depth-first
   - `quit` / `q` → stop; print the close footer
   - Small sets (≤`L` total) skip the tree entirely and just replay cards.

6. **Close.** Print a one-line footer: `↺ replayed <N> commits · <first hash>..<last hash>`.
   With `--narrate`, precede it with a 2-3 sentence arc retrospective: what the
   project moved through across this span.

## Span units (`<n>c`, `<d>d`, `<w>w`, `<m>m`)

A convenient way to say "the last month / two weeks / 30 days" instead of a raw
commit count. The unit only sets the **span**; the recursive outline (step 5)
then chapters whatever falls inside it, exactly as for a bare `n`.

- **Parse** `^(\d+)\s*([cdwmqy])?$`: a count plus an optional unit, default `c`.
  `c`=commits, `d`=days, `w`=weeks, `m`=months, `q`=quarters, `y`=years.
- **`c` = commit count** -- identical to bare `n` (last `n` commits).
- **Time units select a span, measured back from the newest commit** (not
  wall-clock now, so an idle repo still yields "its last month of work"):
  compute the cutoff = newest commit date − the span, then keep spine commits at
  or after it. Do this **in-memory on the fetched spine's `%ad` field** (or as
  the up-front `--since` on the step-2 fetch) -- never as a per-bucket
  re-window (the step-2 hash-not-dates rule).
- **Then chapter recursively.** The selected slice becomes the root node: run
  step 5 on it (`1m` → weeks → days → cards; `2w` → days → cards; `30d` → days →
  cards). If the slice is already ≤`L`, just replay cards.
- **Label the span** in the overview (step 3), e.g.
  `── last 1 month · 2026-06-18 → 2026-07-18 · 146 commits ──`.
- Combine with `--author`/`--grep`/`--path` to scope the span further.

## Resume (`--resume`)

A digression shouldn't lose your place. The current position is bookmarked in a
**per-repo, untracked state file inside the git dir**, so it survives across
sessions and context resets.

- **State file path** (handles worktrees correctly):
  `state="$(git rev-parse --absolute-git-dir)/git-replay-state"` -- write with
  the `Write` tool, read with `cat "$state"`.
- **Write it after every navigation move** (descend / `up` / `next` / `prev`,
  and each card index in a leaf or `--step`). Store one small line, e.g.:
  `path=2026-04/04-26/g1  card=3  scope=all  flags=--narrate`
  (`path` = the breadcrumb from root; `card` = last card index in a leaf, or `-`
  at a TOC; `scope`/`flags` = the original invocation so resume rebuilds the same
  spine).
- **`/git-replay --resume`**: read the state file. If present, rebuild the spine
  from the saved `scope`/`flags`, walk to the saved `path`, and re-render that
  node -- its overview + TOC, or (if a leaf/step) the card at `card` -- then
  continue as normal. If the saved `path` no longer resolves (e.g. history was
  rewritten), fall back to the nearest surviving ancestor and say so.
- **No state file** → say "no saved position" and start at `root`.
- A fresh `/git-replay` *without* `--resume` resets the bookmark to the new
  starting node (root, or the leaf for a small set).

## Step mode (`--step`)

Interactive slideshow across turns. Show **exactly one card**, then stop and
wait. Track your position in the conversation (you remember the last index shown).

- Open with the **overview** (step 3), then a one-line banner:
  `Replaying <N> commits — next · back · jump k · quit`.
- Show card `1/N`, then stop.
- On the user's next message, advance:
  - `next` / `n` / Enter / empty → next card
  - `back` / `b` → previous card
  - `jump k` → card k
  - `quit` / `q` / `done` → stop; print the close footer
- At the last card, say so and offer `quit` or `jump`.

## Notes

- Read-only. Never stages, commits, or mutates anything.
- If the repo has zero commits or `n` exceeds the total, say so and replay what
  exists rather than erroring.
- **Never blind-dump a large history.** If a node exceeds `L` commits, show its
  recursive outline (step 5), not a wall of cards. The user descends explicitly,
  or types `cards` / `all` to opt into full rendering.
- `--step` composes with the tree: inside a leaf (or after `cards`), it paces the
  cards one per turn; at a TOC, the outline navigation verbs drive it.
