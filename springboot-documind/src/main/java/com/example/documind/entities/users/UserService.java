package com.example.documind.entities.users;

import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.configurations.globals.mappers.UserMapper;
import com.example.documind.entities.files.FileService;
import com.example.documind.security.tokens.Token;
import com.example.documind.security.tokens.TokenRepository;
import com.example.documind.security.tokens.TokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final FileService fileService;
    private final TokenService tokenService;

    @Autowired
    public UserService(
            UserMapper userMapper,
            UserRepository userRepository,
            TokenRepository tokenRepository,
            TokenService tokenService,
            FileService fileService
    ) {
        this.userMapper = userMapper;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.fileService = fileService;
        this.tokenService = tokenService;
    }

    public void registerNewUser(User user) {
        Optional<User> optionalUser = Optional.ofNullable(userRepository
                .findByTelephoneOrEmail(user.getTelephone(), user.getEmail()));

        if (optionalUser.isPresent()) {
            throw new CustomException(HttpStatus.CONFLICT, "USER_ALREADY_EXISTS", "User already exists.");
        }

        userRepository.save(user);
        fileService.createDefaultSpace(user);
    }

    public Map<String, Object> login(String telephone, String email, String password) {
        User user = userRepository.findByTelephoneOrEmailAndPassword(telephone, email, password);
        if (user == null) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid username or password.");
        }

        Token userToken = tokenService.generateToken(user);

        return Map.of(
                "token", userToken.getToken(),
                "user", userMapper.toResponse(user)
        );
    }

    public void logout(HttpServletResponse response, String token) {
        User user = requireUserFromValidToken(token);

        tokenRepository.deleteAllByUser(user);

        Cookie cookie = new Cookie("authentication-token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
    }

    @Transactional
    public void deleteUser(String token) {
        User user = requireUserFromValidToken(token);

        fileService.deleteAllByOwner(user.getEmail());
        tokenService.deleteUserTokens(user);
        userRepository.delete(user);
    }

    @Transactional
    public void updateUser(
            String token,
            String telephone,
            String email
    ) {
        User user = requireUserFromValidToken(token);
        String previousEmail = user.getEmail();

        if (StringUtils.hasText(telephone) && !telephone.equals(user.getTelephone())) {
            Optional<User> userOptional = userRepository.findUserByTelephone(telephone);

            if (userOptional.isPresent()) {
                throw new CustomException(HttpStatus.CONFLICT, "TELEPHONE_ALREADY_EXISTS", "Telephone already in use.");
            }

            user.setTelephone(telephone);
        }

        if (StringUtils.hasText(email) && !email.equals(user.getEmail())) {
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isPresent()) {
                throw new CustomException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Email already in use.");
            }

            user.setEmail(email);
            fileService.transferOwnership(previousEmail, email);
        }

        userRepository.save(user);
    }

    public void checkPassword(String token, String oldPassword) {
        User user = requireUserFromValidToken(token);
        if (!user.getPassword().equals(oldPassword)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_PASSWORD", "Incorrect password.");
        }
    }

    public void updateUserPassword(String token, String newPassword) {
        User user = requireUserFromValidToken(token);

        user.setPassword(newPassword);
        userRepository.save(user);
    }

    private User requireUserFromValidToken(String token) {
        if (!StringUtils.hasText(token)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Invalid or expired session.");
        }

        Optional<Token> userTokenOptional = tokenRepository
                .findByToken(token);

        if (userTokenOptional.isEmpty() || !tokenService.isValidToken(token)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Invalid or expired session.");
        }

        return userTokenOptional.get().getUser();
    }
}
