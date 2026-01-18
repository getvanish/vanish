import chalk from 'chalk';
import ora from 'ora';
import { PublicKey } from '@solana/web3.js';
import { VanishClient } from '@vanish/sdk';
import { getConfig, getKeypair } from '../config';

interface ListOptions {
  all?: boolean;
  user?: string;
}

export async function listCommand(options: ListOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n  Vanish Repositories\n'));

  const config = getConfig();
  const keypair = getKeypair();

  // Create client
  const client = new VanishClient({
    network: config.network,
  });

  let targetPubkey: PublicKey | null = null;

  if (options.user) {
    try {
      targetPubkey = new PublicKey(options.user);
    } catch {
      console.log(chalk.red('Error: Invalid public key.'));
      process.exit(1);
    }
  } else if (keypair && !options.all) {
    targetPubkey = keypair.publicKey;
  }

  if (!targetPubkey && !options.all) {
    console.log(chalk.yellow('Not authenticated. Showing usage:'));
    console.log();
    console.log(chalk.gray('  List your repositories:'));
    console.log(chalk.cyan('    vanish auth    ') + chalk.gray('# First authenticate'));
    console.log(chalk.cyan('    vanish list'));
    console.log();
    console.log(chalk.gray('  List a specific user\'s repositories:'));
    console.log(chalk.cyan('    vanish list --user <public_key>'));
    console.log();
    return;
  }

  const spinner = ora('Fetching repositories...').start();

  try {
    if (targetPubkey) {
      // List repositories for a specific user
      const repos = await client.listUserRepositories(targetPubkey);

      spinner.stop();

      if (repos.length === 0) {
        console.log(chalk.gray('  No repositories found.'));
        console.log();
        return;
      }

      console.log(chalk.gray(`  Owner: ${targetPubkey.toBase58().slice(0, 8)}...`));
      console.log(chalk.gray(`  Network: ${config.network}`));
      console.log();

      // Display repositories
      for (const repo of repos) {
        const visibility = repo.isPrivate
          ? chalk.yellow('[private]')
          : chalk.green('[public]');

        console.log(`  ${chalk.white(repo.name)} ${visibility}`);
        if (repo.description) {
          console.log(chalk.gray(`    ${repo.description}`));
        }
        console.log(chalk.gray(`    Updated: ${formatDate(repo.lastUpdated)}`));
        console.log();
      }

      console.log(chalk.gray(`  Total: ${repos.length} repositories`));
      console.log();

    } else {
      // List all public repositories (in production, this would use an indexer)
      spinner.stop();
      console.log(chalk.yellow('  Listing all public repositories requires an indexer.'));
      console.log(chalk.gray('  This feature is not available in the MVP.'));
      console.log();
      console.log(chalk.gray('  To list a specific user\'s repositories:'));
      console.log(chalk.cyan('    vanish list --user <public_key>'));
      console.log();
    }

  } catch (error) {
    spinner.fail('Failed to fetch repositories');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    return 'just now';
  }
}
