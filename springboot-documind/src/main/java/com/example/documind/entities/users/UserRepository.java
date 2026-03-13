package com.example.documind.entities.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u WHERE u.email = ?1")
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.telephone = ?1")
    Optional<User> findUserByTelephone(String telephone);

    @Query("SELECT u FROM User u WHERE u.telephone = ?1 OR u.email = ?2")
    User findByTelephoneOrEmail(String telephone, String email);

    @Query("SELECT u FROM User u WHERE u.telephone = :telephone AND u.password = :password")
    User findByTelephoneAndPassword(@Param("telephone") String telephone, @Param("password") String password);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.password = :password")
    User findByEmailAndPassword(@Param("email") String email, @Param("password") String password);
}
