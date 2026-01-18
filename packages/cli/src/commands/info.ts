import chalk from 'chalk';
import { execSync } from 'child_process';
import { getConfig, getKeypair, getLocalRepoConfig } from '../config';

export async function getRepoInfo(): Promise<void> {
  console.log(chalk.bold.cyan('\n  Vanish Info\n'));

  const config = getConfig();
  const keypair = getKeypair();
  const repoConfig = getLocalRepoConfig();

  // Global info
  console.log(chalk.gray('  Network: ') + chalk.white(config.network));

  if (keypair) {
    console.log(chalk.gray('  Wallet: ') + chalk.white(keypair.publicKey.toBase58()));
  } else {
    console.log(chalk.gray('  Wallet: ') + chalk.yellow('Not authenticated'));
  }

  console.log();

  // Repository info
  if (!repoConfig) {
    console.log(chalk.yellow('  Not a Vanish repository.'));
    console.log(chalk.gray('  Run: ') + chalk.cyan('vanish init'));
    console.log();
    return;
  }

  console.log(chalk.gray('  Repository: ') + chalk.white(repoConfig.name));
  console.log(chalk.gray('  Description: ') + chalk.white(repoConfig.description || '(none)'));
  console.log(chalk.gray('  Private: ') + chalk.white(repoConfig.isPrivate ? 'Yes' : 'No'));

  if (repoConfig.owner) {
    console.log(chalk.gray('  Owner: ') + chalk.white(repoConfig.owner.slice(0, 8) + '...'));
  }

  if (repoConfig.createdAt) {
    console.log(chalk.gray('  Created: ') + chalk.white(new Date(repoConfig.createdAt).toLocaleDateString()));
  }

  if (repoConfig.lastPush) {
    console.log(chalk.gray('  Last Push: ') + chalk.white(new Date(repoConfig.lastPush).toLocaleString()));
  }

  if (repoConfig.ipfsCid) {
    console.log(chalk.gray('  IPFS CID: ') + chalk.white(repoConfig.ipfsCid));
  }

  console.log();

  // Git info
  try {
    const headCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8', stdio: 'pipe' }).trim();

    console.log(chalk.gray('  Branch: ') + chalk.white(branch));
    console.log(chalk.gray('  HEAD: ') + chalk.white(headCommit.slice(0, 7)));
    console.log(chalk.gray('  Commits: ') + chalk.white(commitCount));
  } catch {
    console.log(chalk.gray('  (Git info unavailable)'));
  }

  console.log();

  // Show links if pushed
  if (repoConfig.ipfsCid) {
    console.log(chalk.gray('  IPFS Gateway:'));
    console.log(chalk.cyan(`    https://ipfs.io/ipfs/${repoConfig.ipfsCid}`));
    console.log();
  }
}
