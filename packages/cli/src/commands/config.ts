import chalk from 'chalk';
import { getConfig, setConfig, VanishConfig } from '../config';

interface ConfigOptions {
  list?: boolean;
  set?: string;
  get?: string;
  network?: string;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n  Vanish Configuration\n'));

  if (options.list) {
    listConfig();
    return;
  }

  if (options.get) {
    getConfigValue(options.get);
    return;
  }

  if (options.set) {
    setConfigValue(options.set);
    return;
  }

  if (options.network) {
    setNetwork(options.network);
    return;
  }

  // Default: show all config
  listConfig();
}

function listConfig(): void {
  const config = getConfig();

  console.log(chalk.gray('  network: ') + chalk.white(config.network));
  console.log(chalk.gray('  keypairPath: ') + chalk.white(config.keypairPath || '(not set)'));
  console.log(chalk.gray('  ipfsApiKey: ') + chalk.white(config.ipfsApiKey ? '****' : '(not set)'));
  console.log(chalk.gray('  defaultPrivate: ') + chalk.white(config.defaultPrivate ? 'true' : 'false'));
  console.log();
}

function getConfigValue(key: string): void {
  const config = getConfig();
  const value = (config as unknown as Record<string, unknown>)[key];

  if (value === undefined) {
    console.log(chalk.yellow(`  Unknown config key: ${key}`));
    console.log();
    console.log(chalk.gray('  Available keys:'));
    console.log(chalk.gray('    network, keypairPath, ipfsApiKey, ipfsApiSecret, defaultPrivate'));
  } else {
    console.log(chalk.gray(`  ${key}: `) + chalk.white(String(value) || '(not set)'));
  }
  console.log();
}

function setConfigValue(keyValue: string): void {
  const [key, ...valueParts] = keyValue.split('=');
  const value = valueParts.join('=');

  if (!key || !value) {
    console.log(chalk.red('  Invalid format. Use: --set key=value'));
    console.log();
    return;
  }

  const validKeys: (keyof VanishConfig)[] = [
    'network',
    'keypairPath',
    'ipfsApiKey',
    'ipfsApiSecret',
    'defaultPrivate',
  ];

  if (!validKeys.includes(key as keyof VanishConfig)) {
    console.log(chalk.yellow(`  Unknown config key: ${key}`));
    console.log();
    console.log(chalk.gray('  Available keys:'));
    console.log(chalk.gray('    ' + validKeys.join(', ')));
    console.log();
    return;
  }

  // Handle boolean conversion
  let parsedValue: string | boolean = value;
  if (key === 'defaultPrivate') {
    parsedValue = value === 'true';
  }

  // Handle network validation
  if (key === 'network') {
    const validNetworks = ['mainnet', 'devnet', 'localnet'];
    if (!validNetworks.includes(value)) {
      console.log(chalk.red(`  Invalid network: ${value}`));
      console.log(chalk.gray('  Valid networks: mainnet, devnet, localnet'));
      console.log();
      return;
    }
  }

  setConfig(key as keyof VanishConfig, parsedValue as never);
  console.log(chalk.green(`  Set ${key} = ${value}`));
  console.log();
}

function setNetwork(network: string): void {
  const validNetworks = ['mainnet', 'devnet', 'localnet'];

  if (!validNetworks.includes(network)) {
    console.log(chalk.red(`  Invalid network: ${network}`));
    console.log(chalk.gray('  Valid networks: mainnet, devnet, localnet'));
    console.log();
    return;
  }

  setConfig('network', network as 'mainnet' | 'devnet' | 'localnet');
  console.log(chalk.green(`  Network set to: ${network}`));
  console.log();
}
