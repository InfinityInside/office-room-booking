package io.github.infinityinside.roombooking.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import io.github.infinityinside.roombooking.IntegrationTest;
import io.github.infinityinside.roombooking.grant.AccessGrant;
import io.github.infinityinside.roombooking.grant.AccessGrantRepository;
import io.github.infinityinside.roombooking.grant.GrantType;
import io.github.infinityinside.roombooking.user.AppUser;
import io.github.infinityinside.roombooking.user.AppUserRepository;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class AuthTests {

    @Autowired private MockMvcTester mvc;
    @Autowired private AppUserRepository users;
    @Autowired private AccessGrantRepository grants;
    @Autowired private PasswordEncoder passwordEncoder;

    // Register

    @Test
    void registersAndReturnsAWorkingToken() throws Exception {
        MvcTestResult result = post("/api/auth/register", """
                {
                    "firstName": "  Tom ",
                    "lastName": "Novak",
                    "email": "tom@office.test",
                    "password": "correct horse"
                }
                """).exchange();

        assertThat(result)
                .hasStatus(HttpStatus.CREATED)
                .bodyJson()
                .isLenientlyEqualTo("""
                        {
                            "tokenType": "Bearer",
                            "expiresIn": 3600,
                            "user": {
                                "firstName": "Tom",
                                "lastName": "Novak",
                                "email": "tom@office.test",
                                "active": true,
                                "grantIds": [],
                                "grantCodes": []
                            }
                        }
                        """);

        String token = JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .hasStatusOk();
    }

    @Test
    void storesABcryptHashNotThePassword() {
        assertThat(post("/api/auth/register", registration("tom@office.test", "correct horse")))
                .hasStatus(HttpStatus.CREATED);

        String hash = users.findByEmail("tom@office.test").orElseThrow().getPasswordHash();
        assertThat(hash).startsWith("$2a$10$").hasSize(60);
        assertThat(passwordEncoder.matches("correct horse", hash)).isTrue();
    }

    @Test
    void rejectsAnEmailThatIsTakenIgnoringCase() {
        saveUser("tom@office.test", "correct horse", true);

        assertThat(post("/api/auth/register", registration("TOM@Office.test", "correct horse")))
                .hasStatus(HttpStatus.CONFLICT);
    }

    @Test
    void rejectsPasswordsLongerThan72Bytes() {
        String password = "ł".repeat(40);   // 40 characters, but 80 bytes in UTF-8

        assertThat(post("/api/auth/register", registration("tom@office.test", password)))
                .hasStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                .bodyJson()
                .extractingPath("$.errors[0].field")
                .isEqualTo("password");
    }

    @Test
    void rejectsAnInvalidEmailAndAShortPassword() {
        assertThat(post("/api/auth/register", registration("not-an-email", "short")))
                .hasStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                .bodyJson()
                .extractingPath("$.errors[*].field")
                .asArray()
                .containsExactlyInAnyOrder("email", "password");
    }

    // Login

    @Test
    void logsInAndReturnsTheActiveGrantCodes() {
        AppUser user = saveUser("anna@office.test", "correct horse", true);
        user.addGrant(grants.save(new AccessGrant("ADMIN", "Admin", GrantType.SYSTEM, "")));

        assertThat(post("/api/auth/login", login("ANNA@office.test", "correct horse")))
                .hasStatusOk()
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "user": { "email": "anna@office.test", "grantCodes": ["ADMIN"] } }
                        """);
    }

    @Test
    void wrongPasswordAndUnknownEmailGetTheSameAnswer() {
        saveUser("anna@office.test", "correct horse", true);
        String expected = """
                { "status": 401, "detail": "Wrong email or password." }
                """;

        assertThat(post("/api/auth/login", login("anna@office.test", "wrong horse")))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .isLenientlyEqualTo(expected);
        assertThat(post("/api/auth/login", login("nobody@office.test", "correct horse")))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .isLenientlyEqualTo(expected);
    }

    @Test
    void deactivatedUsersCannotLogIn() {
        saveUser("anna@office.test", "correct horse", false);

        assertThat(post("/api/auth/login", login("anna@office.test", "correct horse")))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "detail": "This account has been deactivated." }
                        """);
    }

    // Helpers

    private AppUser saveUser(String email, String password, boolean active) {
        AppUser user = new AppUser("Test", "User", email, passwordEncoder.encode(password), Instant.now());
        user.setActive(active);
        return users.save(user);
    }

    private MockMvcRequestBuilder post(String uri, String json) {
        return mvc.post().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json);
    }

    private static String registration(String email, String password) {
        return """
                { "firstName": "Tom", "lastName": "Novak", "email": "%s", "password": "%s" }
                """.formatted(email, password);
    }

    private static String login(String email, String password) {
        return """
                { "email": "%s", "password": "%s" }
                """.formatted(email, password);
    }
}