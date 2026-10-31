"""Tests for claude-statusline: fields, omission of absent ones, and the path prefix."""

import json
import re
import subprocess
from pathlib import Path
from typing import Any

import pytest

SCRIPT: Path = Path(__file__).parent.parent / "claude-statusline" / "statusline.js"
WRAPPER: Path = SCRIPT.with_name("statusline-wrapper.js")
ANSI: re.Pattern[str] = re.compile(r"\x1b\[[0-9;]*m")

CONTEXT: dict[str, Any] = {
    "context_window_size": 1_000_000,
    "current_usage": {"input_tokens": 39_541},
}
WINDOW: dict[str, int] = {"used_percentage": 18}


def run_lines(payload: dict[str, Any]) -> list[str]:
    """Run the status line on `payload`; return its output lines without colors."""
    result = subprocess.run(
        ["node", str(SCRIPT)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        check=True,
    )
    return ANSI.sub("", result.stdout).splitlines()


def first_line(payload: dict[str, Any]) -> str:
    return run_lines(payload)[0]


def second_line(payload: dict[str, Any]) -> str:
    return run_lines(payload)[1]


def wrapper_path(cwd: Path) -> str:
    """Run the wrapper in `cwd`; return the path from its `user@host:path` prefix."""
    result = subprocess.run(
        ["bash", str(WRAPPER)],
        input="{}",
        cwd=cwd,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.split(" ", 1)[0].split(":", 1)[1]


def test_all_fields_present() -> None:
    line = first_line(
        {
            "model": {"display_name": "Opus 5.5"},
            "context_window": CONTEXT,
            "rate_limits": {"five_hour": WINDOW, "seven_day": WINDOW},
            "cost": {"total_cost_usd": 0.1},
        }
    )
    assert line == (
        "Opus 5.5 | context 4.0% - (39,541/1M) - "
        "remaining: 5h 82% | weekly 82% | ~$0.10 if API"
    )


def test_no_five_hour_window_moves_remaining_to_weekly() -> None:
    line = first_line(
        {
            "model": {"display_name": "Opus 5.5"},
            "context_window": CONTEXT,
            "rate_limits": {"seven_day": WINDOW},
            "cost": {"total_cost_usd": 0.1},
        }
    )
    assert line == (
        "Opus 5.5 | context 4.0% - (39,541/1M) - remaining: weekly 82% | ~$0.10 if API"
    )


def test_no_rate_limits_drops_remaining() -> None:
    line = first_line(
        {
            "model": {"display_name": "Opus 5.5"},
            "context_window": CONTEXT,
            "cost": {"total_cost_usd": 0.1},
        }
    )
    assert line == "Opus 5.5 | context 4.0% - (39,541/1M) | ~$0.10 if API"


def test_no_context_leaves_no_dangling_separator() -> None:
    line = first_line(
        {
            "model": {"display_name": "Opus 5.5"},
            "rate_limits": {"seven_day": WINDOW},
            "cost": {"total_cost_usd": 0.1},
        }
    )
    assert line == "Opus 5.5 | remaining: weekly 82% | ~$0.10 if API"


def test_only_model() -> None:
    assert first_line({"model": {"display_name": "Opus 5.5"}}) == "Opus 5.5"


def test_null_fields_count_as_absent() -> None:
    line = first_line(
        {
            "model": {"display_name": "Opus 5.5"},
            "rate_limits": {"five_hour": None, "seven_day": {"used_percentage": None}},
            "cost": {"total_cost_usd": None},
        }
    )
    assert line == "Opus 5.5"


def test_unavailable_is_never_printed() -> None:
    assert "unavailable" not in SCRIPT.read_text()


def test_output_tokens_do_not_count_toward_context() -> None:
    usage = {"input_tokens": 39_541, "output_tokens": 500_000}
    line = first_line(
        {"context_window": {"context_window_size": 1_000_000, "current_usage": usage}}
    )
    assert "context 4.0% - (39,541/1M)" in line


def test_before_first_response_and_after_compact_differ() -> None:
    empty = {"context_window_size": 1_000_000, "current_usage": None}
    assert "after your first question" in first_line({"context_window": empty})
    compacted = first_line({"context_window": empty, "prompt_cache": {"warm": True}})
    assert "context updates after the next response." in compacted
    assert "first question" not in compacted


@pytest.mark.parametrize(("warm", "label"), [(True, "Cached"), (False, "Uncached")])
def test_cache_label_sits_just_before_remaining(warm: bool, label: str) -> None:
    line = first_line(
        {
            "context_window": CONTEXT,
            "prompt_cache": {"warm": warm},
            "rate_limits": {"seven_day": WINDOW},
        }
    )
    assert line.endswith(f"(39,541/1M) - {label} - remaining: weekly 82%")


def test_session_line_has_name_then_pr_then_id() -> None:
    line = second_line(
        {"session_id": "abc", "session_name": "Fix it", "pr": {"number": 123}}
    )
    assert line == "session: Fix it | PR #123 | abc"


def test_pr_number_already_in_session_name_is_skipped() -> None:
    line = second_line(
        {"session_id": "abc", "session_name": "PR 123 review", "pr": {"number": 123}}
    )
    assert line == "session: PR 123 review | abc"


def test_pr_number_inside_a_longer_number_still_shows() -> None:
    line = second_line({"session_name": "Issue 1234", "pr": {"number": 123}})
    assert line == "session: Issue 1234 | PR #123"


def test_gitlab_merge_request_label() -> None:
    assert second_line({"pr": {"number": 7, "kind": "mr"}}) == "session: MR !7"


def test_session_line_with_only_id() -> None:
    assert second_line({"session_id": "abc"}) == "session: abc"


def test_wrapper_shows_full_path_with_home_as_tilde() -> None:
    assert wrapper_path(Path.home()) == "~"


def test_wrapper_shortens_through_root_symlink() -> None:
    assert wrapper_path(Path("/tmp")) == "/tmp"


@pytest.mark.skipif(not Path("/w").is_symlink(), reason="needs the /w symlink")
def test_wrapper_prefers_root_symlink_over_home() -> None:
    assert wrapper_path(Path("/w").resolve()) == "/w"
