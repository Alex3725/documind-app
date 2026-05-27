package com.example.documind.entities.files;

import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSemanticType;
import com.example.documind.entities.files.type.FileSubType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<File, Long> {
    boolean existsByHash(String hash);
    Optional<File> findByHash(String hash);

    Optional<File> findByIdAndOwner(Long id, String owner);

    List<File> findAllByOwnerOrderByUploadDateDesc(String owner);

    List<File> findAllByOwnerAndCategoryOrderByUploadDateDesc(String owner, FileCategory category);

    List<File> findAllByOwnerAndSubTypeOrderByUploadDateDesc(String owner, FileSubType subType);

    List<File> findAllByOwnerAndSemanticTypeOrderByUploadDateDesc(String owner, FileSemanticType semanticType);

    List<File> findAllByOwnerAndUploadDateBetweenOrderByUploadDateDesc(String owner, LocalDateTime from, LocalDateTime to);

    @Transactional
    @Modifying
    @Query("UPDATE File f SET f.owner = :newOwner WHERE f.owner = :currentOwner")
    int updateOwner(@Param("currentOwner") String currentOwner, @Param("newOwner") String newOwner);

    void deleteAllByOwner(String owner);

}
