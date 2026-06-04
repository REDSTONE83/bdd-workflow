package com.example.bddworkflow.auth.exception;

import com.example.bddworkflow.harness.Requirement;

/**
 * REQ-011 결정 #5: 가입되지 않은 이메일과 비밀번호 불일치를 구분하지 않고
 * 같은 401 INVALID_CREDENTIALS 응답으로 거절하기 위한 예외.
 */
@Requirement("REQ-011")
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("자격 증명이 일치하지 않습니다.");
    }
}
