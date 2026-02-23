<script lang="ts">
  /**
   * +page.svelte
   *
   * Pagina principale dell'applicazione archivio documenti.
   * Gestisce lo stato dei documenti analizzati dal backend.
   */

  // ============================================================================
  // IMPORTS
  // ============================================================================

  import { onMount } from 'svelte';
  import { UploadForm, DocumentList, Filters } from '$lib';

  // ============================================================================
  // TYPE DEFINITIONS
  // ============================================================================

  /** Dati grezzi come arrivano dal backend */
  type AnalyzedData = {
    filename: string;
    extracted_data: {
      tipo_documento?: string;
      data_documento?: string;
      soggetti_coinvolti?: string[];
      descrizione_breve?: string;
      importi?: Record<string, any>;
      // Aggiungi altri campi estratti se necessario
    };
  };

  /** Struttura del documento usata nel frontend */
  type Doc = {
    id: string; // ID generato client-side per la UI
    name: string;
    uploadedAt: string;
    extracted_data: AnalyzedData['extracted_data'];
  };

  /** Struttura dei filtri */
  type FilterValues = {
    search: string;
    type: string;
  };

  // ============================================================================
  // STATE
  // ============================================================================

  /** Lista completa dei documenti */
  let documents: Doc[] = [];

  /** Lista filtrata visualizzata */
  let filtered: Doc[] = [];

  /** Filtri correnti */
  let filters: FilterValues = {
    search: '',
    type: '',
  };

  /** Flag: indica se c'è un errore nel caricamento iniziale */
  let loadingError: string = '';

  /** Flag: indica se i dati stanno caricando */
  let isLoading: boolean = false;

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * All'avvio, la lista di documenti è vuota.
   * In una versione futura, potremmo caricare documenti da un database.
   */
  onMount(() => {
    isLoading = false;
  });

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Aggiunge un nuovo documento alla lista dopo l'analisi del backend.
   * Callback chiamata da UploadForm.
   */
  function addDocument(analyzedDoc: AnalyzedData) {
    const newDoc: Doc = {
      id: `${Date.now()}-${Math.random()}`, // ID semplice per la UI
      name: analyzedDoc.filename,
      uploadedAt: new Date().toISOString(),
      extracted_data: analyzedDoc.extracted_data,
    };

    documents = [newDoc, ...documents];
    applyFilters(); // R-applica i filtri
  }

  /**
   * Elimina un documento dalla lista.
   * NOTA: Questa operazione è solo client-side.
   */
  function deleteDocument(id: string) {
    documents = documents.filter((d) => d.id !== id);
    applyFilters();
  }

  // ============================================================================
  // FILTERS & SEARCH
  // ============================================================================

  /**
   * Applica i filtri correnti alla lista documenti.
   */
  function applyFilters() {
    filtered = documents.filter((doc) => {
      // Costruisci una stringa di testo ricercabile dai dati estratti
      const searchableText = [
        doc.name,
        doc.extracted_data.tipo_documento,
        ...(doc.extracted_data.soggetti_coinvolti || []),
        doc.extracted_data.descrizione_breve,
      ].join(' ').toLowerCase();

      // FILTRO 1: Ricerca testuale generica
      if (filters.search && !searchableText.includes(filters.search.toLowerCase())) {
        return false;
      }

      // FILTRO 2: Tipo documento (case-insensitive)
      if (
        filters.type &&
        (doc.extracted_data.tipo_documento || '').toLowerCase() !== filters.type.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Gestisce il cambio dei filtri.
   * Callback chiamata da Filters.
   */
  function onFilter(newFilters: FilterValues) {
    filters = newFilters;
    applyFilters();
  }
</script>

<!-- ========================================================================== -->
<!-- TEMPLATE -->
<!-- ========================================================================== -->

<main class="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
  <!-- Header -->
  <header class="text-center mb-8">
    <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">📁 Archivio Documenti Intelligente</h1>
    <p class="text-sm md:text-base text-gray-600">
      Carica un documento per l'analisi automatica con il backend
    </p>
  </header>

  <!-- Layout a 2 colonne -->
  <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 max-w-7xl mx-auto">
    <!-- COLONNA SINISTRA: Upload -->
    <section class="lg:col-span-2">
      <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
        <h2 class="text-lg md:text-xl font-semibold text-gray-700 mb-4 pb-2 border-b-2 border-gray-100">Carica e Analizza</h2>
        <UploadForm onAdd={addDocument} maxFileSize={10} />
      </div>
    </section>

    <!-- COLONNA DESTRA: Lista e Filtri -->
    <section class="lg:col-span-3 flex flex-col space-y-6">
      <!-- Sezione Filtri -->
      <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
        <Filters onFilter={onFilter} />
      </div>

      <!-- Sezione Lista Documenti -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-md flex-1">
        <DocumentList
          documents={filtered}
          onDelete={deleteDocument}
          isLoading={isLoading}
          error={loadingError}
        />
      </div>
    </section>
  </div>

  <footer class="mt-12 pt-6 border-t border-dashed border-gray-300 text-center">
    <p class="text-sm text-gray-500 leading-relaxed">
      Total documents: <strong class="font-medium text-gray-700">{documents.length}</strong>
    </p>
  </footer>
</main>