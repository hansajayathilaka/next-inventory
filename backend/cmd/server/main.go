package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
	"github.com/hardware-store/pos-backend/internal/auth"
	"github.com/hardware-store/pos-backend/internal/database"
	"github.com/hardware-store/pos-backend/internal/logger"
	"github.com/hardware-store/pos-backend/internal/middleware"
	"github.com/hardware-store/pos-backend/internal/repositories"
	"github.com/hardware-store/pos-backend/internal/services"
	"github.com/hardware-store/pos-backend/internal/handlers"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize logger
	logger.Init()

	// Initialize database
	dbPath := getEnv("DATABASE_PATH", "./database/inventory.db")
	db, err := database.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// Initialize JWT service
	jwtService := auth.NewJWTService(
		getEnv("JWT_ACCESS_SECRET", "your-secret-access-key"),
		getEnv("JWT_REFRESH_SECRET", "your-secret-refresh-key"),
		parseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m")),
		parseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h")),
	)

	// Setup Gin router
	router := setupRouter(db, jwtService)

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupRouter(db *gorm.DB, jwtService *auth.JWTService) *gin.Engine {
	// Set Gin mode
	gin.SetMode(getEnv("GIN_MODE", "debug"))

	// Create router
	router := gin.New()

	// Add global middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.SecurityHeaders())

	// Serve static files (frontend)
	staticPath := getEnv("STATIC_PATH", "./static")
	router.Static("/assets", filepath.Join(staticPath, "assets"))
	router.StaticFile("/vite.svg", filepath.Join(staticPath, "vite.svg"))

	// Serve index.html for SPA routes (must be after API routes)
	router.NoRoute(func(c *gin.Context) {
		// Don't serve index.html for API routes
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
			return
		}
		// Serve index.html for all other routes (SPA routing)
		c.File(filepath.Join(staticPath, "index.html"))
	})

	// Initialize repositories and services
	roleRepo := repositories.NewRoleRepository(db)
	permissionRepo := repositories.NewPermissionRepository(db)
	staffRepo := repositories.NewStaffRepository(db)

	roleService := services.NewRoleService(roleRepo, permissionRepo)
	staffService := services.NewStaffService(staffRepo, roleRepo)
	authService := services.NewAuthService(staffRepo, staffService, roleService, jwtService)

	// Initialize handlers
	roleHandler := handlers.NewRoleHandler(roleService)
	permissionHandler := handlers.NewPermissionHandler(roleService)
	staffHandler := handlers.NewStaffHandler(staffService)
	authHandler := handlers.NewAuthHandler(authService)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Health check
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":    "ok",
				"timestamp": time.Now().UTC(),
				"version":   "1.0.0",
			})
		})

		// Authentication routes (no auth required)
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/refresh", authHandler.RefreshToken)
			authGroup.POST("/logout", authHandler.Logout)
		}

		// Protected routes (auth required)
		protected := v1.Group("/")
		protected.Use(middleware.JWTAuth(jwtService))
		{
			// User session route (get current user)
			protected.GET("/auth/session", authHandler.GetSession)

			// Role management routes
			roles := protected.Group("/roles")
			{
				roles.POST("", roleHandler.CreateRole)
				roles.GET("", roleHandler.ListRoles)
				roles.GET("/:id", roleHandler.GetRole)
				roles.PUT("/:id", roleHandler.UpdateRole)
				roles.DELETE("/:id", roleHandler.DeleteRole)
				roles.GET("/:id/permissions", roleHandler.GetRolePermissions)
				roles.POST("/:id/permissions", roleHandler.AssignPermission)
				roles.DELETE("/:id/permissions/:permissionId", roleHandler.RemovePermission)
			}

			// Permission management routes
			permissions := protected.Group("/permissions")
			{
				permissions.POST("", permissionHandler.CreatePermission)
				permissions.GET("", permissionHandler.ListPermissions)
				permissions.GET("/:id", permissionHandler.GetPermission)
			}

			// Staff management routes
			staff := protected.Group("/staff")
			{
				staff.POST("", staffHandler.CreateStaff)
				staff.GET("", staffHandler.ListStaff)
				staff.GET("/:id", staffHandler.GetStaff)
				staff.PUT("/:id", staffHandler.UpdateStaff)
				staff.PUT("/:id/deactivate", staffHandler.DeactivateStaff)
			}
		}
	}

	return router
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func parseDuration(s string) time.Duration {
	duration, err := time.ParseDuration(s)
	if err != nil {
		log.Printf("Warning: Invalid duration '%s', using default", s)
		return 15 * time.Minute
	}
	return duration
}