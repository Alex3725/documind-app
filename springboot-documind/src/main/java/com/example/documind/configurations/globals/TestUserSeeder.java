package com.example.documind.configurations.globals;

import com.example.documind.entities.users.User;
import com.example.documind.entities.users.UserRepository;
import com.example.documind.entities.users.role.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class TestUserSeeder implements CommandLineRunner {
    private final UserRepository userRepository;

    @Value("${app.seed.user.name:Test}")
    private String seedName;

    @Value("${app.seed.user.surname:User}")
    private String seedSurname;

    @Value("${app.seed.user.email:test@documind.local}")
    private String seedEmail;

    @Value("${app.seed.user.telephone:+391111111111}")
    private String seedTelephone;

    @Value("${app.seed.user.password:test123}")
    private String seedPassword;

    public TestUserSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        User existingUser = userRepository.findByTelephoneOrEmail(seedTelephone, seedEmail);
        if (existingUser != null) {
            existingUser.setEmail(seedEmail);
            existingUser.setTelephone(seedTelephone);
            existingUser.setPassword(seedPassword);
            userRepository.save(existingUser);
            return;
        }

        User testUser = new User(
                seedName,
                seedSurname,
                seedEmail,
                seedTelephone,
                seedPassword,
                Role.USER
        );

        userRepository.save(testUser);
    }
}