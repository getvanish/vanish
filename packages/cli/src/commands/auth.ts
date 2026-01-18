import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getConfig, setConfig, getKeypair, saveKeypair, loadKeypairFromFile } from '../config';

interface AuthOptions {
  keypair?: string;
  generate?: boolean;
}

export async function authCommand(options: AuthOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n  Vanish Authentication\n'));

  if (options.generate) {
    await generateNewKeypair();
    return;
  }

  if (options.keypair) {
    await useExistingKeypair(options.keypair);
    return;
  }

  // Interactive mode
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'How would you like to authenticate?',
      choices: [
        { name: 'Use existing Solana keypair file', value: 'existing' },
        { name: 'Use default Solana CLI keypair (~/.config/solana/id.json)', value: 'default' },
        { name: 'Generate new keypair', value: 'generate' },
        { name: 'Enter private key manually', value: 'manual' },
      ],
    },
  ]);

  switch (choice) {
    case 'existing':
      const { keypairPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'keypairPath',
          message: 'Path to keypair file:',
          validate: (input) => {
            const resolvedPath = input.startsWith('~')
              ? path.join(os.homedir(), input.slice(1))
              : input;
            if (!fs.existsSync(resolvedPath)) {
              return 'File not found';
            }
            return true;
          },
        },
      ]);
      await useExistingKeypair(keypairPath);
      break;

    case 'default':
      const defaultPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
      if (!fs.existsSync(defaultPath)) {
        console.log(chalk.red('Default Solana keypair not found.'));
        console.log(chalk.gray('Run `solana-keygen new` to create one, or use a different option.'));
        return;
      }
      await useExistingKeypair(defaultPath);
      break;

    case 'generate':
      await generateNewKeypair();
      break;

    case 'manual':
      await manualKeyEntry();
      break;
  }
}

async function useExistingKeypair(keypairPath: string): Promise<void> {
  const spinner = ora('Loading keypair...').start();

  const keypair = loadKeypairFromFile(keypairPath);
  if (!keypair) {
    spinner.fail('Failed to load keypair');
    return;
  }

  setConfig('keypairPath', keypairPath);
  spinner.succeed('Authenticated successfully!');

  console.log();
  console.log(chalk.gray('  Wallet: ') + chalk.white(keypair.publicKey.toBase58()));
  console.log(chalk.gray('  Network: ') + chalk.white(getConfig().network));
  console.log();
}

async function generateNewKeypair(): Promise<void> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Generate a new Solana keypair?',
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Cancelled.'));
    return;
  }

  const spinner = ora('Generating keypair...').start();

  const keypair = Keypair.generate();
  const vanishDir = path.join(os.homedir(), '.vanish');
  const keypairPath = path.join(vanishDir, 'keypair.json');

  saveKeypair(keypair, keypairPath);
  setConfig('keypairPath', keypairPath);

  spinner.succeed('New keypair generated!');

  console.log();
  console.log(chalk.gray('  Wallet: ') + chalk.white(keypair.publicKey.toBase58()));
  console.log(chalk.gray('  Saved to: ') + chalk.white(keypairPath));
  console.log();
  console.log(chalk.yellow('  IMPORTANT: Back up your keypair file!'));
  console.log(chalk.yellow('  If you lose it, you will lose access to your repositories.'));
  console.log();
  console.log(chalk.gray('  To use on devnet, get free SOL at:'));
  console.log(chalk.cyan('  https://faucet.solana.com'));
  console.log();
}

async function manualKeyEntry(): Promise<void> {
  const { privateKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'privateKey',
      message: 'Enter your private key (base58):',
      mask: '*',
    },
  ]);

  const spinner = ora('Validating keypair...').start();

  try {
    const bs58 = require('bs58');
    const secretKey = bs58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    const vanishDir = path.join(os.homedir(), '.vanish');
    const keypairPath = path.join(vanishDir, 'keypair.json');

    saveKeypair(keypair, keypairPath);
    setConfig('keypairPath', keypairPath);

    spinner.succeed('Authenticated successfully!');

    console.log();
    console.log(chalk.gray('  Wallet: ') + chalk.white(keypair.publicKey.toBase58()));
    console.log();
  } catch {
    spinner.fail('Invalid private key');
  }
}

export async function whoami(): Promise<void> {
  const keypair = getKeypair();
  const config = getConfig();

  console.log();
  if (keypair) {
    console.log(chalk.gray('  Wallet: ') + chalk.white(keypair.publicKey.toBase58()));
    console.log(chalk.gray('  Network: ') + chalk.white(config.network));
    if (config.keypairPath) {
      console.log(chalk.gray('  Keypair: ') + chalk.white(config.keypairPath));
    }
  } else {
    console.log(chalk.yellow('  Not authenticated.'));
    console.log(chalk.gray('  Run: ') + chalk.cyan('vanish auth'));
  }
  console.log();
}
