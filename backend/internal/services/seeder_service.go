package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"

	"github.com/hardware-store/pos-backend/internal/models"
	"github.com/hardware-store/pos-backend/internal/repositories"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeederService handles seeding of initial data
type SeederService struct {
	db                *gorm.DB
	permissionRepo    *repositories.PermissionRepository
	roleRepo          *repositories.RoleRepository
	staffRepo         *repositories.StaffRepository
	customerRepo      *repositories.CustomerRepository
	supplierRepo      *repositories.SupplierRepository
	categoryRepo      *repositories.CategoryRepository
	productRepo       *repositories.ProductRepository
	inventoryRepo     *repositories.InventoryRepository
}

// NewSeederService creates a new seeder service
func NewSeederService(
	db *gorm.DB,
	permissionRepo *repositories.PermissionRepository,
	roleRepo *repositories.RoleRepository,
	staffRepo *repositories.StaffRepository,
	customerRepo *repositories.CustomerRepository,
	supplierRepo *repositories.SupplierRepository,
	categoryRepo *repositories.CategoryRepository,
	productRepo *repositories.ProductRepository,
	inventoryRepo *repositories.InventoryRepository,
) *SeederService {
	return &SeederService{
		db:             db,
		permissionRepo: permissionRepo,
		roleRepo:       roleRepo,
		staffRepo:      staffRepo,
		customerRepo:   customerRepo,
		supplierRepo:   supplierRepo,
		categoryRepo:   categoryRepo,
		productRepo:    productRepo,
		inventoryRepo:  inventoryRepo,
	}
}

// SeedAll seeds all data from JSON files
func (s *SeederService) SeedAll(dataPath string) error {
	// Check if data already exists to avoid duplicates
	var count int64
	s.db.Model(&models.Permission{}).Count(&count)
	if count > 0 {
		return fmt.Errorf("data already seeded - permissions found: %d", count)
	}

	fmt.Println("Starting data seeding...")

	// Seed in order of dependencies
	if err := s.SeedPermissions(filepath.Join(dataPath, "permissions.json")); err != nil {
		return fmt.Errorf("failed to seed permissions: %w", err)
	}
	fmt.Println("✓ Permissions seeded")

	if err := s.SeedRoles(filepath.Join(dataPath, "roles.json")); err != nil {
		return fmt.Errorf("failed to seed roles: %w", err)
	}
	fmt.Println("✓ Roles seeded")

	if err := s.SeedStaff(filepath.Join(dataPath, "staff.json")); err != nil {
		return fmt.Errorf("failed to seed staff: %w", err)
	}
	fmt.Println("✓ Staff seeded")

	if err := s.SeedSuppliers(filepath.Join(dataPath, "suppliers.json")); err != nil {
		return fmt.Errorf("failed to seed suppliers: %w", err)
	}
	fmt.Println("✓ Suppliers seeded")

	if err := s.SeedCategories(filepath.Join(dataPath, "categories.json")); err != nil {
		return fmt.Errorf("failed to seed categories: %w", err)
	}
	fmt.Println("✓ Categories seeded")

	if err := s.SeedProducts(filepath.Join(dataPath, "products.json")); err != nil {
		return fmt.Errorf("failed to seed products: %w", err)
	}
	fmt.Println("✓ Products seeded")

	if err := s.SeedInventory(filepath.Join(dataPath, "inventory.json")); err != nil {
		return fmt.Errorf("failed to seed inventory: %w", err)
	}
	fmt.Println("✓ Inventory batches seeded")

	if err := s.SeedCustomers(filepath.Join(dataPath, "customers.json")); err != nil {
		return fmt.Errorf("failed to seed customers: %w", err)
	}
	fmt.Println("✓ Customers seeded")

	fmt.Println("✅ All data seeded successfully!")
	return nil
}

// SeedPermissions seeds permissions from JSON
func (s *SeederService) SeedPermissions(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var permissions []struct {
		Name        string `json:"name"`
		Resource    string `json:"resource"`
		Action      string `json:"action"`
		Description string `json:"description"`
	}

	if err := json.Unmarshal(data, &permissions); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, p := range permissions {
		permission := &models.Permission{
			Name:        p.Name,
			Resource:    p.Resource,
			Action:      p.Action,
			Description: p.Description,
		}
		if err := s.permissionRepo.Create(permission); err != nil {
			return fmt.Errorf("failed to create permission %s: %w", p.Name, err)
		}
	}

	return nil
}

// SeedRoles seeds roles with permissions from JSON
func (s *SeederService) SeedRoles(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var roles []struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		Permissions []string `json:"permissions"`
	}

	if err := json.Unmarshal(data, &roles); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, r := range roles {
		role := &models.Role{
			Name:        r.Name,
			Description: r.Description,
			IsActive:    true,
		}

		// Create role
		if err := s.roleRepo.Create(role); err != nil {
			return fmt.Errorf("failed to create role %s: %w", r.Name, err)
		}

		// Assign permissions to role
		for _, permName := range r.Permissions {
			perm, err := s.permissionRepo.GetByName(permName)
			if err != nil {
				return fmt.Errorf("failed to fetch permission %s: %w", permName, err)
			}
			if perm == nil {
				return fmt.Errorf("permission %s not found", permName)
			}

			if err := s.roleRepo.AddPermission(role.ID, perm.ID); err != nil {
				return fmt.Errorf("failed to add permission %s to role %s: %w", permName, r.Name, err)
			}
		}
	}

	return nil
}

