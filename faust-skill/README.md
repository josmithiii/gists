# faust — a Claude Code skill for FAUST DSP

A [Claude Code](https://claude.com/claude-code) skill that turns Claude into a
[FAUST](https://faust.grame.fr/) DSP assistant. It bundles a distilled
language reference and a set of **compile-clean** idiomatic examples, and tells
Claude to verify every `.dsp` it writes with the FAUST compiler before handing
it over.

The reference is distilled from
[*Audio Signal Processing in FAUST*](https://ccrma.stanford.edu/~jos/aspf/) by
Julius O. Smith III (CCRMA, Stanford University).

## What it does

When you ask Claude to write, read, translate, or debug FAUST code, this skill
loads automatically and gives Claude:

- **`primer.md`** — the FAUST language in one page: elementary blocks,
  composition operators (`:`, `,`, `<:`, `:>`, `~`), notation styles,
  iteration, foreign functions, the standard-library prefixes, and the CLI.
- **`examples.md`** — three canonical, verified programs, each teaching a
  different structural pattern: a parametric EQ (feedforward chain), a modal
  resonator bank (`<: par(...) :>`), and a Karplus–Strong string (feedback
  loop with explicit delay accounting).
- A **verify-before-presenting** workflow: Claude runs `faust file.dsp` to
  typecheck and `faust -svg` to audit topology, and iterates until clean.

## Install

Add this repo as a plugin marketplace, then install the plugin:

```
/plugin marketplace add josmithiii/gists
/plugin install faust@josmithiii-gists
```

The skill then triggers automatically on FAUST-related requests. To verify
generated code locally you also need the FAUST compiler
([install instructions](https://faust.grame.fr/downloads/)); the skill works
without it but will mark code as unverified.

## Manual install (without the plugin system)

Copy the skill directory into your skills folder:

```bash
git clone https://github.com/josmithiii/gists.git /tmp/gists
cp -r /tmp/gists/faust-skill/skills/faust ~/.claude/skills/faust
```

## Related

A companion skill, `faust-to-cpp`, covers hand-translating FAUST to native C++.
It is project-specific to JOS's `jos_dsp` conventions and is not published here.

## License

MIT — see [LICENSE](../LICENSE).
