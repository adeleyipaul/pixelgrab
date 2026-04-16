# PixelGrab

PixelGrab is a frontend color extraction tool that lets users upload an image, generate a dominant color palette, switch between HEX/RGB/HSL values, copy colors, and export palettes as CSS variables, JSON tokens, or Tailwind config snippets.

## Live Demo

Live site: https://piixelgrab.netlify.app/

## Features

- Upload PNG, JPG, GIF, or WebP images up to 10 MB
- Extract and preview dominant image colors
- Switch palette values between HEX, RGB, and HSL
- Copy individual colors or all palette values
- Export palettes as CSS, JSON, or Tailwind snippets

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- react-dropzone
- colorthief

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use `/palette` for the main tool.

## TestSprite Artifacts

Hackathon TestSprite MCP artifacts, generated test cases, execution logs, and the final testing summary are stored in `testsprite_tests/`.
