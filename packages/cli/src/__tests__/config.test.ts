import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock Conf
jest.mock('conf', () => {
  const store: Record<string, unknown> = {
    network: 'devnet',
    defaultPrivate: false,
  };
  return jest.fn().mockImplementation(() => ({
    get: jest.fn((key: string) => store[key]),
    set: jest.fn((key: string, value: unknown) => {
      store[key] = value;
    }),
  }));
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock os
jest.mock('os', () => ({
  homedir: jest.fn(() => '/home/testuser'),
}));

import {
  getConfig,
  setConfig,
  getKeypair,
  loadKeypairFromFile,
  saveKeypair,
  getLocalRepoConfig,
  saveLocalRepoConfig,
} from '../config';

describe('Config Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return config with defaults', () => {
      const config = getConfig();

      expect(config).toEqual({
        network: 'devnet',
        keypairPath: undefined,
        ipfsApiKey: undefined,
        ipfsApiSecret: undefined,
        defaultPrivate: false,
      });
    });
  });

  describe('loadKeypairFromFile', () => {
    it('should load keypair from file', () => {
      const testKeypair = Keypair.generate();
      const secretKeyArray = Array.from(testKeypair.secretKey);

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(secretKeyArray));

      const loaded = loadKeypairFromFile('/path/to/keypair.json');

      expect(loaded).not.toBeNull();
      expect(loaded?.publicKey.toBase58()).toBe(testKeypair.publicKey.toBase58());
    });

    it('should expand ~ in path', () => {
      const testKeypair = Keypair.generate();
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(Array.from(testKeypair.secretKey))
      );

      loadKeypairFromFile('~/.config/solana/id.json');

      expect(fs.readFileSync).toHaveBeenCalledWith(
        '/home/testuser/.config/solana/id.json',
        'utf-8'
      );
    });

    it('should return null on error', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = loadKeypairFromFile('/nonexistent/path');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('not valid json');

      const result = loadKeypairFromFile('/path/to/invalid.json');
      expect(result).toBeNull();
    });
  });

  describe('getKeypair', () => {
    it('should try default Solana path when no keypairPath configured', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const testKeypair = Keypair.generate();
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(Array.from(testKeypair.secretKey))
      );

      const keypair = getKeypair();

      expect(fs.existsSync).toHaveBeenCalledWith(
        '/home/testuser/.config/solana/id.json'
      );
      expect(keypair).not.toBeNull();
    });

    it('should return null when default path does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const keypair = getKeypair();

      expect(keypair).toBeNull();
    });
  });

  describe('saveKeypair', () => {
    it('should save keypair to file with correct permissions', () => {
      const keypair = Keypair.generate();
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      saveKeypair(keypair, '/path/to/new-keypair.json');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/path/to/new-keypair.json',
        JSON.stringify(Array.from(keypair.secretKey)),
        { mode: 0o600 }
      );
    });

    it('should create directory if it does not exist', () => {
      const keypair = Keypair.generate();
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      saveKeypair(keypair, '/new/dir/keypair.json');

      expect(fs.mkdirSync).toHaveBeenCalledWith('/new/dir', { recursive: true });
    });

    it('should expand ~ in path', () => {
      const keypair = Keypair.generate();
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      saveKeypair(keypair, '~/.solrepo/keypair.json');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/home/testuser/.solrepo/keypair.json',
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('getLocalRepoConfig', () => {
    it('should return null when config does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const config = getLocalRepoConfig();

      expect(config).toBeNull();
    });

    it('should return config when it exists', () => {
      const mockConfig = {
        name: 'my-repo',
        description: 'Test repo',
        isPrivate: false,
      };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      const config = getLocalRepoConfig();

      expect(config).toEqual(mockConfig);
    });

    it('should return null for invalid JSON', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      const config = getLocalRepoConfig();

      expect(config).toBeNull();
    });
  });

  describe('saveLocalRepoConfig', () => {
    it('should create .solrepo directory if needed', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const config = {
        name: 'new-repo',
        description: 'New repository',
        isPrivate: true,
      };

      saveLocalRepoConfig(config);

      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should write config as formatted JSON', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const config = {
        name: 'my-repo',
        description: 'Description',
        isPrivate: false,
      };

      saveLocalRepoConfig(config);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        JSON.stringify(config, null, 2)
      );
    });
  });
});
