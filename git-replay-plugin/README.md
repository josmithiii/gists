# git-replay

A Claude Code skill that replays a repository's commit messages as a
forward-moving story — oldest to newest — instead of a flat `git log` dump.

## What it does

- **Overview prologue.** Before any commits, a short framing of what you're
  about to walk through. For the whole history it's an intro to the project;
  for a scoped slice it summarizes just that slice.
- **One card per commit.** Each commit is rendered as its own card with a
  `k/total` progress counter and the *full* message body, in chronological
  (replay) order.
- **Recursive outline for large histories.** A big history isn't dumped as a
  wall of text — it's chaptered into a navigable tree that splits by the finest
  calendar grain giving ≤10 chunks (`month → week → day`), recursing until every
  leaf is ≤10 commits, where the cards render. Each chunk gets its own mini
  overview.
- **Bookmark / resume.** Your position is saved per-repo (inside the git dir), so
  `--resume` picks up exactly where you left off after any digression.

## Usage

```
/git-replay              # the whole project, start to now
/git-replay 20           # last 20 commits
/git-replay 20c          # same (c = commits)
/git-replay 1m           # the last month, auto-chaptered
/git-replay 2w           # the last two weeks
/git-replay 30d          # the last 30 days
/git-replay --resume     # re-enter where you left off
```

### Flags

| Flag | Effect |
|------|--------|
| `--resume` | Restore the saved outline position for this repo. |
| `--step` | Interactive slideshow — one commit per turn (`next` / `back` / `jump k` / `quit`). |
| `--narrate` | Add connective lines between cards + a closing arc retrospective. |
| `--stat` | Per-commit files-changed / insertions / deletions. |
| `--newest-first` | Reverse the order (most recent first). |
| `--author X` `--since X` `--grep X` `--path X` | Scope the replay (passed to `git log`). |

### Span units

The positional argument is a count with an optional unit suffix (space optional):
`c` = commits (default), `d` = days, `w` = weeks, `m` = months, `q` = quarters,
`y` = years. A time unit selects a span measured back from the newest commit,
then the recursive outline chapters whatever falls inside it.

## Install

```
/plugin marketplace add josmithiii/gists
/plugin install git-replay@josmithiii-gists
```

Read-only: the skill never stages, commits, or mutates anything (its only write
is a small untracked bookmark file inside the repo's git dir).

## License

MIT
