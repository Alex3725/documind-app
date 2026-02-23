<script lang="ts">
  /**
   * DocumentCard.svelte
   *
   * Visualizza una card con i dati estratti di un singolo documento.
   */

  // ============================================================================
  // TYPE DEFINITIONS
  // ============================================================================

  /**
   * Struttura del documento, allineata con quella definita in +page.svelte
   */
  type DocumentData = {
    id: string;
    name: string;
    uploadedAt: string;
    extracted_data: {
      tipo_documento?: string;
      data_documento?: string;
      soggetti_coinvolti?: string[];
      descrizione_breve?: string;
    };
  };

  // ============================================================================
  // PROPS
  // ============================================================================

  export let doc: DocumentData;
  export let onDelete: (id: string) => void;
  export let readonly: boolean = false;

  // ============================================================================
  // STATE
  // ============================================================================

  let isProcessing: boolean = false;
  let error: string = '';

  // ============================================================================
  // ACTIONS HANDLERS
  // ============================================================================

  /**
   * Richiede la conferma ed elimina il documento dalla lista (client-side).
   */
  function remove() {
    if (confirm(`Sei sicuro di voler eliminare "${doc.name}"?`)) {
      try {
        isProcessing = true;
        onDelete(doc.id);
      } catch (err) {
        console.error("Errore durante l'eliminazione:", err);
        error = "Impossibile eliminare il documento.";
      } finally {
        isProcessing = false;
      }
    }
  }

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  /** Formatta la data del documento, se presente */
  $: formattedDate = doc.extracted_data.data_documento
    ? new Date(doc.extracted_data.data_documento).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : null;

  /** Crea una stringa di metadati principali per una visualizzazione rapida */
  $: metadataInfo = [
    doc.extracted_data.tipo_documento,
    (doc.extracted_data.soggetti_coinvolti || []).join(', '),
    formattedDate
  ].filter(Boolean).join(' • ');

</script>

<!-- ========================================================================== -->
<!-- TEMPLATE -->
<!-- ========================================================================== -->

<div class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg mb-3 bg-white transition-all duration-200 relative overflow-hidden
            hover:border-blue-400 hover:shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-opacity-75
            flex-col sm:flex-row sm:items-center">

  <!-- Icona tipo documento (opzionale) -->
  <div class="flex-shrink-0 text-xl bg-blue-50 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
    {#if doc.extracted_data.tipo_documento?.toLowerCase() === 'fattura'}
      🧾
    {:else if doc.extracted_data.tipo_documento?.toLowerCase() === 'contratto'}
      ✍️
    {:else}
      📄
    {/if}
  </div>

  <!-- Colonna Metadati -->
  <div class="flex-1 min-w-0 flex flex-col gap-1 sm:text-left text-center">
    <div class="font-semibold text-base text-gray-800 truncate" title={doc.name}>
      {doc.name}
    </div>

    {#if metadataInfo}
      <div class="text-sm text-gray-600">
        {metadataInfo}
      </div>
    {/if}

    {#if doc.extracted_data.descrizione_breve}
      <div class="text-sm text-gray-700 mt-1 italic">
        {doc.extracted_data.descrizione_breve}
      </div>
    {/if}
  </div>

  <!-- Colonna Azioni -->
  <div class="flex gap-2 flex-shrink-0 sm:mt-0 mt-3">
    <button
      class="px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed opacity-50
             transition-colors duration-200"
      disabled={true}
      title="Funzione non disponibile in questa versione"
    >
      👁️ Vedi
    </button>

    <button
      class="px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed opacity-50
             transition-colors duration-200"
      disabled={true}
      title="Funzione non disponibile in questa versione"
    >
      ⬇️ Scarica
    </button>

    {#if !readonly}
      <button
        class="px-3 py-2 text-sm border border-red-300 rounded-md bg-red-50 text-red-600
               hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed
               transition-colors duration-200"
        on:click={remove}
        disabled={isProcessing}
        title="Elimina documento"
      >
        🗑️ Elimina
      </button>
    {/if}
  </div>

  {#if error}
    <div class="absolute bottom-1 right-1 text-xs text-red-700 bg-red-100 p-1 rounded-md">
      ⚠️ {error}
    </div>
  {/if}

</div>