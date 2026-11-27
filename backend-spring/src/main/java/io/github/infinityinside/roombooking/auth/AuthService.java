package io.github.infinityinside.roombooking.auth;

import io.github.infinityinside.roombooking.error.ConflictException;
import io.github.infinityinside.roombooking.error.InvalidInputException;
import io.github.infinityinside.roombooking.error.UnauthorizedException;
import io.github.infinityinside.roombooking.security.TokenService;
import io.github.infinityinside.roombooking.security.TokenService.IssuedToken;
import io.github.infinityinside.roombooking.user.AppUser;
import io.github.infinityinside.roombooking.user.AppUserRepository;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    /** bcrypt ignores everything after this many bytes (see database/README.md). */
    private static final int BCRYPT_MAX_BYTES = 72;

    public record AuthResult(AppUser user, IssuedToken token) {
    }

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final Clock clock;

    /** Compared against when the email doesn't exist, so that case takes as long as a wrong password. */
    private final String dummyHash;

    public AuthService(AppUserRepository users, PasswordEncoder passwordEncoder, TokenService tokens, Clock clock) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.clock = clock;
        this.dummyHash = passwordEncoder.encode("dummy password for unknown emails");
    }

    @Transactional
    public AuthResult register(String firstName, String lastName, String email, String password) {
        if (!fitsBcrypt(password)) {
            throw new InvalidInputException("password", "Must be at most 72 bytes in UTF-8.");
        }
        String trimmedEmail = email.strip();
        if (users.existsByEmail(trimmedEmail)) {
            throw new ConflictException("An account with this email already exists.");
        }
        AppUser user = users.save(new AppUser(
                firstName.strip(), lastName.strip(), trimmedEmail, passwordEncoder.encode(password), clock.instant()));
        return new AuthResult(user, tokens.issueFor(user.getId()));
    }

    @Transactional(readOnly = true)
    public AuthResult login(String email, String password) {
        if (!fitsBcrypt(password)) {
            throw wrongCredentials();
        }
        Optional<AppUser> found = users.findWithGrantsByEmail(email.strip());

        // Always run bcrypt, even for unknown emails, so response times don't reveal which emails exist.
        String hash = found.map(AppUser::getPasswordHash).orElse(dummyHash);
        boolean passwordMatches = passwordEncoder.matches(password, hash);

        if (found.isEmpty() || !passwordMatches) {
            throw wrongCredentials();
        }
        AppUser user = found.get();
        if (!user.isActive()) {
            throw new UnauthorizedException("This account has been deactivated.");
        }
        return new AuthResult(user, tokens.issueFor(user.getId()));
    }

    private static boolean fitsBcrypt(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length <= BCRYPT_MAX_BYTES;
    }

    private static UnauthorizedException wrongCredentials() {
        return new UnauthorizedException("Wrong email or password.");
    }
}