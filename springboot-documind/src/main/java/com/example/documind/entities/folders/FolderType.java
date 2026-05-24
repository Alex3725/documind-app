package com.example.documind.entities.folders;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * FolderType — Cartella semantica dell'utente.
 * Nel sistema DocuMind, le cartelle NON sono semplici directory:
 * rappresentano TIPI semantici che l'AI usa per classificare i file.
 *
 * Ogni cartella ha:
 * - name: nome della cartella/tipo
 * - description: cosa contiene (usata dall'AI per classificare)
 * - semanticRules: regole semantiche dettagliate per l'AI
 * - parentPath: percorso gerarchico (es. "Lavoro/Codice")
 * - owner: utente proprietario
 */
@Entity
@Table(
    name = "folder_types",
    uniqueConstraints = @UniqueConstraint(columnNames = {"owner", "full_path"})
)
@NoArgsConstructor
@Getter
@Setter
public class FolderType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nome della cartella (es. "Fatture") */
    @Column(nullable = false)
    private String name;

    /**
     * Descrizione semantica — USATA DALL'AI per classificare.
     * Esempio: "Contiene fatture commerciali, ricevute di pagamento,
     * documenti con importi IVA e partita IVA"
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Regole semantiche aggiuntive per l'AI.
     * Esempio: "Esclude ricevute personali. Include solo documenti B2B.
     * Formato atteso: PDF con intestazione aziendale."
     */
    @Column(name = "semantic_rules", columnDefinition = "TEXT")
    private String semanticRules;

    /**
     * Percorso completo (es. "Lavoro/Documenti/Fatture")
     * Permette struttura gerarchica.
     */
    @Column(name = "full_path", nullable = false)
    private String fullPath;

    /**
     * Percorso del padre (es. "Lavoro/Documenti")
     * NULL se cartella radice.
     */
    @Column(name = "parent_path")
    private String parentPath;

    /** Profondità nel tree (0 = root) */
    private int depth = 0;

    /** Icona emoji per l'UI */
    private String icon = "📁";

    /** Colore hex per l'UI */
    private String color = "#6b7280";

    /**
     * Tag automatici da assegnare ai file in questa cartella.
     * Quando un file viene spostato qui, riceve questi tag.
     */
    @ElementCollection
    @CollectionTable(
        name = "folder_auto_tags",
        joinColumns = @JoinColumn(name = "folder_id")
    )
    @Column(name = "tag")
    private List<String> autoTags;

    /**
     * Se true, quando un file viene spostato in questa cartella
     * il tipo viene aggiornato automaticamente.
     */
    @Column(name = "auto_update_type")
    private boolean autoUpdateType = true;

    /** Utente proprietario */
    @Column(nullable = false)
    private String owner;

    /**
     * Cartella di sistema (non cancellabile dall'utente).
     * Esempi: "Non classificati", "Tutti i file"
     */
    @Column(name = "is_system")
    private boolean system = false;

    /** Numero di file nella cartella (cache) */
    @Column(name = "file_count")
    private int fileCount = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
        // Calcola depth dal fullPath
        if (fullPath != null) {
            depth = fullPath.split("/").length - 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Costruttore rapido per seeding */
    public FolderType(String name, String fullPath, String description,
                      String owner, String icon, String color) {
        this.name = name;
        this.fullPath = fullPath;
        this.description = description;
        this.owner = owner;
        this.icon = icon;
        this.color = color;

        // Calcola parentPath
        int lastSlash = fullPath.lastIndexOf("/");
        if (lastSlash > 0) {
            this.parentPath = fullPath.substring(0, lastSlash);
        }
    }
}
