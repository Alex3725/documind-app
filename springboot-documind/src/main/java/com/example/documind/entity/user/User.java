package com.example.documind.entity.user;

import com.example.documind.entity.user.role.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
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

    private long id;

    private String name, surname;
    private String email, telephone;
    private String password;

    private String avatar;
    private LocalDate creation_date;
    private boolean isActive;

    private Role role;

    public User(String name, String surname, String email, String telephone, String password) {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.telephone = telephone;
        this.password = password;
        // this.avatar
        this.creation_date = LocalDate.now();
        this.isActive = true;
        this.role = Role.USER;
    }

    public User(String name, String surname, String email, String telephone, String password, Role role) {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.telephone = telephone;
        this.password = password;
        // this.avatar
        this.creation_date = LocalDate.now();
        this.isActive = true;
        this.role = role;
    }


    public User(String name, String surname, String email, String password, Role role) {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password;
        // this.avatar
        this.creation_date = LocalDate.now();
        this.isActive = true;
        this.role = role;
    }
}
