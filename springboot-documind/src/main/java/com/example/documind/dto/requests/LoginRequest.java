package com.example.documind.dto.requests;

public class LoginRequest {
    private String telephone, email;
    private String password;

    public LoginRequest(String telephone, String email, String password) {
        this.telephone = telephone;
        this.email = email;
        this.password = password;
    }

    public String getTelephone() {
        return telephone;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }
}
