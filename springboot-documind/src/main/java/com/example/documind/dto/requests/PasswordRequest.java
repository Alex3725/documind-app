package com.example.documind.dto.requests;

public class PasswordRequest {
    private String password;

    public PasswordRequest(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }
}
