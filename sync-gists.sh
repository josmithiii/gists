#!/bin/bash -fx

# sync-gists — replace existing files in each gist with local copies.
# Note: `gh gist edit -a` only ADDS new files; use `--filename <name> <path>`
# to replace an existing file. One invocation per file.

# voice
VOICE=607f6090dd9599763d6cc109280abe63
gh gist edit "$VOICE" --filename voice voice/voice

# claude-statusline
STATUSLINE=72bb219437e881521e72028bf01bb99a
gh gist edit "$STATUSLINE" --filename README.md             claude-statusline/README.md
gh gist edit "$STATUSLINE" --filename statusline.js         claude-statusline/statusline.js
gh gist edit "$STATUSLINE" --filename statusline-wrapper.js claude-statusline/statusline-wrapper.js

# add more gists here
