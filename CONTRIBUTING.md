# Contributing to KEKTECH 3.0

Thank you for your interest in contributing to KEKTECH 3.0 Prediction Markets! This document provides guidelines and instructions for contributing to the project.

---

## 🎯 Code of Conduct

- Be respectful and professional
- Focus on constructive feedback
- Help maintain code quality and security
- Follow established patterns and conventions

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ and npm
- Git
- Familiarity with Solidity and Hardhat
- Understanding of smart contract security

### Development Setup

```bash
# Clone the repository
git clone https://github.com/0xBased-lang/BMAD-Kektech3.0.git
cd BMAD-Kektech3.0

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npm test
```

### Project Structure

```
BMAD-KEKTECH3.0/
├── contracts/          # Smart contracts
├── test/               # Test suites
├── scripts/            # Deployment and utility scripts
├── docs/               # Documentation
└── .bmad/              # BMAD framework
```

See [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) for complete navigation.

---

## 💻 Development Guidelines

### Coding Standards

**Solidity**:
- Version: 0.8.20 (strict)
- Follow OpenZeppelin patterns and conventions
- Use NatSpec comments for all public/external functions
- Follow checks-effects-interactions pattern
- Use ReentrancyGuard for state-changing functions
- Implement pull payment pattern for fund transfers

**Example**:
```solidity
/**
 * @notice Stakes NFT and calculates voting power
 * @param tokenId The NFT token ID to stake
 * @dev Requires NFT approval and validates token ID range
 */
function stakeNFT(uint256 tokenId) external override nonReentrant whenNotPaused {
    require(tokenId <= MAX_TOKEN_ID, "Token ID exceeds maximum");
    // ... implementation
}
```

**JavaScript/TypeScript**:
- Use async/await for asynchronous operations
- Follow Airbnb style guide
- Use meaningful variable and function names
- Add comments for complex logic

### Security Best Practices

**CRITICAL - Always Follow**:
1. ✅ Use `ReentrancyGuard` on all state-changing functions
2. ✅ Implement pull payment pattern (no push payments)
3. ✅ Validate all inputs and check boundaries
4. ✅ Use `SafeMath` or Solidity 0.8+ for overflow protection
5. ✅ Emit events for all state changes
6. ✅ Follow checks-effects-interactions pattern
7. ✅ Never commit private keys or sensitive data
8. ✅ Use access control modifiers (onlyOwner, onlyResolver, etc.)

**Security Patterns We Use**:
- Linear fee formulas (not parabolic)
- Multiply-before-divide for precision
- Minimum volume requirements
- Pull payments for all payouts
- Maximum resolution reversals
- Grace periods for betting
- Timelocks for critical operations

See [docs/guides/SECURITY_AUDIT_CHECKLIST.md](./docs/guides/SECURITY_AUDIT_CHECKLIST.md) for complete security guidelines.

---

## 🧪 Testing Requirements

### Test Coverage

- **Minimum**: 80% coverage for new features
- **Target**: 90%+ coverage (our current: 87.3%)
- **Critical Functions**: 100% coverage required

### Test Types

**Unit Tests** (`test/unit/`):
```javascript
describe("PredictionMarket", function() {
  it("Should allow betting during active period", async function() {
    // Test implementation
  });
});
```

**Bulletproof Tests** (`test/*-bulletproof-*.js`):
- Edge cases and boundary conditions
- Security attack scenarios
- State transition validation

**Integration Tests** (`test/integration/`):
- Multi-contract interactions
- Complete user workflows

### Running Tests

```bash
# Run all tests
npm test

# Run specific suite
npm test -- test/unit/01-prediction-market-basic.test.js

# Run bulletproof tests
npm test -- test/*-bulletproof-*.js

# Run with coverage
npm run coverage
```

### Writing Good Tests

**DO**:
- ✅ Test one thing per test case
- ✅ Use descriptive test names
- ✅ Test both success and failure cases
- ✅ Test edge cases and boundaries
- ✅ Use proper setup and teardown

