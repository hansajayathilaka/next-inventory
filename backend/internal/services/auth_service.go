package services

import (
	"errors"
	"fmt"

	"github.com/hardware-store/pos-backend/internal/auth"
	"github.com/hardware-store/pos-backend/internal/repositories"
)

// AuthService handles authentication logic
type AuthService struct {
	staffRepo   *repositories.StaffRepository
	staffSvc    *StaffService
	roleSvc     *RoleService
	jwtService  *auth.JWTService
}

// NewAuthService creates a new AuthService
func NewAuthService(
	staffRepo *repositories.StaffRepository,
	staffSvc *StaffService,
	roleSvc *RoleService,
	jwtService *auth.JWTService,
) *AuthService {
	return &AuthService{
		staffRepo:  staffRepo,
		staffSvc:   staffSvc,
		roleSvc:    roleSvc,
		jwtService: jwtService,
	}
}

// LoginRequest represents login credentials
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse contains tokens and user info
type LoginResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	User         UserInfo    `json:"user"`
}

// UserInfo contains basic user information
type UserInfo struct {
	ID          uint     `json:"id"`
	Username    string   `json:"username"`
	FirstName   string   `json:"first_name"`
	LastName    string   `json:"last_name"`
	Email       string   `json:"email"`
	RoleID      uint     `json:"role_id"`
	RoleName    string   `json:"role_name"`
	Permissions []string `json:"permissions"`
}

// Login authenticates a user and returns tokens
func (a *AuthService) Login(username, password string) (*LoginResponse, error) {
	if username == "" || password == "" {
		return nil, errors.New("username and password are required")
	}

	// Get staff by username
	staff, err := a.staffRepo.GetByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if !staff.IsActive {
		return nil, errors.New("account is inactive")
	}

	// Verify password
	if !a.staffSvc.VerifyPassword(staff, password) {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Get user permissions
	permissions, err := a.roleSvc.GetRolePermissions(staff.RoleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get permissions: %w", err)
	}

	permissionNames := make([]string, len(permissions))
	for i, p := range permissions {
		permissionNames[i] = p.Name
	}

	// Generate tokens
	tokens, err := a.jwtService.GenerateTokenPair(
		staff.ID,
		staff.Username,
		staff.RoleID,
		permissionNames,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Update last login
	_ = a.staffRepo.UpdateLastLogin(staff.ID)

	return &LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User: UserInfo{
			ID:          staff.ID,
			Username:    staff.Username,
			FirstName:   staff.FirstName,
			LastName:    staff.LastName,
			Email:       staff.Email,
			RoleID:      staff.RoleID,
			RoleName:    staff.Role.Name,
			Permissions: permissionNames,
		},
	}, nil
}

// RefreshToken generates new tokens using a refresh token
func (a *AuthService) RefreshToken(refreshTokenString string) (*LoginResponse, error) {
	if refreshTokenString == "" {
		return nil, errors.New("refresh token is required")
	}

	// Validate refresh token
	claims, err := a.jwtService.ValidateRefreshToken(refreshTokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// Get staff member
	staff, err := a.staffRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	if !staff.IsActive {
		return nil, errors.New("account is inactive")
	}

	// Get user permissions
	permissions, err := a.roleSvc.GetRolePermissions(staff.RoleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get permissions: %w", err)
	}

	permissionNames := make([]string, len(permissions))
	for i, p := range permissions {
		permissionNames[i] = p.Name
	}

	// Generate new token pair
	tokens, err := a.jwtService.GenerateTokenPair(
		staff.ID,
		staff.Username,
		staff.RoleID,
		permissionNames,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return &LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User: UserInfo{
			ID:          staff.ID,
			Username:    staff.Username,
			FirstName:   staff.FirstName,
			LastName:    staff.LastName,
			Email:       staff.Email,
			RoleID:      staff.RoleID,
			RoleName:    staff.Role.Name,
			Permissions: permissionNames,
		},
	}, nil
}

// GetCurrentUser retrieves the current user from JWT claims
func (a *AuthService) GetCurrentUser(claims *auth.Claims) (*UserInfo, error) {
	if claims == nil {
		return nil, errors.New("no claims provided")
	}

	staff, err := a.staffRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &UserInfo{
		ID:          staff.ID,
		Username:    staff.Username,
		FirstName:   staff.FirstName,
		LastName:    staff.LastName,
		Email:       staff.Email,
		RoleID:      staff.RoleID,
		RoleName:    staff.Role.Name,
		Permissions: claims.Permissions,
	}, nil
}
