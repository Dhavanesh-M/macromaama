# Macromaama

*Kadinama Iru.*

A premium dark, responsive nutrition and strength-tracking app built with Next.js App Router, TypeScript, Tailwind CSS, Recharts, and Lucide. Macromaama makes nutrition tracking, muscle development, meal planning, and fitness progress simple and data-driven. It adapts to your profile, evening gym schedule, food preferences, budget, and changing goals.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run build` checks the production build; `npm run lint` runs ESLint.

The app saves its profile, food entries, plans, workouts, weight measurements, water, custom foods, and grocery list in this browser's `localStorage`. It does not currently sync data to Supabase or another device. Use **Settings & Profile → Export my data** for a JSON backup. Browser data can be cleared by the browser or deleted from the app. Data saved by the previous prototype is migrated to the current storage key the first time it is read.

## Optional AI assistant

Copy `.env.example` to `.env.local` and set `GROQ_API_KEY` to enable server-side Groq replies:

```dotenv
GROQ_API_KEY=your_server_side_key
```

Without a key the assistant works in local demo mode using recorded entries and the bundled food list. With a key, the user's question and the relevant local context (meal entries, food names, preferences, and grocery list) are sent from the server to Groq. Do not use it for medical advice, allergy screening, or as a verified nutrition source. Never expose the key with a `NEXT_PUBLIC_` variable.

## Data and safety notes

- Food entries are estimates for listed servings. Recipes, brands, cooking methods, and added oil change nutrition; the values are not labelled as verified.
- No energy requirement, macro prescription, or weight-change target is calculated automatically. Optional reference targets can be entered in the profile. The provided starter age is 17, so individualized nutrition targets and supplements should be discussed with a parent/guardian and qualified health professional.
- The starter profile's 63 kg is profile context, not a recorded weigh-in. Charts contain only actual entries saved by the user; no fake history or forecast is generated.
- Grocery prices are user-entered estimates in ₹, not live local prices.
- `supabase/schema.sql` is a legacy schema from the earlier demo. Macromaama's current UI does not use it. RLS is enabled and there are no anonymous access policies. Add authenticated user ownership and policies before building cloud sync.

## Deploy to Vercel

1. Push the repository to GitHub and import it into Vercel.
2. Optionally set `GROQ_API_KEY` in Vercel's server-side environment variables for AI replies. Leaving it unset keeps the working local-rule assistant.
3. Deploy using Vercel's detected Next.js build settings.

Local browser storage remains local to each browser/device after deployment. Add authenticated database storage before expecting multi-device sync.
