package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hardware-store/pos-backend/internal/models"
	"github.com/hardware-store/pos-backend/internal/services"
)

// StaffHandler handles staff-related HTTP requests
type StaffHandler struct {
	staffService *services.StaffService
}

// NewStaffHandler creates a new StaffHandler
func NewStaffHandler(staffService *services.StaffService) *StaffHandler {
	return &StaffHandler{staffService: staffService}
}

// CreateStaffRequest represents the request to create staff
type CreateStaffRequest struct {
	Username  string `json:"username" binding:"required,min=3,max=50"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Email     string `json:"email"`
	RoleID    uint   `json:"role_id" binding:"required"`
}

// UpdateStaffRequest represents the request to update staff
type UpdateStaffRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	RoleID    uint   `json:"role_id"`
}

// CreateStaff handles POST /api/staff
func (h *StaffHandler) CreateStaff(c *gin.Context) {
	var req CreateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	staff, err := h.staffService.CreateStaff(req.Username, req.Password, req.FirstName, req.LastName, req.Email, req.RoleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, staff)
}

// GetStaff handles GET /api/staff/:id
func (h *StaffHandler) GetStaff(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid staff id"})
		return
	}

	staff, err := h.staffService.GetStaffByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, staff)
}

// ListStaff handles GET /api/staff
func (h *StaffHandler) ListStaff(c *gin.Context) {
	staff, err := h.staffService.GetAllStaff()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(staff) == 0 {
		staff = []models.Staff{}
	}

	c.JSON(http.StatusOK, staff)
}

// UpdateStaff handles PUT /api/staff/:id
func (h *StaffHandler) UpdateStaff(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid staff id"})
		return
	}

	var req UpdateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	staff, err := h.staffService.UpdateStaff(uint(id), req.FirstName, req.LastName, req.Email, req.RoleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, staff)
}

// DeactivateStaff handles PUT /api/staff/:id/deactivate
func (h *StaffHandler) DeactivateStaff(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid staff id"})
		return
	}

	if err := h.staffService.DeactivateStaff(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "staff member deactivated successfully"})
}
