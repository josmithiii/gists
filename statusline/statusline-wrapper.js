#!/bin/bash
input=$(cat)

# Your existing info
user_host="$(whoami)@$(hostname -s):$(basename "$(pwd)")"
branch=$(git branch --show-current 2>/dev/null | sed 's/.*/(&)/')

# New script (pipe same input)
context_info=$(echo "$input" | ~/.claude/statusline.js)

printf "%s %s %s" "$user_host" "$branch" "$context_info"
