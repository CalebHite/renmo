# Renmo - XRPL Payment App

A Venmo-like payment application built on the XRPL (XRP Ledger) using RLUSD (Ripple's stablecoin).

## Features

- Connect to XRPL Testnet
- Generate and fund test wallets
- Send and receive payments
- View transaction history
- Modern, responsive UI

## Tech Stack

- Next.js 15 with TypeScript
- React 19
- Tailwind CSS
- XRPL.js
- Zustand for state management

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/renmo.git
   cd renmo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/renmo
  /src
    /components      # React components
    /hooks          # Custom hooks for XRPL
    /lib            # XRPL utility functions
    /app            # Next.js app directory
  /public           # Static assets
```

## XRPL Integration

The app uses the XRPL Testnet for all operations. To get started:

1. Connect your wallet using the "Connect Wallet" button
2. A new test wallet will be generated and funded automatically
3. Use the wallet address to send and receive payments

## License

MIT License - see LICENSE file for details
