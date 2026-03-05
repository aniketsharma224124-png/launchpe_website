# LaunchPe — Website

AI-powered launch content engine for Indian founders.

## Folder Structure

```
launchpe-website/
├── index.html          ← Main landing page
├── css/
│   └── style.css       ← All styles (dark theme, responsive)
├── js/
│   ├── main.js         ← Scroll animations, FAQ, nav, waitlist form
│   └── demo.js         ← Interactive demo logic + 3 example products
└── README.md
```

## How to Run

Just open `index.html` in a browser. No build step, no npm, no server required.

For local development with live reload:
```bash
npx serve .
# or
python3 -m http.server 3000
```

## Tech Stack

- Pure HTML/CSS/JavaScript — zero dependencies
- Google Fonts: Syne + IBM Plex Sans + IBM Plex Mono
- Razorpay for payments (to integrate)
- Claude API for AI analysis (to integrate in backend)

## Demo Data

The demo uses pre-loaded data for 3 example products:
- `indiastartupmap.com`
- `myresume.ai`
- `zapbook.in`

Any other URL entered falls back to the indiastartupmap.com data.

## Pricing (as of this build)

| Plan | Price | Key limits |
|---|---|---|
| Basic Launch | ₹999 one-time | 1 product, 20 pieces, 10-day calendar |
| Premium Growth | ₹2,499/month | Unlimited products, 50 pieces, 30-day calendar |
| Agency | ₹6,999/month | 10 clients, white-label, PDF export |

## To-Do for Production

- [ ] Connect Claude API for real URL analysis
- [ ] Build backend (Node/Supabase)
- [ ] Integrate Razorpay checkout
- [ ] Connect waitlist form to email provider (Resend / Mailchimp)
- [ ] Add auth (Supabase Auth)
- [ ] Build actual content generation pipeline
