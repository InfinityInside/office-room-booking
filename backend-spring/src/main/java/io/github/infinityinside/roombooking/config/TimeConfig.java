package io.github.infinityinside.roombooking.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class TimeConfig {

    /** The one source of "now". Tests can replace it with a fixed clock. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}