**DON'T**:
- ❌ Test multiple unrelated things
- ❌ Use generic names like "test1"
- ❌ Skip error case testing
- ❌ Assume happy path only

---

## 📝 Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass**:
   ```bash
   npm test
   ```

2. **Check code compiles**:
   ```bash
   npx hardhat compile
   ```

3. **Update documentation** if needed

4. **Follow commit message conventions** (see below)

### PR Guidelines

**1. Create a Feature Branch**:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**2. Make Your Changes**:
- Follow coding standards
- Add/update tests
- Update documentation

**3. Commit Your Changes**:
```bash
git add .
git commit -m "feat: add new feature description"
```

**4. Push and Create PR**:
```bash
git push origin feature/your-feature-name
```

Then create PR on GitHub with:
- Clear title and description
- Reference any related issues
- List changes made
- Include test results

### Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build process or auxiliary tool changes

**Examples**:
```
feat(market): add multi-outcome betting support

fix(staking): resolve rarity calculation edge case

docs: update README with deployment instructions

test(governance): add edge case tests for voting power
```

### PR Review Process

1. **Automated Checks**: All tests must pass
2. **Code Review**: At least one approval required
3. **Security Review**: For contract changes
4. **Documentation Review**: For user-facing changes

---

## 🔒 Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email security details privately to the team
2. Include detailed description and reproduction steps
3. Wait for acknowledgment before public disclosure

### Security Testing

Before submitting contract changes:

```bash
# Run security tests
npm test -- test/security/

# Run attack scenario tests
npm test -- test/attack-bulletproof-scenarios.test.js

# Check for known vulnerabilities
npm audit
```

---

## 📚 Documentation

### When to Update Documentation

Update documentation when you:
- Add new features
- Change existing behavior
- Fix bugs that affect usage
- Add new deployment steps
- Update dependencies

### Documentation Locations

- **README.md**: Project overview and quick start
- **docs/guides/**: Operational guides
- **docs/deployment/**: Deployment instructions
- **docs/bulletproof/**: Testing documentation
- **Code comments**: Inline NatSpec and explanations

---

## 🎯 Areas for Contribution

### High Priority

- **Testing**: Increase coverage above 90%
- **Integration Tests**: Complete remaining 26 tests
- **Gas Optimization**: Further reduce costs
- **Documentation**: Improve guides and examples

### Medium Priority

- **Security**: Additional attack scenario tests
- **Monitoring**: Enhanced operational dashboards
- **Scripts**: Automation and tooling improvements

### Future Features

See [KEKTECH_3.0_MASTER_PLAN.md](./KEKTECH_3.0_MASTER_PLAN.md) for roadmap:
- Advanced market types (Duel, NFT Battle)
- Frontend integration
- Multi-chain expansion
- Enhanced analytics

---

## ❓ Questions and Support

### Getting Help

1. **Documentation**: Start with [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
2. **Issues**: Check existing GitHub issues
3. **Discussions**: GitHub discussions for questions

### Useful Resources

- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Master Plan**: [KEKTECH_3.0_MASTER_PLAN.md](./KEKTECH_3.0_MASTER_PLAN.md)
- **Test Results**: [BULLETPROOF_ACHIEVEMENT_90_PERCENT.md](./BULLETPROOF_ACHIEVEMENT_90_PERCENT.md)
- **Deployment**: [docs/deployment/](./docs/deployment/)

---

## 🏆 Recognition

Contributors will be recognized in:
- Project documentation
- Release notes
- GitHub contributors page

Significant contributions may be highlighted in project announcements.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (proprietary).

---

## 🙏 Thank You!

Your contributions help make KEKTECH 3.0 better for everyone. We appreciate your:
- Code contributions
- Bug reports
- Documentation improvements
- Testing efforts
- Community support

**Happy coding!** 🚀

---

**Last Updated**: 2025-01-26
**Version**: 1.0
