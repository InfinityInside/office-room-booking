package io.github.infinityinside.roombooking.security;

import org.springframework.stereotype.Component;

/** Real, signed tokens for tests. */
@Component
public class TestTokens {

    private final TokenService tokens;

    public TestTokens(TokenService tokens) {
        this.tokens = tokens;
    }

    /** An Authorization header value for the given user id. */
    public String bearer(long userId) {
        return "Bearer " + tokens.issueFor(userId).value();
    }
}