package com.example.bddworkflow.user;

import com.example.bddworkflow.category.CategorySeedService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    private final InMemoryUserRepository userRepository;
    private final CategorySeedService categorySeedService;

    public UserService(InMemoryUserRepository userRepository, CategorySeedService categorySeedService) {
        this.userRepository = userRepository;
        this.categorySeedService = categorySeedService;
    }

    public SignupResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException(request.email());
        }

        UserAccount account = userRepository.save(
                request.name(),
                request.email(),
                PASSWORD_ENCODER.encode(request.password())
        );

        categorySeedService.seedDefaults(account.id());

        return new SignupResponse(account.id(), account.email(), account.name());
    }
}
