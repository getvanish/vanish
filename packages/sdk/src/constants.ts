import { PublicKey } from '@solana/web3.js';

// Program ID for the SolRepo on-chain program
// Set SOLREPO_PROGRAM_ID environment variable for production deployments
// IMPORTANT: Replace with your deployed program address!
// Using System Program as placeholder - will NOT work for actual operations
const DEFAULT_PROGRAM_ID = '11111111111111111111111111111111';
const PROGRAM_ID_STRING = process.env.SOLREPO_PROGRAM_ID || process.env.NEXT_PUBLIC_PROGRAM_ID || DEFAULT_PROGRAM_ID;

export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

// Check if using placeholder (for development warnings)
export const IS_PLACEHOLDER_PROGRAM = PROGRAM_ID_STRING === DEFAULT_PROGRAM_ID;

// Seed prefixes for PDAs
export const SEEDS = {
  REPO: 'repo',
  USER: 'user',
  COMMIT: 'commit',
  COLLABORATOR: 'collab',
} as const;

// Network endpoints
export const NETWORKS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  localnet: 'http://localhost:8899',
} as const;

// IPFS gateways
export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
] as const;

// Default IPFS endpoint for uploads
export const DEFAULT_IPFS_ENDPOINT = 'https://api.pinata.cloud';

// Max repo name length
export const MAX_REPO_NAME_LENGTH = 64;

// Max description length
export const MAX_DESCRIPTION_LENGTH = 256;
