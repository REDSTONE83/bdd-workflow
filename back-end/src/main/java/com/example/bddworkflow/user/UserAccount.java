package com.example.bddworkflow.user;

public record UserAccount(
        Long id,
        String name,
        String email,
        String passwordHash
) {
}
