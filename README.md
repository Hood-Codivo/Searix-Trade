# Searix Trade

A mobile-first transparency and trading interface for Solana central-limit-order-book markets.

## Current milestone

The repository currently contains the read-only V1 product shell:

- market discovery with quality badges and depth imbalance
- responsive price and cumulative depth charts
- execution-quality metrics and careful fairness language
- fixture data behind typed market models

The mobile application now reads this data from the separate Fastify service in `backend/`. Start that service before the app:

```powershell
cd backend
npm install
npm start
```

In another terminal:

```powershell
npm start
```

Set `EXPO_PUBLIC_API_URL` when the backend is not available at `http://127.0.0.1:4000`. Android Emulator commonly uses `http://10.0.2.2:4000` to reach the host machine.

- explicit empty, loading, error, and preview states

Wallet signing, live Phoenix ingestion, and order submission are intentionally not connected yet.

## Run locally

```bash
npm install
npm run web
```

For native wallet integrations, use an Expo custom development build rather than Expo Go.

### Android development build over USB

Enable USB debugging on the phone, connect it, and accept the debugging prompt.
With the Android SDK and Java installed, build and install the development app:

```bash
npm install
adb devices
adb reverse tcp:8081 tcp:8081
adb reverse tcp:4000 tcp:4000
npm run android
```

Select the connected phone when prompted. After the initial installation, start
Metro over USB with the following commands and press `a` to open the app:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:4000 tcp:4000
npm run start:android
```

Run the separate backend on port 4000 for market data. Rebuild with
`npm run android` whenever native dependencies or native configuration change,
including when adding MWA. Installing the development client alone does not
implement wallet connectivity.

Frontend — what is finished

- Expo and React Native foundation
- Dark Searix Trade design system
- IBM Plex typography
- Bottom navigation
- Markets screen
- Market search
- Market rows
- Price sparklines
- Quality badges
- Depth-imbalance indicators
- Market Detail screen
- Price chart
- Cumulative depth chart
- Execution-quality tiles
- Fairness explanation
- Buy and Sell preview
- Loading, empty and API-error states
- Frontend API client
- Responsive mobile layout
- Successful TypeScript and web builds

Frontend — what is left
Live market experience

- Replace polling with the backend WebSocket stream
- Display connection status accurately
- Detect stale market data
- Reconnect after network interruptions
- Preserve the last valid market snapshot
- Add real candlestick intervals
- Add an order-book price ladder
- Add complete market filters and sorting
- Add watchlist persistence
  Wallet integration
- Wallet-selection screen
- Android MWA 2.0
- iOS Phantom integration
- iOS Solflare universal/deep links
- Jupiter Mobile Adapter
- Connect, reconnect and disconnect states
- Copy address and explorer links
- Wallet-not-installed handling
- Secure session persistence
  Trading interface
- Complete order ticket
- Limit and market order selection
- Price and quantity inputs
- Balance validation
- Slippage estimates
- Complete fee breakdown
- Transaction simulation result
- Wallet confirmation flow
- Transaction progress timeline
- User rejection and timeout handling
- Partial-fill display
- Open orders and cancellation
- Trade history
  Additional screens
- Portfolio
- Open orders
- Order history
- Wallet settings
- Watchlist
- Alerts
- Notification preferences
- Subscription/paywall screens
  Mobile release work
- Android custom development build
- iOS development build
- App icons and splash screen
- Deep-link configuration
- Push notification configuration
- Accessibility testing
- Physical Android and iPhone testing
- Play Store and App Store preparation
