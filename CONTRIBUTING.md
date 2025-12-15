# Contributing to ErgoSense

Thank you for your interest in contributing to ErgoSense! We welcome contributions from the community to help make this project better.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or later (LTS recommended)
- **npm**: Included with Node.js
- **Build Tools**:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: Visual Studio Build Tools (C++ workload) or `npm install --global --production windows-build-tools`
  - **Linux**: `build-essential` and python3

> **Note:** This project uses native modules (`better-sqlite3`, `brightness`), so a proper C++ build environment is required.

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
    _If you encounter errors during installation, it is likely due to missing build tools for native modules. Check the Prerequisites section._

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
