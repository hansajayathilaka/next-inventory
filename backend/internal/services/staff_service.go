package services

import (
	"errors"
	"fmt"
	"golang.org/x/crypto/bcrypt"

	"github.com/hardware-store/pos-backend/internal/models"
	"github.com/hardware-store/pos-backend/internal/repositories"
)

// StaffService handles business logic for staff
type StaffService struct {
	staffRepo *repositories.StaffRepository
	roleRepo  *repositories.RoleRepository
}

// NewStaffService creates a new StaffService
func NewStaffService(staffRepo *repositories.StaffRepository, roleRepo *repositories.RoleRepository) *StaffService {
	return &StaffService{
		staffRepo: staffRepo,
		roleRepo:  roleRepo,
	}
}

// CreateStaff creates a new staff member
func (s *StaffService) CreateStaff(username, password, firstName, lastName, email string, roleID uint) (*models.Staff, error) {
	if username == "" || password == "" || firstName == "" || lastName == "" {
		return nil, errors.New("username, password, first name, and last name are required")
	}

	if len(username) < 3 || len(username) > 50 {
		return nil, errors.New("username must be between 3 and 50 characters")
	}

	if len(password) < 8 {
		return nil, errors.New("password must be at least 8 characters")
	}

	// Check if username already exists
	existing, _ := s.staffRepo.GetByUsername(username)
	if existing != nil {
		return nil, fmt.Errorf("username '%s' already exists", username)
	}

	// Verify role exists
	_, err := s.roleRepo.GetByID(roleID)
	if err != nil {
		return nil, fmt.Errorf("role not found: %w", err)
	}

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	staff := &models.Staff{
		Username:     username,
		PasswordHash: string(passwordHash),
		FirstName:    firstName,
		LastName:     lastName,
		Email:        email,
		RoleID:       roleID,
		IsActive:     true,
	}

	if err := s.staffRepo.Create(staff); err != nil {
		return nil, fmt.Errorf("failed to create staff: %w", err)
	}

	// Don't return password hash
	staff.PasswordHash = ""
	return staff, nil
}

// GetStaffByID retrieves a staff member by ID
func (s *StaffService) GetStaffByID(id uint) (*models.Staff, error) {
	if id == 0 {
		return nil, errors.New("invalid staff id")
	}

	staff, err := s.staffRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	staff.PasswordHash = ""
	return staff, nil
}

// GetStaffByUsername retrieves a staff member by username
func (s *StaffService) GetStaffByUsername(username string) (*models.Staff, error) {
	if username == "" {
		return nil, errors.New("username is required")
	}

	return s.staffRepo.GetByUsername(username)
}

// GetAllStaff retrieves all active staff members
func (s *StaffService) GetAllStaff() ([]models.Staff, error) {
	staff, err := s.staffRepo.GetAll()
	if err != nil {
		return nil, err
	}

	// Remove password hashes
	for i := range staff {
		staff[i].PasswordHash = ""
	}

	return staff, nil
}

// UpdateStaff modifies a staff member
func (s *StaffService) UpdateStaff(id uint, firstName, lastName, email string, roleID uint) (*models.Staff, error) {
	if id == 0 {
		return nil, errors.New("invalid staff id")
	}

	staff, err := s.staffRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if firstName != "" {
		staff.FirstName = firstName
	}
	if lastName != "" {
		staff.LastName = lastName
	}
	if email != "" {
		staff.Email = email
	}
	if roleID != 0 {
		// Verify role exists
		_, err := s.roleRepo.GetByID(roleID)
		if err != nil {
			return nil, fmt.Errorf("role not found: %w", err)
		}
		staff.RoleID = roleID
	}

	if err := s.staffRepo.Update(id, staff); err != nil {
		return nil, fmt.Errorf("failed to update staff: %w", err)
	}

	staff.PasswordHash = ""
	return staff, nil
}

// DeactivateStaff deactivates a staff member
func (s *StaffService) DeactivateStaff(id uint) error {
	if id == 0 {
		return errors.New("invalid staff id")
	}

	_, err := s.staffRepo.GetByID(id)
	if err != nil {
		return err
	}

	return s.staffRepo.Deactivate(id)
}

// VerifyPassword checks if a password matches the stored hash
func (s *StaffService) VerifyPassword(staff *models.Staff, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(staff.PasswordHash), []byte(password))
	return err == nil
}

// ChangePassword updates a staff member's password
func (s *StaffService) ChangePassword(id uint, oldPassword, newPassword string) error {
	if id == 0 {
		return errors.New("invalid staff id")
	}

	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	staff, err := s.staffRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Verify old password
	if !s.VerifyPassword(staff, oldPassword) {
		return errors.New("old password is incorrect")
	}

	// Hash new password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	staff.PasswordHash = string(passwordHash)
	return s.staffRepo.Update(id, staff)
}
