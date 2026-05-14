---
name: markdown-ppt
description: "Convert Markdown to HTML/PDF presentations using Marp. Guides writing slide-ready Markdown and provides a conversion script."
version: "1.0.0"
license: MIT
metadata:
  author: moflow
---

## What I Do

I help you create slide presentations from Markdown content. I handle:

1. Writing Markdown in Marp-compatible format (slide separators, themes, layouts)
2. Providing a script to convert Markdown to HTML or PDF presentations

## When to Use Me

Use me when you need to create a presentation, slides, or PPT from Markdown content. Activate this skill when the user mentions "presentation", "slides", "PPT", or "demo deck".

## Marp Syntax

### Frontmatter

Set theme and pagination style at the top of the file:

```markdown
---
marp: true
theme: default
paginate: true
style: |
  section {
    font-size: 28px;
  }
---
```

Available themes: `default`, `gaia`, `uncover`

### Slide separators

Use `---` to split slides:

```markdown
# Title Slide

Speaker name | Date

---

# Second Slide

Content here

---

# Last Slide

Thanks!
```

### Slide-level directives

Per-slide settings using HTML comments:

```markdown
<!-- _class: lead -->
# Centered Title Slide

---

<!-- _paginate: false -->
# No Page Number

---

<!-- _header: 'Section Title' -->
# Slide With Header
```

### Images

```markdown
![width:600px](image.png)
![bg right:40%](background.jpg)
![bg contain](diagram.svg)
```

Background image options: `cover`, `contain`, `fit`, `left`, `right`, `top`, `bottom`

### Code blocks

```markdown
```python
def hello():
    print("Hello, world!")
```
```

Marp renders code blocks with syntax highlighting automatically.

### Math (KaTeX)

```markdown
$$E = mc^2$$
```

Inline: `$x^2 + y^2 = r^2$`

### Fragments (step-by-step reveal)

```markdown
* First point
* Second point <!-- .element: class="fragment" -->
* Third point <!-- .element: class="fragment" -->
```

## Writing Guidelines

### Keep slides concise

- Each slide should convey one idea
- Maximum 5-7 bullet points per slide
- Use short phrases, not full sentences
- Avoid paragraphs longer than 3 lines

### Structure

1. **Title slide** — presentation title, speaker, date
2. **Outline slide** — what you'll cover (optional)
3. **Content slides** — one concept per slide
4. **Summary slide** — key takeaways
5. **Closing slide** — call to action or Q&A

### Use visuals

- Prefer diagrams and images over text walls
- Use `![bg right:40%]` to split slide into text + image
- Code examples should be short and focused

### Typography

- Use `#` for slide titles (rendered large)
- Use `##` or `###` for section headers within a slide
- Use bold `**text**` for emphasis, not italics
- Use numbered lists for sequential steps, bullet lists for parallel items

## Conversion Script

Dependencies are managed via `package.json`. Install them first:

```bash
cd scripts && bun install
```

Then convert your Marp Markdown file:

```bash
node scripts/convert.js input.md --html
node scripts/convert.js input.md --pdf
node scripts/convert.js input.md --html --pdf
```

Output files are placed alongside the input file:
- `input.html` for `--html`
- `input.pdf` for `--pdf`

### PDF requirements

PDF output requires either Chromium/Chrome or the `puppeteer` npm package.

## Example Presentation

```markdown
---
marp: true
theme: default
paginate: true
---

# Introduction to MoFlow

A minimalist Markdown editor

2026-05-14

---

# Features

- **Distraction-free editing** — frameless window, clean UI
- **Rich Markdown** — GFM, math, Mermaid, code highlighting
- **Multi-tab** — open multiple files with auto-save
- **AI Sidebar** — integrated AI chat with tool-calling

---

# AI Tool-Calling

![bg right:40%](ai-sidebar.png)

- AI can explore documents via tools
- Outline, grep, read, webfetch
- Skills system for extensible behavior

---

# Summary

- MoFlow: Markdown editor for writers
- Rich editing + AI integration
- Skills make AI extensible

**Questions?**
```

## Important Notes

- The `---` separator must have blank lines before and after it
- Marp themes are limited; for advanced styling use the `style` frontmatter field with CSS
- HTML output is self-contained and can be opened in any browser
- PDF quality depends on the browser engine; Chrome/Chromium gives best results
- If the user wants PPTX format specifically, suggest using Marp's HTML output and then importing into PowerPoint, or mention Pandoc as an alternative