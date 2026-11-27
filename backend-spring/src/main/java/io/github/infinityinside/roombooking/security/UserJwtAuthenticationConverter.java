package io.github.infinityinside.roombooking.security;

import io.github.infinityinside.roombooking.grant.AccessGrant;
import io.github.infinityinside.roombooking.user.AppUser;
import io.github.infinityinside.roombooking.user.AppUserRepository;
import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Runs after a token's signature and claims are validated: loads the user it names, rejects missing or
 * deactivated users, and turns the user's active grants into authorities.
 */
@Component
class UserJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AppUserRepository users;

    UserJwtAuthenticationConverter(AppUserRepository users) {
        this.users = users;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        AppUser user = users.findWithGrantsById(parseUserId(jwt.getSubject()))
                .filter(AppUser::isActive)
                .orElseThrow(() -> new InvalidBearerTokenException("The user no longer exists or is deactivated."));

        List<GrantedAuthority> authorities = user.getGrants().stream()
                .filter(AccessGrant::isActive)
                .map(grant -> (GrantedAuthority) new SimpleGrantedAuthority(grant.getCode()))
                .toList();

        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    private static long parseUserId(String subject) {
        if (subject == null) {
            throw new InvalidBearerTokenException("The token has no subject.");
        }
        try {
            return Long.parseLong(subject);
        } catch (NumberFormatException exception) {
            throw new InvalidBearerTokenException("The token's subject is not a user id.");
        }
    }
}