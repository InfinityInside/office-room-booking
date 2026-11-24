package io.github.infinityinside.roombooking.error;

import io.github.infinityinside.roombooking.api.model.FieldErrorDto;

import java.util.*;

import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/** Turns every error into the contract's Problem Details format (RFC 9457). */
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    private static final HttpStatus VALIDATION_FAILED = HttpStatus.UNPROCESSABLE_CONTENT;

    /** Database constraints that users can run into, and what to tell them. Names are from V1__create_schema.sql. */
    private static final Map<String, String> CONSTRAINT_MESSAGES = Map.of(
            "booking_no_overlap", "This room is already booked at that time.",
            "app_user_email_key", "An account with this email already exists.",
            "access_grant_code_key", "A grant with this code already exists.",
            "access_grant_name_key", "A grant with this name already exists.",
            "equipment_type_code_key", "An equipment type with this code already exists.",
            "equipment_type_name_key", "An equipment type with this name already exists.",
            "room_name_key", "A room with this name already exists.");

    /** "Still referenced" errors: 23503 for NO ACTION foreign keys, 23001 for RESTRICT ones (PostgreSQL 18). */
    private static final Set<String> STILL_REFERENCED_STATES = Set.of("23503", "23001");

    // Our own exceptions

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail handleNotFound(NotFoundException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    ProblemDetail handleConflict(ConflictException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    // Database constraints: the final guard against duplicates and race conditions

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException exception) {
        Optional<ServerErrorMessage> postgresError = findPostgresError(exception);
        String constraint = postgresError.map(ServerErrorMessage::getConstraint).orElse(null);
        String sqlState = postgresError.map(ServerErrorMessage::getSQLState).orElse(null);

        if (constraint != null && CONSTRAINT_MESSAGES.containsKey(constraint)) {
            return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, CONSTRAINT_MESSAGES.get(constraint));
        }
        if (sqlState != null && STILL_REFERENCED_STATES.contains(sqlState)) {
            return ProblemDetail.forStatusAndDetail(
                    HttpStatus.CONFLICT, "This item is still in use, so it can't be deleted.");
        }
        // Any other violation (a check constraint, a NOT NULL) means our validation missed something: a bug.
        log.error("Unmapped data integrity violation (SQLSTATE {}, constraint {})", sqlState, constraint);
        return handleUnexpected(exception);
    }

    // Validation → 422, with one entry per invalid field

    /** A @Valid request body failed validation. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        List<FieldErrorDto> errors = exception.getBindingResult().getFieldErrors().stream()
                .map(ApiExceptionHandler::toFieldError)
                .toList();
        return handleExceptionInternal(exception, validationProblem(errors), headers, VALIDATION_FAILED, request);
    }

    /** Constraints on other parameters (query, path) failed, possibly together with the body's. */
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(
            HandlerMethodValidationException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        List<FieldErrorDto> errors = new ArrayList<>();
        for (ParameterValidationResult result : exception.getParameterValidationResults()) {
            if (result instanceof ParameterErrors bodyErrors) {
                bodyErrors.getFieldErrors().forEach(error -> errors.add(toFieldError(error)));
            } else {
                String parameter = result.getMethodParameter().getParameterName();
                result.getResolvableErrors().forEach(error -> errors.add(
                        new FieldErrorDto(parameter, messageOrDefault(error.getDefaultMessage()))));
            }
        }
        return handleExceptionInternal(exception, validationProblem(errors), headers, VALIDATION_FAILED, request);
    }

    // Everything else

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception exception) {
        log.error("Unexpected error", exception);
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please try again later.");
    }

    // Helpers

    private static ProblemDetail validationProblem(List<FieldErrorDto> errors) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(VALIDATION_FAILED, "The request contains invalid values.");
        problem.setProperty("errors", errors);
        return problem;
    }

    private static FieldErrorDto toFieldError(FieldError error) {
        return new FieldErrorDto(error.getField(), messageOrDefault(error.getDefaultMessage()));
    }

    private static String messageOrDefault(String message) {
        return Objects.requireNonNullElse(message, "Invalid value.");
    }

    /** Walks the chain of causes down to the driver's exception, which knows the violated constraint. */
    private static Optional<ServerErrorMessage> findPostgresError(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof PSQLException psql && psql.getServerErrorMessage() != null) {
                return Optional.of(psql.getServerErrorMessage());
            }
        }
        return Optional.empty();
    }
}