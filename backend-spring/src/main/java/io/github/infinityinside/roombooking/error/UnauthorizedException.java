package io.github.infinityinside.roombooking.error;

/** The caller couldn't be authenticated, e.g. wrong login credentials. Becomes a 401. */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}