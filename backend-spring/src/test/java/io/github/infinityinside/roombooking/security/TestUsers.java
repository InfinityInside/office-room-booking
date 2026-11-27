package io.github.infinityinside.roombooking.security;

import io.github.infinityinside.roombooking.grant.AccessGrant;
import io.github.infinityinside.roombooking.grant.AccessGrantRepository;
import io.github.infinityinside.roombooking.grant.GrantType;
import io.github.infinityinside.roombooking.grant.SystemGrants;
import io.github.infinityinside.roombooking.user.AppUser;
import io.github.infinityinside.roombooking.user.AppUserRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Creates users and real, signed tokens for tests. Use from @Transactional tests, so everything is rolled back. */
@Component
public class TestUsers {

    private final AppUserRepository users;
    private final AccessGrantRepository grants;
    private final TokenService tokens;

    public TestUsers(AppUserRepository users, AccessGrantRepository grants, TokenService tokens) {
        this.users = users;
        this.grants = grants;
        this.tokens = tokens;
    }

    /** A new active user with a unique email, holding the given grants (created if missing). */
    public AppUser create(String... grantCodes) {
        String email = "user-" + UUID.randomUUID() + "@office.test";
        AppUser user = users.save(new AppUser("Test", "User", email, "not-a-real-hash", Instant.now()));
        for (String code : grantCodes) {
            user.addGrant(grants.findByCode(code).orElseGet(() -> grants.save(newGrant(code))));
        }
        return user;
    }

    /** An Authorization header value for the given user. */
    public String bearer(AppUser user) {
        return "Bearer " + tokens.issueFor(user.getId()).value();
    }

    public String bearerForNewUser() {
        return bearer(create());
    }

    public String bearerForNewAdmin() {
        return bearer(create(SystemGrants.ADMIN));
    }

    private static AccessGrant newGrant(String code) {
        GrantType type = SystemGrants.ADMIN.equals(code) ? GrantType.SYSTEM : GrantType.ROOM_ACCESS;
        return new AccessGrant(code, code, type, "");
    }
}