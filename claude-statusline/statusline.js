#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

// --- input ---
const input = readJSON(0); // stdin
const sessionId = String(input.session_id ?? "").trim();
const sessionName = String(input.session_name ?? "").trim();
const model = input.model || {};
// Claude Code sends `effort: { level }` (low | medium | high | xhigh | max)
// only for models that support effort levels; the block is absent otherwise.
const effortLevel = String(input.effort?.level ?? "").trim();
const effort = effortLevel ? ` \x1b[94m${effortLevel}\x1b[0m` : "";
const name = `\x1b[95m${String(model.display_name ?? "").trim()}\x1b[0m${effort}`;

// --- helpers ---
function readJSON(fd) {
  try {
    return JSON.parse(fs.readFileSync(fd, "utf8"));
  } catch {
    return {};
  }
}
// Number(null) is 0, which would read as a real value; absent must stay NaN.
const toNumber = (v) => (v == null ? NaN : Number(v));
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

function inputTotal(u) {
  return (
    (u?.input_tokens ?? 0) +
    (u?.cache_read_input_tokens ?? 0) +
    (u?.cache_creation_input_tokens ?? 0)
  );
}

// --- context window ---
// Claude Code supplies `context_window.current_usage` (the usage block of the
// newest main-context API response) and `context_window_size` directly, so no
// transcript walk is needed.  Reported as input + cache_read + cache_creation,
// the input-only formula behind Claude Code's own used_percentage, computed
// here to keep the decimal place.
// Every label below returns "" when Claude Code does not supply its field, so
// the segment disappears along with its separator.
function contextLabel() {
  const cw = input?.context_window;
  const size = Number(cw?.context_window_size);
  if (!cw || !Number.isFinite(size) || size <= 0) return "";
  const used = inputTotal(cw.current_usage);
  if (used === 0) {
    // current_usage is also null after /compact until the next API call;
    // prompt_cache tells the two apart, since it follows the first response.
    return input?.prompt_cache
      ? "\x1b[36mcontext updates after the next response.\x1b[0m"
      : "\x1b[36mcontext usage starts after your first question.\x1b[0m";
  }
  const pct = Math.round((used * 1000) / size) / 10;
  return (
    `${color(pct)}context ${pct.toFixed(1)}%\x1b[0m - ` +
    `\x1b[33m(${comma(used)}/${compact(size)})\x1b[0m`
  );
}

// --- prompt cache ---
// Claude Code re-runs the status line when a warm cache reaches expires_at, so
// `warm` flips to Uncached on its own while the session sits idle.
// prompt_cache is absent after a resume until the first response, but the
// cache itself outlives the process, so each session's expires_at is kept in
// CACHE_STATE ({ session_id: expires_at }) to bridge that gap.
const CACHE_STATE = path.join(os.homedir(), ".claude", "statusline-cache.json");
const CACHED = "\x1b[32mCached\x1b[0m";

// Rewrites the whole file, dropping expired entries, so it never grows.
function saveCacheExpiry(state, now, expires) {
  const live = Object.entries(state).filter(
    ([id, t]) => id !== sessionId && t > now
  );
  if (Number.isFinite(expires)) live.push([sessionId, expires]);
  const tmp = `${CACHE_STATE}.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(live)));
  fs.renameSync(tmp, CACHE_STATE);
}

function cacheLabel() {
  const state = readJSON(CACHE_STATE);
  const now = Date.now() / 1000;
  const warm = input?.prompt_cache?.warm;
  if (warm == null) return state[sessionId] > now ? CACHED : "";
  const expires = warm ? toNumber(input.prompt_cache.expires_at) : NaN;
  const known = Number.isFinite(expires) ? expires : undefined;
  if (known !== state[sessionId]) saveCacheExpiry(state, now, expires);
  return warm ? CACHED : "\x1b[33mUncached\x1b[0m";
}

// --- rate-limit labels (appear after first API response) ---
// Shows the percentage *remaining* (100 - used); color still tracks usage.
// Which windows exist depends on the plan: Ultra has no five_hour window, and
// spend_limit is only for Claude apps gateway users.
function rateLimitLabel(window, label) {
  const p = toNumber(window?.used_percentage);
  if (!Number.isFinite(p)) return "";
  const remaining = 100 - p;
  let suffix = "";
  const resetsAt = Number(window?.resets_at);
  if (Number.isFinite(resetsAt)) {
    const hrs = (resetsAt * 1000 - Date.now()) / 3_600_000;
    if (hrs > 0) {
      suffix = hrs >= 24 ? ` (${(hrs / 24).toFixed(1)}d)` : ` (${hrs.toFixed(1)}h)`;
    }
  }
  return `${color(p)}${label} ${remaining.toFixed(0)}%${suffix}\x1b[0m`;
}

// --- session cost ---
// Claude Code exposes no remaining-credit balance to the status line, only
// this client-side estimate of the current session's spend (cost.total_cost_usd).
// It prices tokens at standard per-token API rates with no knowledge of the Max
// subscription, so it reads as "what this session would cost at pay-as-you-go API
// rates" -- i.e. the on-demand bill Max avoids. Shown in neutral cyan -- it is a
// running total, not a percentage, so the usage color scale does not apply.
function costLabel() {
  const c = toNumber(input?.cost?.total_cost_usd);
  if (!Number.isFinite(c)) return "";
  return `\x1b[36m~$${c.toFixed(2)} if API\x1b[0m`;
}

// "remaining: " belongs to whichever window comes first, so it is attached
// only after the absent windows are dropped.
function rateLimitLabels() {
  const rl = input?.rate_limits;
  const windows = [
    rateLimitLabel(rl?.five_hour, "5h"),
    rateLimitLabel(rl?.seven_day, "weekly"),
    rateLimitLabel(rl?.spend_limit, "spend"),
  ].filter(Boolean);
  return windows.length ? `remaining: ${windows.join(" | ")}` : "";
}

function statusLine() {
  const usage = [contextLabel(), cacheLabel(), rateLimitLabels()]
    .filter(Boolean)
    .join(" - ");
  return [name, usage, costLabel()].filter(Boolean).join(" | ");
}

// --- session line ---
// The PR number is skipped when the session name already carries it.
function prLabel() {
  const n = toNumber(input?.pr?.number);
  if (!Number.isInteger(n)) return "";
  if (new RegExp(`(^|\\D)${n}(\\D|$)`).test(sessionName)) return "";
  return `\x1b[36m${input.pr.kind === "mr" ? `MR !${n}` : `PR #${n}`}\x1b[0m`;
}

function sessionLine() {
  const id = sessionId ? `\x1b[90m${sessionId}\x1b[0m` : "";
  return `session: ${[sessionName, prLabel(), id].filter(Boolean).join(" | ")}`;
}

// --- print ---
console.log(`${statusLine()}\n${sessionLine()}`);
