#!/usr/bin/env python3
"""
Watchtower build system — generates release zips with automatic carry-forward.

Usage (Claude runs this to generate zips):
  python3 wt-build.py --version v74.10.0 --desc "major: proactive APEX, Taegis isolation, demo sim" --major

State file: build_state.json
  - tracks last deployed SHA vs last zip SHA so undeployed files are never dropped
  - records every file in each zip for carry-forward
"""
import json, os, zipfile, sys, argparse
from datetime import datetime

STATE_FILE = os.path.join(os.path.dirname(__file__), 'build_state.json')
BASE = os.path.dirname(__file__)
OUTPUTS = '/mnt/user-data/outputs'

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        'last_deployed_sha': None,       # SHA known to be live on Vercel
        'last_built_version': None,      # version string of last zip we generated
        'last_built_files': [],          # files included in that zip
        'undeployed_since': [],          # accumulating list of all files not yet confirmed deployed
        'versions': [],                  # changelog of all builds
    }

def save_state(s):
    with open(STATE_FILE, 'w') as f:
        json.dump(s, f, indent=2)

def file_exists(rel):
    return os.path.exists(os.path.join(BASE, rel))


def check_ts_strings(files):
    """Catch apostrophes inside single-quoted TypeScript string literals — SWC build killer."""
    import re
    errors = []
    contractions = ["hasn't","haven't","don't","won't","can't","it's","we're","you're",
                    "they're","isn't","aren't","wasn't","weren't","couldn't","wouldn't",
                    "shouldn't","didn't","doesn't","hadn't","I'm","you'll","we'll","that's"]
    for rel in files:
        full = os.path.join(BASE, rel)
        if not full.endswith(('.ts', '.tsx', '.js', '.jsx')) or not os.path.exists(full):
            continue
        with open(full) as f:
            for i, line in enumerate(f, 1):
                for c in contractions:
                    if c in line and ("'" + c in line or c + "'" in line.split(c)[0][-1:] if line.split(c) else False):
                        errors.append(f"  {rel}:{i} — apostrophe in string: {line.strip()[:80]}")
                        break
    if errors:
        print("\n⚠ APOSTROPHE WARNINGS (may break SWC build):")
        for e in errors:
            print(e)
    return errors

def build_zip(version, files, state):
    output = os.path.join(OUTPUTS, f'watchtower-{version}.zip')
    seen = set()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zf:
        for rel in files:
            if rel in seen:
                continue
            full = os.path.join(BASE, rel)
            if os.path.exists(full):
                zf.write(full, rel)
                seen.add(rel)
                print(f'  ✓ {rel}')
            else:
                print(f'  ✗ MISSING (skipped): {rel}')
    size_kb = os.path.getsize(output) // 1024
    print(f'\n✓ {output} ({size_kb}KB, {len(seen)} files)')
    return output, list(seen)

def check_carry_forward(state, deployed_sha):
    """Returns files from previous zip that need carrying forward."""
    if not deployed_sha:
        return []
    if deployed_sha == state.get('last_deployed_sha'):
        # Already up to date — no carry-forward needed
        return []
    # Deployed SHA hasn't changed since last build — carry forward all undeployed files
    carry = list(state.get('undeployed_since', []))
    print(f'  → Carrying forward {len(carry)} files from undeployed builds')
    return carry

def merge_files(carry_files, new_files):
    """Merge carry-forward + new files, new_files take precedence (dedup by keeping last)."""
    seen = {}
    for f in carry_files + new_files:
        seen[f] = f  # later entries overwrite
    return list(seen.keys())

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--version', required=True, help='e.g. v74.10.0')
    parser.add_argument('--desc', required=True, help='short description')
    parser.add_argument('--files', nargs='*', default=[], help='new/changed files to include')
    parser.add_argument('--deployed-sha', default=None, help='latest deployed SHA from Vercel')
    parser.add_argument('--major', action='store_true', help='mark as major version bump')
    args = parser.parse_args()

    state = load_state()
    print(f'\n🏗  Watchtower build {args.version}')
    print(f'   Last deployed SHA : {args.deployed_sha or "unknown"}')
    print(f'   Last built        : {state.get("last_built_version", "none")}')

    # Carry-forward undeployed files
    carry = check_carry_forward(state, args.deployed_sha)

    # Always include next.config.js
    core_files = ['next.config.js']

    all_files = merge_files(carry, args.files + core_files)

    check_ts_strings(all_files)
    print(f'\n📦 Files in zip ({len(all_files)}):')
    output, included = build_zip(args.version, all_files, state)

    # Update state
    new_undeployed = list(set(state.get('undeployed_since', []) + included))
    # If deployed SHA advanced, clear undeployed list up to that point
    if args.deployed_sha and args.deployed_sha != state.get('last_deployed_sha'):
        # Clear — user has deployed something newer
        new_undeployed = included

    state.update({
        'last_deployed_sha': args.deployed_sha or state.get('last_deployed_sha'),
        'last_built_version': args.version,
        'last_built_files': included,
        'undeployed_since': new_undeployed,
        'versions': state.get('versions', []) + [{
            'version': args.version,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'desc': args.desc,
            'files': included,
            'major': args.major,
            'built_at': datetime.now().isoformat(),
        }]
    })
    save_state(state)
    print(f'\n✓ build_state.json updated')
    print(f'  Undeployed file count: {len(new_undeployed)}')
    return output

if __name__ == '__main__':
    main()
