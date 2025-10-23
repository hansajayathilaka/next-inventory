package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hardware-store/pos-backend/internal/auth"
	"github.com/hardware-store/pos-backend/internal/responses"
	"github.com/hardware-store/pos-backend/internal/services"
)

// AuthHandler handles authentication HTTP requests
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// LoginRequest represents login credentials
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RefreshTokenRequest represents refresh token request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.Error("validation_error", err.Error(), nil))
		return
	}

	response, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, responses.Error("auth_error", err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, responses.Success(response))
}

// RefreshToken handles POST /api/auth/refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.Error("validation_error", err.Error(), nil))
		return
	}

	response, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, responses.Error("auth_error", err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, responses.Success(response))
}

// GetSession handles GET /api/auth/session
func (h *AuthHandler) GetSession(c *gin.Context) {
	// Get claims from context (set by middleware)
	claimsInterface, exists := c.Get("claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, responses.Error("auth_error", "unauthorized", nil))
		return
	}

	claims, ok := claimsInterface.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, responses.Error("auth_error", "invalid claims", nil))
		return
	}

	user, err := h.authService.GetCurrentUser(claims)
	if err != nil {
		c.JSON(http.StatusUnauthorized, responses.Error("auth_error", err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, responses.Success(user))
}

// Logout handles POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// Token invalidation would be handled client-side by removing the token
	// Server-side you could implement a token blacklist if needed
	c.JSON(http.StatusOK, responses.Success(map[string]string{"message": "logged out successfully"}))
}
