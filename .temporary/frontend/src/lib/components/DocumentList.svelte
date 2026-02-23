<script lang="ts">
/**
 * DocumentList.svelte
 *
 * Componente per visualizzare una lista di documenti.
 * Gestisce stati: empty, loading, error.
 * Pattern Svelte 5: usa callback props per comunicare con il parent.
 *
 * Props:
 * - documents: array di documenti da visualizzare
 * - onDelete: callback per eliminazione documento
 * - isLoading: indica se i dati stanno caricando (opzionale)
 * - error: messaggio di errore da mostrare (opzionale)
 * - readonly: se true, passa readonly alle card (opzionale)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import DocumentCard from './DocumentCard.svelte';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Struttura del documento (deve corrispondere a quella in +page.svelte) */
type DocumentData = {
  id: string;
  name: string;
  uploadedAt: string;
  extracted_data: {
    tipo_documento?: string;
    data_documento?: string;
    soggetti_coinvolti?: string[];
    [key: string]: any; // Permette altri campi
  };
};

// ============================================================================
// PROPS
// ============================================================================

/** Array di documenti da visualizzare */
export let documents: DocumentData[] = [];

/** Callback per eliminazione documento */
export let onDelete: (id: string) => void;

/** Indica se i dati stanno caricando */
export let isLoading: boolean = false;

/** Messaggio di errore (se presente) */
export let error: string = '';

/** Modalità readonly (disabilita eliminazione) */
export let readonly: boolean = false;

/** Numero massimo di documenti da mostrare (0 = tutti) */
export let limit: number = 0;

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

/** Documenti da visualizzare (con limite se specificato) */
$: displayedDocuments = limit > 0
  ? documents.slice(0, limit)
  : documents;

/** Conta dei documenti nascosti dal limite */
$: hiddenCount = limit > 0 && documents.length > limit
  ? documents.length - limit
  : 0;

/** Flag: lista vuota */
$: isEmpty = documents.length === 0;

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Gestisce la richiesta di eliminazione da una card.
 * Propaga al parent tramite callback.
 */
function handleDelete(id: string) {
  onDelete(id);
}

</script>

<!-- ========================================================================== -->
<!-- TEMPLATE -->
<!-- ========================================================================== -->

<div class="w-full">

  <!-- STATO: Loading -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-600">
      <div class="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p>Caricamento documenti...</p>
    </div>

  <!-- STATO: Errore -->
  {:else if error}
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center text-red-700">
      <div class="text-5xl mb-2">⚠️</div>
      <p class="text-lg font-semibold mb-1">Si è verificato un errore</p>
      <p class="text-sm text-gray-600 max-w-md">{error}</p>
    </div>

  <!-- STATO: Lista vuota -->
  {:else if isEmpty}
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500">
      <div class="text-6xl mb-4 opacity-30">📄</div>
      <p class="text-xl font-semibold text-gray-600 mb-1">Nessun documento presente</p>
      <p class="text-base text-gray-500">
        Carica il tuo primo documento per iniziare
      </p>
    </div>

  <!-- STATO: Lista con documenti -->
  {:else}
    <div class="w-full">

      <!-- Header lista (opzionale, mostra conteggio) -->
      <div class="flex justify-between items-center mb-3 px-0.5 md:flex-row flex-col md:items-center items-start">
        <span class="text-sm font-medium text-gray-600">
          {documents.length} {documents.length === 1 ? 'documento' : 'documenti'}
        </span>
      </div>

      <!-- Cards documenti -->
      <div class="flex flex-col">
        {#each displayedDocuments as doc (doc.id)}
          <DocumentCard
            {doc}
            {readonly}
            onDelete={handleDelete}
          />
        {/each}
      </div>

      <!-- Indicatore documenti nascosti -->
      {#if hiddenCount > 0}
        <div class="text-center py-3 text-gray-600 text-sm italic border-t border-dashed border-gray-300 mt-2">
          + altri {hiddenCount} {hiddenCount === 1 ? 'documento' : 'documenti'}
        </div>
      {/if}

    </div>
  {/if}

</div>