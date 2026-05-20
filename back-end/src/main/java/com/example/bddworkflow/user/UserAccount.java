package com.example.bddworkflow.user;

import com.example.bddworkflow.harness.Requirement;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_account")
@Requirement("REQ-001")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Requirement("REQ-001")
    @Column(nullable = false, length = 100)
    private String name;

    @Requirement("REQ-001")
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Requirement("REQ-001")
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    protected UserAccount() {
    }

    public UserAccount(Long id, String name, String email, String passwordHash) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public Long id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String email() {
        return email;
    }

    public String passwordHash() {
        return passwordHash;
    }
}
