package com.example.bddworkflow.user.repository;

import com.example.bddworkflow.user.domain.UserAccount;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserAccount, UUID> {

    boolean existsByEmail(String email);

    Optional<UserAccount> findByEmail(String email);

    /**
     * 테스트/시드 진입점. 이메일 정규화는 DTO canonical constructor 가 끝낸 결과만 받는다.
     */
    default UserAccount save(String name, String email, String passwordHash) {
        return save(new UserAccount(null, name, email, passwordHash));
    }
}
