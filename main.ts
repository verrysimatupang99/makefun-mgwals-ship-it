#!/usr/bin/env node

/**
 * friday-ship-it
 *
 * A dependency-free CLI that presents one very specific commit message with
 * the ceremony it clearly does not deserve.
 */

const ENTRY_LINE =
  "fix: tiny refactor before the weekend (removes the payment retry loop, but the tests pass)";
const VERSION = "1.0.0";
const NAME = "friday-ship-it";
const MIN_WIDTH = 25;
const MAX_WIDTH = 160;

type OutputMode = "plain" | "fancy" | "json";

type CliOptions = {
  mode: OutputMode;
  width: number;
  help: boolean;
  version: boolean;
};

type ParseResult = { ok: true; options: CliOptions } | { ok: false; error: string };

const ANSI = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  cyan: "\u001b[36m",
  green: "\u001b[32m",
};

/**
 * Clamp a terminal width into the range this program is willing to format.
 */
function clampWidth(width: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
}

/**
 * Choose the default width from the terminal, falling back to 80 columns.
 */
function defaultWidth(): number {
  const columns = process.stdout.columns;
  if (typeof columns === "number" && Number.isFinite(columns)) {
    return clampWidth(Math.floor(columns));
  }
  return 80;
}

/**
 * Render usage text. Help intentionally goes to stderr so stdout remains a
 * clean machine-readable channel even for successful informational output.
 */
function usage(): string {
  return `${NAME} ${VERSION}

Present the canonical Friday-afternoon commit message.

Usage:
  node main.ts [options]

Options:
  --plain          Print the entry line as plain text (default)
  --fancy          Print an ANSI-styled, box-drawn presentation
  --json           Print machine-readable JSON
  --width <n>      Wrap output to n columns (${MIN_WIDTH}-${MAX_WIDTH})
  --version        Print the version
  --help           Show this help on stderr

Examples:
  node main.ts
  node main.ts --fancy --width 72
  node main.ts --json`;
}

/**
 * Parse an integer width and reject values that would produce useless output.
 */
function parseWidth(raw: string): number | null {
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const width = Number.parseInt(raw, 10);
  if (width < MIN_WIDTH || width > MAX_WIDTH) {
    return null;
  }
  return width;
}

/**
 * Parse command-line arguments without dependencies.
 *
 * The three output modes are mutually exclusive. Repeating the same mode is
 * accepted because it is unambiguous and harmless in scripts.
 */
function parseArgs(argv: string[]): ParseResult {
  const options: CliOptions = {
    mode: "plain",
    width: defaultWidth(),
    help: false,
    version: false,
  };

  let explicitMode: OutputMode | null = null;

  const chooseMode = (mode: OutputMode): string | null => {
    if (explicitMode !== null && explicitMode !== mode) {
      return `options --${explicitMode} and --${mode} cannot be used together`;
    }
    explicitMode = mode;
    options.mode = mode;
    return null;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    let modeError: string | null = null;

    switch (arg) {
      case "--help":
        options.help = true;
        break;
      case "--version":
        options.version = true;
        break;
      case "--plain":
        modeError = chooseMode("plain");
        break;
      case "--fancy":
        modeError = chooseMode("fancy");
        break;
      case "--json":
        modeError = chooseMode("json");
        break;
      case "--width": {
        const raw = argv[index + 1];
        if (raw === undefined) {
          return { ok: false, error: "option --width requires a value" };
        }
        const width = parseWidth(raw);
        if (width === null) {
          return {
            ok: false,
            error: `invalid width '${raw}': expected an integer from ${MIN_WIDTH} to ${MAX_WIDTH}`,
          };
        }
        options.width = width;
        index += 1;
        break;
      }
      default:
        if (arg.startsWith("--width=")) {
          const raw = arg.slice("--width=".length);
          const width = parseWidth(raw);
          if (width === null) {
            return {
              ok: false,
              error: `invalid width '${raw}': expected an integer from ${MIN_WIDTH} to ${MAX_WIDTH}`,
            };
          }
          options.width = width;
        } else if (arg.startsWith("-")) {
          return { ok: false, error: `unknown option: ${arg}` };
        } else {
          return { ok: false, error: `unexpected argument: ${arg}` };
        }
    }

    if (modeError !== null) {
      return { ok: false, error: modeError };
    }
  }

  return { ok: true, options };
}

