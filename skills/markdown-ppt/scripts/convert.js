import { execSync } from "node:child_process";
import { resolve, dirname, basename, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

function printHelp() {
  console.log(`Usage: run_skill_script("convert.js", "<input.md> [--html] [--pdf] [--output <dir>]")

Arguments:
  <input.md>            Input Markdown file (Marp format)

Options:
  --html                Generate HTML presentation
  --pdf                 Generate PDF presentation
  --output <dir>        Output directory (default: same as input file)
  --help, -h            Show this help message

Examples:
  run_skill_script("convert.js", "slides.md --html")
  run_skill_script("convert.js", "slides.md --html --pdf")
  run_skill_script("convert.js", "slides.md --html --output ./presentations/")
`);
  process.exit(0);
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  printHelp();
}

let input = "";
let html = false;
let pdf = false;
let outputDir = "";

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--html") {
    html = true;
  } else if (arg === "--pdf") {
    pdf = true;
  } else if (arg === "--output") {
    outputDir = args[++i];
    if (!outputDir) {
      console.error("Error: --output requires a directory path");
      process.exit(1);
    }
  } else if (arg === "--help" || arg === "-h") {
    printHelp();
  } else if (arg.startsWith("-")) {
    console.error(`Unknown option: ${arg}`);
    console.error("Run with --help for usage information");
    process.exit(1);
  } else {
    input = arg;
  }
}

if (!input) {
  console.error("Error: no input file specified");
  console.error("Run with --help for usage information");
  process.exit(1);
}

const inputPath = resolve(input);
if (!existsSync(inputPath)) {
  console.error(`Error: file not found: ${inputPath}`);
  process.exit(1);
}

if (!html && !pdf) {
  console.error("Error: specify at least one output format (--html or --pdf)");
  console.error("Run with --help for usage information");
  process.exit(1);
}

const inputDir = dirname(inputPath);
const inputBase = basename(inputPath, ".md");
const targetDir = outputDir ? resolve(outputDir) : inputDir;

if (outputDir && !existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

if (html) {
  const outputPath = join(targetDir, `${inputBase}.html`);
  console.log("Converting to HTML...");
  execSync(`bunx @marp-team/marp-cli --html "${inputPath}" -o "${outputPath}"`, { stdio: "inherit" });
  console.log(`✅ Created: ${outputPath}`);
}

if (pdf) {
  const outputPath = join(targetDir, `${inputBase}.pdf`);
  console.log("Converting to PDF...");
  execSync(`bunx @marp-team/marp-cli --pdf "${inputPath}" -o "${outputPath}" --allow-local-files`, { stdio: "inherit" });
  console.log(`✅ Created: ${outputPath}`);
}

console.log("Done!");
