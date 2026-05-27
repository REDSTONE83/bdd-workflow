package com.example.bddworkflow.common;

import org.springframework.data.domain.Sort;

import java.util.Set;

public final class SortKeys {

    private SortKeys() {
    }

    /**
     * 사용자가 요청한 sort key 가 허용 집합 안에 있는지 검증한다.
     * 도메인 고정 정렬만 허용하는 endpoint 는 빈 집합을 넘긴다.
     */
    public static void requireAllowed(Sort sort, Set<String> allowed) {
        if (sort == null) {
            return;
        }
        for (Sort.Order order : sort) {
            if (!allowed.contains(order.getProperty())) {
                throw new InvalidSortKeyException(order.getProperty());
            }
        }
    }
}
