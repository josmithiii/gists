# handoff

A Claude Code skill that compacts the current session into a handoff document a
fresh agent can resume from cold -- written to the **repo root**, named
`HandoffPrompt-<YYYY-MM-DD>-<Topic>.md`.

## What it does

- **Repo root, not a temp dir.** Destination is `git rev-parse --show-toplevel`,
  so the handoff lives next to the work it describes. Outside a repo it falls
  back to the current directory and says so.
- **Dated, topical filenames.** `HandoffPrompt-2026-07-20-Filters-M7.md`,
  `HandoffPrompt-2026-07-18-Sim-SM4.md`. The date comes from `date +%F` -- never
  guessed. An existing name is never overwritten; the topic gets narrowed
  instead.
- **Follows the repo's tracking precedent.** Some projects track their handoffs,
  some deliberately do not. The skill checks `git ls-files` / `git check-ignore`
  and follows what the repo already does. It **never stages or commits** -- if
  the repo tracks handoffs, it just hands you the `git add` line.
- **A structure built for resumption.** Where things stand (done / committed /
  pushed, with SHAs) -> the next task, by plan reference -> blast radius, marked
  as a re-grep-first snapshot -> **traps already paid for** -> invariants that
  must stay green, each with its check command -> pointers to plans and memory.
- **References instead of copies.** Plans, specs, diffs, and issues are linked by
  path or URL, so the handoff does not go stale the moment it is written.
- **Suggested next skills**, plus the first command the next session should run.

## Usage

```
/handoff                                  # infer the topic from the session
/handoff Filters-M8                       # name the topic explicitly
/handoff Sim-SM4 focus on the bridge fit  # topic + what comes next
```

Everything after the topic slug is treated as the next session's focus, and the
whole document is slanted toward it.

## Install

```
/plugin marketplace add josmithiii/gists
/plugin install handoff@josmithiii-gists
```

The skill is `disable-model-invocation: true` -- only you can trigger it by
typing `/handoff`. Its only write is the handoff file itself.

## Credits

The idea, and a few of its rules (suggested-skills section, reference rather than
duplicate existing artifacts, redact secrets), come from Matt Pocock's `handoff`
skill in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT). This
version rewrites the rest around JOS's conventions: repo-root output, dated
`HandoffPrompt-` naming, per-repo tracking precedent, and a document structure
taken from his existing handoffs.

## License

MIT
