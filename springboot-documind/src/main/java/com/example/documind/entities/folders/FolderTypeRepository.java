package com.example.documind.entities.folders;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderTypeRepository extends JpaRepository<FolderType, Long> {

    List<FolderType> findAllByOwnerOrderByFullPathAsc(String owner);

    Optional<FolderType> findByFullPathAndOwner(String fullPath, String owner);

    Optional<FolderType> findByIdAndOwner(Long id, String owner);

    List<FolderType> findAllByOwnerAndParentPathOrderByNameAsc(String owner, String parentPath);

    List<FolderType> findAllByOwnerAndDepthOrderByNameAsc(String owner, int depth);

    boolean existsByFullPathAndOwner(String fullPath, String owner);

    void deleteAllByOwner(String owner);

    /**
     * Cerca cartelle per query testuale (nome o descrizione).
     */
    @Query("SELECT f FROM FolderType f WHERE f.owner = :owner " +
           "AND (LOWER(f.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(f.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<FolderType> searchByOwner(@Param("owner") String owner, @Param("q") String query);

    /**
     * Recupera tutte le cartelle che contengono un certo auto-tag.
     */
    @Query("SELECT f FROM FolderType f JOIN f.autoTags t WHERE f.owner = :owner AND t = :tag")
    List<FolderType> findByOwnerAndAutoTag(@Param("owner") String owner, @Param("tag") String tag);
}
