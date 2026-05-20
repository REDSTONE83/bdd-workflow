package com.example.bddworkflow.user;

import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryUserRepository {

    private final AtomicLong ids = new AtomicLong(1);
    private final ConcurrentMap<String, UserAccount> accountsByEmail = new ConcurrentHashMap<>();

    public boolean existsByEmail(String email) {
        return accountsByEmail.containsKey(normalize(email));
    }

    public Optional<UserAccount> findByEmail(String email) {
        return Optional.ofNullable(accountsByEmail.get(normalize(email)));
    }

    public UserAccount save(String name, String email, String passwordHash) {
        String normalizedEmail = normalize(email);
        UserAccount account = new UserAccount(ids.getAndIncrement(), name, normalizedEmail, passwordHash);
        UserAccount previous = accountsByEmail.putIfAbsent(normalizedEmail, account);
        if (previous != null) {
            throw new DuplicateEmailException(email);
        }
        return account;
    }

    public void deleteAll() {
        accountsByEmail.clear();
        ids.set(1);
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
