package utils

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ValidationErrors represents validation error details
type ValidationErrors map[string][]string

// BindAndValidate binds JSON payload and validates it
func BindAndValidate(c *gin.Context, obj interface{}) bool {
	// Bind JSON
	if err := c.ShouldBindJSON(obj); err != nil {
		// Check if it's a validation error
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			ValidationError(c, FormatValidationErrors(validationErrors))
			return false
		}

		// JSON parsing error
		BadRequest(c, fmt.Sprintf("Invalid JSON: %s", err.Error()))
		return false
	}

	return true
}

// FormatValidationErrors formats validator errors into a readable format
func FormatValidationErrors(errs validator.ValidationErrors) ValidationErrors {
	errors := make(ValidationErrors)

	for _, err := range errs {
		field := getJSONFieldName(err)
		message := getValidationMessage(err)

		if _, exists := errors[field]; !exists {
			errors[field] = []string{}
		}
		errors[field] = append(errors[field], message)
	}

	return errors
}

// getJSONFieldName extracts the JSON field name from validation error
func getJSONFieldName(err validator.FieldError) string {
	field := err.Field()

	// Try to get JSON tag name
	if err.StructField() != "" {
		// This would require reflection to get the actual JSON tag
		// For now, convert PascalCase to snake_case
		return toSnakeCase(field)
	}

	return toSnakeCase(field)
}

// getValidationMessage creates a human-readable validation message
func getValidationMessage(err validator.FieldError) string {
	field := err.Field()
	tag := err.Tag()
	param := err.Param()

	switch tag {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return fmt.Sprintf("%s must be a valid email address", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s characters long", field, param)
	case "max":
		return fmt.Sprintf("%s must be at most %s characters long", field, param)
	case "len":
		return fmt.Sprintf("%s must be exactly %s characters long", field, param)
	case "oneof":
		return fmt.Sprintf("%s must be one of: %s", field, param)
	case "numeric":
		return fmt.Sprintf("%s must be a number", field)
	case "alpha":
		return fmt.Sprintf("%s must contain only letters", field)
	case "alphanum":
		return fmt.Sprintf("%s must contain only letters and numbers", field)
	case "gt":
		return fmt.Sprintf("%s must be greater than %s", field, param)
	case "gte":
		return fmt.Sprintf("%s must be greater than or equal to %s", field, param)
	case "lt":
		return fmt.Sprintf("%s must be less than %s", field, param)
	case "lte":
		return fmt.Sprintf("%s must be less than or equal to %s", field, param)
	default:
		return fmt.Sprintf("%s is invalid", field)
	}
}

// toSnakeCase converts PascalCase to snake_case
func toSnakeCase(str string) string {
	var result strings.Builder
	for i, r := range str {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteRune('_')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}

// GetFieldName uses reflection to get JSON field name
func GetFieldName(obj interface{}, fieldName string) string {
	t := reflect.TypeOf(obj)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	field, ok := t.FieldByName(fieldName)
	if !ok {
		return toSnakeCase(fieldName)
	}

	jsonTag := field.Tag.Get("json")
	if jsonTag == "" {
		return toSnakeCase(fieldName)
	}

	// Extract field name from tag (ignore options like omitempty)
	parts := strings.Split(jsonTag, ",")
	return parts[0]
}