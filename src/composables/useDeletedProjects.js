// composables/useDeletedProjects.js
import { ref, computed } from 'vue'
import { api } from 'boot/axios'

// Shared state for deleted projects
const deletedProjects = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filters = ref({
    status: null,
    health: null,
    tags: []
})
const sortBy = ref('-last_updated')
const pagination = ref({
    page: 1,
    rowsPerPage: 12,
    rowsNumber: 0
})

export function useDeletedProjects() {
    /**
     * Fetch deleted projects with search, filters, sorting, and pagination
     */
    const fetchDeletedProjects = async (params = {}) => {
        loading.value = true

        try {
            // Build query parameters
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
            if (filters.value.health) {
                queryParams.health = filters.value.health
            }

            // Tags filter
            if (filters.value.tags && filters.value.tags.length > 0) {
                queryParams.tags = filters.value.tags.join(',')
            }

            const response = await api.get('/projects/deleted_projects/', { params: queryParams })

            // Handle paginated response
            if (response.data.results) {
                deletedProjects.value = response.data.results
                pagination.value.rowsNumber = response.data.count
            } else {
                // Non-paginated response
                deletedProjects.value = response.data
                pagination.value.rowsNumber = response.data.length
            }

            return response.data
        } catch (error) {
            console.error('Error fetching deleted projects:', error)
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
        await fetchDeletedProjects()
    }

    /**
     * Clear search
     */
    const clearSearch = async () => {
        searchQuery.value = ''
        await fetchDeletedProjects()
    }

    /**
     * Apply filters
     */
    const applyFilters = async (newFilters) => {
        filters.value = { ...filters.value, ...newFilters }
        pagination.value.page = 1 // Reset to first page on filter change
        await fetchDeletedProjects()
    }

    /**
     * Clear all filters
     */
    const clearFilters = async () => {
        filters.value = {
            status: null,
            health: null,
            tags: []
        }
        await fetchDeletedProjects()
    }

    /**
     * Change sort order
     */
    const changeSort = async (field, descending = true) => {
        sortBy.value = descending ? `-${field}` : field
        await fetchDeletedProjects()
    }

    /**
     * Handle pagination change
     */
    const onPaginationChange = async (props) => {
        const { page, rowsPerPage } = props.pagination
        pagination.value.page = page
        pagination.value.rowsPerPage = rowsPerPage
        await fetchDeletedProjects({ page, rowsPerPage })
    }

    /**
     * Restore a deleted project
     */
    const restoreProject = async (projectId) => {
        try {
            const response = await api.post(`/projects/${projectId}/recover/`)

            // Remove from deleted projects list
            const index = deletedProjects.value.findIndex(p => p.id === projectId)
            if (index !== -1) {
                deletedProjects.value.splice(index, 1)
                pagination.value.rowsNumber -= 1
            }

            return response.data
        } catch (error) {
            console.error('Error restoring project:', error)
            throw error
        }
    }

    /**
     * Permanently delete a project
     */
    const permanentDeleteProject = async (projectId) => {
        try {
            await api.delete(`/projects/${projectId}/permanent_delete/`)

            // Remove from deleted projects list
            const index = deletedProjects.value.findIndex(p => p.id === projectId)
            if (index !== -1) {
                deletedProjects.value.splice(index, 1)
                pagination.value.rowsNumber -= 1
            }
        } catch (error) {
            console.error('Error permanently deleting project:', error)
            throw error
        }
    }

    /**
     * Computed: Check if any filters are active
     */
    const hasActiveFilters = computed(() => {
        return !!(
            filters.value.status ||
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
        deletedProjects,
        loading,
        searchQuery,
        filters,
        sortBy,
        pagination,

        // Computed
        hasActiveFilters,
        isSearching,

        // Methods
        fetchDeletedProjects,
        handleSearch,
        clearSearch,
        applyFilters,
        clearFilters,
        changeSort,
        onPaginationChange,
        restoreProject,
        permanentDeleteProject
    }
}
