package io.github.infinityinside.roombooking.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** The app.jwt.* settings. */
@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, Duration expiresIn) {
}