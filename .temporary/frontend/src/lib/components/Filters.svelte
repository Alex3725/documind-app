<script lang="ts">
  /**
   * Filters.svelte
   *
   * Componente per filtrare e cercare documenti.
   * Supporta ricerca testuale e filtro per tipo.
   */

  // ============================================================================
  // IMPORTS
  // ============================================================================

  import { onDestroy } from 'svelte';

  // ============================================================================
  // TYPE DEFINITIONS
  // ============================================================================

  /** Struttura dei filtri applicati */
  type FilterValues = {
    search: string;
    type: string;
  };

  // ============================================================================
  // PROPS
  // ============================================================================

  export let onFilter: (filters: FilterValues) => void;
  export let debounceMs: number = 300;

  // ============================================================================
  // STATE
  // ============================================================================

  let search: string = '';
  let type: string = '';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  $: hasActiveFilters = search.trim() !== '' || type.trim() !== '';
  $: activeFiltersCount = [
    search.trim() !== '',
    type.trim() !== ''
  ].filter(Boolean).length;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Applica i filtri correnti chiamando il callback onFilter.
   */
  function applyFilters() {
    const filters: FilterValues = {
      search: search.trim(),
      type: type.trim(),
    };
    onFilter(filters);
  }

  /**
   * Gestisce l'input di ricerca con debounce.
   */
  function handleSearchInput() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      applyFilters();
    }, debounceMs);
  }

  /**
   * Gestisce il cambio del filtro tipo (immediato).
   */
  function handleTypeChange() {
    applyFilters();
  }

  /**
   * Resetta tutti i filtri.
   */
  function resetFilters() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    search = '';
    type = '';
    applyFilters();
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  onDestroy(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });
</script>

<!-- ========================================================================== -->
<!-- TEMPLATE -->
<!-- ========================================================================== -->

<div class="w-full mb-4">

  <div class="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch">
    <!-- Campo Ricerca -->
    <div class="flex-1 sm:flex-2 min-w-0">
      <label for="search-input" class="sr-only">Cerca documenti</label>
      <input
        id="search-input"
        type="text"
        placeholder="🔍 Cerca per nome, tipo, contenuto..."
        bind:value={search}
        on:input={handleSearchInput}
        class="w-full p-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200
               focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </div>

    <!-- Campo Tipo -->
    <div class="flex-1 min-w-0">
      <label for="type-input" class="sr-only">Filtra per tipo</label>
      <input
        id="type-input"
        type="text"
        placeholder="Tipo documento (es. Fattura)"
        bind:value={type}
        on:input={handleTypeChange}
        class="w-full p-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200
               focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </div>

    <!-- Bottone Reset -->
    <button
      class="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium
               text-gray-700 whitespace-nowrap transition-colors duration-200
               hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
               sm:w-auto w-full"
      on:click={resetFilters}
      disabled={!hasActiveFilters}
      title="Rimuovi tutti i filtri"
    >
      {#if hasActiveFilters}
        ✕ Reset ({activeFiltersCount})
      {:else}
        Reset
      {/if}
    </button>
  </div>

  {#if hasActiveFilters}
    <div class="flex flex-wrap gap-2 items-center mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <span class="text-sm font-medium text-gray-600 mr-2">Filtri attivi:</span>

      {#if search.trim()}
        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          Ricerca: "{search.trim()}"
          <button
            class="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            on:click={() => { search = ''; applyFilters(); }}
            aria-label="Rimuovi filtro ricerca"
          >
            ✕
          </button>
        </span>
      {/if}

      {#if type.trim()}
        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Tipo: {type.trim()}
          <button
            class="text-green-600 hover:text-green-800 transition-colors duration-200"
            on:click={() => { type = ''; applyFilters(); }}
            aria-label="Rimuovi filtro tipo"
          >
            ✕
          </button>
        </span>
      {/if}
    </div>
  {/if}

</div>