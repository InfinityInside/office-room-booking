package io.github.infinityinside.roombooking.error;

/** A field is invalid in a way the request validation couldn't check. Becomes a 422 with one field error. */
public class InvalidInputException extends RuntimeException {

    private final String field;

    public InvalidInputException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}