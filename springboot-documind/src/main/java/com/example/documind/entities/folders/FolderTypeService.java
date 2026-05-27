package com.example.documind.entities.folders;

import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.dto.requests.FolderRelocateRequest;
import com.example.documind.dto.requests.FolderTypeCreateRequest;
import com.example.documind.dto.responses.FolderTypeResponse;
import com.example.documind.security.tokens.Token;
import com.example.documind.security.tokens.TokenRepository;
import com.example.documind.security.tokens.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * FolderTypeService — Gestione delle cartelle semantiche.
 *
 * Le cartelle in DocuMind sono TIPI semantici: la loro descrizione
 * viene inviata all'AI per migliorare la classificazione dei file.
 *
 * Funzionalità:
 * - CRUD cartelle utente
 * - Seeding profili (Developer, Designer, ecc.)
 * - Costruzione contesto per classificazione AI
 */
@Service
public class FolderTypeService {

    private static final Logger logger = LoggerFactory.getLogger(FolderTypeService.class);

    private static final Pattern REFERENCE_PATTERN = Pattern.compile("\\[\\[(folder|tag):([^\\]]+)\\]\\]", Pattern.CASE_INSENSITIVE);

    private final FolderTypeRepository folderTypeRepository;
    private final TokenRepository tokenRepository;
    private final TokenService tokenService;

    public FolderTypeService(
            FolderTypeRepository folderTypeRepository,
            TokenRepository tokenRepository,
            TokenService tokenService
    ) {
        this.folderTypeRepository = folderTypeRepository;
        this.tokenRepository = tokenRepository;
        this.tokenService = tokenService;
    }

    // =====================================================
    // CRUD CARTELLE
    // =====================================================

    @Transactional
    public FolderTypeResponse createFolder(String token, FolderTypeCreateRequest request) {
        String owner = requireOwner(token);
        validateRequest(request);

        String fullPath = buildFullPath(request);
        if (folderTypeRepository.existsByFullPathAndOwnerAndTrashedFalse(fullPath, owner)) {
            throw new CustomException(HttpStatus.CONFLICT, "FOLDER_EXISTS",
                    "Esiste già una cartella con questo percorso: " + fullPath);
        }

        FolderType folder = new FolderType();
        folder.setOwner(owner);
        folder.setName(request.getName().trim());
        folder.setFullPath(fullPath);
        folder.setParentPath(request.getParentPath());
        folder.setDescription(request.getDescription());
        folder.setSemanticRules(request.getSemanticRules());
        folder.setIcon(request.getIcon() != null ? request.getIcon() : "📁");
        folder.setColor(request.getColor() != null ? request.getColor() : "#6b7280");
        folder.setAutoTags(request.getAutoTags() != null ? request.getAutoTags() : new ArrayList<>());
        folder.setAutoUpdateType(request.getAutoUpdateType() != null && request.getAutoUpdateType());
        folder.setTrashed(false);
        folder.setTrashedAt(null);

        FolderType saved = folderTypeRepository.save(folder);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FolderTypeResponse> listFolders(String token) {
        String owner = requireOwner(token);
        return folderTypeRepository.findAllByOwnerAndTrashedFalseOrderByFullPathAsc(owner)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FolderTypeResponse> listTrashedFolders(String token) {
        String owner = requireOwner(token);
        return folderTypeRepository.findAllByOwnerAndTrashedTrueOrderByUpdatedAtDesc(owner)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FolderTypeResponse> getRootFolders(String token) {
        String owner = requireOwner(token);
        return folderTypeRepository.findAllByOwnerAndDepthAndTrashedFalseOrderByNameAsc(owner, 0)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FolderTypeResponse> getChildren(String token, String parentPath) {
        String owner = requireOwner(token);
        return folderTypeRepository.findAllByOwnerAndParentPathAndTrashedFalseOrderByNameAsc(owner, parentPath)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FolderTypeResponse updateFolder(String token, Long folderId, FolderTypeCreateRequest request) {
        String owner = requireOwner(token);
        FolderType folder = folderTypeRepository.findByIdAndOwner(folderId, owner)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FOLDER_NOT_FOUND",
                        "Cartella non trovata."));

        if (folder.isSystem()) {
            throw new CustomException(HttpStatus.FORBIDDEN, "FOLDER_SYSTEM",
                    "Non è possibile modificare cartelle di sistema.");
        }
        if (folder.isTrashed()) {
            throw new CustomException(HttpStatus.CONFLICT, "FOLDER_TRASHED",
                "Ripristina la cartella dal cestino prima di modificarla.");
        }

        if (StringUtils.hasText(request.getName())) {
            folder.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            folder.setDescription(request.getDescription());
        }
        if (request.getSemanticRules() != null) {
            folder.setSemanticRules(request.getSemanticRules());
        }
        if (request.getIcon() != null) {
            folder.setIcon(request.getIcon());
        }
        if (request.getColor() != null) {
            folder.setColor(request.getColor());
        }
        if (request.getAutoTags() != null) {
            folder.setAutoTags(request.getAutoTags());
        }
        if (request.getAutoUpdateType() != null) {
            folder.setAutoUpdateType(request.getAutoUpdateType());
        }

        FolderType saved = folderTypeRepository.save(folder);
        return toResponse(saved);
    }

    @Transactional
    public void deleteFolder(String token, Long folderId) {
        String owner = requireOwner(token);
        FolderType folder = folderTypeRepository.findByIdAndOwner(folderId, owner)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FOLDER_NOT_FOUND",
                        "Cartella non trovata."));

        if (folder.isSystem()) {
            throw new CustomException(HttpStatus.FORBIDDEN, "FOLDER_SYSTEM",
                    "Non è possibile eliminare cartelle di sistema.");
        }

        logger.info("Deleting folder request: owner={}, folderId={}, fullPath={}, parentPath={}",
            owner, folderId, folder.getFullPath(), folder.getParentPath());
        trashSubtree(owner, folder.getFullPath());
    }

    @Transactional
    public FolderTypeResponse restoreFolder(String token, Long folderId) {
        String owner = requireOwner(token);
        FolderType folder = folderTypeRepository.findByIdAndOwner(folderId, owner)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FOLDER_NOT_FOUND",
                        "Cartella non trovata."));

