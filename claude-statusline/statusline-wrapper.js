#!/bin/bash
input=$(cat)

# Your existing info
# Full path, shortened through root-level symlinks (/w -> /Users/jos/w), then ~
dir=$(pwd -P)
for link in /*; do
  [ -L "$link" ] || continue
  target=$(cd "$link" 2>/dev/null && pwd -P) || continue
  case "$dir/" in
    "$target"/*) dir="$link${dir#"$target"}"; break ;;
  esac
done
dir=${dir/#$HOME/\~}
user_host="$(whoami)@$(hostname -s):$dir"
branch=$(git branch --show-current 2>/dev/null | sed 's/.*/(&)/')

# New script (pipe same input)
context_info=$(echo "$input" | ~/.claude/statusline.js)

printf "%s %s %s" "$user_host" "$branch" "$context_info"
