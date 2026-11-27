package io.github.infinityinside.roombooking.security;

import io.github.infinityinside.roombooking.error.UnauthorizedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Who is making the current request. */
@Component
public class AuthenticatedUser {

    public long id() {
        return Long.parseLong(authentication().getName());
    }

    public boolean hasGrant(String code) {
        return authentication().getAuthorities().stream()
                .anyMatch(authority -> code.equals(authority.getAuthority()));
    }

    private static Authentication authentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            throw new UnauthorizedException("Log in to continue.");
        }
        return authentication;
    }
}