#!/usr/bin/env python3
"""
List all files in the current working directory.
At the end, offers to copy the filenames to the clipboard.
"""

import os
import sys


def get_clipboard_tool():
    """
    Detect an available clipboard tool.
    Returns a tuple (name, copy_function) or (None, None) if none found.
    """
    import shutil
    import subprocess

    # Try in order of preference
    if shutil.which("pbcopy"):                       # macOS
        def copy(text):
            subprocess.run(["pbcopy"], input=text.encode(), check=True)
        return "pbcopy", copy

    if shutil.which("wl-copy"):                      # Wayland Linux
        def copy(text):
            subprocess.run(["wl-copy"], input=text.encode(), check=True)
        return "wl-copy", copy

    if shutil.which("xclip"):                        # X11 Linux
        def copy(text):
            subprocess.run(["xclip", "-selection", "clipboard"],
                           input=text.encode(), check=True)
        return "xclip", copy

    if shutil.which("xsel"):                         # X11 Linux (alternative)
        def copy(text):
            subprocess.run(["xsel", "--clipboard", "--input"],
                           input=text.encode(), check=True)
        return "xsel", copy

    if shutil.which("clip"):                         # Windows
        def copy(text):
            subprocess.run(["clip"], input=text.encode(), check=True)
        return "clip", copy

    return None, None


def main() -> None:
    cwd = os.getcwd()
    print(f"Working directory: {cwd}\n")

    # List only files (skip directories)
    files = sorted(
        f for f in os.listdir(cwd)
        if os.path.isfile(os.path.join(cwd, f))
    )

    if not files:
        print("No files in this directory.")
        return

    # Print numbered list
    for i, name in enumerate(files, start=1):
        print(f"{i:>4}. {name}")

    print(f"\nTotal: {len(files)} file(s)\n")

    # --- Clipboard offer ---
    answer = input("Copy filenames to clipboard? [y/N]: ").strip().lower()
    if answer not in ("y", "yes"):
        print("Done. Nothing copied.")
        return

    # --- Format choice ---
    print("\nFormat:")
    print("  1) One per line")
    print("  2) Space-separated on a single line")
    print("  3) Comma-separated on a single line")
    fmt = input("Choose [1/2/3] (default 1): ").strip() or "1"

    if fmt == "2":
        text = " ".join(files)
    elif fmt == "3":
        text = ", ".join(files)
    else:
        text = "\n".join(files)

    tool_name, copy_fn = get_clipboard_tool()
    if copy_fn is None:
        print("\n  ✗ No clipboard tool found.")
        print("    Install one of: pbcopy (macOS), wl-copy / xclip / xsel (Linux), clip (Windows)")
        print("    Falling back: printing the text so you can copy manually.\n")
        print(text)
        return

    try:
        copy_fn(text)
        print(f"\n  ✓ Copied {len(files)} filename(s) to clipboard using '{tool_name}'.")
    except Exception as e:
        print(f"\n  ✗ Clipboard copy failed: {e}")
        print("    Here's the text so you can copy manually:\n")
        print(text)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(130)