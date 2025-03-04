# EW Node Demo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

EW Node Demo is a command-line interface (CLI) tool for managing embedded wallets. It provides a simple and intuitive interface for executing commands and managing wallet operations through Fireblocks' infrastructure.

## Features

- Execute commands through the command line.
- Simple and easy-to-use interface.
- Extensible architecture for adding more commands.
- Interactive command selection.

## Installation

To install the CLI tool:

```bash
git clone https://github.com/fireblocks/ew-node-demo.git
cd ew-node-demo
yarn install
```

## Setup

1. Configure environment variables:

   ```bash
   mv .env.example .env
   ```

   Edit `.env` with your configuration.

2. Set up secrets:
   ```bash
   mv secrets.example secrets
   ```
   Update the secrets files with your credentials.

## Usage

Start the CLI tool:

```bash
yarn start
```

You will be prompted to choose a command to execute.

## Documentation

- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community standards
- [Security Policy](SECURITY.md) - Security practices and reporting

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development process
- Pull request process
- Coding standards

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Open an issue for bugs
- See documentation for help
- Contact support team for assistance
