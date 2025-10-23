package main

import (
	"flag"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/hardware-store/pos-backend/internal/database"
	"github.com/hardware-store/pos-backend/internal/logger"
	"github.com/hardware-store/pos-backend/internal/repositories"
	"github.com/hardware-store/pos-backend/internal/services"
	"gorm.io/gorm"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize logger
	logger.Init()

	// Parse command line flags
	dbPath := flag.String("db", getEnv("DATABASE_PATH", "./database/inventory.db"), "Path to SQLite database")
	dataPath := flag.String("data", "./seeders/data", "Path to seeder data directory")
	fresh := flag.Bool("fresh", false, "Drop all data and start fresh (use with caution!)")
	flag.Parse()

	log.Println("🌱 Hardware Store POS Seeder")
	log.Printf("Database: %s\n", *dbPath)
	log.Printf("Data path: %s\n", *dataPath)

	// Initialize database
	db, err := database.InitDB(*dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// If fresh flag is set, drop all data
	if *fresh {
		log.Println("⚠️  Dropping all data...")
		if err := dropAllTables(db); err != nil {
			log.Fatalf("Failed to drop tables: %v", err)
		}
		log.Println("✓ All tables dropped")
	}

	// Run database migrations (create tables if they don't exist)
	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize repositories
	permissionRepo := repositories.NewPermissionRepository(db)
	roleRepo := repositories.NewRoleRepository(db)
	staffRepo := repositories.NewStaffRepository(db)
	customerRepo := repositories.NewCustomerRepository(db)
	supplierRepo := repositories.NewSupplierRepository(db)
	categoryRepo := repositories.NewCategoryRepository(db)
	productRepo := repositories.NewProductRepository(db)
	inventoryRepo := repositories.NewInventoryRepository(db)

	// Create seeder service
	seeder := services.NewSeederService(
		db,
		permissionRepo,
		roleRepo,
		staffRepo,
		customerRepo,
		supplierRepo,
		categoryRepo,
		productRepo,
		inventoryRepo,
	)

	// Run seeder
	if err := seeder.SeedAll(*dataPath); err != nil {
		log.Fatalf("Seeding failed: %v", err)
	}

	log.Println("\n✨ Seeding complete! You can now use the application.")
	log.Println("\nDefault test accounts:")
	log.Println("  Admin:      admin / Admin@123456")
	log.Println("  Manager:    manager1 / Manager@123456")
	log.Println("  Cashier:    cashier1 / Cashier@123456")
}

// Helper to get env variable
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// dropAllTables drops all application tables
func dropAllTables(db *gorm.DB) error {
	// Import models package to access models
	tables := []string{
		"sale_items",
		"sales_sessions",
		"sales_session_items",
		"sales",
		"inventory_batches",
		"products",
		"categories",
		"customers",
		"suppliers",
		"staff",
		"role_permissions",
		"permissions",
		"roles",
	}

	for _, table := range tables {
		if err := db.Migrator().DropTable(table); err != nil {
			log.Printf("Warning: failed to drop table %s: %v\n", table, err)
		}
	}

	return nil
}
