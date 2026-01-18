import chalk from 'chalk';
import ora from 'ora';
import { PublicKey } from '@solana/web3.js';
import * as path from 'path';
import * as fs from 'fs';
import { VanishClient } from '@vanish/sdk';
import { getConfig, getKeypair } from '../config';

interface CloneOptions {
  output?: string;
}

export async function cloneCommand(
  owner: string,
  repo: string,
  options: CloneOptions
): Promise<void> {
  console.log(chalk.bold.cyan('\n  Cloning from Vanish...\n'));

  // Validate owner public key
  let ownerPubkey: PublicKey;
  try {
    ownerPubkey = new PublicKey(owner);
  } catch {
    console.log(chalk.red('Error: Invalid owner public key.'));
    process.exit(1);
  }

  // Determine output path
  const outputPath = options.output || path.join(process.cwd(), repo);

  // Check if directory already exists
  if (fs.existsSync(outputPath)) {
    console.log(chalk.red(`Error: Directory already exists: ${outputPath}`));
    process.exit(1);
  }

  const config = getConfig();
  const keypair = getKeypair();

  // Create client
  const client = new VanishClient({
    network: config.network,
    ipfsApiKey: config.ipfsApiKey,
    ipfsApiSecret: config.ipfsApiSecret,
  });

  if (keypair) {
    client.setKeypair(keypair);
  }

  console.log(chalk.gray('  Owner: ') + chalk.white(owner.slice(0, 8) + '...'));
  console.log(chalk.gray('  Repository: ') + chalk.white(repo));
  console.log(chalk.gray('  Network: ') + chalk.white(config.network));
  console.log();

  const spinner = ora('Fetching repository info...').start();

  try {
    // Get repository info
    const repoInfo = await client.getRepository(ownerPubkey, repo);

    if (!repoInfo) {
      spinner.fail('Repository not found');
      process.exit(1);
    }

    if (repoInfo.isPrivate && !keypair) {
      spinner.fail('Repository is private');
      console.log(chalk.yellow('You need to authenticate to clone private repositories.'));
      console.log(chalk.gray('Run: ') + chalk.cyan('vanish auth'));
      process.exit(1);
    }

    spinner.text = 'Downloading from IPFS...';

    // Get decryption key if private
    let decryptionKey: Uint8Array | undefined;
    if (repoInfo.isPrivate && keypair) {
      const { deriveEncryptionKey } = require('@vanish/sdk');
      decryptionKey = deriveEncryptionKey(keypair);
    }

    // Clone repository
    await client.cloneRepository(ownerPubkey, repo, outputPath, decryptionKey);

    spinner.succeed('Cloned successfully!');

    console.log();
    console.log(chalk.gray('  Location: ') + chalk.white(outputPath));
    console.log(chalk.gray('  Head: ') + chalk.white(repoInfo.headCommit.slice(0, 7)));
    console.log(chalk.gray('  IPFS CID: ') + chalk.white(repoInfo.ipfsCid));
    console.log();

  } catch (error) {
    spinner.fail('Clone failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
