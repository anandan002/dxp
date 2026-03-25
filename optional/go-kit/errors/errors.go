package errors

import "fmt"

// Code represents a domain error code (not HTTP status).
type Code string

const (
	CodeNotFound       Code = "NOT_FOUND"
	CodeAlreadyExists  Code = "ALREADY_EXISTS"
	CodeInvalidInput   Code = "INVALID_INPUT"
	CodeUnauthorized   Code = "UNAUTHORIZED"
	CodeForbidden      Code = "FORBIDDEN"
	CodeInternal       Code = "INTERNAL"
	CodeUnavailable    Code = "UNAVAILABLE"
	CodeConflict       Code = "CONFLICT"
	CodeRateLimited    Code = "RATE_LIMITED"
)

// DomainError is the standard error type for all domain-layer errors.
type DomainError struct {
	Code    Code   `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
	Cause   error  `json:"-"`
}

func (e *DomainError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func (e *DomainError) Unwrap() error {
	return e.Cause
}

// Constructor helpers

func NotFound(entity, id string) *DomainError {
	return &DomainError{
		Code:    CodeNotFound,
		Message: fmt.Sprintf("%s not found", entity),
		Detail:  fmt.Sprintf("id=%s", id),
	}
}

func AlreadyExists(entity, id string) *DomainError {
	return &DomainError{
		Code:    CodeAlreadyExists,
		Message: fmt.Sprintf("%s already exists", entity),
		Detail:  fmt.Sprintf("id=%s", id),
	}
}

func InvalidInput(message string) *DomainError {
	return &DomainError{
		Code:    CodeInvalidInput,
		Message: message,
	}
}

func Unauthorized(message string) *DomainError {
	return &DomainError{
		Code:    CodeUnauthorized,
		Message: message,
	}
}

func Forbidden(message string) *DomainError {
	return &DomainError{
		Code:    CodeForbidden,
		Message: message,
	}
}

func Internal(message string, cause error) *DomainError {
	return &DomainError{
		Code:    CodeInternal,
		Message: message,
		Cause:   cause,
	}
}
