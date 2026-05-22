package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;

import java.util.UUID;

@Requirement("REQ-004")
public record AuthenticatedUser(UUID id) {
}
