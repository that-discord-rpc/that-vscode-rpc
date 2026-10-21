#!/usr/bin/env python3
"""
Interactive launcher for Inkscape.

Two modes:
  1) Open every .svg in the current folder.
  2) Open only files you list — accepts filenames separated by
     newlines, spaces, and/or commas, in any mix.
"""

import os
import shutil
import subprocess
import sys


INKSCAPE_CANDIDATES = [
    r"C:\Program Files\Inkscape\bin\inkscape.exe",
    r"C:\Program Files (x86)\Inkscape\bin\inkscape.exe",
    "inkscape",
    "inkscape.exe",
]


def find_inkscape() -> str:
    for candidate in INKSCAPE_CANDIDATES:
        if os.path.isabs(candidate) and os.path.isfile(candidate):
            return candidate
        found = shutil.which(candidate)
        if found:
            return found
    print("  ✗ Inkscape not found.")
    print("    Install it, or add inkscape.exe to your PATH.")
    sys.exit(1)


# --- Prompts ---------------------------------------------------------------

def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    answer = input(f"{prompt}{suffix}: ").strip()
    return answer if answer else default


def ask_yes_no(prompt: str, default: bool = True) -> bool:
    d = "Y/n" if default else "y/N"
    answer = input(f"{prompt} [{d}]: ").strip().lower()
    if not answer:
        return default
    return answer in ("y", "yes")


def ask_mode() -> str:
    print("What do you want to open?")
    print("  1) Every .svg in the current folder")
    print("  2) Only specific files I list")
    while True:
        choice = input("Choose [1/2]: ").strip().lower()
        if choice in ("1", "all", "folder"):
            return "folder"
        if choice in ("2", "list", "specific"):
            return "list"
        print("  ✗ Enter 1 or 2.")


def ask_file_list() -> list:
    """
    Read a list of filenames until a blank line is entered.

    Accepts filenames separated by newlines, spaces, commas, or tabs —
    in any combination. Blank line ends input.
    """
    print("\nPaste filenames (one per line, or all on one line).")
    print("Separators allowed: newlines, spaces, commas, tabs.")
    print("Blank line = done.\n")

    names = []
    while True:
        try:
            line = input()
        except EOFError:
            break

        if line.strip() == "":
            break

        # Split on commas and whitespace, keep order, drop empties
        for token in line.replace(",", " ").split():
            token = token.strip()
            if token:
                names.append(token)

    return names


# --- File collection -------------------------------------------------------

def collect_all_svgs(folder: str) -> list:
    return [
        os.path.join(folder, f)
        for f in sorted(os.listdir(folder))
        if f.lower().endswith(".svg")
        and os.path.isfile(os.path.join(folder, f))
    ]


def collect_from_names(folder: str, names: list) -> tuple:
    """
    Resolve each name to a file path in `folder`.
    Returns (found_paths, missing_names).
    """
    found, missing = [], []
    for name in names:
        path = os.path.join(folder, name)
        if os.path.isfile(path):
            found.append(path)
        else:
            missing.append(name)
    return found, missing


# --- Main ------------------------------------------------------------------

def main() -> None:
    print("=== Open SVGs in Inkscape ===\n")

    inkscape = find_inkscape()
    folder = os.getcwd()
    print(f"Inkscape: {inkscape}")
    print(f"Folder  : {folder}\n")

    mode = ask_mode()
    files = []

    if mode == "folder":
        files = collect_all_svgs(folder)
        if not files:
            print("No .svg files in this folder.")
            return
        print(f"\nFound {len(files)} .svg file(s).")
    else:
        names = ask_file_list()
        if not names:
            print("No filenames provided.")
            return
        found, missing = collect_from_names(folder, names)
        files = found
        print(f"\nResolved {len(found)} of {len(names)} file(s).")
        if missing:
            print("Not found:")
            for n in missing:
                print(f"  ✗ {n}")
        if not files:
            print("Nothing to open.")
            return

    # Confirm before launching
    print("\nFiles to open:")
    for f in files:
        print(f"  {os.path.basename(f)}")

    print()
    if not ask_yes_no(f"Open these {len(files)} file(s) in Inkscape?",
                      default=True):
        print("Aborted.")
        return

    # Big-batch warning
    if len(files) > 50:
        print(f"\n⚠  {len(files)} files may freeze or crash Inkscape.")
        if not ask_yes_no("Continue anyway?", default=False):
            print("Aborted.")
            return

    print("\nLaunching Inkscape...")
    try:
        subprocess.Popen([inkscape] + files)
    except OSError as e:
        print(f"  ✗ Failed to launch Inkscape: {e}")
        sys.exit(1)

    print("Done.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(130)
