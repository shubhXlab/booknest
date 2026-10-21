# Contributing to BookNest

Thank you for your interest in contributing! This project was built as a college project submission, but contributions are welcome.

## 🤝 How to Contribute

### Reporting Bugs
1. Check existing issues first
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment (OS, Node version, browser)

### Suggesting Features
1. Open an issue with the "enhancement" label
2. Describe the feature and its value
3. Discuss implementation approach

### Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test` (both client & server)
5. Run linting: `npm run lint`
6. Commit with conventional commits: `feat: add amazing feature`
7. Push and open a PR

## 🛠 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/booknest.git
cd booknest

# Install dependencies
cd server && npm install
cd ../client && npm install

# Initialize database
cd ../server && npm run init-db

# Start dev servers
# Terminal 1
cd server && npm run dev
# Terminal 2
cd client && npm run dev
```

## 📝 Code Style

- **Backend**: ESLint + TypeScript (strict mode)
- **Frontend**: ESLint + Prettier
- **Commits**: Conventional Commits (feat:, fix:, docs:, etc.)
- **Branches**: `feature/`, `fix/`, `docs/`, `refactor/`, `chore/`

## ✅ Pre-PR Checklist

- [ ] Tests pass (`npm test` in both client & server)
- [ ] Linting passes (`npm run lint`)
- [ ] Type-checking passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Updated documentation if needed
- [ ] Conventional commit messages

## 🏷 Versioning

We use [Semantic Versioning](https://semver.org/). For the college project, version is `1.0.0`.

## 📄 License

By contributing, you agree your contributions will be licensed under the MIT License.

---

**Note**: This is a college project. Major architectural changes may not be accepted as the project scope is fixed for submission.