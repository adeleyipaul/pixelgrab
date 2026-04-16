# PixelGrab

PixelGrab is a fast, browser-based color extraction tool that turns any image into a usable color system.

Upload an image, extract its dominant palette, switch between formats, and export production-ready color tokens in seconds.

---

## 🔗 Live Demo

🌐 [https://pixelgrabb.netlify.app/](https://pixelgrabb.netlify.app/)

---

## 🎥 Demo Video

https://youtu.be/zkBV997LIzU

---

## ✨ Features

- Upload PNG, JPG, GIF, or WebP images (up to 10MB)
- Extract dominant colors from any image
- View palettes in **HEX, RGB, or HSL**
- Copy individual colors or the entire palette
- Export palettes as:
  - CSS variables
  - JSON tokens
  - Tailwind config snippets
- Reset and analyze new images instantly

---

## ⚡ Why PixelGrab?

Most color tools stop at extraction.

PixelGrab goes further by turning raw colors into **usable, frontend-ready formats** — making it easy to move from inspiration → implementation without friction.

---

## 🛠 Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- react-dropzone
- colorthief

---

## 🧪 TestSprite Hackathon Testing

This project was tested using **TestSprite MCP**.

- Multi-round automated testing was performed
- Core flows validated:
  - Image upload and extraction
  - Palette rendering
  - Format switching (HEX, RGB, HSL)
  - Copy and export actions
- Test-driven improvements were made to:
  - Stabilize UI interactions
  - Improve export flows
  - Ensure format switching preserves state

All generated test artifacts, plans, and summaries are stored in:

```bash
testsprite_tests/
```

---

## 📦 Running Locally

```bash
npm install
npm run dev
```

Open:

```
http://localhost:3000/palette
```

---

## 📁 Project Structure

```
app/                  # Next.js app routes
components/           # UI components
testsprite_tests/     # TestSprite-generated tests and reports
public/               # Static assets
```

---

## 🎯 Design Goals

PixelGrab is built around one idea:

> Turning image colors into usable design tokens with minimal friction.

- No setup
- No complexity
- Just upload → extract → use

---

## 📌 Notes

- No images are stored — processing happens client-side
- Designed for designers and frontend developers
- Built for speed and simplicity

---

