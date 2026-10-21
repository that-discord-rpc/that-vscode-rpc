#!/usr/bin/env python3
"""
Rename files in the current directory by replacing a character sequence.

Asks the user:
  1) What to find       (X)
  2) What to replace it with (Y)  — leave blank to remove X
  3) Where to match     (beginning / contain / end)

Matching is purely character-based (no word splitting).
Only files are renamed; the running script protects itself.
"""

import os
import sys


PROTECTED = {os.path.basename(__file__)}


# --- Prompts ---------------------------------------------------------------

def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    answer = input(f"{prompt}{suffix}: ")
    return answer if answer else default


def ask_find() -> str:
    while True:
        x = ask("Find (X)")
        if x:
            return x
        print("  ✗ The find string cannot be empty.")


def ask_replace() -> str:
    """Replacement string. Blank = remove X entirely."""
    y = ask("Replace with (blank = remove)")
    return y


def ask_where() -> str:
    valid = {"beginning", "contain", "end"}
    while True:
        where = ask("Match location (beginning / contain / end)").strip().lower()
        if where in valid:
            return where
        print("  ✗ Enter beginning, contain, or end.")


def ask_yes_no(prompt: str, default: bool = True) -> bool:
    d = "Y/n" if default else "y/N"
    answer = input(f"{prompt} [{d}]: ").strip().lower()
    if not answer:
        return default
    return answer in ("y", "yes")


# --- Rename logic ----------------------------------------------------------

def rename_one(name: str, find: str, replace: str, where: str) -> str | None:
    """
    Return the new filename, or None if the file doesn't match.
    Character-based only — no word splitting.

    where == "beginning" : name must start with `find`
    where == "contain"   : `find` must appear somewhere in `name`
    where == "end"       : name must end with `find`
    """
    if where == "beginning":
        if not name.startswith(find):
            return None
        return replace + name[len(find):]

    if where == "end":
        if not name.endswith(find):
            return None
        return name[: -len(find)] + replace

    # contain — replace the FIRST occurrence only, matching typical editors
    idx = name.find(find)
    if idx == -1:
        return None
    return name[:idx] + replace + name[idx + len(find):]


def resolve_collisions(plan: dict) -> dict:
    """
    plan: { old_name: new_name }
    Detect two cases:
      1. Target already exists on disk (and isn't one of the files being renamed)
      2. Two different files want to become the same name
    Returns a cleaned plan with conflicting entries dropped.
    """
    existing = set(os.listdir("."))
    # Files that are being renamed away are allowed to be overwritten
    moving_away = set(plan.keys())

    targets = {}
    conflicts = []

    for old, new in plan.items():
        # Case 1: target already exists and isn't moving
        if new in existing and new not in moving_away:
            conflicts.append((old, new, "target already exists"))
            continue
        # Case 2: two files map to the same target
        if new in targets:
            conflicts.append((old, new, f"already claimed by {targets[new]}"))
            continue
        targets[new] = old

    for old, new, reason in conflicts:
        plan.pop(old, None)
        print(f"  ⚠ Skipping {old} → {new}: {reason}")

    return plan


# --- Main ------------------------------------------------------------------

def main() -> None:
    cwd = os.getcwd()
    print(f"Working directory: {cwd}")
    print(f"Protected from rename: {', '.join(sorted(PROTECTED))}\n")

    find    = ask_find()
    replace = ask_replace()
    where   = ask_where()

    entries = sorted(
        f for f in os.listdir(cwd)
        if os.path.isfile(os.path.join(cwd, f))
        and f not in PROTECTED
    )

    plan = {}
    for name in entries:
        new = rename_one(name, find, replace, where)
        if new is not None and new != name and new:
            plan[name] = new

    if not plan:
        print("\nNo files matched.")
        return

    # Handle collisions before showing the plan
    print()
    plan = resolve_collisions(plan)

    if not plan:
        print("Nothing left to rename after collision checks.")
        return

    # --- Preview ---
    print("=" * 60)
    print(f"Find       : {find!r}")
    print(f"Replace    : {replace!r}" + ("  (remove)" if replace == "" else ""))
    print(f"Where      : {where}")
    print("=" * 60)
    print(f"\n{len(plan)} file(s) will be renamed:\n")
    for old, new in plan.items():
        print(f"  {old}")
        print(f"  → {new}\n")

    if not ask_yes_no("Proceed?", default=True):
        print("Aborted. Nothing renamed.")
        return

    ok, fail = 0, 0
    for old, new in plan.items():
        try:
            os.rename(old, new)
            ok += 1
        except OSError as e:
            print(f"  ✗ Failed: {old} → {new} ({e})")
            fail += 1

    print(f"\nDone. {ok} renamed, {fail} failed.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted. No further files renamed.")
        sys.exit(130)

