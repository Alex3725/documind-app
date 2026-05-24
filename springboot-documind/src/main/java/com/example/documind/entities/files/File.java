package com.example.documind.entities.files;

import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSemanticType;
import com.example.documind.entities.files.type.FileSubType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


@Entity
@Table(name = "files")
@NoArgsConstructor
@Getter
@Setter
public class File {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //  Nome file
    private String name;

    // 📁 Dove sta realmente
    private String path;

    // 📂 Cartella logica del file nel workspace dell'utente
    @Column(name = "folder_path")
    private String folderPath;

    // 📂 Tipo tecnico
    @Enumerated(EnumType.STRING)
    private FileCategory category;

    @Enumerated(EnumType.STRING)
    private FileSubType subType;

    // 📄 MIME reale
    private String mimeType;

    // 📏 Dimensione
    private Long size;

    // 🔐 Identità unica
    @Column(unique = true)
    private String hash;

    // 🏷️ Tag
    @ElementCollection
    private List<String> tags;

    // 🧠 AI - tipo principale
    @Enumerated(EnumType.STRING)
    private FileSemanticType semanticType;

    // 📊 Confidenza AI
    private Double semanticConfidence;

    // 📈 Tutti gli score AI
    @ElementCollection
    @CollectionTable(
            name = "file_semantic_scores",
            joinColumns = @JoinColumn(name = "file_id")
    )
    @MapKeyEnumerated(EnumType.STRING)
    @Column(name = "score")
    private Map<FileSemanticType, Double> semanticScores;

    // 📅 Date
    private LocalDateTime uploadDate;
    private LocalDateTime lastAccess;
    private LocalDateTime lastModified;

    // 👤 opzionale
    private String owner;

    // 📍 IP dell'upload per audit (separato dall'owner)
    private String uploaderIp;

    // 🔑 Token dell'uploader (truncated per audit trail)
    private String uploaderToken;

    // ⚙️ flags utili
    private boolean compressed;
    private boolean encrypted;
}


