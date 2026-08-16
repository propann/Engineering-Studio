# Contributing to Studio Ecosystem

Welcome! This guide will help you contribute to the Studio Ecosystem project.

## 🤝 Code of Conduct

Be respectful, inclusive, and constructive. Treat all contributors with courtesy.

## 🎯 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm
- Git
- Text editor (VS Code recommended)

### Setup Development Environment

```bash
# Clone repository
git clone <repository-url>
cd studio-ecosystem

# Install dependencies
npm install

# Install audio libraries (optional, for Sound Editor)
npm install -D wavesurfer.js tone.js

# Verify setup
npm run lint
npm test
```

### Project Structure

```
studio-ecosystem/
├── packages/
│   ├── sound-editor/     # Audio editing tool
│   ├── svg-editor/       # Vector drawing tool
│   ├── studio-hub/       # Main dashboard
│   ├── op1-studio/       # OP-1 integration
│   ├── ep133-studio/     # EP-133 integration
│   └── shared-ui/        # Shared components
├── tools/                # Analysis & conversion tools
└── docs/                 # Documentation
```

## 💻 Development Workflow

### 1. Create Feature Branch

```bash
# From main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow these guidelines:

#### Code Style
- Use TypeScript strict mode
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic

#### Testing
- Write tests for new features
- Ensure all tests pass
- Aim for 80%+ coverage

```bash
npm test -- --coverage
```

#### Linting
```bash
npm run lint
npm run lint -- --fix  # Auto-fix issues
```

### 3. Commit Changes

Use conventional commit format:

```bash
git add .
git commit -m "type(scope): description"

# Examples:
# feat(svg-editor): add layer reordering
# fix(sound-editor): correct pitch detection
# docs(readme): update setup instructions
# test(alignment): add distribution tests
# chore(deps): upgrade dependencies
```

### 4. Push & Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create PR on GitHub:
- Fill in PR template
- Reference related issues
- Describe changes clearly
- Add screenshots if UI changes

### 5. Code Review

- Address feedback promptly
- Keep discussion professional
- Request re-review after changes
- Merge once approved

## 📝 Documentation

### When to Document
- New features → Add to README
- API changes → Update COMPONENTS.md
- Setup changes → Update DEPLOYMENT.md
- Architecture changes → Update relevant guide

### Documentation Standards
- Use Markdown format
- Include code examples
- Add screenshots for UI features
- Keep examples current

## 🧪 Testing

### Writing Tests

```typescript
// Test file location: src/__tests__/[feature].test.ts

import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- stores.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Test Coverage
- Unit tests: Core business logic
- Integration tests: Feature workflows
- E2E tests: Complete user journeys
- Performance tests: Speed benchmarks

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview  # Test production build locally
```

### Deployment Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Bundle size acceptable
- [ ] No console errors
- [ ] Performance verified
- [ ] Documentation updated

## 📦 Package Management

### Adding Dependencies
```bash
# Add to main project
npm install package-name

# Add to specific package
npm install -w packages/svg-editor package-name

# Add dev dependency
npm install -D --save-exact package-name@version
```

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm update package-name
```

## 🐛 Reporting Issues

### Bug Report Template
```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Expected result
4. Actual result

## Environment
- OS: [e.g., macOS 13]
- Browser: [e.g., Chrome 120]
- Node: [e.g., 20.x]

## Screenshots
[If applicable]
```

## ✨ Feature Request Template
```markdown
## Description
What feature would you like?

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives
Other approaches?
```

## 📋 Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issue
Fixes #[issue-number]

## Testing
Describe testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No new console errors
- [ ] No breaking changes
```

## 🔍 Code Review Checklist

Reviewers should verify:
- ✅ Code follows project style
- ✅ Tests are included
- ✅ Documentation is updated
- ✅ No console errors/warnings
- ✅ Performance impact considered
- ✅ Security implications reviewed
- ✅ Accessibility maintained
- ✅ Tests pass locally

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm test                # Run tests
npm test -- --coverage # With coverage report
npm test -- --watch    # Watch mode

# Linting & Formatting
npm run lint            # Run ESLint
npm run lint -- --fix   # Auto-fix
npm run format          # Format code

# Documentation
npm run docs            # Generate docs (if configured)
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [Vite Documentation](https://vitejs.dev)
- [Vitest Documentation](https://vitest.dev)

## 🤔 Questions?

- Check existing documentation
- Search issues for similar problems
- Ask in discussions
- Contact project maintainers

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🎉 Thank You!

Your contributions make this project better. Thanks for helping! 🙏

---

**Happy coding!** 💻✨

