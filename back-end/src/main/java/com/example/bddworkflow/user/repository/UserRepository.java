package com.example.bddworkflow.user.repository;

import com.example.bddworkflow.user.domain.UserAccount;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserAccount, UUID> {

    default boolean existsByEmail(String email) {
        return existsByEmailIgnoreCase(normalize(email));
    }

    default Optional<UserAccount> findByEmail(String email) {
        return findByEmailIgnoreCase(normalize(email));
    }

    default UserAccount save(String name, String email, String passwordHash) {
        return save(new UserAccount(null, name, normalize(email), passwordHash));
    }

    boolean existsByEmailIgnoreCase(String email);

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
