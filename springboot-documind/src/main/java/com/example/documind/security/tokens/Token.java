package com.example.documind.security.tokens;

import com.example.documind.entities.users.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "token")
public class Token {
    @Id
    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime created_at;

    @Column(nullable = false)
    private LocalDateTime expires_at;

    public Token() {
    }

    public Token(String token, User user, LocalDateTime created_at) {
        this.token = token;
        this.user = user;
        this.created_at = created_at;
    }

    public String getToken() {
        return token;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getExpiresAt() {
        return expires_at;
    }

    public void setExpiresAt(LocalDateTime expires_at) {
        this.expires_at = expires_at;
    }
}
