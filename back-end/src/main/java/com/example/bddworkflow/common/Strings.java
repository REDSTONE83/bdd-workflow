package com.example.bddworkflow.common;

import org.openapitools.jackson.nullable.JsonNullable;

import java.util.Locale;

public final class Strings {

    private Strings() {
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String normalizeEmail(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    /**
     * Trim the value inside a JsonNullable string. Preserves {@code undefined} (field absent),
     * and converts blank-after-trim values to {@code null} so PATCH "clear" semantics work
     * consistently whether the client sends explicit {@code null} or whitespace-only.
     */
    public static JsonNullable<String> trimInsideNullable(JsonNullable<String> value) {
        if (value == null) {
            return JsonNullable.undefined();
        }
        if (!value.isPresent()) {
            return value;
        }
        return JsonNullable.of(trimToNull(value.get()));
    }
}
