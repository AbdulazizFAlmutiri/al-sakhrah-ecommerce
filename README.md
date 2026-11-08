# Al-Sakhra for Industry — Company Website

الموقع التعريفي لشركة الصخرة للصناعة — bilingual (Arabic / English) company website, styled after the 2026 company profile.

Built with Next.js 16, React 19 and Tailwind CSS 4. It's one page with these sections: Hero · About · Vision & Values · Quality & Certifications · Products · Target Sectors · Why Al-Sakhrah · Contact.

## Editing content

- **Text, phone, email, address, products, sectors:** `lib/content.ts` (plus the longer paragraphs in `components/Sections.tsx`)
- **Logo:** `public/logo/`
- **Photos:** `public/images/` (grayscale photos. The site adds the blue tint automatically)
- **Colours:** `app/globals.css` (`--color-brand-*`)

## Working on any computer (PC or laptop)

The code is on GitHub, so you can work on it from any computer.

### First time on a new computer

1. Install **Node.js 20 or newer** (LTS) from https://nodejs.org and **Git** from https://git-scm.com
2. Open a terminal (on Windows: PowerShell) and run:

```bash
git clone https://github.com/AbdulazizFAlmutiri/al-sakhrah-ecommerce.git
```

```bash
cd al-sakhrah-ecommerce
```

```bash
npm install
```

```bash
npm run dev
```

3. Open http://localhost:3000 in your browser.

### Moving between computers

Before you leave one computer, save and upload your changes:

```bash
git add -A
```

```bash
git commit -m "Describe what you changed"
```

```bash
git push
```

When you sit down at the other computer, download the latest changes first:

```bash
git pull
```

## Publishing it online

To put the site on the internet so anyone can open it, connect this GitHub repo to [Vercel](https://vercel.com/new). The defaults work and no settings are needed. Each time you push, the live site updates automatically.

## Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Local dev server with hot reload |
| `npm run build` | Production build                 |
| `npm start`     | Serve the production build       |
| `npm run lint`  | Lint the code                    |
