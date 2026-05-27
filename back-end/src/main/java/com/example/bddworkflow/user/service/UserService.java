package com.example.bddworkflow.user.service;

import com.example.bddworkflow.category.service.CategorySeedService;
import com.example.bddworkflow.user.exception.DuplicateEmailException;
import com.example.bddworkflow.user.dto.SignupRequest;
import com.example.bddworkflow.user.dto.SignupResponse;
import com.example.bddworkflow.user.domain.UserAccount;
import com.example.bddworkflow.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CategorySeedService categorySeedService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public SignupResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException(request.email());
        }

        UserAccount account = userRepository.save(
                request.name(),
                request.email(),
                passwordEncoder.encode(request.password())
        );

        categorySeedService.seedDefaults(account.id());

        return new SignupResponse(account.id(), account.email(), account.name());
    }
}
