import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import { SolRepoClient } from '../client';
import { PROGRAM_ID, SEEDS } from '../constants';

// Mock the entire storage module
jest.mock('../storage', () => ({
  IPFSStorage: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockResolvedValue('QmMockCid12345678901234567890123456789012345'),
    download: jest.fn().mockResolvedValue(Buffer.from('mock-bundle')),
    pin: jest.fn().mockResolvedValue(undefined),
  })),
  packRepository: jest.fn().mockResolvedValue(Buffer.from('mock-bundle')),
  unpackRepository: jest.fn().mockResolvedValue(undefined),
  getRepoMetadata: jest.fn().mockReturnValue({
    headCommit: 'a'.repeat(40),
    branch: 'main',
  }),
}));

// Mock @solana/web3.js partially
jest.mock('@solana/web3.js', () => {
  const actual = jest.requireActual('@solana/web3.js');
  return {
    ...actual,
    Connection: jest.fn().mockImplementation(() => ({
      getAccountInfo: jest.fn().mockResolvedValue(null),
      getProgramAccounts: jest.fn().mockResolvedValue([]),
    })),
    sendAndConfirmTransaction: jest.fn().mockResolvedValue('mock-signature'),
  };
});

describe('SolRepoClient', () => {
  let client: SolRepoClient;
  let keypair: Keypair;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SolRepoClient({ network: 'devnet' });
    keypair = Keypair.generate();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      const defaultClient = new SolRepoClient();
      expect(defaultClient).toBeInstanceOf(SolRepoClient);
    });

    it('should create client with custom RPC endpoint', () => {
      const customClient = new SolRepoClient({
        rpcEndpoint: 'https://custom-rpc.com',
      });
      expect(customClient).toBeInstanceOf(SolRepoClient);
    });

    it('should create client with IPFS credentials', () => {
      const ipfsClient = new SolRepoClient({
        ipfsApiKey: 'test-key',
        ipfsApiSecret: 'test-secret',
      });
      expect(ipfsClient).toBeInstanceOf(SolRepoClient);
    });
  });

  describe('setKeypair and getPublicKey', () => {
    it('should return null when no keypair is set', () => {
      expect(client.getPublicKey()).toBeNull();
    });

    it('should return public key after setting keypair', () => {
      client.setKeypair(keypair);
      expect(client.getPublicKey()).toEqual(keypair.publicKey);
    });
  });

  describe('getRepoPDA', () => {
    it('should derive correct PDA for repository', () => {
      const owner = keypair.publicKey;
      const repoName = 'my-repo';

      const [pda, bump] = client.getRepoPDA(owner, repoName);

      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThanOrEqual(255);
    });

    it('should derive same PDA for same inputs', () => {
      const owner = keypair.publicKey;
      const repoName = 'test-repo';

      const [pda1] = client.getRepoPDA(owner, repoName);
      const [pda2] = client.getRepoPDA(owner, repoName);

      expect(pda1.equals(pda2)).toBe(true);
    });

    it('should derive different PDAs for different repos', () => {
      const owner = keypair.publicKey;

      const [pda1] = client.getRepoPDA(owner, 'repo-1');
      const [pda2] = client.getRepoPDA(owner, 'repo-2');

      expect(pda1.equals(pda2)).toBe(false);
    });

    it('should derive different PDAs for different owners', () => {
      const owner1 = keypair.publicKey;
      const owner2 = Keypair.generate().publicKey;

      const [pda1] = client.getRepoPDA(owner1, 'same-repo');
      const [pda2] = client.getRepoPDA(owner2, 'same-repo');

      expect(pda1.equals(pda2)).toBe(false);
    });
  });

  describe('getUserPDA', () => {
    it('should derive correct PDA for user', () => {
      const owner = keypair.publicKey;

      const [pda, bump] = client.getUserPDA(owner);

      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
    });

    it('should derive same PDA for same user', () => {
      const owner = keypair.publicKey;

      const [pda1] = client.getUserPDA(owner);
      const [pda2] = client.getUserPDA(owner);

      expect(pda1.equals(pda2)).toBe(true);
    });
  });

  describe('createRepository', () => {
    it('should throw error when wallet not connected', async () => {
      await expect(
        client.createRepository('test-repo', 'Test description', false)
      ).rejects.toThrow('Wallet not connected');
    });

    it('should create repository when wallet is connected', async () => {
      client.setKeypair(keypair);

      const signature = await client.createRepository(
        'my-new-repo',
        'A test repository',
        false
      );

      expect(signature).toBe('mock-signature');
    });

    it('should create private repository', async () => {
      client.setKeypair(keypair);

      const signature = await client.createRepository(
        'private-repo',
        'Private repository',
        true
      );

      expect(signature).toBe('mock-signature');
    });
  });

  describe('pushRepository', () => {
    it('should return error when wallet not connected', async () => {
      const result = await client.pushRepository('/path/to/repo', 'my-repo');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet not connected');
    });

    it('should push repository successfully', async () => {
      client.setKeypair(keypair);

      const result = await client.pushRepository('/path/to/repo', 'my-repo');

      expect(result.success).toBe(true);
      expect(result.ipfsCid).toBeDefined();
      expect(result.txSignature).toBe('mock-signature');
    });

    it('should push encrypted repository', async () => {
      client.setKeypair(keypair);

      const result = await client.pushRepository('/path/to/repo', 'private-repo', {
        encrypt: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getRepository', () => {
    it('should return null when repository not found', async () => {
      const repo = await client.getRepository(keypair.publicKey, 'non-existent');
      expect(repo).toBeNull();
    });
  });

  describe('listUserRepositories', () => {
    it('should return empty array when no repositories', async () => {
      const repos = await client.listUserRepositories(keypair.publicKey);
      expect(repos).toEqual([]);
    });
  });

  describe('cloneRepository', () => {
    beforeEach(() => {
      // Mock getRepository to return a repo
      jest.spyOn(client, 'getRepository').mockResolvedValue({
        name: 'test-repo',
        owner: keypair.publicKey,
        description: 'Test',
        isPrivate: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        headCommit: 'a'.repeat(40),
        ipfsCid: 'QmTestCid',
      });
    });

    it('should throw error when repository not found', async () => {
      jest.spyOn(client, 'getRepository').mockResolvedValue(null);

      await expect(
        client.cloneRepository(keypair.publicKey, 'non-existent', '/target')
      ).rejects.toThrow('Repository not found');
    });

    it('should clone public repository', async () => {
      await expect(
        client.cloneRepository(keypair.publicKey, 'test-repo', '/target/path')
      ).resolves.not.toThrow();
    });
  });
});
