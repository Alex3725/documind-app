package com.example.documind.entities.users;

import com.example.documind.dto.requests.LoginRequest;
import com.example.documind.dto.requests.PasswordRequest;
import com.example.documind.dto.responses.LoginResponse;
import com.example.documind.security.tokens.TokenService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping(("/api/v1/user"))
public class UserController {
    private final UserService userService;
    private final TokenService tokenService;

    public UserController(UserService userService, TokenService tokenService) {
        this.userService = userService;
        this.tokenService = tokenService;
    }

    @PostMapping
    public ResponseEntity<String> registerNewUser(@RequestBody User user) {
        userService.registerNewUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body("User successfully registered.");
    }

    @PostMapping("/in")
    public ResponseEntity<?> loginUser(
            @RequestBody LoginRequest loginRequest,
            HttpServletResponse response
    ) {
        Map<String, Object> data = userService.login(loginRequest.getTelephone(), loginRequest.getEmail(), loginRequest.getPassword());

        String token = (String) data.get("token");
        ResponseCookie cookie = ResponseCookie.from("authentication-token", token)
                .httpOnly(true)
                .secure(false) // HTTPS = true (localhost = false)
                .sameSite("Lax")
                .maxAge(30 * 24 * 60 * 60) // 24H * 30
                .path("/")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
        return ResponseEntity.ok((LoginResponse) data.get("user"));
    }

    @PostMapping("/out")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "authentication-token", required = false) String token,
            HttpServletResponse response
    ) {
        userService.logout(response, token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/extend-session")
    public  ResponseEntity<?> extendUserSession(
            @CookieValue(name = "authentication-token", required = false) String token,
            HttpServletResponse response
    ) {
        tokenService.extendSession(token, response, 30);
        return ResponseEntity.ok("Session extended.");
    }

    @DeleteMapping(path = "/me")
    public ResponseEntity<String> deleteUser(
            @CookieValue(name = "authentication-token", required = false) String token
    ) {
        userService.deleteUser(token);
        return ResponseEntity.ok("User successfully deleted.");
    }

    @PutMapping(path = "/me")
    public ResponseEntity<String> updateUser(
            @CookieValue(name = "authentication-token", required = false) String token,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email
    ) {
        userService.updateUser(token, username, email);
        return ResponseEntity.ok("User information successfully updated.");
    }

    @PostMapping(path = "me/verify-password")
    public ResponseEntity<String> verifyOldPassword(
            @CookieValue(name = "authentication-token", required = false) String token,
            @RequestBody PasswordRequest passwordRequest
    ) {
        userService.checkPassword(token, passwordRequest.getPassword());
        return ResponseEntity.ok("Password verified.");
    }

    @PutMapping(path = "me/password")
    public ResponseEntity<String> updateUserPassword(
            @CookieValue(name = "authentication-token", required = false) String token,
            @RequestBody PasswordRequest passwordRequest
    ) {
        userService.updateUserPassword(token, passwordRequest.getPassword());
        return ResponseEntity.ok("Password successfully updated.");
    }
}
