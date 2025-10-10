package logger

import (
	"log"
	"os"
)

var (
	InfoLogger    *log.Logger
	ErrorLogger   *log.Logger
	WarningLogger *log.Logger
)

// Init initializes the logging system
func Init() {
	// For now, use simple stdout/stderr logging
	// In production, you might want to use structured logging like logrus or zap

	InfoLogger = log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
	ErrorLogger = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)
	WarningLogger = log.New(os.Stdout, "WARNING: ", log.Ldate|log.Ltime|log.Lshortfile)
}

// Info logs an info message
func Info(v ...interface{}) {
	if InfoLogger != nil {
		InfoLogger.Println(v...)
	}
}

// Infof logs a formatted info message
func Infof(format string, v ...interface{}) {
	if InfoLogger != nil {
		InfoLogger.Printf(format, v...)
	}
}

// Error logs an error message
func Error(v ...interface{}) {
	if ErrorLogger != nil {
		ErrorLogger.Println(v...)
	}
}

// Errorf logs a formatted error message
func Errorf(format string, v ...interface{}) {
	if ErrorLogger != nil {
		ErrorLogger.Printf(format, v...)
	}
}

// Warning logs a warning message
func Warning(v ...interface{}) {
	if WarningLogger != nil {
		WarningLogger.Println(v...)
	}
}

// Warningf logs a formatted warning message
func Warningf(format string, v ...interface{}) {
	if WarningLogger != nil {
		WarningLogger.Printf(format, v...)
	}
}