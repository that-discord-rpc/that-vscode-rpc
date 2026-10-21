#!/usr/bin/env python3
"""
file_mover.py - Interactively locate files by name or by type in the CURRENT
directory only (no recursion), then copy or cut them to a target directory.

Usage:
    python3 file_mover.py
Run it from the directory you want to search in.
"""

import shutil
import sys
from pathlib import Path


def parse_tokens(raw: str):
    """Split user input on commas, spaces, and newlines, dropping empties."""
    return raw.replace(",", " ").split()


def normalize_ext(token: str) -> str:
    """Accept 'svg', '.svg', 'SVG' -> '.svg'."""
    token = token.strip().lower()
    if not token:
        return ""
    if not token.startswith("."):
        token = "." + token
    return token


def list_files(search_dir: Path):
    """Return only the files directly inside search_dir (no recursion)."""
    return [p for p in search_dir.iterdir() if p.is_file()]


def find_by_names(names, search_dir: Path):
    """Look for each filename directly inside search_dir.
    Returns (found: dict[name -> Path], missing: list[name])."""
    direct_files = {p.name: p.resolve() for p in list_files(search_dir)}
    found = {}
    missing = []
    for name in names:
        if name in direct_files:
            found[name] = direct_files[name]
        else:
            missing.append(name)
    return found, missing


def find_by_types(exts, search_dir: Path):
    """Look for files directly inside search_dir whose extension matches.
    Returns (found: dict[name -> Path], missing: list[ext])."""
    found = {}
    hits = {ext: 0 for ext in exts}
    for p in list_files(search_dir):
        ext = p.suffix.lower()
        if ext in hits:
            found[p.name] = p.resolve()
            hits[ext] += 1
    missing = [ext for ext, count in hits.items() if count == 0]
    return found, missing


def choose_mode():
    while True:
        print("Search by:")
        print("  [1] Filename")
        print("  [2] File type / extension")
        choice = input("Choose [1/2]: ").strip()
        if choice == "1":
            return "name"
        if choice == "2":
            return "type"
        print("Please enter 1 or 2.")


def choose_action():
    while True:
        choice = input("Copy or Cut? [c/x]: ").strip().lower()
        if choice in ("c", "copy"):
            return "copy"
        if choice in ("x", "cut"):
            return "cut"
        print("Please enter 'c' for copy or 'x' for cut.")


def choose_destination(search_dir: Path):
    parent = search_dir.parent

    while True:
        print("\nDestination options:")
        print("  [b] Back (parent directory):", parent)
        print("  [f] Forward (a subdirectory):")
        print("  [t] Third (type an address):")
        choice = input("Choose [b/f/t]: ").strip().lower()

        if choice == "b":
            return parent

        if choice == "f":
            subdirs = sorted(
                [p for p in search_dir.iterdir() if p.is_dir()],
                key=lambda p: p.name.lower(),
            )
            if not subdirs:
                print("No subdirectories available here.")
                continue
            print("\nSubdirectories of", search_dir, ":")
            for i, d in enumerate(subdirs, 1):
                print(f"  {i}. {d.name}")
            pick = input("Enter number (or 'a' for an absolute path): ").strip()
            if pick.lower() == "a":
                dest = input("Enter destination path: ").strip()
                p = Path(dest).expanduser()
                if p.is_dir():
                    return p.resolve()
                print("That path isn't a directory.")
                continue
            if pick.isdigit() and 1 <= int(pick) <= len(subdirs):
                return subdirs[int(pick) - 1].resolve()
            print("Invalid selection.")
            continue

        if choice == "t":
            dest = input("Enter destination path: ").strip()
            p = Path(dest).expanduser()
            if p.is_dir():
                return p.resolve()
            print("That path isn't a directory.")
            continue

        print("Please choose b, f, or t.")


def do_transfer(files: dict, action: str, dest: Path):
    """files: {display_name: source_path}. Flattens all into dest."""
    dest.mkdir(parents=True, exist_ok=True)
    for name, src in files.items():
        target = dest / src.name
        if target.exists():
            overwrite = input(f"'{target}' exists. Overwrite? [y/N]: ").strip().lower()
            if overwrite != "y":
                print(f"  Skipped: {name}")
                continue
        try:
            if action == "copy":
                shutil.copy2(src, target)
                print(f"  Copied: {src} -> {target}")
            else:
                shutil.move(str(src), str(target))
                print(f"  Moved:  {src} -> {target}")
        except Exception as e:
            print(f"  Error with {name}: {e}")


def main():
    search_dir = Path.cwd()
    print(f"Searching in (non-recursive): {search_dir}\n")

    mode = choose_mode()

    if mode == "name":
        print("\nEnter filenames (separated by commas, spaces, or Enter).")
    else:
        print("\nEnter file types/extensions (e.g. svg, .png, jpg).")
    print("Press Enter on an empty line when done.")

    lines = []
    while True:
        line = input("> ")
        if not line.strip():
            break
        lines.append(line)

    tokens = parse_tokens(" ".join(lines))
    if not tokens:
        print("Nothing entered. Exiting.")
        return

    if mode == "name":
        found, missing = find_by_names(tokens, search_dir)
        label = "filename"
    else:
        exts = [normalize_ext(t) for t in tokens]
        exts = [e for e in exts if e]
        found, missing = find_by_types(exts, search_dir)
        label = "file type"

    if missing:
        print(f"\nNo matches for these {label}s:")
        for m in missing:
            print("  -", m)
        if not found:
            print("No files found. Exiting.")
            return
        cont = input("Continue with the found files? [y/N]: ").strip().lower()
        if cont != "y":
            return

    print(f"\nFound {len(found)} file(s):")
    for name, path in found.items():
        print(f"  {name} -> {path}")

    if not found:
        print("Nothing to do.")
        return

    action = choose_action()
    dest = choose_destination(search_dir)

    print(f"\nAbout to {action} {len(found)} file(s) into: {dest}")
    confirm = input("Proceed? [y/N]: ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    do_transfer(found, action, dest)
    print("\nDone.")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nInterrupted.")
        sys.exit(1)
