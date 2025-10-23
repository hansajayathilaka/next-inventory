package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hardware-store/pos-backend/internal/models"
	"github.com/hardware-store/pos-backend/internal/services"
)

// PermissionHandler handles permission-related HTTP requests
type PermissionHandler struct {
	roleService *services.RoleService
}

// NewPermissionHandler creates a new PermissionHandler
func NewPermissionHandler(roleService *services.RoleService) *PermissionHandler {
	return &PermissionHandler{roleService: roleService}
}

// CreatePermissionRequest represents the request to create a permission
type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Resource    string `json:"resource" binding:"required"`
	Action      string `json:"action" binding:"required"`
	Description string `json:"description"`
}

// CreatePermission handles POST /api/permissions
func (h *PermissionHandler) CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permission, err := h.roleService.CreatePermission(req.Name, req.Resource, req.Action, req.Description)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, permission)
}

// GetPermission handles GET /api/permissions/:id
func (h *PermissionHandler) GetPermission(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid permission id"})
		return
	}

	permission, err := h.roleService.GetPermissionByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, permission)
}

// ListPermissions handles GET /api/permissions
func (h *PermissionHandler) ListPermissions(c *gin.Context) {
	permissions, err := h.roleService.GetAllPermissions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(permissions) == 0 {
		permissions = []models.Permission{}
	}

	c.JSON(http.StatusOK, permissions)
}
