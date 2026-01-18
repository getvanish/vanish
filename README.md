# Vanish

[![CI](https://github.com/getvanish/vanish/actions/workflows/ci.yml/badge.svg)](https://github.com/getvanish/vanish/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-1.18-purple.svg)](https://solana.com/)

**Decentralized Git repository storage on Solana**

Vanish is a decentralized code version control platform that combines familiar Git workflows with Solana blockchain identity and decentralized storage.

## Features

- 🔐 **Wallet-based Identity** - Use your Solana wallet (Phantom, Solflare) as your identity
- 📦 **Decentralized Storage** - Repository data stored on IPFS with hashes anchored on Solana
- 🔒 **End-to-End Encryption** - Private repos encrypted with your wallet-derived keys
- 💻 **CLI Integration** - Push repos with familiar `git push vanish` commands
- 🌐 **Web Interface** - Browse and explore public repositories

## Quick Start

### Install CLI

```bash
npm install -g @vanish/cli
```

### Initialize & Push

```bash
# Initialize Vanish in your git repository
vanish init

# Connect your Solana wallet
vanish auth

# Push your repository
vanish push
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Git Repo      │────▶│   Vanish CLI    │────▶│   IPFS Storage  │
│   (local)       │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Solana Program  │
                        │ (Repo Registry) │
                        └─────────────────┘
```

## Packages

- `@vanish/cli` - Command-line interface
- `@vanish/web` - Web interface for browsing repos
- `@vanish/sdk` - JavaScript SDK for integration
- `@vanish/program` - Solana on-chain program

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run web dev server
npm run web:dev

# Run linting
npm run lint

# Run tests
npm run test

# Type checking
npm run type-check
```

## Configuration

Copy `.env.example` to `.env` and configure your environment:

```bash
cp .env.example .env
```

Key configuration options:
- `SOLANA_NETWORK` - Network to use (mainnet, devnet, localnet)
- `VANISH_PROGRAM_ID` - Deployed program address
- `PINATA_API_KEY` - IPFS pinning service API key

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

For security concerns, please see [SECURITY.md](SECURITY.md).

## License

MIT
