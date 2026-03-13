package com.example.documind.dto.responses;

import com.example.documind.entities.users.role.Role;

public class LoginResponse {
    private String name, surname;
    private String telephone;
    private String email;
    private Role role;

    public LoginResponse() {
    }

    public LoginResponse(String username, String email) {
        this.telephone = username;
        this.email = email;
    }

    public LoginResponse(String name, String surname, String telephone, String email, Role role) {
        this.name = name;
        this.surname = surname;
        this.telephone = telephone;
        this.email = email;
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public String getSurname() {
        return surname;
    }

    public String getTelephone() {
        return telephone;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }
}
