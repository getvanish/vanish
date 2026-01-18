# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Vanish, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue
2. Email security concerns to: security@vanish.dev (replace with actual email)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Credit in security advisory (if desired)

## Security Considerations

### Cryptography

- We use TweetNaCl for encryption (NaCl secretbox)
- Private repositories are encrypted end-to-end
- Keys are derived from Solana keypairs

### On-Chain Security

- Program uses Anchor framework with built-in checks
- PDA-based account derivation
- Owner validation on all mutations

### IPFS Storage

- Content-addressed storage (CID verification)
- Optional encryption for private data
- Multiple gateway fallbacks

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Known Limitations

1. **Ed25519 to X25519 Conversion**: Simplified implementation for MVP
2. **Simulated IPFS**: Falls back to local simulation without API keys
3. **No Audit**: This code has not been professionally audited

## Best Practices for Users

1. Never share your Solana keypair
2. Use hardware wallets for mainnet
3. Verify repository authenticity via on-chain records
4. Keep your CLI and dependencies updated
