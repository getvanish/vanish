import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { PROGRAM_ID, SEEDS, NETWORKS } from './constants';
import { Repository, Commit, PushResult, RepoListItem, UserProfile } from './types';
import { IPFSStorage, packRepository, getRepoMetadata } from './storage';
import { deriveEncryptionKey, signMessage } from './crypto';

export interface Logger {
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

const noopLogger: Logger = {
  log: () => {},
  warn: () => {},
  error: () => {},
};

export interface VanishClientConfig {
  network?: 'mainnet' | 'devnet' | 'localnet';
  rpcEndpoint?: string;
  ipfsApiKey?: string;
  ipfsApiSecret?: string;
  logger?: Logger;
}

/**
 * Main client for interacting with Vanish
 */
export class VanishClient {
  private connection: Connection;
  private storage: IPFSStorage;
  private keypair?: Keypair;
  private logger: Logger;

  constructor(config: VanishClientConfig = {}) {
    const endpoint = config.rpcEndpoint || NETWORKS[config.network || 'devnet'];
    this.connection = new Connection(endpoint, 'confirmed');
    this.storage = new IPFSStorage({
      apiKey: config.ipfsApiKey,
      apiSecret: config.ipfsApiSecret,
    });
    this.logger = config.logger || noopLogger;
  }

  /**
   * Set the wallet keypair for signing transactions
   */
  setKeypair(keypair: Keypair): void {
    this.keypair = keypair;
  }

  /**
   * Get the connected wallet's public key
   */
  getPublicKey(): PublicKey | null {
    return this.keypair?.publicKey || null;
  }

