---
name: handoff
description: Compact the current session into a HandoffPrompt-<date>-<Topic>.md at the repo root so a fresh agent can pick the work up cold. Use when JOS says "/handoff", "write a handoff", or the session is about to end or be compacted.
argument-hint: "[Topic-Slug] [what the next session should focus on]"
disable-model-invocation: true
allowed-tools: Bash(git rev-parse:*), Bash(git status:*), Bash(git ls-files:*), Bash(git check-ignore:*), Bash(git log:*), Bash(ls:*), Bash(date:*), Read, Grep, Glob, Write
---

Write a handoff document that lets a **fresh agent with zero context** resume
this work without re-deriving it. Write the file, then stop -- do not start the
next milestone in this session.

## 1. Where it goes

Repo root, never a temp dir:

```bash
git rev-parse --show-toplevel        # -> the destination directory
date +%F                             # -> the date; never guess it
```

If not inside a git repo, write to the current working directory and say so.

**Filename:** `HandoffPrompt-<YYYY-MM-DD>-<Topic>.md`

`<Topic>` is PascalCase parts joined by hyphens: area first, then milestone or
sub-topic. Take it from the first argument if one was given, else derive it from
the work. Match the existing names in the repo -- e.g. `Filters-M7`,
`Sim-SM4`, `CalGap-8.6-CollisionWall`, `Geo-StringDisplay-M3`,
`PBass-NearBridge-Calibration`.

If that exact filename already exists, do **not** overwrite it: narrow the topic
(`...-M7` -> `...-M7-Followups`) and say which name you used.

## 2. Tracked or untracked

Some repos track their handoffs, some deliberately do not. **Follow the local
precedent, and never stage or commit** -- leave that to JOS.

```bash
git ls-files 'HandoffPrompt-*.md' | head        # tracked precedent?
git check-ignore -v HandoffPrompt-<name>.md     # ignored by policy?
```

- Existing root handoffs are **tracked** -> say so, and end with the exact
  `git add <file>` line so JOS can commit it with one paste.
- Existing handoffs are **untracked**, or the name is gitignored, or there is no
  precedent -> leave it untracked and say so in one line.

## 3. Sections

Include the sections that carry real information; drop the rest rather than
padding. This is the shape JOS's own handoffs use:

```markdown
# Handoff -- <Topic> <Milestone>

## Where things stand
What is DONE, what is COMMITTED (with SHAs), what is uncommitted, what is
pushed. Name the branch. Say plainly what is verified vs. believed.

## Next: <the actual task>
The concrete objective, with a pointer to the plan section that defines it
(e.g. PLAN.md section 7 M8) rather than a restatement of it.

## Blast radius -- RE-GREP FIRST (snapshot <date>)
Files/symbols the next session will touch, marked as a snapshot to re-verify,
not as truth.

## Traps already paid for (verify, then rely on)
Every dead end, gotcha, and surprise this session bought. This is the highest
value section -- it is what a fresh agent cannot rediscover cheaply.

## Invariants to preserve
Gates, tests, and behaviors that must stay green or bit-exact, with the exact
command that checks each one.

## Plan / memory pointers
Paths to plans, logs, memory files, prior handoffs. Links, not copies.
```

## 4. Rules

- **Reference, do not duplicate.** Plans, specs, ADRs, diffs, issues, and prior
  handoffs get a path or URL. Copying them in makes the doc stale on write.
- **Be specific.** `file.cpp:214`, real SHAs, real commands to paste. No
  "various fixes were made".
- **Separate fact from belief.** Anything you did not actually run or read this
  session gets flagged as unverified.
- **Suggested skills.** Close with a short list of skills the next session
  should invoke (e.g. `/git-commit` to land the pending work), plus the first
  command it should run.
- **Redact secrets** -- keys, tokens, passwords, PII.
- **ASCII output**: `--` not an em dash, `->` not an arrow, straight quotes.
- If arguments were given, treat everything after the topic slug as the next
  session's focus and slant the whole document toward it.

## 5. Report back

One line: the full path written, whether it is tracked or untracked, and the
`git add` line if this repo tracks handoffs.
