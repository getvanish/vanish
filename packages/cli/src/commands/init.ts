import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { saveLocalRepoConfig, getLocalRepoConfig, getKeypair } from '../config';

interface InitOptions {
  name?: string;
  description?: string;
  private?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n  Initializing Vanish...\n'));

  // Check if we're in a git repository
  if (!isGitRepo()) {
    console.log(chalk.red('Error: Not a git repository.'));
    console.log(chalk.gray('Please run this command inside a git repository.'));
    process.exit(1);
  }

  // Check if already initialized
  const existing = getLocalRepoConfig();
  if (existing) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Vanish is already initialized. Overwrite?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Initialization cancelled.'));
      return;
    }
  }

  // Get repository name
  let repoName = options.name;
  if (!repoName) {
    const dirName = path.basename(process.cwd());
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Repository name:',
        default: dirName,
        validate: (input) => {
          if (!input.trim()) return 'Name is required';
          if (input.length > 64) return 'Name must be 64 characters or less';
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
            return 'Name can only contain letters, numbers, hyphens, and underscores';
          }
          return true;
        },
      },
    ]);
    repoName = answers.name;
  }

  // Get description
  let description = options.description;
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description (optional):',
        default: '',
      },
    ]);
    description = answers.description;
  }

  // Get privacy setting
  let isPrivate = options.private ?? false;
  if (options.private === undefined) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'private',
        message: 'Make repository private?',
        default: false,
      },
    ]);
    isPrivate = answers.private;
  }

  const spinner = ora('Creating Vanish configuration...').start();

  try {
    // Create .vanish directory
    const vanishDir = path.join(process.cwd(), '.vanish');
    if (!fs.existsSync(vanishDir)) {
      fs.mkdirSync(vanishDir, { recursive: true });
    }

    // Save configuration
    saveLocalRepoConfig({
      name: repoName!,
      description: description || '',
      isPrivate,
      createdAt: new Date().toISOString(),
    });

    // Add .vanish to .gitignore if not already there
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    let gitignore = '';
    if (fs.existsSync(gitignorePath)) {
      gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    }
    if (!gitignore.includes('.vanish')) {
      fs.appendFileSync(gitignorePath, '\n# Vanish\n.vanish/\n');
    }

    spinner.succeed('Vanish initialized successfully!');

    console.log();
    console.log(chalk.gray('  Repository: ') + chalk.white(repoName));
    console.log(chalk.gray('  Private: ') + chalk.white(isPrivate ? 'Yes' : 'No'));
    if (description) {
      console.log(chalk.gray('  Description: ') + chalk.white(description));
    }

    // Check if authenticated
    const keypair = getKeypair();
    if (!keypair) {
      console.log();
      console.log(chalk.yellow('  Note: You need to authenticate before pushing.'));
      console.log(chalk.gray('  Run: ') + chalk.cyan('vanish auth'));
    } else {
      console.log();
      console.log(chalk.green('  Ready to push!'));
      console.log(chalk.gray('  Run: ') + chalk.cyan('vanish push'));
    }
    console.log();
  } catch (error) {
    spinner.fail('Failed to initialize Vanish');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
