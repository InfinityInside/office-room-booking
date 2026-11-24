package io.github.infinityinside.roombooking.error;

/** The requested resource doesn't exist, or isn't visible to the current user. Becomes a 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    /** For example: NotFoundException.of("Room", 42) → "Room 42 was not found." */
    public static NotFoundException of(String resource, Object id) {
        return new NotFoundException("%s %s was not found.".formatted(resource, id));
    }
}