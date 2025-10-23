package services

import (
	"errors"
	"fmt"

	"github.com/hardware-store/pos-backend/internal/models"
	"github.com/hardware-store/pos-backend/internal/repositories"
)

// RoleService handles business logic for roles
type RoleService struct {
	roleRepo       *repositories.RoleRepository
	permissionRepo *repositories.PermissionRepository
}

// NewRoleService creates a new RoleService
func NewRoleService(roleRepo *repositories.RoleRepository, permissionRepo *repositories.PermissionRepository) *RoleService {
	return &RoleService{
		roleRepo:       roleRepo,
		permissionRepo: permissionRepo,
	}
}

// CreateRole creates a new role
func (s *RoleService) CreateRole(name, description string) (*models.Role, error) {
	if name == "" {
		return nil, errors.New("role name is required")
	}
	if len(name) < 2 || len(name) > 50 {
		return nil, errors.New("role name must be between 2 and 50 characters")
	}

	// Check if role already exists
	existing, _ := s.roleRepo.GetByName(name)
	if existing != nil {
		return nil, fmt.Errorf("role '%s' already exists", name)
	}

	role := &models.Role{
		Name:        name,
		Description: description,
		IsActive:    true,
	}

	if err := s.roleRepo.Create(role); err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	return role, nil
}

// GetRoleByID retrieves a role by ID with all permissions
func (s *RoleService) GetRoleByID(id uint) (*models.Role, error) {
	if id == 0 {
		return nil, errors.New("invalid role id")
	}

	role, err := s.roleRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	return role, nil
}

// GetRoleByName retrieves a role by name
func (s *RoleService) GetRoleByName(name string) (*models.Role, error) {
	if name == "" {
		return nil, errors.New("role name is required")
	}

	role, err := s.roleRepo.GetByName(name)
	if err != nil {
		return nil, err
	}

	return role, nil
}

// GetAllRoles retrieves all active roles
func (s *RoleService) GetAllRoles() ([]models.Role, error) {
	return s.roleRepo.GetAll()
}

// UpdateRole modifies an existing role
func (s *RoleService) UpdateRole(id uint, name, description string) (*models.Role, error) {
	if id == 0 {
		return nil, errors.New("invalid role id")
	}

	// Get existing role
	role, err := s.roleRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Check for name uniqueness if name is being changed
	if name != "" && name != role.Name {
		if len(name) < 2 || len(name) > 50 {
			return nil, errors.New("role name must be between 2 and 50 characters")
		}
		existing, _ := s.roleRepo.GetByName(name)
		if existing != nil {
			return nil, fmt.Errorf("role '%s' already exists", name)
		}
		role.Name = name
	}

	if description != "" {
		role.Description = description
	}

	if err := s.roleRepo.Update(id, role); err != nil {
		return nil, fmt.Errorf("failed to update role: %w", err)
	}

	return role, nil
}

// DeleteRole soft deletes a role
func (s *RoleService) DeleteRole(id uint) error {
	if id == 0 {
		return errors.New("invalid role id")
	}

	// Verify role exists
	_, err := s.roleRepo.GetByID(id)
	if err != nil {
		return err
	}

	return s.roleRepo.Delete(id)
}

// AssignPermission adds a permission to a role
func (s *RoleService) AssignPermission(roleID, permissionID uint) error {
	if roleID == 0 || permissionID == 0 {
		return errors.New("invalid role id or permission id")
	}

	// Verify role and permission exist
	_, err := s.roleRepo.GetByID(roleID)
	if err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	_, err = s.permissionRepo.GetByID(permissionID)
	if err != nil {
		return fmt.Errorf("permission not found: %w", err)
	}

	return s.roleRepo.AddPermission(roleID, permissionID)
}

// RemovePermission removes a permission from a role
func (s *RoleService) RemovePermission(roleID, permissionID uint) error {
	if roleID == 0 || permissionID == 0 {
		return errors.New("invalid role id or permission id")
	}

	// Verify role exists
	_, err := s.roleRepo.GetByID(roleID)
	if err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	return s.roleRepo.RemovePermission(roleID, permissionID)
}

// GetRolePermissions retrieves all permissions for a role
func (s *RoleService) GetRolePermissions(roleID uint) ([]models.Permission, error) {
	if roleID == 0 {
		return nil, errors.New("invalid role id")
	}

	// Verify role exists
	_, err := s.roleRepo.GetByID(roleID)
	if err != nil {
		return nil, err
	}

	return s.roleRepo.GetPermissions(roleID)
}

