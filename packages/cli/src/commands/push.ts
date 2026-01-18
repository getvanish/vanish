import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { VanishClient } from '@vanish/sdk';
import { getConfig, getKeypair, getLocalRepoConfig, saveLocalRepoConfig } from '../config';

interface PushOptions {
  message?: string;
  force?: boolean;
}

export async function pushCommand(options: PushOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n  Pushing to Vanish...\n'));

  // Check if initialized
  const repoConfig = getLocalRepoConfig();
  if (!repoConfig) {
    console.log(chalk.red('Error: Vanish not initialized in this repository.'));
    console.log(chalk.gray('Run: ') + chalk.cyan('vanish init'));
    process.exit(1);
  }

  // Check authentication
  const keypair = getKeypair();
  if (!keypair) {
    console.log(chalk.red('Error: Not authenticated.'));
    console.log(chalk.gray('Run: ') + chalk.cyan('vanish auth'));
    process.exit(1);
  }

  // Check if there are any commits
  try {
    execSync('git rev-parse HEAD', { stdio: 'pipe' });
  } catch {
    console.log(chalk.red('Error: No commits in repository.'));
    console.log(chalk.gray('Make at least one commit before pushing.'));
    process.exit(1);
  }

  const config = getConfig();

  // Create client
  const client = new VanishClient({
    network: config.network,
    ipfsApiKey: config.ipfsApiKey,
    ipfsApiSecret: config.ipfsApiSecret,
  });
  client.setKeypair(keypair);

  console.log(chalk.gray('  Repository: ') + chalk.white(repoConfig.name));
  console.log(chalk.gray('  Owner: ') + chalk.white(keypair.publicKey.toBase58().slice(0, 8) + '...'));
  console.log(chalk.gray('  Network: ') + chalk.white(config.network));
  console.log();

  const spinner = ora('Packing repository...').start();

  try {
    // Get current commit info
    const headCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();

    spinner.text = 'Uploading to IPFS...';

    // Push repository
    const result = await client.pushRepository(
      process.cwd(),
      repoConfig.name,
      { encrypt: repoConfig.isPrivate }
    );

    if (!result.success) {
      spinner.fail('Push failed');
      console.log(chalk.red(result.error));
      process.exit(1);
    }

    spinner.text = 'Recording on Solana...';

    // Update local config
    repoConfig.lastPush = new Date().toISOString();
    repoConfig.ipfsCid = result.ipfsCid;
    repoConfig.owner = keypair.publicKey.toBase58();
    saveLocalRepoConfig(repoConfig);

    spinner.succeed('Pushed successfully!');

    console.log();
    console.log(chalk.gray('  Commit: ') + chalk.white(headCommit.slice(0, 7)));
    console.log(chalk.gray('  Message: ') + chalk.white(commitMessage.split('\n')[0]));
    console.log(chalk.gray('  IPFS CID: ') + chalk.white(result.ipfsCid));
    if (result.txSignature) {
      console.log(chalk.gray('  Tx: ') + chalk.white(result.txSignature.slice(0, 16) + '...'));
    }
    console.log();
    console.log(chalk.green('  Your code is now permanently stored on the decentralized web!'));
    console.log();

    // Show explorer link
    if (config.network === 'devnet') {
      console.log(chalk.gray('  View on Solana Explorer:'));
      console.log(chalk.cyan(`  https://explorer.solana.com/tx/${result.txSignature}?cluster=devnet`));
    } else if (config.network === 'mainnet') {
      console.log(chalk.gray('  View on Solana Explorer:'));
      console.log(chalk.cyan(`  https://explorer.solana.com/tx/${result.txSignature}`));
    }

    // Show IPFS gateway link
    console.log();
    console.log(chalk.gray('  View on IPFS:'));
    console.log(chalk.cyan(`  https://ipfs.io/ipfs/${result.ipfsCid}`));
    console.log();

  } catch (error) {
    spinner.fail('Push failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
