package com.example.documind.security.tokens;


import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.entities.users.User;
import com.example.documind.entities.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StringUtils;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/tokens")
public class TokenController {
    private final TokenService tokenService;
    private final UserRepository userRepository;

    @Autowired
    public TokenController(TokenService tokenService, UserRepository userRepository) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<String> deleteAllTokens(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String token
    ) {
        String rawToken = extractTokenValue(token);
        tokenService.requireValidToken(rawToken);

        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            throw new CustomException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found.");
        }

        tokenService.deleteUserTokens(optionalUser.get());
        return ResponseEntity.ok("All tokens deleted for user ID: " + userId);
    }

    private String extractTokenValue(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Invalid or expired session.");
        }

        if (authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7).trim();
        }

        return authorizationHeader.trim();
    }
}