        if (!folder.isTrashed()) {
            return toResponse(folder);
        }

        restoreSubtree(owner, folder.getFullPath());
        return toResponse(folderTypeRepository.findByIdAndOwner(folderId, owner).orElseThrow());
    }

    @Transactional
    public FolderTypeResponse moveFolder(String token, Long folderId, FolderRelocateRequest request) {
        return relocateFolder(token, folderId, request, false);
    }

    @Transactional
    public FolderTypeResponse copyFolder(String token, Long folderId, FolderRelocateRequest request) {
        return relocateFolder(token, folderId, request, true);
    }

    private FolderTypeResponse relocateFolder(String token, Long folderId, FolderRelocateRequest request, boolean copy) {
        String owner = requireOwner(token);
        FolderType folder = folderTypeRepository.findByIdAndOwner(folderId, owner)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FOLDER_NOT_FOUND",
                        "Cartella non trovata."));

        if (folder.isSystem()) {
            throw new CustomException(HttpStatus.FORBIDDEN, "FOLDER_SYSTEM",
                    "Non è possibile spostare o copiare cartelle di sistema.");
        }
        if (folder.isTrashed()) {
            throw new CustomException(HttpStatus.CONFLICT, "FOLDER_TRASHED",
                    "Ripristina la cartella dal cestino prima di spostarla o copiarla.");
        }

        String targetParentPath = request != null && StringUtils.hasText(request.getTargetParentPath())
                ? request.getTargetParentPath().trim()
                : null;
        String newName = request != null && StringUtils.hasText(request.getNewName())
                ? request.getNewName().trim()
                : folder.getName();

        String targetFullPath = buildTargetPath(targetParentPath, newName);
        if (folderTypeRepository.existsByFullPathAndOwnerAndTrashedFalse(targetFullPath, owner)) {
            throw new CustomException(HttpStatus.CONFLICT, "FOLDER_EXISTS",
                    "Esiste già una cartella attiva con questo percorso: " + targetFullPath);
        }

        if (!copy) {
            relocateSubtree(owner, folder, targetParentPath, newName);
            return toResponse(folderTypeRepository.findByIdAndOwner(folderId, owner).orElseThrow());
        }

        return duplicateSubtree(owner, folder, targetParentPath, newName);
    }

    private void trashSubtree(String owner, String rootPath) {
        List<FolderType> subtree = folderTypeRepository.findSubtreeByOwnerAndFullPathPrefix(owner, rootPath);
        logger.info("Trash subtree match: owner={}, rootPath={}, matchedCount={}, matchedPaths={}",
                owner,
                rootPath,
                subtree.size(),
                subtree.stream().map(FolderType::getFullPath).collect(Collectors.toList()));
        for (FolderType item : subtree) {
            item.setTrashed(true);
            item.setTrashedAt(java.time.LocalDateTime.now());
        }
        folderTypeRepository.saveAll(subtree);
    }

    private void restoreSubtree(String owner, String rootPath) {
        List<FolderType> subtree = folderTypeRepository.findTrashedSubtreeByOwnerAndFullPathPrefix(owner, rootPath);
        for (FolderType item : subtree) {
            if (folderTypeRepository.existsByFullPathAndOwnerAndTrashedFalse(item.getFullPath(), owner)) {
                throw new CustomException(HttpStatus.CONFLICT, "FOLDER_EXISTS",
                        "Non è possibile ripristinare perché esiste già una cartella attiva con percorso: " + item.getFullPath());
            }
            item.setTrashed(false);
            item.setTrashedAt(null);
        }
        folderTypeRepository.saveAll(subtree);
    }

    private void relocateSubtree(String owner, FolderType folder, String targetParentPath, String newName) {
        String sourcePrefix = folder.getFullPath();
        String targetPrefix = buildTargetPath(targetParentPath, newName);
        if (targetPrefix.startsWith(sourcePrefix + "/")) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Non puoi spostare una cartella dentro una sua sottocartella.");
        }

        List<FolderType> subtree = folderTypeRepository.findSubtreeByOwnerAndFullPathPrefix(owner, sourcePrefix);
        for (FolderType item : subtree) {
            String newFullPath = replacePrefix(item.getFullPath(), sourcePrefix, targetPrefix);
            if (!newFullPath.equals(item.getFullPath()) && folderTypeRepository.existsByFullPathAndOwnerAndTrashedFalse(newFullPath, owner)) {
                throw new CustomException(HttpStatus.CONFLICT, "FOLDER_EXISTS",
                        "Esiste già una cartella attiva con percorso: " + newFullPath);
            }
        }

        for (FolderType item : subtree) {
            String newFullPath = replacePrefix(item.getFullPath(), sourcePrefix, targetPrefix);
            item.setFullPath(newFullPath);
            int lastSlash = newFullPath.lastIndexOf("/");
            item.setParentPath(lastSlash > 0 ? newFullPath.substring(0, lastSlash) : null);
            item.setName(extractName(newFullPath));
            item.setDepth(newFullPath.split("/").length - 1);
        }
        folderTypeRepository.saveAll(subtree);
    }

    private FolderTypeResponse duplicateSubtree(String owner, FolderType folder, String targetParentPath, String newName) {
        String sourcePrefix = folder.getFullPath();
        String targetPrefix = buildTargetPath(targetParentPath, newName);
        List<FolderType> subtree = folderTypeRepository.findSubtreeByOwnerAndFullPathPrefix(owner, sourcePrefix);
        List<FolderType> clones = new ArrayList<>();

        for (FolderType item : subtree) {
            FolderType clone = new FolderType();
            clone.setOwner(owner);
            clone.setName(item == folder ? newName : extractName(replacePrefix(item.getFullPath(), sourcePrefix, targetPrefix)));
            String newFullPath = replacePrefix(item.getFullPath(), sourcePrefix, targetPrefix);
            clone.setFullPath(newFullPath);
            int lastSlash = newFullPath.lastIndexOf("/");
            clone.setParentPath(lastSlash > 0 ? newFullPath.substring(0, lastSlash) : null);
            clone.setDescription(item.getDescription());
            clone.setSemanticRules(item.getSemanticRules());
            clone.setIcon(item.getIcon());
            clone.setColor(item.getColor());
            clone.setAutoTags(item.getAutoTags() == null ? new ArrayList<>() : new ArrayList<>(item.getAutoTags()));
            clone.setAutoUpdateType(item.isAutoUpdateType());
            clone.setSystem(false);
            clone.setTrashed(false);
            clone.setTrashedAt(null);
            clones.add(clone);
        }

        FolderType saved = folderTypeRepository.saveAll(clones).get(0);
        return toResponse(saved);
    }

    private String buildTargetPath(String targetParentPath, String name) {
        if (!StringUtils.hasText(name)) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Il nome della cartella è obbligatorio.");
        }
        if (StringUtils.hasText(targetParentPath)) {
            return targetParentPath.trim() + "/" + name.trim();
        }
        return name.trim();
    }

    private String replacePrefix(String fullPath, String sourcePrefix, String targetPrefix) {
        if (fullPath.equals(sourcePrefix)) {
            return targetPrefix;
        }
        return targetPrefix + fullPath.substring(sourcePrefix.length());
    }

    private String extractName(String fullPath) {
        int idx = fullPath.lastIndexOf("/");
        return idx >= 0 ? fullPath.substring(idx + 1) : fullPath;
    }

    // =====================================================
    // CONTESTO AI — per classificazione gerarchica
    // =====================================================

    /**
     * Costruisce il dizionario di descrizioni cartelle da inviare all'AI Python.
     * Formato: { "fullPath": "descrizione + regole semantiche" }
     *
     * L'AI userà queste descrizioni nel prompt per capire dove classificare i file.
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, String> buildAITypeDescriptions(String owner) {
        List<FolderType> folders = folderTypeRepository.findAllByOwnerAndTrashedFalseOrderByFullPathAsc(owner);
        Map<String, FolderType> byFullPath = folders.stream()
                .filter(f -> StringUtils.hasText(f.getFullPath()))
                .collect(Collectors.toMap(
                        f -> normalizeKey(f.getFullPath()),
                        f -> f,
                        (a, b) -> a,
                        HashMap::new
                ));

        Map<String, FolderType> byTag = new HashMap<>();
        for (FolderType folder : folders) {
            if (StringUtils.hasText(folder.getName())) {
                byTag.putIfAbsent(normalizeKey(folder.getName()), folder);
            }
            if (folder.getAutoTags() != null) {
                for (String tag : folder.getAutoTags()) {
                    if (StringUtils.hasText(tag)) {
                        byTag.putIfAbsent(normalizeKey(tag), folder);
                    }
                }
            }
        }

        java.util.Map<String, String> result = new java.util.LinkedHashMap<>();
        for (FolderType folder : folders) {
            String enriched = buildEnrichedDescription(folder, byFullPath, byTag, new LinkedHashSet<>(), 0);
            if (StringUtils.hasText(enriched)) {
                result.put(folder.getFullPath(), enriched);
            }
        }
        return result;
    }

    private String buildEnrichedDescription(
            FolderType folder,
            Map<String, FolderType> byFullPath,
            Map<String, FolderType> byTag,
            Set<String> visited,
            int depth
    ) {
        if (folder == null || depth > 3) {
            return null;
        }

        String identityKey = normalizeKey(folder.getFullPath() != null ? folder.getFullPath() : folder.getName());
        if (!StringUtils.hasText(identityKey) || !visited.add(identityKey)) {
            return null;
        }

        StringBuilder builder = new StringBuilder();
        if (StringUtils.hasText(folder.getDescription())) {
            builder.append(folder.getDescription().trim());
        }
        if (StringUtils.hasText(folder.getSemanticRules())) {
            if (builder.length() > 0) {
                builder.append(" | ");
            }
            builder.append("Regole: ").append(folder.getSemanticRules().trim());
        }

        List<String> references = extractReferencedDescriptions(folder.getDescription(), byFullPath, byTag, visited, depth + 1);
        if (StringUtils.hasText(folder.getSemanticRules())) {
            references.addAll(extractReferencedDescriptions(folder.getSemanticRules(), byFullPath, byTag, visited, depth + 1));
        }

        if (!references.isEmpty()) {
            builder.append(" | Riferimenti: ");
            builder.append(String.join(" || ", references));
        }

        return builder.toString().trim();
    }

    private List<String> extractReferencedDescriptions(
            String text,
            Map<String, FolderType> byFullPath,
            Map<String, FolderType> byTag,
            Set<String> visited,
            int depth
    ) {
        if (!StringUtils.hasText(text) || depth > 3) {
            return List.of();
        }

        List<String> references = new ArrayList<>();
        Matcher matcher = REFERENCE_PATTERN.matcher(text);
        while (matcher.find()) {
            String kind = matcher.group(1);
            String target = matcher.group(2).trim();
            FolderType referenced = resolveReference(kind, target, byFullPath, byTag);
            if (referenced == null) {
                continue;
            }

            String refKey = normalizeKey(referenced.getFullPath() != null ? referenced.getFullPath() : referenced.getName());
            if (!StringUtils.hasText(refKey) || visited.contains(refKey)) {
                continue;
            }

            String resolved = buildEnrichedDescription(referenced, byFullPath, byTag, new LinkedHashSet<>(visited), depth);
            if (StringUtils.hasText(resolved)) {
                references.add("[" + referenced.getFullPath() + "] " + resolved);
            }
        }
        return references;
    }

    private FolderType resolveReference(String kind, String target, Map<String, FolderType> byFullPath, Map<String, FolderType> byTag) {
        if (!StringUtils.hasText(target)) {
            return null;
        }

        if ("folder".equalsIgnoreCase(kind)) {
            FolderType byPath = byFullPath.get(normalizeKey(target));
            if (byPath != null) {
                return byPath;
            }
        }

        FolderType byNameOrTag = byTag.get(normalizeKey(target));
        if (byNameOrTag != null) {
            return byNameOrTag;
        }

        return byFullPath.get(normalizeKey(target));
    }

    private String normalizeKey(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim().toLowerCase();
    }

    // =====================================================
    // SEEDING PROFILI UTENTE
    // =====================================================

    /**
     * Crea la struttura di cartelle per un profilo predefinito.
     * Chiamato durante l'onboarding.
     */
    @Transactional
    public List<FolderTypeResponse> seedProfile(String token, String profileName) {
        String owner = requireOwner(token);
        List<FolderType> foldersToCreate = getProfileFolders(profileName, owner);
        List<FolderTypeResponse> created = new ArrayList<>();

        for (FolderType folder : foldersToCreate) {
            if (!folderTypeRepository.existsByFullPathAndOwnerAndTrashedFalse(folder.getFullPath(), owner)) {
                FolderType saved = folderTypeRepository.save(folder);
                created.add(toResponse(saved));
            }
        }

        // Crea sempre le cartelle di sistema
        createSystemFolders(owner);
        return created;
    }

    private void createSystemFolders(String owner) {
        List<FolderType> systemFolders = List.of(
            createSystemFolder("Non classificati", "Non classificati", owner,
                "File con bassa confidenza AI che richiedono classificazione manuale", "🗂️", "#9ca3af"),
            createSystemFolder("Tutti i file", "Tutti i file", owner,
                "Vista aggregata di tutti i file", "📂", "#6b7280")
        );
        for (FolderType sf : systemFolders) {
            if (!folderTypeRepository.existsByFullPathAndOwnerAndTrashedFalse(sf.getFullPath(), owner)) {
                folderTypeRepository.save(sf);
            }
        }
    }

    private FolderType createSystemFolder(String name, String fullPath, String owner,
                                           String description, String icon, String color) {
        FolderType f = new FolderType(name, fullPath, description, owner, icon, color);
        f.setSystem(true);
        return f;
    }

    /**
     * Definizioni profili predefiniti.
     * Ogni profilo crea una struttura gerarchica di cartelle con
     * descrizioni semantiche per l'AI.
     */
    private List<FolderType> getProfileFolders(String profileName, String owner) {
        return switch (profileName.toLowerCase()) {
            case "developer" -> List.of(
                new FolderType("Lavoro", "Lavoro",
                    "Documenti e file di lavoro professionali", owner, "💼", "#1b6f5c"),
                new FolderType("Codice", "Lavoro/Codice",
                    "File di codice sorgente, script, configurazioni: Java, Python, JavaScript, TypeScript, Shell, YAML, JSON config",
                    owner, "💻", "#0891b2"),
                new FolderType("Java", "Lavoro/Codice/Java",
                    "File Java: classi, interfacce, Spring Boot, Maven pom.xml, file .java", owner, "☕", "#f97316"),
                new FolderType("JavaScript/TypeScript", "Lavoro/Codice/JS",
                    "File JavaScript e TypeScript: React, Node.js, Next.js, file .js/.ts/.tsx", owner, "🟡", "#eab308"),
                new FolderType("Python", "Lavoro/Codice/Python",
                    "Script Python: .py, Jupyter notebook, requirements.txt, setup.py", owner, "🐍", "#22c55e"),
                new FolderType("Configurazioni", "Lavoro/Codice/Config",
                    "File di configurazione: YAML, TOML, INI, .env, docker-compose, Dockerfile", owner, "⚙️", "#64748b"),
                new FolderType("Note", "Lavoro/Note",
                    "Appunti di sviluppo, TODO list, brainstorming, note tecniche informali", owner, "📝", "#a855f7"),
                new FolderType("Corsi", "Lavoro/Corsi",
                    "Materiale di formazione: tutorial, guide, esercizi, dispense di corsi tecnici", owner, "📚", "#3b82f6"),
                new FolderType("Progetti", "Lavoro/Progetti",
                    "Documentazione di progetto: specifiche, architettura, roadmap, meeting notes", owner, "🚀", "#ec4899"),
                new FolderType("Documenti", "Documenti",
                    "Documenti formali generici: fatture, contratti, ricevute, PDF", owner, "📄", "#f59e0b"),
                new FolderType("Bozze", "Bozze",
                    "Bozze e draft non ancora completati o categorizzati", owner, "✏️", "#9ca3af")
            );

            case "designer" -> List.of(
                new FolderType("Progetti Design", "Progetti Design",
                    "File di design: mockup, wireframe, prototipi, asset grafici", owner, "🎨", "#ec4899"),
                new FolderType("Brief", "Progetti Design/Brief",
                    "Brief di progetto, requisiti del cliente, specifiche di design", owner, "📋", "#8b5cf6"),
                new FolderType("Risorse", "Progetti Design/Risorse",
                    "Font, palette colori, icone, librerie di asset", owner, "🎭", "#06b6d4"),
                new FolderType("Lavoro", "Lavoro",
                    "Documenti professionali: contratti, fatture, preventivi", owner, "💼", "#1b6f5c"),
                new FolderType("Ispirazione", "Ispirazione",
                    "Riferimenti visivi, mood board, screenshot, articoli di design", owner, "✨", "#f59e0b")
            );

            case "student" -> List.of(
                new FolderType("Studio", "Studio",
                    "Materiale di studio universitario e scolastico", owner, "🎓", "#3b82f6"),
                new FolderType("Appunti", "Studio/Appunti",
                    "Appunti di lezione, note manoscritte digitalizzate, riassunti", owner, "📝", "#10b981"),
                new FolderType("Guide", "Studio/Guide",
                    "Libri di testo, dispense, tutorial, materiale didattico ufficiale", owner, "📖", "#6366f1"),
                new FolderType("Esercizi", "Studio/Esercizi",
                    "Compiti svolti, esercitazioni, soluzioni di problemi", owner, "✏️", "#f59e0b"),
                new FolderType("Relazioni", "Studio/Relazioni",
                    "Relazioni, tesine, elaborati da consegnare", owner, "📃", "#ef4444"),
                new FolderType("Personale", "Personale",
                    "Documenti personali: documenti d'identità, ricevute, note private", owner, "👤", "#64748b")
            );

            case "business" -> List.of(
                new FolderType("Fatture", "Fatture",
                    "Fatture emesse e ricevute, note di credito, documenti fiscali con importi IVA e partita IVA",
                    owner, "🧾", "#16a34a"),
                new FolderType("Contratti", "Contratti",
                    "Contratti, accordi, NDA, convenzioni, documenti legali con clausole e firme",
                    owner, "⚖️", "#7c3aed"),
                new FolderType("Report", "Report",
                    "Report aziendali, analisi, presentazioni di risultati, dashboard", owner, "📊", "#0284c7"),
                new FolderType("Comunicazioni", "Comunicazioni",
                    "Email importanti, lettere formali, verbali di riunione", owner, "📧", "#d97706"),
                new FolderType("HR", "HR",
                    "Documenti risorse umane: CV, contratti di lavoro, buste paga, valutazioni",
                    owner, "👥", "#db2777")
            );

            default -> List.of(
                new FolderType("Documenti", "Documenti",
                    "Documenti generici: PDF, Word, testi formali", owner, "📄", "#6b7280"),
                new FolderType("Personale", "Personale",
                    "Documenti personali privati", owner, "👤", "#db2777"),
                new FolderType("Lavoro", "Lavoro",
                    "Documenti e file di lavoro", owner, "💼", "#1b6f5c"),
                new FolderType("Note", "Note",
                    "Appunti e note informali", owner, "📝", "#a855f7")
            );
        };
    }

    // =====================================================
    // HELPER
    // =====================================================

    private String buildFullPath(FolderTypeCreateRequest request) {
        if (StringUtils.hasText(request.getFullPath())) {
            return request.getFullPath().trim();
        }
        if (StringUtils.hasText(request.getParentPath())) {
            return request.getParentPath().trim() + "/" + request.getName().trim();
        }
        return request.getName().trim();
    }

    private void validateRequest(FolderTypeCreateRequest request) {
        if (request == null || !StringUtils.hasText(request.getName())) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Il nome della cartella è obbligatorio.");
        }
        if (request.getName().contains("/") && !StringUtils.hasText(request.getFullPath())) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Il nome non può contenere '/'. Usa fullPath per percorsi gerarchici.");
        }
    }

    private FolderTypeResponse toResponse(FolderType folder) {
        FolderTypeResponse r = new FolderTypeResponse();
        r.setId(folder.getId());
        r.setName(folder.getName());
        r.setFullPath(folder.getFullPath());
        r.setParentPath(folder.getParentPath());
        r.setDescription(folder.getDescription());
        r.setSemanticRules(folder.getSemanticRules());
        r.setIcon(folder.getIcon());
        r.setColor(folder.getColor());
        r.setAutoTags(folder.getAutoTags() == null ? List.of() : new ArrayList<>(folder.getAutoTags()));
        r.setAutoUpdateType(folder.isAutoUpdateType());
        r.setSystem(folder.isSystem());
        r.setTrashed(folder.isTrashed());
        r.setTrashedAt(folder.getTrashedAt());
        r.setFileCount(folder.getFileCount());
        r.setDepth(folder.getDepth());
        r.setCreatedAt(folder.getCreatedAt());
        r.setUpdatedAt(folder.getUpdatedAt());
        return r;
    }

    private String requireOwner(String token) {
        if (!StringUtils.hasText(token)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION",
                    "Sessione non valida o scaduta.");
        }
        Optional<Token> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty() || !tokenService.isValidToken(token)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION",
                    "Sessione non valida o scaduta.");
        }
        var user = tokenOpt.get().getUser();
        if (user == null || !StringUtils.hasText(user.getEmail())) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION",
                    "Utente non trovato.");
        }
        return user.getEmail();
    }

    public String resolveOwner(String token) {
        return requireOwner(token);
    }
}
