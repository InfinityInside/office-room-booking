package io.github.infinityinside.roombooking.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    /** Case-insensitive, using the lower(email) index. */
    @Query("select u from AppUser u where lower(u.email) = lower(:email)")
    Optional<AppUser> findByEmail(String email);

    @Query("select count(u) > 0 from AppUser u where lower(u.email) = lower(:email)")
    boolean existsByEmail(String email);

    /** Like findByEmail, but also loads the user's grants in the same query. */
    @EntityGraph(attributePaths = "grants")
    @Query("select u from AppUser u where lower(u.email) = lower(:email)")
    Optional<AppUser> findWithGrantsByEmail(String email);

    @EntityGraph(attributePaths = "grants")
    Optional<AppUser> findWithGrantsById(Long id);
}