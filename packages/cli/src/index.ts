#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { authCommand } from './commands/auth';
import { pushCommand } from './commands/push';
import { cloneCommand } from './commands/clone';
import { listCommand } from './commands/list';
import { configCommand } from './commands/config';

const program = new Command();

program
  .name('vanish')
  .description('Decentralized Git repository storage on Solana')
  .version('0.1.0');

// Initialize Vanish in current directory
program
  .command('init')
  .description('Initialize Vanish in the current Git repository')
  .option('-n, --name <name>', 'Repository name')
  .option('-d, --description <desc>', 'Repository description')
  .option('-p, --private', 'Make repository private', false)
  .action(initCommand);

// Authenticate with Solana wallet
program
  .command('auth')
  .description('Authenticate with your Solana wallet')
  .option('-k, --keypair <path>', 'Path to Solana keypair file')
  .option('--generate', 'Generate a new keypair')
  .action(authCommand);

// Push repository to Vanish
program
  .command('push')
  .description('Push current repository to Vanish')
  .option('-m, --message <msg>', 'Push message')
  .option('-f, --force', 'Force push', false)
  .action(pushCommand);

// Clone repository from Vanish
program
  .command('clone <owner> <repo>')
  .description('Clone a repository from Vanish')
  .option('-o, --output <path>', 'Output directory')
  .action(cloneCommand);

// List repositories
program
  .command('list')
  .description('List your repositories')
  .option('-a, --all', 'Show all public repositories')
  .option('-u, --user <pubkey>', 'List repositories for a specific user')
  .action(listCommand);

// Configuration
program
  .command('config')
  .description('Manage Vanish configuration')
  .option('-l, --list', 'List all configuration')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('--network <network>', 'Set network (mainnet, devnet, localnet)')
  .action(configCommand);

// Info command
program
  .command('info')
  .description('Show current repository info')
  .action(async () => {
    const { getRepoInfo } = await import('./commands/info');
    await getRepoInfo();
  });

// Whoami command
program
  .command('whoami')
  .description('Show current authenticated wallet')
  .action(async () => {
    const { whoami } = await import('./commands/auth');
    await whoami();
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(`Run ${chalk.cyan('vanish --help')} for a list of available commands.`);
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.bold.cyan('\n  Vanish - Decentralized Git on Solana\n'));
  program.outputHelp();
}
