# Problem 2 — Fancy Form: Currency Swap

A currency swap form built with Vite + React + TypeScript. Users select two tokens, enter an amount, and confirm a swap at the live exchange rate.

## Features

- Live token prices fetched from the Switcheo prices API
- Token selector with search, SVG icons, and colored-initials fallback for missing icons
- Two-way amount calculation — editing either field updates the other
- Swap arrow button to reverse the token pair with a rotation animation
- USD value preview under each input
- Exchange rate display with inverse rate
- Simulated 2-second submit with loading spinner
- Success overlay with swap summary
- Input validation: missing tokens, same-token selection, empty/zero/invalid amounts
- API error state with retry
- Responsive layout, dark glassmorphism design

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 8 | Build tool + dev server |
| React | 19 | UI |
| TypeScript | 5.9 (strict) | Type safety |
| Tailwind CSS | 4 | Styling via `@tailwindcss/vite` plugin |
| Vitest | 4 | Unit testing |
| @testing-library/react | 16 | Component test utilities |

## Project Structure

```
src/
├── types/index.ts          # Shared interfaces and discriminated union actions
├── utils/
│   ├── priceUtils.ts       # Deduplication, exchange rate, number formatting
│   └── validation.ts       # Form validation rules
├── hooks/
│   ├── usePrices.ts        # Fetch + deduplicate token prices, retry logic
│   └── useSwapForm.ts      # useReducer-based form state, exported reducer
├── components/
│   ├── AmountInput/        # Controlled decimal input with error display
│   ├── ConfirmButton/      # Submit button with spinner
│   ├── RateDisplay/        # Exchange rate + inverse rate row
│   ├── SwapArrow/          # Animated direction-reverse button
│   ├── TokenSelector/      # Trigger + portal dropdown with search
│   └── SwapCard/           # Orchestrator: loading / error / success / form views
└── __tests__/
    ├── utils/              # priceUtils and validation unit tests
    └── hooks/              # useSwapForm reducer unit tests
```

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm test           # run unit tests (vitest)
npm run test:watch # watch mode
```

## Data Sources

- Prices: `https://interview.switcheo.com/prices.json`
- Icons: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/{SYMBOL}.svg`

## Design Decisions

**`useReducer` over multiple `useState`** — swapping direction changes four fields atomically; a single dispatch avoids intermediate inconsistent renders.

**Rate computed inside the reducer** — `SET_FROM_AMOUNT` and `SET_TO_AMOUNT` derive the exchange rate from `state.fromToken`/`state.toToken` directly, eliminating the stale-closure risk of passing rate as an action payload.

**Portal dropdown with `position: fixed`** — the token dropdown is rendered via `createPortal` and positioned using `getBoundingClientRect()`, so it cannot be clipped by the card's `backdrop-filter` stacking context.

**Click-outside via dual-ref** — the mousedown listener checks both the trigger button ref and the dropdown ref, so a click on a token option is not swallowed before the selection fires.