/**
 * Wrap text on word boundaries without breaking words unless one word is
 * longer than the available width.
 */
function wrapText(text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line.length === 0) {
      line = word;
    } else if (line.length + 1 + word.length <= width) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }

    while (line.length > width) {
      lines.push(line.slice(0, width));
      line = line.slice(width);
    }
  }

  if (line.length > 0) {
    lines.push(line);
  }

  return lines;
}

function style(text: string, ...codes: string[]): string {
  return `${codes.join("")}${text}${ANSI.reset}`;
}

/**
 * Render plain output. This is deliberately copy-friendly: no labels, color,
 * or decoration are added to the commit message itself.
 */
function renderPlain(options: CliOptions): string {
  return `${wrapText(ENTRY_LINE, options.width).join("\n")}\n`;
}

/**
 * Render JSON with both the exact entry line and the display-wrapped lines.
 */
function renderJson(options: CliOptions): string {
  return `${JSON.stringify(
    {
      name: NAME,
      version: VERSION,
      entry: ENTRY_LINE,
      width: options.width,
      lines: wrapText(ENTRY_LINE, options.width),
    },
    null,
    2,
  )}\n`;
}

function boxLine(content: string, innerWidth: number): string {
  const visible = content.replace(/\u001b\[[0-9;]*m/g, "").length;
  const padding = " ".repeat(Math.max(0, innerWidth - visible));
  return `│ ${content}${padding} │`;
}

/**
 * Render the fancy presentation. The width option describes total columns,
 * including the box border, matching what a terminal user expects.
 */
function renderFancy(options: CliOptions): string {
  const totalWidth = options.width;
  const innerWidth = totalWidth - 4;
  const horizontal = "─".repeat(totalWidth - 2);
  const top = `┌${horizontal}┐`;
  const bottom = `└${horizontal}┘`;
  const title = style(`${NAME} v${VERSION}`, ANSI.cyan, ANSI.bold);
  const messageLines = wrapText(ENTRY_LINE, innerWidth).map((line) =>
    boxLine(style(line, ANSI.bold), innerWidth),
  );
  const footerText = "tests: passing · retry loop: gone";
  const footer = footerText.length <= innerWidth
    ? boxLine(style(footerText, ANSI.green), innerWidth)
    : null;

  const lines = [
    style(top, ANSI.dim),
    boxLine(title, innerWidth),
    boxLine("", innerWidth),
    ...messageLines,
  ];

  if (footer !== null) {
    lines.push(boxLine("", innerWidth), footer);
  }

  lines.push(style(bottom, ANSI.dim));
  return `${lines.join("\n")}\n`;
}

function render(options: CliOptions): string {
  if (options.mode === "json") {
    return renderJson(options);
  }
  if (options.mode === "fancy") {
    return renderFancy(options);
  }
  return renderPlain(options);
}

function fail(message: string): number {
  process.stderr.write(`${NAME}: ${message}\n`);
  process.stderr.write("Try 'node main.ts --help' for usage.\n");
  return 2;
}

function main(argv: string[]): number {
  const parsed = parseArgs(argv);

  if (!parsed.ok) {
    return fail(parsed.error);
  }

  if (parsed.options.help) {
    process.stderr.write(`${usage()}\n`);
    return 0;
  }

  if (parsed.options.version) {
    process.stdout.write(`${NAME} ${VERSION}\n`);
    return 0;
  }

  process.stdout.write(render(parsed.options));
  return 0;
}

process.exitCode = main(process.argv.slice(2));
