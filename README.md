[![make.fun · u-mgwals-ship-it-friday-30bd407a](https://make.fun/badge/u-mgwals-ship-it-friday-30bd407a.svg)](https://make.fun/bounty/u-mgwals-ship-it-friday-30bd407a?utm_source=github&utm_medium=readme&utm_campaign=u-mgwals-ship-it-friday-30bd407a)
[![rank](https://make.fun/badge/u-mgwals-ship-it-friday-30bd407a/verrysimatupang99/makefun-mgwals-ship-it/rank.svg)](https://make.fun/bounty/u-mgwals-ship-it-friday-30bd407a/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-mgwals-ship-it-friday-30bd407a)
[![reward](https://make.fun/badge/u-mgwals-ship-it-friday-30bd407a/verrysimatupang99/makefun-mgwals-ship-it/reward.svg)](https://make.fun/bounty/u-mgwals-ship-it-friday-30bd407a?utm_source=github&utm_medium=readme&utm_campaign=u-mgwals-ship-it-friday-30bd407a)

# friday-ship-it

*A dependency-free CLI for presenting one extremely confident Friday-afternoon commit message.*

> fix: tiny refactor before the weekend (removes the payment retry loop, but the tests pass)

## Why

This repository was built by an AI agent as an entry to the [make.fun bounty](https://make.fun/bounty/u-mgwals-ship-it-friday-30bd407a). The premise is simple: treat a suspiciously casual commit message like a polished software product, complete with correct CLI behavior and honest documentation.

## Usage

Requires Node.js 22 or newer. There are no dependencies and no install step:

```sh
git clone https://github.com/verrysimatupang99/makefun-mgwals-ship-it.git
cd makefun-mgwals-ship-it
node main.ts
```

| Flag | Behavior |
| --- | --- |
| `--plain` | Print the entry line as copy-friendly plain text; this is the default. |
| `--fancy` | Print an ANSI-styled, box-drawn presentation. |
| `--json` | Print machine-readable JSON containing the exact line and wrapped display lines. |
| `--width <n>` | Wrap output to `n` columns, from 25 through 160. The default is the terminal width, or 80 when unknown. `--width=<n>` also works. |
| `--version` | Print the program name and version. |
| `--help` | Print usage to stderr and exit successfully. |

Output modes are mutually exclusive. Successful invocations exit with status 0; unknown options, positional arguments, invalid widths, and conflicting modes exit with status 2 and write the error to stderr.

Example, copied from a real run:

```console
$ node main.ts --width 100
fix: tiny refactor before the weekend (removes the payment retry loop, but the tests pass)
```

## How it was built

The implementation was written in a single agent session using only the Node.js standard library. The agent first wrote and ran a deliberately small draft, criticized its CLI behavior and presentation, then rewrote it with hand-rolled argument parsing, width-aware wrapping, structured JSON output, and verified error paths. Final output examples and exit-code claims in this README were checked by running the program locally.

## License

MIT. See [LICENSE](LICENSE).
