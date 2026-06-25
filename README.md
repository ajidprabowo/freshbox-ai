# FreshBox AI 🧊

**AI-powered modular cold box rental system for reducing food loss and energy waste in Indonesia's cold chain logistics.**

FreshBox AI is a production-ready MVP web application built with Next.js 14 App Router, TypeScript, and Tailwind CSS. It enables food businesses to rent smart cold boxes, register product batches, get AI-powered microclimate recommendations, and monitor their cold chain in real time.

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Fleet overview, sustainability metrics, recent alerts |
| **Box Availability** | Browse and filter FreshBox units (S/M/L) with live sensor data |
| **Book Rental** | Reserve available boxes with form validation and confirmation |
| **Product Registration** | Register food batches and get AI microclimate recommendations |
| **AI Recommendation** | Gemini-powered or rule-based cold chain advice |
| **Live Monitoring** | Simulated real-time sensor data refreshed every 5 seconds |
| **Cost Calculator** | Itemized rental cost breakdown with invoice preview |
| **Cold Chain Report** | Per-batch summary with printable PDF export |
| **Impact Dashboard** | Sustainability metrics: food saved, CO₂e avoided, energy saved |

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (optional — app works without it)
- **Persistence**: localStorage (no external database required)
- **Deployment**: Vercel

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/freshbox-ai.git
cd freshbox-ai

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Optional: Gemini API for AI microclimate recommendations
# If not set, the app uses a rule-based fallback engine
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Gemini model name (default: gemini-3.5-flash)
# Change this if the model is unavailable or you want to use a different version
GEMINI_MODEL=gemini-3.5-flash
```

> **Note**: `GEMINI_API_KEY` is a **server-side only** variable. It is never exposed to the browser.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

---

## Deploying to Vercel

### Option 1: One-Click Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/freshbox-ai)

### Option 2: Manual Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables** in the Vercel dashboard:
   - Go to your project → **Settings** → **Environment Variables**
   - Add `GEMINI_API_KEY` (your Google Gemini API key)
   - Add `GEMINI_MODEL` (optional, defaults to `gemini-3.5-flash`)

4. **Redeploy** after setting environment variables:
   ```bash
   vercel --prod
   ```

### Option 3: GitHub Integration

1. Push your code to a GitHub repository
2. Import the repository in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in project settings
4. Vercel will auto-deploy on every push to `main`

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | No | — | Google Gemini API key for AI recommendations |
| `GEMINI_MODEL` | No | `gemini-3.5-flash` | Gemini model name. Change if model is unavailable |

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` or Vercel environment variables

### Changing the Gemini Model

If the default model `gemini-3.5-flash` is unavailable, change `GEMINI_MODEL` in your Vercel project settings to one of:
- `gemini-1.5-flash`
- `gemini-1.5-pro`
- `gemini-2.0-flash-exp`

The app will still work without a valid model — it automatically falls back to rule-based recommendations.

---

## Project Structure

```
freshbox-ai/
├── app/
│   ├── page.tsx              # Dashboard (root)
│   ├── layout.tsx            # Root layout with sidebar
│   ├── globals.css           # Global styles
│   ├── boxes/page.tsx        # Box availability
│   ├── booking/page.tsx      # Rental booking form
│   ├── products/page.tsx     # Product registration + AI rec
│   ├── monitoring/page.tsx   # Live monitoring
│   ├── calculator/page.tsx   # Cost calculator
│   ├── reports/page.tsx      # Cold chain reports
│   ├── impact/page.tsx       # Impact dashboard
│   └── api/
│       └── recommendation/
│           └── route.ts      # Gemini API route (server-side)
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar + mobile nav
│   ├── StatCard.tsx          # Metric stat card
│   ├── BoxCard.tsx           # FreshBox unit card
│   ├── MonitoringCard.tsx    # Live monitoring card with temp ring
│   ├── CostBreakdown.tsx     # Cost breakdown display
│   └── AlertBadge.tsx        # Alert notification badge
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── mockData.ts           # Seed data for localStorage
│   ├── storage.ts            # localStorage utility functions
│   ├── recommendationFallback.ts  # Rule-based recommendation engine
│   ├── calculations.ts       # Cost and impact calculations
│   └── utils.ts              # General helpers
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## MVP Limitations

This is a Minimum Viable Product (MVP). The following limitations apply:

| Limitation | Details |
|---|---|
| **No real IoT integration** | Monitoring data is simulated using random variations every 5 seconds |
| **No real-time database** | Data persists in browser localStorage only — not shared across devices/users |
| **No authentication** | No user accounts or access control in MVP |
| **No payment gateway** | Invoice preview only — no actual payment processing |
| **Simplified product database** | Cold chain parameters are based on general food science — expert validation recommended for production use |
| **Single-device persistence** | localStorage is per-browser; clearing browser data resets the app |
| **Simulated compliance data** | Temperature compliance percentages in reports are estimated, not from real sensor logs |

---

## Data Reset

The app seeds localStorage with demo data on first load. To reset back to demo data, open the browser console and run:

```javascript
localStorage.clear();
location.reload();
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Built with ❤️ for Indonesia's cold chain food logistics ecosystem.
