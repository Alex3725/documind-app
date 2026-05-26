package com.example.documind.entities.folders;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderTypeRepository extends JpaRepository<FolderType, Long> {

    List<FolderType> findAllByOwnerAndTrashedFalseOrderByFullPathAsc(String owner);

    List<FolderType> findAllByOwnerAndTrashedTrueOrderByUpdatedAtDesc(String owner);

    Optional<FolderType> findByFullPathAndOwner(String fullPath, String owner);

    Optional<FolderType> findByIdAndOwner(Long id, String owner);

    Optional<FolderType> findByIdAndOwnerAndTrashedFalse(Long id, String owner);

    List<FolderType> findAllByOwnerAndParentPathAndTrashedFalseOrderByNameAsc(String owner, String parentPath);

    List<FolderType> findAllByOwnerAndDepthAndTrashedFalseOrderByNameAsc(String owner, int depth);

    boolean existsByFullPathAndOwnerAndTrashedFalse(String fullPath, String owner);

    boolean existsByFullPathAndOwnerAndTrashedTrue(String fullPath, String owner);

    @Query("SELECT f FROM FolderType f WHERE f.owner = :owner AND (f.fullPath = :rootPath OR f.fullPath LIKE CONCAT(:rootPath, '/%')) ORDER BY f.fullPath ASC")
    List<FolderType> findSubtreeByOwnerAndFullPathPrefix(@Param("owner") String owner, @Param("rootPath") String rootPath);

    @Query("SELECT f FROM FolderType f WHERE f.owner = :owner AND f.trashed = true AND (f.fullPath = :rootPath OR f.fullPath LIKE CONCAT(:rootPath, '/%')) ORDER BY f.fullPath ASC")
    List<FolderType> findTrashedSubtreeByOwnerAndFullPathPrefix(@Param("owner") String owner, @Param("rootPath") String rootPath);

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
