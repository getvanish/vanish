# Contributing to Vanish

Thank you for your interest in contributing to Vanish! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Rust (for Solana program development)
- Solana CLI
- Anchor CLI

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-org/vanish.git
cd vanish
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Build all packages:
```bash
npm run build
```

## Project Structure

```
vanish/
├── packages/
│   ├── sdk/       # TypeScript SDK
│   ├── cli/       # Command-line interface
│   ├── web/       # Next.js web application
│   └── program/   # Solana on-chain program
├── .github/       # GitHub Actions workflows
└── docs/          # Documentation
```

## Development Workflow

### Running the Development Server

```bash
# Web application
npm run web:dev

# CLI (development mode)
npm run cli -- <command>
```

### Code Quality

We use ESLint and Prettier to maintain code quality:

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run tests for a specific package
npm run test --workspace=@vanish/sdk
```

### Type Checking

```bash
npm run type-check
```

## Pull Request Process

1. Fork the repository and create your branch from `main`
2. Make your changes following our coding standards
3. Add or update tests as needed
4. Ensure all tests pass and there are no linting errors
5. Update documentation if needed
6. Submit a pull request

### Commit Message Format

We follow conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add repository forking functionality

- Add fork button to repository page
- Implement fork API endpoint
- Update SDK with fork method
```

## Code Style

- Use TypeScript for all JavaScript code
- Follow the existing code patterns
- Keep functions small and focused
- Write meaningful comments for complex logic
- Use descriptive variable and function names

## Testing Guidelines

- Write unit tests for all new functionality
- Maintain test coverage above 70%
- Mock external dependencies (Solana, IPFS)
- Test both success and error cases

## Questions?

If you have questions, please open an issue or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
