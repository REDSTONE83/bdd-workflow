package com.example.bddworkflow.testsupport;

import java.util.UUID;

public final class ApiRequestSupport {

    private ApiRequestSupport() {
    }

    public static String bearer(UUID userId) {
        return "Bearer " + TestJwt.signFor(userId);
    }
}
