package io.github.infinityinside.roombooking.security;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.infinityinside.roombooking.IntegrationTest;
import io.github.infinityinside.roombooking.grant.AccessGrant;
import io.github.infinityinside.roombooking.grant.AccessGrantRepository;
import io.github.infinityinside.roombooking.grant.GrantType;
import io.github.infinityinside.roombooking.grant.SystemGrants;
import io.github.infinityinside.roombooking.user.AppUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class AuthorizationTests {

    private static final String NEW_EQUIPMENT = """
            { "code": "SPEAKERPHONE", "name": "Speakerphone" }
            """;

    @Autowired private MockMvcTester mvc;
    @Autowired private TestUsers testUsers;
    @Autowired private TokenService tokens;
    @Autowired private AccessGrantRepository grants;

    // /auth/me

    @Test
    void meReturnsTheCurrentUserWithOnlyActiveGrantCodes() {
        AccessGrant oldTeam = grants.save(new AccessGrant("OLD_TEAM", "Old team", GrantType.ROOM_ACCESS, ""));
        oldTeam.setActive(false);
        AppUser user = testUsers.create(SystemGrants.ADMIN);
        user.addGrant(oldTeam);

        assertThat(mvc.get().uri("/api/auth/me").header(HttpHeaders.AUTHORIZATION, testUsers.bearer(user)))
                .hasStatusOk()
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "email": "%s", "active": true, "grantCodes": ["ADMIN"] }
                        """.formatted(user.getEmail()))
                .extractingPath("$.grantIds")
                .asArray()
                .hasSize(2);
    }

    // Admin endpoints

    @Test
    void regularUsersGet403OnAdminEndpoints() {
        assertThat(createEquipmentAs(testUsers.bearerForNewUser()))
                .hasStatus(HttpStatus.FORBIDDEN)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "status": 403, "detail": "You don't have permission to do this." }
                        """);
    }

    @Test
    void adminsCanUseAdminEndpoints() {
        assertThat(createEquipmentAs(testUsers.bearerForNewAdmin()))
                .hasStatus(HttpStatus.CREATED);
    }

    // Changes take effect immediately

    @Test
    void removingTheAdminGrantTakesEffectOnTheNextRequest() {
        AppUser admin = testUsers.create(SystemGrants.ADMIN);
        String token = testUsers.bearer(admin);
        admin.removeGrant(grants.findByCode(SystemGrants.ADMIN).orElseThrow());

        assertThat(createEquipmentAs(token)).hasStatus(HttpStatus.FORBIDDEN);
    }

    @Test
    void deactivatedUsersTokensStopWorking() {
        AppUser user = testUsers.create();
        String token = testUsers.bearer(user);
        user.setActive(false);

        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, token))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void tokensForUsersThatDoNotExistAreRejected() {
        String token = "Bearer " + tokens.issueFor(999_999).value();

        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, token))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }

    private MockMvcTester.MockMvcRequestBuilder createEquipmentAs(String bearer) {
        return mvc.post().uri("/api/admin/equipment-types")
                .header(HttpHeaders.AUTHORIZATION, bearer)
                .contentType(MediaType.APPLICATION_JSON)
                .content(NEW_EQUIPMENT);
    }
}