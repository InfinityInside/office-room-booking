package io.github.infinityinside.roombooking.grant;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccessGrantRepository extends JpaRepository<AccessGrant, Long> {

    Optional<AccessGrant> findByCode(String code);
}