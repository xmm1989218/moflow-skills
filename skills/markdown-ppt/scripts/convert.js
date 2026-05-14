import { execSync } from "node:child_process";
import { resolve, dirname, basename, join } from "node:path";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("Usage: node convert.js <input.md> [--html] [--pdf]");
  console.log("");
  console.log("Converts a Marp Markdown file to presentation format.");
  console.log("At least one output format (--html or --pdf) must be specified.");
  console.log("");
  console.log("Options:");
  console.log("  --html    Generate HTML presentation");
  console.log("  --pdf     Generate PDF presentation");
  console.log("");
  console.log("Output files are placed alongside the input file.");
  console.log("Example: node convert.js slides.md --html --pdf");
  console.log("  → slides.html + slides.pdf");
  process.exit(1);
}

let input = "";
let html = false;
let pdf = false;

for (const arg of args) {
  if (arg === "--html") {
    html = true;
  } else if (arg === "--pdf") {
    pdf = true;
  } else if (arg.startsWith("-")) {
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  } else {
    input = arg;
  }
}

if (!input) {
  console.error("Error: no input file specified");
  process.exit(1);
}

const inputPath = resolve(input);
if (!existsSync(inputPath)) {
  console.error(`Error: file not found: ${inputPath}`);
  process.exit(1);
}

if (!html && !pdf) {
  console.error("Error: specify at least one output format (--html or --pdf)");
  process.exit(1);
}

const inputDir = dirname(inputPath);
const inputBase = basename(inputPath, ".md");
const marpCmd = "npx @marp-team/marp-cli";

if (html) {
  const outputPath = join(inputDir, `${inputBase}.html`);
  console.log("Converting to HTML...");
  execSync(`${marpCmd} --html "${inputPath}" -o "${outputPath}"`, { stdio: "inherit" });
  console.log(`✅ Created: ${outputPath}`);
}

if (pdf) {
  const outputPath = join(inputDir, `${inputBase}.pdf`);
  console.log("Converting to PDF...");
  execSync(`${marpCmd} --pdf "${inputPath}" -o "${outputPath}" --allow-local-files`, { stdio: "inherit" });
  console.log(`✅ Created: ${outputPath}`);
}

console.log("Done!");
