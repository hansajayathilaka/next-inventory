# Quickstart Guide: Hardware Store POS System

This guide will help you set up the development environment and run the application locally.

## Prerequisites

Ensure you have the following installed:

- **Go**: Version 1.21 or higher
  ```bash
  go version  # Should show go1.21 or higher
  ```

- **Node.js**: Version 18 or higher with npm
  ```bash
  node --version  # Should show v18.x or higher
  npm --version
  ```

- **SQLite**: Version 3.35 or higher (usually pre-installed on most systems)
  ```bash
  sqlite3 --version  # Should show 3.35 or higher
  ```

- **Git**: For version control
  ```bash
  git --version
  ```

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd next-inventory
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend

# Download Go dependencies
go mod download

# Verify dependencies are installed
go mod verify
```

#### Database Initialization

The database will be automatically initialized on first run. The SQLite database file will be created at `database/inventory.db`.

```bash
# Create database directory if it doesn't exist
mkdir -p ../database

# Run database migrations (automatically runs on server start)
# Alternatively, create a migration script:
go run cmd/server/main.go migrate
```

#### Start Backend Server

```bash
# Development mode with auto-reload (using air - optional)
# Install air: go install github.com/cosmtrek/air@latest
air

# Or run directly
go run cmd/server/main.go
```

The backend server will start on `http://localhost:8080` (default port).

**Environment Variables** (optional):

Create a `.env` file in the `backend/` directory:

```env
PORT=8080
DB_PATH=../database/inventory.db
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h
SESSION_TIMEOUT=5h
```

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend

# Install dependencies
npm install
```

#### Configure API Endpoint

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8080/api
```

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (Vite default).

### 4. Create Initial Admin User

The application requires an initial admin user to be created. You can do this in two ways:

#### Option A: Database Seeding Script

Run the seeding script (to be created):

```bash
cd backend
go run cmd/server/main.go seed
```

This will create:
- **Admin Role** with all permissions
- **Cashier Role** with limited permissions
- **Default Admin User**:
  - Username: `admin`
  - Password: `admin123` (change immediately after first login)

#### Option B: Direct Database Insertion

```bash
sqlite3 database/inventory.db

-- Create admin role
INSERT INTO roles (name, description, created_at, updated_at)
VALUES ('Admin', 'Full system access', datetime('now'), datetime('now'));

-- Create admin user (password: admin123, bcrypt hashed)
INSERT INTO staff (username, full_name, role_id, password_hash, is_active, created_at, updated_at)
VALUES ('admin', 'System Administrator', 1, '$2a$10$N9qo8uLOickgx2ZMRZoMye1J9YuuLBpFI/TGDnPJJRlTJIgdJN.ca', 1, datetime('now'), datetime('now'));
```

### 5. Access the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Log in with the default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. You should see the dashboard

### 6. Verify Basic Flow

After logging in, verify the following:

1. **Navigation**: Ensure all menu items are accessible
2. **Create Role**: Navigate to Roles → Create a new role (e.g., "Cashier")
3. **Assign Permissions**: Add permissions to the role (e.g., "view_products", "create_sale")
4. **Create Staff**: Navigate to Staff → Create a new staff member
5. **Logout/Login**: Log out and log in with the new staff member

## Development Workflow

### Running Tests

#### Backend Tests

```bash
cd backend

# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific package tests
go test ./internal/services/...

# Run integration tests
go test ./tests/integration/...
```

#### Frontend Tests

```bash
cd frontend

# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Building for Production

#### Backend

```bash
cd backend

# Build binary
go build -o bin/server cmd/server/main.go

# Run production build
./bin/server
```

#### Frontend

```bash
cd frontend

# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

The production build will be in `frontend/dist/`.

### Hot Reload Setup (Optional)

#### Backend Hot Reload with Air

Install Air:

```bash
go install github.com/cosmtrek/air@latest
```

Create `.air.toml` in `backend/`:

```toml
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -o ./tmp/main cmd/server/main.go"
  bin = "tmp/main"
  include_ext = ["go", "tpl", "tmpl", "html"]
  exclude_dir = ["assets", "tmp", "vendor", "tests"]
  delay = 1000

[log]
  time = true
```

Run with:

```bash
cd backend
air
```

## Troubleshooting

### Backend Issues

**Port already in use**:
```bash
# Find process using port 8080
lsof -i :8080
# Kill the process
kill -9 <PID>
```

**Database locked error**:
- Ensure only one backend instance is running
- Check `database/inventory.db-wal` and `database/inventory.db-shm` files exist (WAL mode)
- Restart the backend server

**JWT token errors**:
- Ensure `JWT_SECRET` is set and consistent between restarts
- Clear browser cookies and log in again

### Frontend Issues

**API connection errors**:
- Verify backend is running on `http://localhost:8080`
- Check `VITE_API_URL` in `.env` file
- Check browser console for CORS errors

**Module not found errors**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors**:
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Database Issues

**Reset database**:
```bash
# Backup existing database
cp database/inventory.db database/inventory.db.backup

# Delete database files
rm database/inventory.db*

# Restart backend to recreate
cd backend
go run cmd/server/main.go
```

**View database schema**:
```bash
sqlite3 database/inventory.db
.schema
.tables
.quit
```

## Next Steps

After successful setup:

1. **Configure Roles & Permissions**: Set up roles for your organization (Cashier, Manager, etc.)
2. **Add Staff Members**: Create user accounts for your team
3. **Set Up Categories**: Create product categories hierarchy
4. **Add Suppliers**: Register your suppliers
5. **Add Products**: Create product catalog
6. **Test POS Flow**: Create a test sale to verify the system works end-to-end

## Additional Resources

- **API Documentation**: See `specs/001-initial-pos-system/contracts/api-spec.yaml` (OpenAPI spec)
- **Data Model**: See `specs/001-initial-pos-system/data-model.md`
- **Research Documentation**: See `specs/001-initial-pos-system/research.md`

For issues or questions, refer to the project documentation or create an issue in the repository.
