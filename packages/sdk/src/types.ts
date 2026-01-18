import { PublicKey } from '@solana/web3.js';

export interface Repository {
  name: string;
  owner: PublicKey;
  description: string;
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
  headCommit: string;
  ipfsCid: string;
}

export interface Commit {
  hash: string;
  message: string;
  author: PublicKey;
  timestamp: number;
  parentHash: string | null;
  treeCid: string;
}

export interface RepoMetadata {
  name: string;
  description: string;
  isPrivate: boolean;
  collaborators: string[];
}

export interface PushResult {
  success: boolean;
  txSignature?: string;
  ipfsCid?: string;
  error?: string;
}

export interface RepoListItem {
  name: string;
  owner: string;
  description: string;
  isPrivate: boolean;
  lastUpdated: Date;
  stars: number;
}

export interface UserProfile {
  publicKey: string;
  displayName?: string;
  avatar?: string;
  repositories: string[];
  createdAt: Date;
}

export interface StorageProvider {
  upload(data: Buffer, options?: UploadOptions): Promise<string>;
  download(cid: string): Promise<Buffer>;
  pin(cid: string): Promise<void>;
}

export interface UploadOptions {
  encrypt?: boolean;
  encryptionKey?: Uint8Array;
}
