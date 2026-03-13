package com.example.documind.entities.users;

import com.example.documind.entities.users.role.Role;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "users")
@NoArgsConstructor
public class User {
    @Id
    @SequenceGenerator(
            name = "user_sequence",
            sequenceName = "user_sequence",
            allocationSize = 1
    )

    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "user_sequence"
    )

    private Long id;

    private String name, surname;
    private String email, telephone;
    private String password;

    private String avatar;
    private LocalDate creation_date, last_log;
    private boolean isActive;

    private Role role;

    public User(String name, String surname, String email, String telephone, String password, Role role) {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.telephone = telephone;
        this.password = password;
        // this.avatar
        last_log = creation_date = LocalDate.now();
        this.isActive = true;
        this.role = role;
    }


    public User(String name, String surname, String email, String password, Role role) {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password;
        // this.avatar
        last_log = creation_date = LocalDate.now();
        this.isActive = true;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
