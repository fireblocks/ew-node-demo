# Contributing to EW Node Demo

First off, thank you for considering contributing to EW Node Demo! It's people like you that make this project better.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use our bug report template
* Include the steps that reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed and what behavior you expected to see
* Include screenshots if possible
* Include your environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

If you have a suggestion for the project:

* Use our feature request template
* Provide a clear and detailed explanation of the feature
* Explain why this enhancement would be useful to most users
* List some examples of how it would work

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Update the documentation
5. Create the pull request!

## Development Process

1. Clone the repo:
   ```bash
   git clone https://github.com/fireblocks/ew-node-demo.git
   cd ew-node-demo
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment:
   ```bash
   mv .env.example .env
   mv secrets.example secrets
   ```

4. Fill in the required variables

5. Run tests:
   ```bash
   yarn test
   ```

### Coding Style

* Use TypeScript for all new code
* Follow existing code formatting
* Use meaningful variable and function names
* Add JSDoc comments for functions and complex code blocks
* Keep functions focused and modular
* Write unit tests for new features

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### Documentation

* Keep README.md updated
* Document new features
* Update API documentation if needed
* Add comments to explain complex logic

## Project Structure

```
.
├── src/              # Source files
│   ├── managers/     # Core managers
│   └── utils/       # Utility functions
├── tests/           # Test files
└── docs/           # Documentation
```

## Getting Help

If you need help, you can:

* Check the documentation
* Open an issue with your question
* Review existing issues and discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.