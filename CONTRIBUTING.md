# Contributing to ErgoSense

Thank you for your interest in contributing to ErgoSense! We welcome contributions from the community to help make this project better.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v22.12 or later (matches `engines` in `package.json`)
- **npm**: Included with Node.js

> **Note:** No C++ build tools or Python are needed. The database uses Electron's built-in `node:sqlite`, and `onnxruntime-node` ships prebuilt binaries for Windows, macOS, and Linux.

### Installation

1.  **Fork the repository** on GitHub.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/TheSadishGautam/ergosense.git
    cd ergosense
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
    _If installation fails, check that you are on Node.js 22.12 or later (`node -v`)._

### Running Locally

To start the development server:

```bash
npm run dev
```

This will launch the Electron application with Hot Module Replacement (HMR) enabled.

## Development Workflow

1.  **Create a branch** for your feature or fix:
    ```bash
    git checkout -b feature/amazing-feature
    ```
2.  **Make your changes**.
3.  **Lint your code** to ensure it meets quality standards:
    ```bash
    npm run lint
    ```
4.  **Commit your changes** with descriptive commit messages.
5.  **Push to your fork**:
    ```bash
    git push origin feature/amazing-feature
    ```
6.  **Open a Pull Request** against the `main` branch of the original repository.

## Project Structure

- `electron/`: Main process code (TypeScript).
- `renderer/`: Frontend React application.
- `models/`: Shared types and constants.
- `scripts/`: Helper scripts.

## Code Style

- We use **ESLint** and **Prettier** for code formatting.
- Please ensure your code passes linting before submitting a PR.
- Use TypeScript types explicitly where possible.

## License

By contributing, you agree that your contributions will be licensed under the MIT License defined in the `LICENSE.md` file.
