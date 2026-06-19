# Contributing to LUXE Store

First off, thank you for considering contributing to LUXE Store! It's people like you who make the open-source community such an amazing place to learn, inspire, and create.

## How Can I Contribute?

### Reporting Bugs
* Check the existing issues/commits to make sure the bug hasn't already been reported.
* Open a new issue with a clear title and description, providing as much relevant information as possible, including:
  * Steps to reproduce the issue.
  * Expected behavior vs. actual behavior.
  * Screenshots or video recordings if applicable.
  * Details about your browser version, OS, and local runtime node version.

### Proposing Enhancements
* Open a new issue describing the feature you'd like to see added.
* Explain why this enhancement would be useful to other users.

### Submitting Pull Requests
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-amazing-feature
   ```
2. Make your modifications. Make sure your code adheres to standard styling and TypeScript principles.
3. Verify that the project builds successfully without lint or compilation errors:
   ```bash
   npm run build
   ```
4. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "Add some amazing feature"
   ```
5. Push to your branch:
   ```bash
   git push origin feature/my-amazing-feature
   ```
6. Open a Pull Request against the `main` branch of this repository.

## Development Guidelines
* Maintain consistent file naming conventions.
* Keep components small, focused, and reusable.
* Ensure all SQL commands are parameterized (using `$1, $2` index variables) to protect against SQL injections.
* Test your changes against both SQLite and PostgreSQL backends if modifying the database logic layer.