// CreatePermission creates a new permission
func (s *RoleService) CreatePermission(name, resource, action, description string) (*models.Permission, error) {
	if name == "" || resource == "" || action == "" {
		return nil, errors.New("permission name, resource, and action are required")
	}

	// Check if permission already exists
	existing, _ := s.permissionRepo.GetByName(name)
	if existing != nil {
		return nil, fmt.Errorf("permission '%s' already exists", name)
	}

	permission := &models.Permission{
		Name:        name,
		Resource:    resource,
		Action:      action,
		Description: description,
	}

	if err := s.permissionRepo.Create(permission); err != nil {
		return nil, fmt.Errorf("failed to create permission: %w", err)
	}

	return permission, nil
}

// GetAllPermissions retrieves all permissions
func (s *RoleService) GetAllPermissions() ([]models.Permission, error) {
	return s.permissionRepo.GetAll()
}

// GetPermissionByID retrieves a permission by ID
func (s *RoleService) GetPermissionByID(id uint) (*models.Permission, error) {
	if id == 0 {
		return nil, errors.New("invalid permission id")
	}

	return s.permissionRepo.GetByID(id)
}

// InitializeDefaultPermissions creates standard permissions if they don't exist
func (s *RoleService) InitializeDefaultPermissions() error {
	defaultPermissions := []models.Permission{
		// Role permissions
		{Name: "create_role", Resource: "roles", Action: "create", Description: "Create new roles"},
		{Name: "update_role", Resource: "roles", Action: "update", Description: "Update roles"},
		{Name: "delete_role", Resource: "roles", Action: "delete", Description: "Delete roles"},
		{Name: "view_roles", Resource: "roles", Action: "view", Description: "View roles"},

		// Staff permissions
		{Name: "create_staff", Resource: "staff", Action: "create", Description: "Create new staff members"},
		{Name: "update_staff", Resource: "staff", Action: "update", Description: "Update staff members"},
		{Name: "deactivate_staff", Resource: "staff", Action: "deactivate", Description: "Deactivate staff"},
		{Name: "view_staff", Resource: "staff", Action: "view", Description: "View staff members"},

		// Customer permissions
		{Name: "create_customer", Resource: "customers", Action: "create", Description: "Create customers"},
		{Name: "update_customer", Resource: "customers", Action: "update", Description: "Update customers"},
		{Name: "view_customers", Resource: "customers", Action: "view", Description: "View customers"},

		// Supplier permissions
		{Name: "create_supplier", Resource: "suppliers", Action: "create", Description: "Create suppliers"},
		{Name: "update_supplier", Resource: "suppliers", Action: "update", Description: "Update suppliers"},
		{Name: "view_suppliers", Resource: "suppliers", Action: "view", Description: "View suppliers"},

		// Category permissions
		{Name: "create_category", Resource: "categories", Action: "create", Description: "Create categories"},
		{Name: "update_category", Resource: "categories", Action: "update", Description: "Update categories"},
		{Name: "delete_category", Resource: "categories", Action: "delete", Description: "Delete categories"},
		{Name: "view_categories", Resource: "categories", Action: "view", Description: "View categories"},

		// Product permissions
		{Name: "create_product", Resource: "products", Action: "create", Description: "Create products"},
		{Name: "update_product", Resource: "products", Action: "update", Description: "Update products"},
		{Name: "delete_product", Resource: "products", Action: "delete", Description: "Delete products"},
		{Name: "view_products", Resource: "products", Action: "view", Description: "View products"},

		// Inventory permissions
		{Name: "adjust_inventory", Resource: "inventory", Action: "adjust", Description: "Adjust inventory"},
		{Name: "view_inventory", Resource: "inventory", Action: "view", Description: "View inventory"},

		// Purchase permissions
		{Name: "create_purchase", Resource: "purchases", Action: "create", Description: "Create purchases"},
		{Name: "view_purchases", Resource: "purchases", Action: "view", Description: "View purchases"},

		// POS permissions
		{Name: "create_sales_session", Resource: "sales_sessions", Action: "create", Description: "Create sales sessions"},
		{Name: "manage_sales_sessions", Resource: "sales_sessions", Action: "manage", Description: "Manage sales sessions"},

		// Payment permissions
		{Name: "process_payment", Resource: "payments", Action: "process", Description: "Process payments"},
		{Name: "view_sales", Resource: "sales", Action: "view", Description: "View sales"},

		// Credit permissions
		{Name: "manage_credits", Resource: "credits", Action: "manage", Description: "Manage credits"},
		{Name: "settle_credits", Resource: "credits", Action: "settle", Description: "Settle credits"},

		// Return permissions
		{Name: "process_return", Resource: "returns", Action: "process", Description: "Process returns"},
		{Name: "approve_old_return", Resource: "returns", Action: "approve_old", Description: "Approve old returns"},

		// Receipt permissions
		{Name: "generate_receipt", Resource: "receipts", Action: "generate", Description: "Generate receipts"},
	}

	return s.permissionRepo.BulkCreate(defaultPermissions)
}
