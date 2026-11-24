package io.github.infinityinside.roombooking.error;

/** The request conflicts with the current state, e.g. a taken name. Becomes a 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}