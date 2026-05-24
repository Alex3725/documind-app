package com.example.documind.entities.folders;

import com.example.documind.dto.requests.FolderTypeCreateRequest;
import com.example.documind.dto.responses.FolderTypeResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FolderTypeController — API REST per la gestione delle cartelle semantiche.
 *
 * Le cartelle in DocuMind sono TIPI semantici. La loro descrizione
 * viene usata dall'AI per classificare i file.
 *
 * Endpoints:
 * GET    /api/v1/folders              → lista tutte le cartelle
 * GET    /api/v1/folders/root         → solo cartelle radice
 * GET    /api/v1/folders/children     → figli di una cartella
 * POST   /api/v1/folders              → crea nuova cartella
 * PATCH  /api/v1/folders/{id}         → aggiorna cartella
 * DELETE /api/v1/folders/{id}         → elimina cartella
 * POST   /api/v1/folders/seed/{profile} → crea struttura da profilo
 * GET    /api/v1/folders/ai-context   → contesto per l'AI
 */
@RestController
@RequestMapping("/api/v1/folders")
public class FolderTypeController {

    private final FolderTypeService folderTypeService;

    public FolderTypeController(FolderTypeService folderTypeService) {
        this.folderTypeService = folderTypeService;
    }

    @GetMapping
    public ResponseEntity<List<FolderTypeResponse>> listFolders(
            @CookieValue(name = "authentication-token", required = false) String token
    ) {
        return ResponseEntity.ok(folderTypeService.listFolders(token));
    }

    @GetMapping("/root")
    public ResponseEntity<List<FolderTypeResponse>> getRootFolders(
            @CookieValue(name = "authentication-token", required = false) String token
    ) {
        return ResponseEntity.ok(folderTypeService.getRootFolders(token));
    }

    @GetMapping("/children")
    public ResponseEntity<List<FolderTypeResponse>> getChildren(
            @CookieValue(name = "authentication-token", required = false) String token,
            @RequestParam String parentPath
    ) {
        return ResponseEntity.ok(folderTypeService.getChildren(token, parentPath));
    }

    @PostMapping
    public ResponseEntity<FolderTypeResponse> createFolder(
            @CookieValue(name = "authentication-token", required = false) String token,
            @RequestBody FolderTypeCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(folderTypeService.createFolder(token, request));
    }

    @PatchMapping("/{folderId}")
    public ResponseEntity<FolderTypeResponse> updateFolder(
            @CookieValue(name = "authentication-token", required = false) String token,
            @PathVariable Long folderId,
            @RequestBody FolderTypeCreateRequest request
    ) {
        return ResponseEntity.ok(folderTypeService.updateFolder(token, folderId, request));
    }

    @DeleteMapping("/{folderId}")
    public ResponseEntity<Void> deleteFolder(
            @CookieValue(name = "authentication-token", required = false) String token,
            @PathVariable Long folderId
    ) {
        folderTypeService.deleteFolder(token, folderId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Crea struttura cartelle da profilo predefinito.
     * Profili disponibili: developer, designer, student, business, default
     */
    @PostMapping("/seed/{profile}")
    public ResponseEntity<List<FolderTypeResponse>> seedProfile(
            @CookieValue(name = "authentication-token", required = false) String token,
            @PathVariable String profile
    ) {
        List<FolderTypeResponse> created = folderTypeService.seedProfile(token, profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Restituisce il contesto di tipo per l'AI.
     * Formato: { "percorso_cartella": "descrizione semantica" }
     * Usato dal backend per arricchire il prompt dell'AI con i tipi utente.
     */
    @GetMapping("/ai-context")
    public ResponseEntity<Map<String, String>> getAIContext(
            @CookieValue(name = "authentication-token", required = false) String token
    ) {
        String owner = folderTypeService.resolveOwner(token);
        Map<String, String> context = folderTypeService.buildAITypeDescriptions(owner);
        return ResponseEntity.ok(context);
    }
}
