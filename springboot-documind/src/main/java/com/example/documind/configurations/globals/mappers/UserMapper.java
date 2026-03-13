package com.example.documind.configurations.globals.mappers;

import com.example.documind.dto.responses.LoginResponse;
import com.example.documind.entities.users.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    LoginResponse toResponse(User user);
}
