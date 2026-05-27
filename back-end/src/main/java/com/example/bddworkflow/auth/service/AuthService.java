package com.example.bddworkflow.auth.service;

import com.example.bddworkflow.auth.dto.LoginRequest;
import com.example.bddworkflow.auth.dto.UserMeResponse;
import com.example.bddworkflow.auth.exception.InvalidCredentialsException;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.user.domain.UserAccount;
import com.example.bddworkflow.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * REQ-011 로그인/현재 사용자 조회의 업무 로직.
 *
 * <p>결정 #2, #16: access token 은 HttpOnly Cookie 로만 전달한다.
 * 결정 #5: 모든 자격 증명 실패는 같은 InvalidCredentialsException 으로 통일한다.
 * 결정 #9, #18: 비밀번호 비교는 REQ-001 과 동일한 PasswordEncoder Bean 을 재사용한다.
 * 결정 #25: 로그인 성공 응답은 204 No Content, 형식 오류는 400 Bean Validation.
 *
 * <p>로그아웃은 DB 접근 없이 Cookie 만 만료시키면 충분하므로 서비스 메서드로 두지 않고
 * {@link AccessTokenCookieFactory#expire()} 를 컨트롤러가 직접 사용한다 (transaction.md).
 */
@Requirement("REQ-011")
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccessTokenIssuer accessTokenIssuer;
    private final AccessTokenCookieFactory cookieFactory;

    /**
     * 자격 증명을 검증해 access token Cookie 를 만들어 반환한다.
     * 실패 시 {@link InvalidCredentialsException}.
     */
    @Transactional
    public ResponseCookie login(LoginRequest request) {
        UserAccount account = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), account.passwordHash())) {
            throw new InvalidCredentialsException();
        }
        AccessTokenIssuer.IssuedToken token = accessTokenIssuer.issue(account.id());
        return cookieFactory.issue(token.value());
    }

    /**
     * 인증된 사용자의 식별자와 이메일을 반환한다.
     */
    @Transactional(readOnly = true)
    public UserMeResponse loadCurrentUser(UUID userId) {
        UserAccount account = userRepository.findById(userId)
                .orElseThrow(InvalidCredentialsException::new);
        return new UserMeResponse(account.id(), account.email());
    }
}
