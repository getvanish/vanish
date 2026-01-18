import { IPFSStorage, packRepository, unpackRepository, getRepoMetadata } from '../storage';
import { Keypair } from '@solana/web3.js';
import { deriveEncryptionKey } from '../crypto';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  mkdtempSync: jest.fn(() => '/tmp/solrepo-test'),
  readFileSync: jest.fn(() => Buffer.from('mock-bundle-data')),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
}));

// Mock os
jest.mock('os', () => ({
  tmpdir: jest.fn(() => '/tmp'),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('Storage Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('IPFSStorage', () => {
    describe('upload', () => {
      it('should simulate upload when no API key is provided', async () => {
        const storage = new IPFSStorage();
        const data = Buffer.from('test data');

        const cid = await storage.upload(data);

        expect(cid).toMatch(/^Qm[a-zA-Z0-9]{44}$/);
      });

      it('should generate consistent CID for same data', async () => {
        const storage = new IPFSStorage();
        const data = Buffer.from('consistent data');

        const cid1 = await storage.upload(data);
        const cid2 = await storage.upload(data);

        expect(cid1).toBe(cid2);
      });

      it('should generate different CID for different data', async () => {
        const storage = new IPFSStorage();

        const cid1 = await storage.upload(Buffer.from('data 1'));
        const cid2 = await storage.upload(Buffer.from('data 2'));

        expect(cid1).not.toBe(cid2);
      });

      it('should encrypt data when encrypt option is true', async () => {
        const storage = new IPFSStorage();
        const keypair = Keypair.generate();
        const encryptionKey = deriveEncryptionKey(keypair);
        const data = Buffer.from('sensitive data');

        const cidEncrypted = await storage.upload(data, {
          encrypt: true,
          encryptionKey,
        });
        const cidPlain = await storage.upload(data);

        // Different CIDs because encrypted data is different
        expect(cidEncrypted).not.toBe(cidPlain);
      });

      it('should upload to Pinata when API key is provided', async () => {
        const mockResponse = { IpfsHash: 'QmTestCid123456789012345678901234567890123' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const storage = new IPFSStorage({
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
        });
        const data = Buffer.from('test data');

        const cid = await storage.upload(data);

        expect(cid).toBe(mockResponse.IpfsHash);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'pinata_api_key': 'test-api-key',
              'pinata_secret_api_key': 'test-api-secret',
            }),
          })
        );
      });

      it('should throw error on upload failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          statusText: 'Unauthorized',
        });

        const storage = new IPFSStorage({
          apiKey: 'invalid-key',
        });

        await expect(storage.upload(Buffer.from('data'))).rejects.toThrow(
          'Failed to upload to IPFS: Unauthorized'
        );
      });
    });

    describe('download', () => {
      it('should download from IPFS gateway', async () => {
        const mockData = Buffer.from('downloaded data');
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockData),
        });

        const storage = new IPFSStorage();
        const result = await storage.download('QmTestCid');

        expect(result).toEqual(mockData);
        expect(global.fetch).toHaveBeenCalledWith('https://ipfs.io/ipfs/QmTestCid');
      });

      it('should try fallback gateways on failure', async () => {
        const mockData = Buffer.from('fallback data');
        (global.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            arrayBuffer: () => Promise.resolve(mockData),
          });

        const storage = new IPFSStorage();
        const result = await storage.download('QmTestCid');

        expect(result).toEqual(mockData);
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it('should throw error when all gateways fail', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const storage = new IPFSStorage();

        await expect(storage.download('QmTestCid')).rejects.toThrow(
          'Failed to download from IPFS: QmTestCid'
        );
      });
    });

    describe('pin', () => {
      it('should simulate pin when no API key', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const storage = new IPFSStorage();

        await storage.pin('QmTestCid');

        expect(consoleSpy).toHaveBeenCalledWith('[Simulated] Pinned CID: QmTestCid');
        consoleSpy.mockRestore();
      });

      it('should pin via Pinata API when key provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

        const storage = new IPFSStorage({
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        });

        await storage.pin('QmTestCid');

        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.pinata.cloud/pinning/pinByHash',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ hashToPin: 'QmTestCid' }),
          })
        );
      });
    });
  });

  describe('packRepository', () => {
    it('should create a git bundle', async () => {
      const { execSync } = require('child_process');
      const fs = require('fs');

      const bundle = await packRepository('/path/to/repo');

      expect(execSync).toHaveBeenCalledWith(
        'git bundle create "/tmp/solrepo-test/repo.bundle" --all',
        expect.objectContaining({ cwd: '/path/to/repo' })
      );
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(fs.rmSync).toHaveBeenCalledWith('/tmp/solrepo-test', {
        recursive: true,
        force: true,
      });
      expect(bundle).toEqual(Buffer.from('mock-bundle-data'));
    });
  });

  describe('unpackRepository', () => {
    it('should unpack a git bundle', async () => {
      const { execSync } = require('child_process');
      const fs = require('fs');

      const bundle = Buffer.from('bundle-data');
      await unpackRepository(bundle, '/target/path');

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalledWith('/target/path', { recursive: true });
      expect(execSync).toHaveBeenCalledWith(
        'git clone "/tmp/solrepo-test/repo.bundle" "/target/path"',
        expect.any(Object)
      );
    });
  });

  describe('getRepoMetadata', () => {
    it('should return head commit and branch', () => {
      const { execSync } = require('child_process');
      (execSync as jest.Mock)
        .mockReturnValueOnce('abc123def456\n')
        .mockReturnValueOnce('main\n');

      const metadata = getRepoMetadata('/repo/path');

      expect(metadata).toEqual({
        headCommit: 'abc123def456',
        branch: 'main',
      });
      expect(execSync).toHaveBeenCalledWith('git rev-parse HEAD', expect.any(Object));
      expect(execSync).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD', expect.any(Object));
    });
  });
});
