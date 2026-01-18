import Conf from 'conf';
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface VanishConfig {
  network: 'mainnet' | 'devnet' | 'localnet';
  keypairPath?: string;
  ipfsApiKey?: string;
  ipfsApiSecret?: string;
  defaultPrivate: boolean;
}

const config = new Conf<VanishConfig>({
  projectName: 'vanish',
  defaults: {
    network: 'devnet',
    defaultPrivate: false,
  },
});

export function getConfig(): VanishConfig {
  return {
    network: config.get('network'),
    keypairPath: config.get('keypairPath'),
    ipfsApiKey: config.get('ipfsApiKey'),
    ipfsApiSecret: config.get('ipfsApiSecret'),
    defaultPrivate: config.get('defaultPrivate'),
  };
}

export function setConfig<K extends keyof VanishConfig>(
  key: K,
  value: VanishConfig[K]
): void {
  config.set(key, value);
}

export function getKeypair(): Keypair | null {
  const keypairPath = config.get('keypairPath');

  if (!keypairPath) {
    // Try default Solana CLI path
    const defaultPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
    if (fs.existsSync(defaultPath)) {
      return loadKeypairFromFile(defaultPath);
    }
    return null;
  }

  return loadKeypairFromFile(keypairPath);
}

export function loadKeypairFromFile(filePath: string): Keypair | null {
  try {
    const resolvedPath = filePath.startsWith('~')
      ? path.join(os.homedir(), filePath.slice(1))
      : filePath;

    const secretKey = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch {
    return null;
  }
}

export function saveKeypair(keypair: Keypair, filePath: string): void {
  const resolvedPath = filePath.startsWith('~')
    ? path.join(os.homedir(), filePath.slice(1))
    : filePath;

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    resolvedPath,
    JSON.stringify(Array.from(keypair.secretKey)),
    { mode: 0o600 }
  );
}

export function getLocalRepoConfig(): LocalRepoConfig | null {
  const configPath = path.join(process.cwd(), '.vanish', 'config.json');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

export function saveLocalRepoConfig(config: LocalRepoConfig): void {
  const vanishDir = path.join(process.cwd(), '.vanish');
  const configPath = path.join(vanishDir, 'config.json');

  if (!fs.existsSync(vanishDir)) {
    fs.mkdirSync(vanishDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export interface LocalRepoConfig {
  name: string;
  description: string;
  isPrivate: boolean;
  owner?: string;
  createdAt?: string;
  lastPush?: string;
  ipfsCid?: string;
}
