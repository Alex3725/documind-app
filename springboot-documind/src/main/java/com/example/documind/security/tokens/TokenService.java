package com.example.documind.security.tokens;

import com.example.documind.entities.users.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.beans.Transient;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class TokenService {
    @Autowired
    private TokenRepository tokenRepository;

    public Token generateToken(User user) {
        String tokenString = UUID.randomUUID().toString();
        LocalDateTime creationDate = LocalDateTime.now();

        Token token = new Token(
                tokenString,
                user,
                creationDate
        );
        token.setExpiresAt(creationDate.plusHours(24));
        return tokenRepository.save(token);
    }

    public boolean extendSession(String token, HttpServletResponse response, int timeInMinutes) {
        Optional<Token> tokenOpt = tokenRepository.findByToken(token);

        if (tokenOpt.isEmpty()) {
            return false;
        }

        Token existingToken = tokenOpt.get();
        if (existingToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        existingToken.setExpiresAt(existingToken.getExpiresAt().plusMinutes(timeInMinutes));
        tokenRepository.save(existingToken);

        Cookie cookie = new Cookie("authentication-token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // HTTPS = true
        cookie.setPath("/");
        cookie.setMaxAge((int) Duration.between(LocalDateTime.now(), existingToken.getExpiresAt()).getSeconds());

        response.addCookie(cookie);
        return true;
    }

    public boolean isValidToken(String tokenStr) {
        Optional<Token> tokenOpt = tokenRepository.findByToken(tokenStr);
        return tokenOpt.isPresent() && tokenOpt.get().getExpiresAt().isAfter(LocalDateTime.now());
    }

    @Transient
    public void deleteUserTokens(User user) {
        tokenRepository.deleteAllByUser(user);
    }
}
