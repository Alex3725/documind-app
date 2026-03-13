package com.example.documind.entities.users;

import com.example.documind.configurations.globals.mappers.UserMapper;
import com.example.documind.dto.responses.LoginResponse;
import com.example.documind.security.tokens.Token;
import com.example.documind.security.tokens.TokenRepository;
import com.example.documind.security.tokens.TokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final TaskRepository taskRepository; // files.
    private final TaskService taskService; // files.
    private final TokenService tokenService;

    @Autowired
    public UserService(UserMapper userMapper, UserRepository userRepository, TokenRepository tokenRepository, TokenService tokenService, TaskRepository  taskRepository, TaskService taskService) {
        this.userMapper = userMapper;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.taskRepository  = taskRepository;
        this.taskService = taskService;
        this.tokenService = tokenService;
    }

    public boolean registerNewUser(User user) {
        Optional<User> optionalUser = Optional.ofNullable(userRepository
                .findByTelephoneOrEmail(user.getTelephone(), user.getEmail()));

        if (optionalUser.isEmpty()){
            userRepository.save(user);
            taskService.createDefaultTask(user); // files.

            return true;
        }

        return false;
    }

    public Optional<Map<String, Object>> login(String telephone, String email, String password) {
        User user = userRepository.findByTelephoneOrEmailAndPassword(telephone, email, password);
        if (user == null)
            return Optional.empty();

        Token userToken = tokenService.generateToken(user);

        return Optional.of(
                Map.of(
                        "token", userToken.getToken(),
                        "user", userMapper.toResponse(
                                user
                        )
                )
        );
    }

    public void logout(HttpServletResponse response, String token) {
        // DATABASE
        Optional<User> optionalUser = getUserFromValidToken(token);

        if (optionalUser.isEmpty()) {
            return;
        }

        //DATABASE
        tokenRepository.deleteAllByUser(optionalUser.get());

        // CLIENT-SIDE
        Cookie cookie = new Cookie("authentication-token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
    }

    @Transactional
    public boolean deleteUser(String token) {
        Optional<User> userOptional = getUserFromValidToken(token);
        if (userOptional.isEmpty())
            return false;

        User user = userOptional.get();

        // DELETE TASKS AND TOKENS
        taskRepository.deleteAllByUserId(user.getId()); // files.
        tokenService.deleteUserTokens(user);

        // DELETE USER
        userRepository.delete(user);

        return true;
    }

    @Transactional
    public boolean updateUser(
            String token,
            String telephone,
            String email
    ) {
        Optional<User> optionalUser = getUserFromValidToken(token);
        if (optionalUser.isEmpty())
            return false;

        User user = optionalUser.get();

        if (StringUtils.hasText(telephone) && !telephone.equals(user.getTelephone())) {
            Optional<User> userOptional = userRepository.findUserByTelephone(telephone);

            if (userOptional.isEmpty())
                user.setTelephone(telephone);
        }

        if (StringUtils.hasText(email) && !email.equals(user.getEmail())) {
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty())
                user.setEmail(email);
        }

        userRepository.save(user);
        return true;
    }

    public boolean checkPassword(String token, String oldPassword) {
        Optional<User> userOptional = getUserFromValidToken(token);
        if (userOptional.isEmpty())
            return false;

        User user = userOptional.get();

        if (!user.getPassword().equals(oldPassword)) {
            return false;
        }

        return true;
    }

    public boolean updateUserPassword(String token, String newPassword) {
        Optional<User> userOptional = getUserFromValidToken(token);
        if (userOptional.isEmpty())
            return false;

        User user = userOptional.get();

        user.setPassword(newPassword);
        userRepository.save(user);
        return true;
    }

    private Optional<User> getUserFromValidToken(String token) {
        Optional<Token> userTokenOptional = tokenRepository
                .findByToken(token);

        if (userTokenOptional.isEmpty() || !tokenService.isValidToken(token))
            return Optional.empty();

        return Optional.of(
                userTokenOptional.get().getUser()
        );
    }
}
