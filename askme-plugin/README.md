# askme

A Claude Code skill that reads back through the current session, finds every
decision that was deferred, assumed, or left open, and puts the ones that are
yours to make as multiple-choice questions - then carries out what you pick.

## What it does

- **Finds the rulings a long session leaves behind.** Decisions deferred out
  loud ("your call"), assumptions made to keep moving, forks taken without
  asking, work left out or filed for later, things built that you have not
  seen yet (an unsent draft, an unmerged branch), and hard-to-undo process
  steps (ship, merge, send, delete).
- **Skips what it can look up.** Anything a grep or a read would answer, any
  harmless default already applied, and any question whose answer would not
  change the next step.
- **Asks the four that matter most.** Ranked by how much the answer changes,
  one decision per question, two to four real options each, with a
  `(Recommended)` option only when there is a reason for one. If more remain,
  it offers a second round.
- **Acts on the answers.** It applies what you chose, records the ruling where
  the project keeps rulings (tracker item, plan, changelog), and reports each
  question, answer, and action in a few lines.

## Usage

```
/askme
```

Best near the end of a long session, or before you hand work off.

## Install

```
/plugin marketplace add josmithiii/gists
/plugin install askme@josmithiii-gists
```

## Credits

Adapted from Nick Porcaro's `askme` skill for moForte, generalized to any user
and any project.

## License

MIT
