# next-inventory Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-24

## Active Technologies
- Frontend: React 19 + TypeScript + Vite
- Backend: Go 1.23 + Gin framework + GORM + SQLite
- Testing: Playwright (E2E tests with Page Object Model)

## Project Structure
```
frontend/          # React/TypeScript frontend with Vite
backend/          # Go backend with Gin framework
tests/            # Playwright E2E tests with POM pattern
specs/            # Feature specifications and documentation
database/         # SQLite database file
```

## Testing Framework

### Playwright E2E Tests
- Location: `tests/`
- Pattern: Page Object Model (POM)
- Configuration: `tests/playwright.config.ts`
- Base URL: `http://localhost:5173`

### Running Tests
```bash
cd tests
npm install
npm test                    # Run all tests
npm run test:ui            # Run in UI mode
npm run test:debug         # Debug mode
npm run test:report        # View HTML report
```

### Test Coverage
- **Login**: 9 tests (form display, credentials, error handling)
- **POS**: 12 tests (sessions, cart, payments, discounts)
- **Credits**: 16 tests (search, status, settlements)
- **Total**: 37 happy path workflow tests

### Key Test Components
- **Page Objects**: `tests/pom/` - LoginPage, POSPage, CreditsPage, BasePage
- **Selectors**: `tests/selectors/` - Centralized selector files
- **Test Data**: `tests/data/testData.ts` - Users, customers, products
- **Fixtures**: `tests/fixtures/testFixtures.ts` - Custom Playwright fixtures
- **Utils**: `tests/utils/testHelpers.ts` - Common helper functions
- **Specs**: `tests/specs/` - Test specifications (login, pos, credits)

### Testing Standards
See `specs/001-initial-pos-system/constitution.md` for:
- Architectural principles
- Test organization standards
- Selector management strategy
- Best practices and guidelines
- Maintenance procedures

## Commands

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Backend
```bash
cd backend
go mod tidy         # Manage dependencies
go run ./cmd/server # Run development server
go build ./cmd/server # Build binary
```

### Testing
```bash
cd tests
npm test            # Run all tests
npm run test:ui     # Interactive mode
npm run test:debug  # Debugging mode
npm run test:report # View results
```

## Code Style

### Frontend (TypeScript/React)
- Follow standard React conventions
- Use TypeScript for type safety
- Component-based architecture
- shadcn/ui components

### Backend (Go)
- Follow Go naming conventions
- Repository pattern for data access
- Service layer for business logic
- Structured error handling

### Tests (TypeScript)
- Page Object Model pattern (mandatory)
- Centralized selectors (required)
- Descriptive test names
- Happy path workflows first

## Recent Changes
- 2025-10-24: Added Playwright E2E testing framework with POM pattern
- 2025-10-24: Created 37 happy path workflow tests
- 2025-10-24: Added project constitution with testing standards

<!-- MANUAL ADDITIONS START -->
## Testing Implementation Notes

### Playwright Setup (2025-10-24)
- Implemented Page Object Model pattern for test organization
- Created 4 page objects: BasePage, LoginPage, POSPage, CreditsPage
- Centralized selectors in dedicated selector files
- Created custom Playwright fixtures for common scenarios
- Implemented 37 happy path workflow tests
- Added comprehensive helper utilities
- Created project constitution with testing guidelines

### Test Data
- Test data sourced from `backend/seeders/data/*.json`
- Centralized in `tests/data/testData.ts`
- Includes: users, customers, products, payments, discounts

### Running Tests Locally
1. Start frontend: `cd frontend && npm run dev`
2. Start backend: `cd backend && go run ./cmd/server` (if needed)
3. Run tests: `cd tests && npm test`
4. Debug selectors: `npm run test:debug` or `npm run test:ui`
<!-- MANUAL ADDITIONS END -->