  /**
   * Derive the PDA for a repository
   */
  getRepoPDA(owner: PublicKey, repoName: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(SEEDS.REPO),
        owner.toBuffer(),
        Buffer.from(repoName),
      ],
      PROGRAM_ID
    );
  }

  /**
   * Derive the PDA for a user profile
   */
  getUserPDA(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SEEDS.USER), owner.toBuffer()],
      PROGRAM_ID
    );
  }

  /**
   * Create a new repository on-chain
   */
  async createRepository(
    name: string,
    description: string,
    isPrivate: boolean
  ): Promise<string> {
    if (!this.keypair) {
      throw new Error('Wallet not connected');
    }

    const [repoPDA] = this.getRepoPDA(this.keypair.publicKey, name);

    // Create instruction data
    const instructionData = Buffer.alloc(256);
    let offset = 0;

    // Instruction discriminator (0 = create_repo)
    instructionData.writeUInt8(0, offset);
    offset += 1;

    // Name length and name
    instructionData.writeUInt8(name.length, offset);
    offset += 1;
    instructionData.write(name, offset);
    offset += name.length;

    // Description length and description
    instructionData.writeUInt16LE(description.length, offset);
    offset += 2;
    instructionData.write(description, offset);
    offset += description.length;

    // Is private flag
    instructionData.writeUInt8(isPrivate ? 1 : 0, offset);
    offset += 1;

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: this.keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: repoPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: instructionData.slice(0, offset),
    });

    const transaction = new Transaction().add(instruction);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.keypair]
    );

    return signature;
  }

  /**
   * Push a local git repository to SolRepo
   */
  async pushRepository(
    repoPath: string,
    repoName: string,
    options: { encrypt?: boolean } = {}
  ): Promise<PushResult> {
    if (!this.keypair) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // Pack the repository
      this.logger.log('Packing repository...');
      const bundle = await packRepository(repoPath);

      // Get repo metadata
      const { headCommit } = getRepoMetadata(repoPath);

      // Upload to IPFS
      this.logger.log('Uploading to IPFS...');
      const encryptionKey = options.encrypt
        ? deriveEncryptionKey(this.keypair)
        : undefined;

      const ipfsCid = await this.storage.upload(bundle, {
        encrypt: options.encrypt,
        encryptionKey,
      });

      this.logger.log(`Uploaded to IPFS: ${ipfsCid}`);

      // Update on-chain record
      this.logger.log('Recording on Solana...');
      const txSignature = await this.updateRepoOnChain(repoName, headCommit, ipfsCid);

      return {
        success: true,
        txSignature,
        ipfsCid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update repository record on-chain
   */
  private async updateRepoOnChain(
    repoName: string,
    headCommit: string,
    ipfsCid: string
  ): Promise<string> {
    if (!this.keypair) {
      throw new Error('Wallet not connected');
    }

    const [repoPDA] = this.getRepoPDA(this.keypair.publicKey, repoName);

    // Create instruction data
    const instructionData = Buffer.alloc(256);
    let offset = 0;

    // Instruction discriminator (1 = update_repo)
    instructionData.writeUInt8(1, offset);
    offset += 1;

    // Head commit (40 bytes hex string)
    instructionData.write(headCommit, offset);
    offset += 40;

    // IPFS CID length and CID
    instructionData.writeUInt8(ipfsCid.length, offset);
    offset += 1;
    instructionData.write(ipfsCid, offset);
    offset += ipfsCid.length;

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: this.keypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: repoPDA, isSigner: false, isWritable: true },
      ],
      programId: PROGRAM_ID,
      data: instructionData.slice(0, offset),
    });

    const transaction = new Transaction().add(instruction);

    return await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.keypair]
    );
  }

  /**
   * Clone a repository from SolRepo
   */
  async cloneRepository(
    owner: PublicKey,
    repoName: string,
    targetPath: string,
    decryptionKey?: Uint8Array
  ): Promise<void> {
    const repo = await this.getRepository(owner, repoName);
    if (!repo) {
      throw new Error('Repository not found');
    }

    this.logger.log(`Downloading from IPFS: ${repo.ipfsCid}`);
    let bundle = await this.storage.download(repo.ipfsCid);

    // Decrypt if needed
    if (repo.isPrivate && decryptionKey) {
      const { decrypt } = require('./crypto');
      const decrypted = decrypt(new Uint8Array(bundle), decryptionKey);
      if (!decrypted) {
        throw new Error('Failed to decrypt repository');
      }
      bundle = Buffer.from(decrypted);
    }

    const { unpackRepository } = require('./storage');
    await unpackRepository(bundle, targetPath);
    this.logger.log(`Repository cloned to: ${targetPath}`);
  }

  /**
   * Get repository info from chain
   */
  async getRepository(owner: PublicKey, repoName: string): Promise<Repository | null> {
    const [repoPDA] = this.getRepoPDA(owner, repoName);

    try {
      const accountInfo = await this.connection.getAccountInfo(repoPDA);
      if (!accountInfo) {
        return null;
      }

      // Parse account data
      return this.parseRepoAccount(accountInfo.data, owner);
    } catch {
      return null;
    }
  }

  /**
   * List repositories for a user
   */
  async listUserRepositories(owner: PublicKey): Promise<RepoListItem[]> {
    // For MVP, we'll use getProgramAccounts with a filter
    // In production, this would use an indexer for better performance

    const accounts = await this.connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: owner.toBase58(),
          },
        },
      ],
    });

    return accounts.map((account) => {
      const data = account.account.data;
      return this.parseRepoListItem(data);
    });
  }

  /**
   * Parse repository account data
   */
  private parseRepoAccount(data: Buffer, owner: PublicKey): Repository {
    // Simplified parsing - in production, use borsh or anchor
    let offset = 8; // Skip discriminator

    const nameLength = data.readUInt8(offset);
    offset += 1;
    const name = data.toString('utf-8', offset, offset + nameLength);
    offset += nameLength;

    const descLength = data.readUInt16LE(offset);
    offset += 2;
    const description = data.toString('utf-8', offset, offset + descLength);
    offset += descLength;

    const isPrivate = data.readUInt8(offset) === 1;
    offset += 1;

    const createdAt = Number(data.readBigInt64LE(offset));
    offset += 8;

    const updatedAt = Number(data.readBigInt64LE(offset));
    offset += 8;

    const headCommit = data.toString('utf-8', offset, offset + 40);
    offset += 40;

    const cidLength = data.readUInt8(offset);
    offset += 1;
    const ipfsCid = data.toString('utf-8', offset, offset + cidLength);

    return {
      name,
      owner,
      description,
      isPrivate,
      createdAt,
      updatedAt,
      headCommit,
      ipfsCid,
    };
  }

  /**
   * Parse repository list item from account data
   */
  private parseRepoListItem(data: Buffer): RepoListItem {
    let offset = 8;

    const ownerBytes = data.slice(offset, offset + 32);
    offset += 32;

    const nameLength = data.readUInt8(offset);
    offset += 1;
    const name = data.toString('utf-8', offset, offset + nameLength);
    offset += nameLength;

    const descLength = data.readUInt16LE(offset);
    offset += 2;
    const description = data.toString('utf-8', offset, offset + descLength);
    offset += descLength;

    const isPrivate = data.readUInt8(offset) === 1;
    offset += 1;

    offset += 8; // Skip createdAt

    const updatedAt = Number(data.readBigInt64LE(offset));

    return {
      name,
      owner: new PublicKey(ownerBytes).toBase58(),
      description,
      isPrivate,
      lastUpdated: new Date(updatedAt * 1000),
      stars: 0,
    };
  }
}
