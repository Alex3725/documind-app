package com.example.documind.security.tokens;

import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.entities.users.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.beans.Transient;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.util.StringUtils;

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

    public void extendSession(String token, HttpServletResponse response, int timeInMinutes) {
        Optional<Token> tokenOpt = tokenRepository.findByToken(token);

        if (tokenOpt.isEmpty()) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Invalid or expired session.");
        }

        Token existingToken = tokenOpt.get();
        if (existingToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Invalid or expired session.");
        }

        existingToken.setExpiresAt(existingToken.getExpiresAt().plusMinutes(timeInMinutes));
        tokenRepository.save(existingToken);

        Cookie cookie = new Cookie("authentication-token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // HTTPS = true
        cookie.setPath("/");
        cookie.setMaxAge((int) Duration.between(LocalDateTime.now(), existingToken.getExpiresAt()).getSeconds());

        response.addCookie(cookie);
    }

    public boolean isValidToken(String tokenStr) {
        Optional<Token> tokenOpt = tokenRepository.findByToken(tokenStr);
        return tokenOpt.isPresent() && tokenOpt.get().getExpiresAt().isAfter(LocalDateTime.now());
    }

    @Transient
    public void deleteUserTokens(User user) {
        tokenRepository.deleteAllByUser(user);
    }

    public void requireValidToken(String token) {
        if (!StringUtils.hasText(token) || !isValidToken(token)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Invalid or expired session.");
        }
    }
}
