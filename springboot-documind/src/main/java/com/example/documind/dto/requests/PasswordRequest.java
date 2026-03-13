package com.example.documind.dto.requests;

public class PasswordRequest {
    private String oldPassword;
    private String newPassword;

    public PasswordRequest(String oldPassword, String newPassword) {
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
    }

    public String getOldPassword() {
        return oldPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }
}
