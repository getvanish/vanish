import { StorageProvider, UploadOptions } from './types';
import { encrypt, decrypt } from './crypto';

/**
 * IPFS Storage Provider
 * Handles uploading and downloading repository data to/from IPFS
 */
export class IPFSStorage implements StorageProvider {
  private endpoint: string;
  private apiKey?: string;
  private apiSecret?: string;

  constructor(config: { endpoint?: string; apiKey?: string; apiSecret?: string } = {}) {
    this.endpoint = config.endpoint || 'https://api.pinata.cloud';
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  /**
   * Upload data to IPFS
   */
  async upload(data: Buffer, options: UploadOptions = {}): Promise<string> {
    let uploadData = data;

    // Encrypt if requested
    if (options.encrypt && options.encryptionKey) {
      uploadData = Buffer.from(encrypt(new Uint8Array(data), options.encryptionKey));
    }

    // For MVP, simulate IPFS upload by generating a CID-like hash
    // In production, this would use the actual IPFS API
    if (!this.apiKey) {
      return this.simulateUpload(uploadData);
    }

    const formData = new FormData();
    formData.append('file', new Blob([uploadData]));

    const response = await fetch(`${this.endpoint}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.apiSecret || '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  }

  /**
   * Download data from IPFS
   */
  async download(cid: string): Promise<Buffer> {
    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch {
        continue;
      }
    }

    throw new Error(`Failed to download from IPFS: ${cid}`);
  }

  /**
   * Pin a CID to ensure it stays available
   */
  async pin(cid: string): Promise<void> {
    if (!this.apiKey) {
      console.log(`[Simulated] Pinned CID: ${cid}`);
      return;
    }

    const response = await fetch(`${this.endpoint}/pinning/pinByHash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.apiSecret || '',
      },
      body: JSON.stringify({ hashToPin: cid }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pin CID: ${response.statusText}`);
    }
  }

  /**
   * Simulate IPFS upload for local development
   */
  private simulateUpload(data: Buffer): string {
    // Generate a fake CID based on content hash
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `Qm${hash.slice(0, 44)}`; // Simulated CIDv0 format
  }
}

/**
 * Pack a git repository into a single uploadable bundle
 */
export async function packRepository(repoPath: string): Promise<Buffer> {
  const { execSync } = require('child_process');
  const path = require('path');
  const fs = require('fs');
  const os = require('os');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solrepo-'));
  const bundlePath = path.join(tempDir, 'repo.bundle');

  try {
    // Create a git bundle of the entire repository
    execSync(`git bundle create "${bundlePath}" --all`, {
      cwd: repoPath,
      stdio: 'pipe',
    });

    const bundleData = fs.readFileSync(bundlePath);
    return bundleData;
  } finally {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Unpack a repository bundle
 */
export async function unpackRepository(bundle: Buffer, targetPath: string): Promise<void> {
  const { execSync } = require('child_process');
  const path = require('path');
  const fs = require('fs');
  const os = require('os');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solrepo-'));
  const bundlePath = path.join(tempDir, 'repo.bundle');

  try {
    fs.writeFileSync(bundlePath, bundle);
    fs.mkdirSync(targetPath, { recursive: true });

    execSync(`git clone "${bundlePath}" "${targetPath}"`, {
      stdio: 'pipe',
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Get repository metadata from local git repo
 */
export function getRepoMetadata(repoPath: string): { headCommit: string; branch: string } {
  const { execSync } = require('child_process');

  const headCommit = execSync('git rev-parse HEAD', { cwd: repoPath, encoding: 'utf-8' }).trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath, encoding: 'utf-8' }).trim();

  return { headCommit, branch };
}
