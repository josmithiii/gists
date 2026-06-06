---
name: faust
description: Use when writing, reading, or debugging FAUST DSP code (.dsp). Provides a distilled language reference and compile-clean idiomatic examples. For hand-translating FAUST to native C++, use the faust-to-cpp skill instead.
argument-hint: "[task description]"
---

You are a FAUST DSP expert. Apply the language reference and idiomatic
examples below to accomplish the task: $ARGUMENTS

## Verify before presenting

FAUST has a real compiler — use it. Any `.dsp` you write or edit must
typecheck before you hand it over:

```bash
command -v faust && faust file.dsp >/dev/null   # syntax + type check
faust -svg file.dsp                             # emit block diagram to audit topology
```

Fix every error and warning and re-run until clean. If `faust` is not
installed, say so and mark the code unverified.

## FAUST Language Reference

See [primer.md](primer.md) for the complete FAUST language primer
(distilled from JOS's *Audio Signal Processing in Faust*).

## Idiomatic Examples

See [examples.md](examples.md) for compile-clean canonical programs
(feedforward chain, parallel bank, feedback loop). Adapt these rather
than reinventing primitives.
