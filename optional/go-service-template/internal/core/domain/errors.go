package domain

import "fmt"

// DomainError represents errors originating from business logic.
type DomainError struct {
	Code    string
	Message string
}

func (e *DomainError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

var (
	ErrNotFound      = &DomainError{Code: "NOT_FOUND", Message: "resource not found"}
	ErrAlreadyExists = &DomainError{Code: "ALREADY_EXISTS", Message: "resource already exists"}
	ErrInvalidInput  = &DomainError{Code: "INVALID_INPUT", Message: "invalid input"}
)
