package com.example.documind.entity.user;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table
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
}
