#!/usr/bin/env node
"use strict";

const fs = require("fs");

// --- input ---
const input = readJSON(0); // stdin
const sessionId = `\x1b[90m${String(input.session_id ?? "")}\x1b[0m`;
const model = input.model || {};
// Claude Code sends `effort: { level }` (low | medium | high | xhigh | max)
// only for models that support effort levels; the block is absent otherwise.
const effortLevel = String(input.effort?.level ?? "").trim();
const effort = effortLevel ? ` \x1b[94m${effortLevel}\x1b[0m` : "";
const name = `\x1b[95m${String(model.display_name ?? "").trim()}\x1b[0m${effort}`;

// Printed (in red) wherever Claude Code omitted a field it normally supplies,
// e.g. rate limits during a usage-service outage -- loud, not silent.
const UNAVAILABLE = "\x1b[31m<unavailable>\x1b[0m";

// --- helpers ---
function readJSON(fd) {
  try {
    return JSON.parse(fs.readFileSync(fd, "utf8"));
  } catch {
    return {};
  }
}
function color(p) {
  if (p >= 90) return "\x1b[31m"; // red
  if (p >= 70) return "\x1b[33m"; // yellow
  return "\x1b[32m"; // green
}
const comma = (n) =>
  new Intl.NumberFormat("en-US").format(
    Math.max(0, Math.floor(Number(n) || 0))
  );
// 1000000 -> "1M", 200000 -> "200K", 12345 -> "12,345"
function compact(n) {
  n = Math.max(0, Math.floor(Number(n) || 0));
  const trim = (x) => String(Number(x.toFixed(1)));
  if (n >= 1e6) return `${trim(n / 1e6)}M`;
  if (n >= 1e3) return `${trim(n / 1e3)}K`;
  return comma(n);
}

function usedTotal(u) {
  return (
    (u?.input_tokens ?? 0) +
    (u?.output_tokens ?? 0) +
    (u?.cache_read_input_tokens ?? 0) +
    (u?.cache_creation_input_tokens ?? 0)
  );
}

// --- context window ---
// Claude Code supplies `context_window.current_usage` (the usage block of the
// newest main-context API response) and `context_window_size` directly, so no
// transcript walk is needed.  Reported as input + output + cache_read +
// cache_creation, i.e. everything that occupied the window on the last turn.
function contextLabel() {
  const cw = input?.context_window;
  const size = Number(cw?.context_window_size);
  if (!cw || !Number.isFinite(size) || size <= 0) {
    return `context ${UNAVAILABLE}`;
  }
  const used = usedTotal(cw.current_usage);
  if (used === 0) {
    return "\x1b[36mcontext usage starts after your first question.\x1b[0m";
  }
  const pct = Math.round((used * 1000) / size) / 10;
  return (
    `${color(pct)}context ${pct.toFixed(1)}%\x1b[0m - ` +
    `\x1b[33m(${comma(used)}/${compact(size)})\x1b[0m`
  );
}

// --- rate-limit labels (Pro/Max; appear after first API response) ---
// Shows the percentage *remaining* (100 - used); color still tracks usage.
// `required` windows print <unavailable> when missing; optional ones
// (spend_limit, only for Claude apps gateway users) are simply omitted.
function rateLimitLabel(window, label, sep, required) {
  const p = Number(window?.used_percentage);
  if (!Number.isFinite(p)) return required ? `${sep}${label} ${UNAVAILABLE}` : "";
  const remaining = 100 - p;
  let suffix = "";
  const resetsAt = Number(window?.resets_at);
  if (Number.isFinite(resetsAt)) {
    const hrs = (resetsAt * 1000 - Date.now()) / 3_600_000;
    if (hrs > 0) {
      suffix = hrs >= 24 ? ` (${(hrs / 24).toFixed(1)}d)` : ` (${hrs.toFixed(1)}h)`;
    }
  }
  return `${sep}${color(p)}${label} ${remaining.toFixed(0)}%${suffix}\x1b[0m`;
}

// --- session cost ---
// Claude Code exposes no remaining-credit balance to the status line, only
// this client-side estimate of the current session's spend (cost.total_cost_usd).
// It prices tokens at standard per-token API rates with no knowledge of the Max
// subscription, so it reads as "what this session would cost at pay-as-you-go API
// rates" -- i.e. the on-demand bill Max avoids. Shown in neutral cyan -- it is a
// running total, not a percentage, so the usage color scale does not apply.
function costLabel(sep) {
  const c = Number(input?.cost?.total_cost_usd);
  if (!Number.isFinite(c)) return `${sep}cost ${UNAVAILABLE}`;
  return `${sep}\x1b[36m~$${c.toFixed(2)} if API\x1b[0m`;
}

function rateLimitLabels() {
  const rl = input?.rate_limits;
  return (
    rateLimitLabel(rl?.five_hour, "5h", " - remaining: ", true) +
    rateLimitLabel(rl?.seven_day, "weekly", " | ", true) +
    rateLimitLabel(rl?.spend_limit, "spend", " | ", false) +
    costLabel(" | ")
  );
}

// --- print ---
console.log(`${name} | ${contextLabel()}${rateLimitLabels()}\nsession: ${sessionId}`);
