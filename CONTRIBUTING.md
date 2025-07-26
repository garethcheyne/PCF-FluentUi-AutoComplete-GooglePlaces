# Contributing to PCF FluentUI AutoComplete - Google Places

Thank you for your interest in contributing to this PCF control! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information**:
   - PCF version and Power Platform environment
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or error logs

### Suggesting Features

1. **Check the roadmap** in issues for planned features
2. **Open a feature request** with:
   - Clear description of the feature
   - Use case and business value
   - Proposed implementation approach
   - Examples or mockups if applicable

### Code Contributions

#### Prerequisites

- Node.js 18+ and npm
- Power Platform CLI
- TypeScript knowledge
- React experience
- Familiarity with PCF development

#### Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/PCF-FluentUi-AutoComplete-GooglePlaces.git
   cd PCF-FluentUi-AutoComplete-GooglePlaces
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your environment**:
   - Copy `.env.example` to `.env.dev`
   - Add your Google Places API key
   - Configure test environment settings

4. **Start development**:
   ```bash
   npm start
   ```

#### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow coding standards**:
   - Use TypeScript strict mode
   - Follow existing code style and patterns
   - Add JSDoc comments for public methods
   - Use meaningful variable and function names

3. **Test your changes**:
   ```bash
   npm run build
   npm run test (if tests are available)
   ```

4. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add country restriction toggle functionality"
   ```

#### Code Style Guidelines

##### TypeScript/React
- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript interfaces for all props and state
- Follow React best practices for performance
- Prefer composition over inheritance

##### CSS
- Use CSS variables for theming
- Follow BEM naming convention where appropriate
- Ensure responsive design
- Test accessibility compliance

##### PCF Specific
- Follow PCF naming conventions (no hyphens in constructor names)
- Implement proper lifecycle methods
- Handle context updates efficiently
- Respect PCF property types and constraints

#### Pull Request Process

1. **Update documentation** if needed
2. **Ensure all checks pass**:
   - Build succeeds
   - No TypeScript errors
   - Code follows style guidelines
   - All tests pass (when available)

3. **Create pull request**:
   - Use descriptive title
   - Reference related issues
   - Provide detailed description of changes
   - Include screenshots for UI changes

4. **Respond to feedback**:
   - Address review comments promptly
   - Make requested changes
   - Update PR description if scope changes

## 🔧 Development Guidelines

### Architecture Principles

- **Separation of concerns**: Keep API logic, UI components, and PCF integration separate
- **Error handling**: Implement comprehensive error boundaries and user feedback
- **Performance**: Optimize for large datasets and slow networks
- **Accessibility**: Ensure WCAG 2.1 AA compliance
- **Extensibility**: Design for easy customization and theming

### Component Structure

```
PCFFluentUiAutoComplete/
├── index.ts              # PCF control entry point
├── tsx/
│   ├── AutoComplete.tsx  # Main dropdown component
│   ├── EntityHoverCard.tsx # Hover card with maps
│   └── Queries.tsx       # API integration
├── types/
│   └── *.ts             # Type definitions
├── css/
│   └── *.css            # Styling
└── strings/
    └── *.resx           # Localization
```

### API Integration Guidelines

- **Google Places API**: Use new Place API with legacy fallback
- **Error handling**: Implement proper retry logic and user notifications
- **Rate limiting**: Respect API quotas and implement throttling
- **Caching**: Cache responses where appropriate to reduce API calls

### Testing Strategy

While comprehensive tests are not yet implemented, contributors should:

1. **Manual testing**:
   - Test in multiple browsers
   - Verify mobile responsiveness
   - Test with different data volumes
   - Validate accessibility with screen readers

2. **PCF testing**:
   - Test in Canvas and Model-driven apps
   - Verify property binding works correctly
   - Test context updates and lifecycle events

3. **API testing**:
   - Test with different API keys
   - Verify fallback mechanisms
   - Test error scenarios (network issues, API limits)

## 📋 Release Process

1. **Version numbering**: Follow semantic versioning (MAJOR.MINOR.PATCH)
2. **Change documentation**: Update CHANGELOG.md with all changes
3. **Testing**: Thorough testing in staging environment
4. **Release notes**: Create comprehensive release notes
5. **Solution packaging**: Build and test final solution package

## 💬 Communication

- **GitHub Issues**: For bugs, features, and questions
- **Discussions**: For general questions and community interaction
- **Email**: For security issues or private concerns

## 📝 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- GitHub repository contributors list

## ❓ Questions?

If you have questions about contributing:

1. Check existing documentation and issues
2. Join GitHub Discussions
3. Reach out via GitHub issues with the "question" label

Thank you for contributing to make this PCF control better for the Power Platform community!
