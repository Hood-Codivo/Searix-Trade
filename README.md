# Searix Trade

A mobile-first trading companion for Solana's on-chain order-book markets — built around one idea: you should be able to see what you're about to trade into before you commit to it.

## The problem

On-chain order books are transparent in theory — every quote, every fill, every level of depth is public. In practice, almost none of that transparency reaches the person about to tap "buy" on their phone. Most mobile trading apps show a price and ask you to trust it. Searix Trade shows the market underneath the price: how tight the spread really is, how much depth actually backs it, and whether recent activity looks clean or worth a second look — before you commit any funds.

## What it does

**Market discovery.** Browse active markets with an at-a-glance read on execution quality — not just price and 24h change, but spread, depth, and a plain-language quality signal that flags when a book looks thin or one-sided.

**Market depth, visualized.** Price history and cumulative depth are rendered as real charts, not a single flat number, so you can see the shape of the book rather than take it on faith.

**Fairness language you can act on.** Every market carries a short, honest explanation of what its quality signal means — described as a signal worth weighing, never as financial advice or proof of anything.

**Your own wallet, your own keys.** Connect the Solana wallet you already use. Searix Trade never asks for, sees, or stores a private key — signing happens entirely inside your wallet app.

**Transparent economics.** Any fee the platform takes is stated plainly, not buried — including while that fee isn't yet being collected.

## Design philosophy

Searix Trade is opinionated about honesty over polish-that-hides-things: empty states say when there's nothing to show, error states say when something couldn't load, and preview states are labeled as previews. Nothing pretends to be more finished than it is.

## Tech stack

- **Framework**: [Expo](https://expo.dev/) (React Native) with [expo-router](https://docs.expo.dev/router/introduction/) (file-based routing), TypeScript throughout
- **Wallet**: `@solana-mobile/mobile-wallet-adapter-protocol-web3js` (real Mobile Wallet Adapter — connect, reauthorize, sign & submit; Android-only by nature of MWA), `@solana/web3.js`, session persisted via `expo-secure-store`
- **UI**: `lucide-react-native` icons, `expo-linear-gradient`, `react-native-svg` (real SVG charts, no charting library), Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`)
- **Backend link**: plain `fetch` against the Searix Trade backend's REST API, plus a live WebSocket subscription (`src/services/marketStream.ts`) for real-time market updates — configured via `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOLANA_NETWORK` (`.env`)

## Screens

- **Markets** (`app/(tabs)/index.tsx`) — home screen: live market list, real ticker chips for the flagship tokenized stocks, search/filter
- **Market detail** (`app/market/[id].tsx`) — real price chart with a floating price-tag callout, execution-quality stats, the pre-trade execution lab (analyze → preview → sign & submit), and the verified-asset-registry card for tokenized stocks
- **Watchlist** (`app/(tabs)/watchlist.tsx`) — placeholder; honestly labeled as not built yet rather than faked
- **Receipts** (`app/(tabs)/receipts.tsx`) — real saved execution receipts, verified vs. analysis-only
- **Alerts** (`app/(tabs)/alerts.tsx`) — real peg-deterioration alerts from the backend
- **Profile** (`app/(tabs)/profile.tsx`) — wallet connection state, and the platform's real fee/collection/revenue numbers, never hidden

## Run

```bash
npm install
npx expo start --web    # browser preview
npx expo run:android    # real device/emulator, required for wallet signing (MWA is Android-only)
```

Copy `.env` and point `EXPO_PUBLIC_API_URL` at a running backend (defaults to the deployed Render
instance). `EXPO_PUBLIC_SOLANA_NETWORK` defaults to `devnet`, matching the backend's default.

## Security update

Wallet connection now includes a sign-in message (not a transaction). Private API calls use an expiring session stored in SecureStore. Old or expired sessions require reconnecting. Install the matching hardened backend before using this app build.

`EXPO_PUBLIC_API_URL` must use HTTPS in production. `EXPO_PUBLIC_SOLANA_RPC_URL` optionally sets the independently trusted mainnet RPC used for pre-sign simulation; it defaults to Solana's public mainnet endpoint. This URL is bundled into the app: never include a privileged RPC credential. Public RPC rate limits can block signing; use an app-safe RPC endpoint with appropriate quotas.

Before signing, the app verifies the signer, permitted instruction families, token spending, minimum output and token authorities. It simulates through the independent RPC. These checks depend on the trusted RPC and swap programs and are not an audit of those programs.

After submission, pending receipt confirmations are persisted in SecureStore. The retry action confirms the same signature instead of signing another swap. A failed/expired pending transaction needs reconciliation against chain history before clearing its journal; this intentionally blocks automatic resubmission.

Validation (Node 22.18+):

```bash
npm run typecheck
npm run test:security
npx expo export --platform android --output-dir /tmp/searix-export --max-workers 2 --no-bytecode
```

A real Android wallet smoke test is still required before release; an export is not a device test. See the backend `SECURITY.md` for the full audit and remaining dependency issues.
