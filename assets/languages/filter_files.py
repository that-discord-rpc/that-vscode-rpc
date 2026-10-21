#!/usr/bin/env python3
"""
Filter files in the current working directory by character sequence or by name list.

Flow:
  1) Action:  KEEP matches (delete the rest)  OR  DELETE matches (keep the rest)
  2) Mode:    beginning / contain / end / list
  3) Filter:  the character sequence X, OR a block of filenames (mode=list)
  4) Safety:  move matches to _deleted/  OR  delete permanently

The running script is always protected from deletion.
"""

import os
import shutil
import sys

PROTECTED = {os.path.basename(__file__)}
TRASH_DIR = "_deleted"


# ---------------------------------------------------------------------------
# Input helpers
# ---------------------------------------------------------------------------

def get_action() -> str:
    """Ask whether to KEEP matches or DELETE matches."""
    print("What should happen to files that MATCH your filter?")
    print("  1) KEEP   matches  → delete everything else")
    print("  2) DELETE matches  → keep everything else")
    while True:
        choice = input("Choose action [1/2] (or type 'keep'/'delete'): ").strip().lower()
        if choice in ("1", "keep"):
            return "keep"
        if choice in ("2", "delete"):
            return "delete"
        print("  ✗ Invalid. Enter 1, 2, keep, or delete.")


def get_mode() -> str:
    valid = {"beginning", "contain", "end", "list"}
    while True:
        mode = input("Match mode (beginning / contain / end / list): ").strip().lower()
        if mode in valid:
            return mode
        print(f"  ✗ Invalid. Choose one of: {', '.join(sorted(valid))}")


def get_filter_string() -> str:
    """Single-line character sequence (for beginning/contain/end)."""
    while True:
        x = input("Filter string (X): ")
        if x:
            return x
        print("  ✗ Filter string cannot be empty.")


def get_name_list() -> set:
    """
    Read filenames until a blank line is entered.

    Accepts:
      - one name per line, OR
      - many names on a single line separated by spaces / commas / tabs
      - or any mix of the above

    Ends when the user enters an empty line.
    """
    print("\nPaste filenames (one per line, or all on one line).")
    print("Blank line = done. Commas, spaces, and tabs all work as separators.\n")

    names = set()
    while True:
        try:
            line = input()
        except EOFError:
            break

        if line.strip() == "":
            # First blank line ends input
            break

        # Split on commas, whitespace, tabs — handles all layouts
        for token in line.replace(",", " ").split():
            token = token.strip()
            if token:
                names.add(token)

    return names


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

def matches(filename: str, mode: str, x) -> bool:
    """
    True if filename matches the rule.
      beginning / contain / end → character-sequence matching against x (a string)
      list                      → exact membership in x (a set of names)
    """
    if mode == "beginning":
        return filename.startswith(x)
    if mode == "contain":
        return x in filename
    if mode == "end":
        return filename.endswith(x)
    if mode == "list":
        return filename in x
    return False


def confirm(prompt: str) -> bool:
    while True:
        ans = input(f"{prompt} [y/N]: ").strip().lower()
        if ans in ("y", "yes"):
            return True
        if ans in ("", "n", "no"):
            return False
        print("  ✗ Please answer y or n.")


def choose_safety() -> str:
    """Ask how to handle the files slated for deletion."""
    print("\nHow should deletion be handled?")
    print(f"  1) Move to {TRASH_DIR}/   (reversible)")
    print("  2) Delete permanently   (not reversible)")
    while True:
        choice = input("Choose [1/2]: ").strip().lower()
        if choice in ("1", "move", "trash"):
            return "move"
        if choice in ("2", "delete", "permanent"):
            return "delete"
        print("  ✗ Invalid. Enter 1 or 2.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    cwd = os.getcwd()
    print(f"Working directory: {cwd}")
    print(f"Protected from deletion: {', '.join(sorted(PROTECTED))}\n")

    action = get_action()
    mode = get_mode()

    if mode == "list":
        names = get_name_list()
        if not names:
            print("No filenames provided. Nothing to do.")
            return
        x = names
    else:
        x = get_filter_string()

    entries = [e for e in os.listdir(cwd) if os.path.isfile(os.path.join(cwd, e))]

    if not entries:
        print("No files in this directory. Nothing to do.")
        return

    to_keep = []
    to_delete = []

    for f in entries:
        if f in PROTECTED:
            to_keep.append((f, "protected"))
            continue

        is_match = matches(f, mode, x)

        if action == "keep":
            if is_match:
                to_keep.append((f, "match"))
            else:
                to_delete.append((f, "no match"))
        else:  # action == "delete"
            if is_match:
                to_delete.append((f, "match"))
            else:
                to_keep.append((f, "no match"))

    # ---- Summary ----
    print()
    print("=" * 60)
    print(f"Action : {action.upper()} matching files")
    if mode == "list":
        print(f"Mode   : list ({len(x)} name(s))")
    else:
        print(f"Mode   : {mode}")
        print(f"Filter : {x!r}")
    print("=" * 60)

    print(f"\n  ✓ KEEP ({len(to_keep)}):")
    for f, reason in to_keep:
        print(f"      {f}   [{reason}]")

    print(f"\n  ✗ DELETE ({len(to_delete)}):")
    for f, reason in to_delete:
        print(f"      {f}   [{reason}]")

    if not to_delete:
        print("\nNothing to delete. Exiting.")
        return

    # ---- Final confirmation ----
    print()
    if not confirm(f"Proceed with the {len(to_delete)} file(s) listed above?"):
        print("Aborted. No files were deleted.")
        return

    # ---- Safety: move vs permanent ----
    safety = choose_safety()

    if safety == "move":
        os.makedirs(TRASH_DIR, exist_ok=True)

    moved = deleted = failed = 0
    for f, _ in to_delete:
        src = os.path.join(cwd, f)
        try:
            if safety == "move":
                shutil.move(src, os.path.join(TRASH_DIR, f))
                moved += 1
            else:
                os.remove(src)
                deleted += 1
        except OSError as e:
            print(f"  ✗ Failed on {f}: {e}")
            failed += 1

    print()
    if safety == "move":
        print(f"Done. Moved {moved} file(s) to {TRASH_DIR}/.")
    else:
        print(f"Done. Permanently deleted {deleted} file(s).")
    if failed:
        print(f"  Failed: {failed}.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted. No further files were changed.")
        sys.exit(130)
