package io.github.infinityinside.roombooking.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import io.github.infinityinside.roombooking.IntegrationTest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.spec.SecretKeySpec;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@IntegrationTest
@Transactional
class SecurityTests {

    @Autowired private MockMvcTester mvc;
    @Autowired private TestUsers testUsers;
    @Autowired private JwtEncoder encoder;

    @Test
    void requestsWithoutATokenGet401Problem() {
        assertThat(mvc.get().uri("/api/equipment-types"))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .hasHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer")
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "status": 401, "detail": "Log in to continue." }
                        """);
    }

    @Test
    void validTokensAreAccepted() {
        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, testUsers.bearerForNewUser()))
                .hasStatusOk();
    }

    @Test
    void garbageTokensGet401() {
        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void expiredTokensGet401() {
        Instant past = Instant.now().minus(Duration.ofHours(2));
        String expired = sign(encoder, claims(TokenService.ISSUER, past, past.plus(Duration.ofHours(1))));

        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, "Bearer " + expired))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void tokensFromAnotherIssuerGet401() {
        Instant now = Instant.now();
        String foreign = sign(encoder, claims("someone-else", now, now.plus(Duration.ofHours(1))));

        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, "Bearer " + foreign))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void tokensSignedWithAnotherSecretGet401() {
        byte[] otherSecret = Base64.getDecoder().decode("YW5vdGhlci1zZWNyZXQtd2l0aC1lbm91Z2gtYnl0ZXMhIQ==");
        JwtEncoder otherEncoder = new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(otherSecret, "HmacSHA256")));
        Instant now = Instant.now();
        String forged = sign(otherEncoder, claims(TokenService.ISSUER, now, now.plus(Duration.ofHours(1))));

        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, "Bearer " + forged))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void healthIsPublic() {
        assertThat(mvc.get().uri("/actuator/health")).hasStatusOk();
    }

    private static JwtClaimsSet claims(String issuer, Instant issuedAt, Instant expiresAt) {
        return JwtClaimsSet.builder()
                .issuer(issuer)
                .subject("1")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();
    }

    private static String sign(JwtEncoder encoder, JwtClaimsSet claims) {
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}