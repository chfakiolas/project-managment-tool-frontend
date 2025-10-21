// composables/useProjectSearch.js
import { ref, computed } from 'vue'
import { api } from 'boot/axios'

// Shared state across components
const projects = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filters = ref({
  status: null,
  owner: null,
  health: null,
  tags: []
})
const sortBy = ref('-last_updated') // Default sort
const pagination = ref({
  page: 1,
  rowsPerPage: 12,
  rowsNumber: 0
})

export function useProjectSearch() {
  /**
   * Fetch projects with search, filters, sorting, and pagination
   */
  const fetchProjects = async (params = {}) => {
    loading.value = true

    try {
      // Build query parameters for advanced search
      const queryParams = {
        page: params.page || pagination.value.page,
        page_size: params.rowsPerPage || pagination.value.rowsPerPage,
        ordering: sortBy.value,
      }

      // Add search query if exists
      if (searchQuery.value) {
        queryParams.search = searchQuery.value
      }

      // Add filters if they exist
      if (filters.value.status) {
        queryParams.status = filters.value.status
      }
      if (filters.value.owner) {
        queryParams.owner = filters.value.owner
      }
      if (filters.value.health) {
        queryParams.health = filters.value.health
      }

      // Tags filter
      if (filters.value.tags && filters.value.tags.length > 0) {
        queryParams.tags = filters.value.tags.join(',')
      }

      // Use advanced search endpoint if we have any search criteria
      const hasSearchCriteria = searchQuery.value ||
        filters.value.status ||
        filters.value.owner ||
        filters.value.health ||
        (filters.value.tags && filters.value.tags.length > 0)

      const endpoint = hasSearchCriteria ? '/projects/advanced_search/' : '/projects/'
      const response = await api.get(endpoint, { params: queryParams })

      // Handle paginated response
      if (response.data.results) {
        projects.value = response.data.results
        pagination.value.rowsNumber = response.data.count
      } else {
        // Non-paginated response
        projects.value = response.data
        pagination.value.rowsNumber = response.data.length
      }

      return response.data
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Handle search query change
   */
  const handleSearch = async (query) => {
    searchQuery.value = query
    pagination.value.page = 1 // Reset to first page on new search
    await fetchProjects()
  }

  /**
   * Clear search
   */
  const clearSearch = async () => {
    searchQuery.value = ''
    await fetchProjects()
  }

  /**
   * Apply filters
   */
  const applyFilters = async (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1 // Reset to first page on filter change
    await fetchProjects()
  }

  /**
   * Clear all filters
   */
  const clearFilters = async () => {
    filters.value = {
      status: null,
      owner: null,
      health: null,
      tags: []
    }
    await fetchProjects()
  }

  /**
   * Change sort order
   */
  const changeSort = async (field, descending = true) => {
    sortBy.value = descending ? `-${field}` : field
    await fetchProjects()
  }

  /**
   * Handle pagination change
   */
  const onPaginationChange = async (props) => {
    const { page, rowsPerPage } = props.pagination
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    await fetchProjects({ page, rowsPerPage })
  }

  /**
   * Add a new project to the list
   */
  const addProject = (project) => {
    projects.value.unshift(project)
    pagination.value.rowsNumber += 1
  }

  /**
   * Update a project in the list
   */
  const updateProject = (updatedProject) => {
    const index = projects.value.findIndex(p => p.id === updatedProject.id)
    if (index !== -1) {
      projects.value[index] = updatedProject
    }
  }

  /**
   * Remove a project from the list (soft delete)
   */
  const removeProject = (projectId) => {
    const index = projects.value.findIndex(p => p.id === projectId)
    if (index !== -1) {
      projects.value.splice(index, 1)
      pagination.value.rowsNumber -= 1
    }
  }

  /**
   * Computed: Check if any filters are active
   */
  const hasActiveFilters = computed(() => {
    return !!(
      filters.value.status ||
      filters.value.owner ||
      filters.value.health ||
      (filters.value.tags && filters.value.tags.length > 0)
    )
  })

  /**
   * Computed: Check if searching
   */
  const isSearching = computed(() => {
    return searchQuery.value.length > 0
  })

  return {
    // State
    projects,
    loading,
    searchQuery,
    filters,
    sortBy,
    pagination,

    // Computed
    hasActiveFilters,
    isSearching,

    // Methods
    fetchProjects,
    handleSearch,
    clearSearch,
    applyFilters,
    clearFilters,
    changeSort,
    onPaginationChange,
    addProject,
    updateProject,
    removeProject
  }
}