// SeedStaff seeds staff members from JSON
func (s *SeederService) SeedStaff(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var staffMembers []struct {
		Username  string `json:"username"`
		Password  string `json:"password"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Email     string `json:"email"`
		RoleID    uint   `json:"roleId"`
		IsActive  bool   `json:"isActive"`
	}

	if err := json.Unmarshal(data, &staffMembers); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, sm := range staffMembers {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(sm.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}

		staff := &models.Staff{
			Username:     sm.Username,
			PasswordHash: string(hashedPassword),
			FirstName:    sm.FirstName,
			LastName:     sm.LastName,
			Email:        sm.Email,
			RoleID:       sm.RoleID,
			IsActive:     sm.IsActive,
		}

		if err := s.staffRepo.Create(staff); err != nil {
			return fmt.Errorf("failed to create staff %s: %w", sm.Username, err)
		}
	}

	return nil
}

// SeedSuppliers seeds suppliers from JSON
func (s *SeederService) SeedSuppliers(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var suppliers []struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		Address  string `json:"address"`
		IsActive bool   `json:"isActive"`
	}

	if err := json.Unmarshal(data, &suppliers); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, sup := range suppliers {
		supplier := &models.Supplier{
			Name:     sup.Name,
			Email:    sup.Email,
			Phone:    sup.Phone,
			Address:  sup.Address,
			IsActive: sup.IsActive,
		}

		if err := s.supplierRepo.Create(supplier); err != nil {
			return fmt.Errorf("failed to create supplier %s: %w", sup.Name, err)
		}
	}

	return nil
}

// SeedCategories seeds categories from JSON
func (s *SeederService) SeedCategories(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var categories []struct {
		Name        string `json:"name"`
		ParentID    *uint  `json:"parentId"`
		Description string `json:"description"`
	}

	if err := json.Unmarshal(data, &categories); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, c := range categories {
		category := &models.Category{
			Name:     c.Name,
			ParentID: c.ParentID,
			Level:    0,
		}

		if c.ParentID != nil {
			category.Level = 1 // Simple level calculation
		}

		if err := s.categoryRepo.Create(category); err != nil {
			return fmt.Errorf("failed to create category %s: %w", c.Name, err)
		}
	}

	return nil
}

// SeedProducts seeds products from JSON
func (s *SeederService) SeedProducts(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var products []struct {
		Code       string                 `json:"code"`
		Description string                 `json:"description"`
		CategoryID uint                   `json:"categoryId"`
		Attributes map[string]interface{} `json:"attributes"`
	}

	if err := json.Unmarshal(data, &products); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, p := range products {
		attrBytes, _ := json.Marshal(p.Attributes)

		product := &models.Product{
			Code:        p.Code,
			Description: p.Description,
			CategoryID:  p.CategoryID,
			Attributes:  string(attrBytes),
			IsActive:    true,
		}

		if err := s.productRepo.Create(product); err != nil {
			return fmt.Errorf("failed to create product %s: %w", p.Code, err)
		}
	}

	return nil
}

// SeedInventory seeds inventory batches from JSON
func (s *SeederService) SeedInventory(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var batches []struct {
		ProductCode     string  `json:"productCode"`
		SupplierID      uint    `json:"supplierId"`
		BatchNumber     string  `json:"batchNumber"`
		QuantityInStock int     `json:"quantityInStock"`
		CostPrice       float64 `json:"costPrice"`
		SalePrice       float64 `json:"salePrice"`
		ExpiryDate      *string `json:"expiryDate"`
	}

	if err := json.Unmarshal(data, &batches); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, b := range batches {
		// Find product by code
		product, err := s.productRepo.GetByCode(b.ProductCode)
		if err != nil {
			return fmt.Errorf("failed to fetch product %s: %w", b.ProductCode, err)
		}
		if product == nil {
			return fmt.Errorf("product %s not found", b.ProductCode)
		}

		batch := &models.InventoryBatch{
			ProductID:       product.ID,
			SupplierID:      b.SupplierID,
			BatchNumber:     b.BatchNumber,
			QuantityInStock: b.QuantityInStock,
			CostPrice:       b.CostPrice,
			SalePrice:       b.SalePrice,
			ExpiryDate:      b.ExpiryDate,
			IsActive:        true,
		}

		if err := s.inventoryRepo.Create(batch); err != nil {
			return fmt.Errorf("failed to create inventory batch %s: %w", b.BatchNumber, err)
		}
	}

	return nil
}

// SeedCustomers seeds customers from JSON
func (s *SeederService) SeedCustomers(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var customers []struct {
		Name        string  `json:"name"`
		Email       string  `json:"email"`
		Phone       string  `json:"phone"`
		Address     string  `json:"address"`
		CreditLimit float64 `json:"creditLimit"`
		IsActive    bool    `json:"isActive"`
	}

	if err := json.Unmarshal(data, &customers); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	for _, c := range customers {
		customer := &models.Customer{
			Name:        c.Name,
			Email:       c.Email,
			Phone:       c.Phone,
			Address:     c.Address,
			CreditLimit: c.CreditLimit,
			IsActive:    c.IsActive,
		}

		if err := s.customerRepo.Create(customer); err != nil {
			return fmt.Errorf("failed to create customer %s: %w", c.Name, err)
		}
	}

	return nil
}
