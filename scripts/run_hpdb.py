#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path

from HPDB import generate_excel


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--kmz", required=True)
    parser.add_argument("--template", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--manual", required=True)
    args = parser.parse_args()
    manual = json.loads(args.manual)
    stats = generate_excel(args.kmz, args.template, args.output, manual)
    print(json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
