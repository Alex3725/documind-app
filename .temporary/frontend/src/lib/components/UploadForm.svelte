<script lang="ts">
  /**
   * UploadForm.svelte
   *
   * Componente per il caricamento di documenti.
   * Invia il file a un backend per l'analisi e notifica il genitore
   * del risultato.
   *
   * Props:
   * - onAdd: callback chiamata con i dati analizzati del documento.
   * - maxFileSize: dimensione massima file in MB (default: 10MB)
   */

  // ============================================================================
  // TYPE DEFINITIONS
  // ============================================================================

  // Questo tipo dovrebbe rispecchiare la risposta dell'API
  // Adattalo in base a cosa restituisce il tuo backend
  type AnalyzedDocument = {
    filename: string;
    extracted_data: Record<string, any>;
    // Aggiungi qui altri campi che il backend potrebbe restituire
  };

  // ============================================================================
  // PROPS & STATE
  // ============================================================================

  /** Callback per notificare l'aggiunta di un documento */
  export let onAdd: (doc: AnalyzedDocument) => void;

  /** Dimensione massima file in MB */
  export let maxFileSize: number = 10;

  // State del form
  let file: File | null = null;

  // State per errori e loading
  let error: string = '';
  let isLoading: boolean = false;

  // Endpoint del backend
  const API_ENDPOINT = 'http://localhost:5001/api/analyze';

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  /**
   * Gestisce la selezione del file dall'input.
   * Valida la dimensione prima di accettare il file.
   */
  function onFileChange(e: Event) {
    error = '';
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0] || null;

    if (!selectedFile) {
      file = null;
      return;
    }

    // VALIDAZIONE: Dimensione file
    const maxBytes = maxFileSize * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      error = `File troppo grande. Massimo ${maxFileSize}MB consentiti.`;
      input.value = '';
      file = null;
      return;
    }

    file = selectedFile;
  }

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  /**
   * Gestisce l'invio del form.
   * Invia il file al backend usando FormData.
   */
  async function onSubmit(e: Event) {
    e.preventDefault();
    error = '';

    if (!file) {
      error = 'Seleziona un file da caricare';
      return;
    }

    isLoading = true;

    // Usa FormData per inviare il file
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Errore di comunicazione con il server' }));
        throw new Error(errorData.error || `Errore HTTP ${response.status}`);
      }

      const analyzedData: AnalyzedDocument = await response.json();

      // Chiama callback del parent con i dati dal backend
      onAdd(analyzedData);

      // Reset form
      resetForm();

    } catch (err) {
      console.error("Errore durante l'upload:", err);
      error = err instanceof Error ? err.message : 'Errore sconosciuto durante l\'upload';
    } finally {
      isLoading = false;
    }
  }

  /**
   * Resetta il form allo stato iniziale.
   */
  function resetForm() {
    file = null;
    error = '';

    const input = document.getElementById('file-input') as HTMLInputElement | null;
    if (input) input.value = '';
  }
</script>

<!-- ========================================================================== -->
<!-- TEMPLATE -->
<!-- ========================================================================== -->

<form on:submit={onSubmit} class="flex flex-col space-y-4">

  <!-- Messaggio di errore -->
  {#if error}
    <div class="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
      ⚠️ {error}
    </div>
  {/if}

  <!-- Campo File -->
  <div class="flex flex-col space-y-1">
    <label for="file-input" class="text-sm font-medium text-gray-700">
      Seleziona un documento da analizzare
      <span class="text-xs text-gray-500">(Max {maxFileSize}MB)</span>
    </label>
    <input
      id="file-input"
      type="file"
      on:change={onFileChange}
      required
      disabled={isLoading}
      class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50
             file:mr-4 file:py-2 file:px-4
             file:rounded-md file:border-0
             file:text-sm file:font-semibold
             file:bg-blue-50 file:text-blue-700
             hover:file:bg-blue-100
             disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>

  <!-- Bottone Submit -->
  <div class="mt-2">
    <button
      type="submit"
      disabled={isLoading || !file}
      class="w-full py-2.5 px-4 bg-blue-600 text-white font-medium text-base rounded-md
             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
             disabled:bg-gray-400 disabled:cursor-not-allowed
             relative transition-colors duration-200"
      class:loading={isLoading}
    >
      {#if isLoading}
        <span class="flex items-center justify-center">
          Analisi in corso...
          <span class="animate-spin ml-2">⏳</span>
        </span>
      {:else}
        Analizza documento
      {/if}
    </button>
  </div>

</form>