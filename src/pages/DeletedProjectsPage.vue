<template>
  <q-page class="q-pa-xl">
    <projects-top-bar
      :show-create-button="false"
      :show-deleted-button="false"
      search-placeholder="Search in deleted projects..."
      @search="handleSearch"
      @clear-search="handleClearSearch"
    />

    <div class="row">
      <!-- Deleted Projects Header -->
      <div class="col-12 q-mb-lg">
        <div class="row items-center">
          <div class="col">
            <div class="text-h4 text-weight-bold">Deleted Projects</div>
            <div class="text-subtitle1 text-grey-6">Manage and restore deleted projects</div>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              label="Back to Projects"
              icon="arrow_back"
              color="primary"
              @click="$router.push('/')"
            />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="col-12 q-mb-md">
        <q-expansion-item
          icon="filter_list"
          label="Filters"
          class="q-mb-md"
          :class="{ 'text-primary': hasActiveFilters }"
        >
          <div class="q-pa-md">
            <div class="row q-gutter-md">
              <!-- Status Filter -->
              <div class="col-12 col-md-3">
                <q-select
                  v-model="filters.status"
                  label="Status"
                  outlined
                  clearable
                  :options="statusOptions"
                  emit-value
                  map-options
                  @update:model-value="applyFilters"
                />
              </div>

              <!-- Health Filter -->
              <div class="col-12 col-md-3">
                <q-select
                  v-model="filters.health"
                  label="Health"
                  outlined
                  clearable
                  :options="healthOptions"
                  emit-value
                  map-options
                  @update:model-value="applyFilters"
                />
              </div>

              <!-- Sort Options -->
              <div class="col-12 col-md-3">
                <q-select
                  v-model="sortBy"
                  label="Sort By"
                  outlined
                  :options="sortOptions"
                  emit-value
                  map-options
                  @update:model-value="changeSort"
                />
              </div>
            </div>

            <div class="row q-mt-md">
              <q-space />
              <q-btn
                flat
                label="Clear All Filters"
                color="grey-7"
                @click="clearFilters"
                v-if="hasActiveFilters"
              />
            </div>
          </div>
        </q-expansion-item>
      </div>
    </div>

    <div class="row">
      <!-- Loading State -->
      <div class="col-12" v-if="loading">
        <q-spinner-dots size="50px" color="primary" />
        <div class="text-center q-mt-md">Loading deleted projects...</div>
      </div>

      <!-- Deleted Projects Grid -->
      <div class="col-12 projects-container q-pa-xl" v-else-if="deletedProjects.length > 0">
        <deleted-project-card
          v-for="project in deletedProjects"
          :key="project.id"
          :project="project"
          @restore="handleRestore"
          @permanent-delete="handlePermanentDelete"
        />
      </div>

      <!-- No Results -->
      <div class="col-12 text-center q-pa-xl" v-else>
        <q-icon name="delete_sweep" size="64px" color="grey-5" />
        <div class="text-h6 q-mt-md text-grey-6">
          {{
            isSearching
              ? 'No deleted projects found matching your search'
              : 'No deleted projects found'
          }}
        </div>
        <div class="text-body2 text-grey-5 q-mt-sm" v-if="isSearching">
          Try adjusting your search terms or filters
        </div>
      </div>

      <!-- Pagination -->
      <div class="col-12 q-mt-md" v-if="deletedProjects.length > 0">
        <q-pagination
          v-model="pagination.page"
          :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
          direction-links
          outline
          color="primary"
          @update:model-value="onPaginationChange"
        />
        <div class="text-center q-mt-sm text-caption text-grey-6">
          Showing {{ deletedProjects.length }} of {{ pagination.rowsNumber }} deleted projects
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDeletedProjects } from 'src/composables/useDeletedProjects'
import DeletedProjectCard from 'src/components/DeletedProjectCard.vue'
import ProjectsTopBar from 'src/components/ProjectsTopBar.vue'
import { Notify } from 'quasar'

// Use the deleted projects composable
const {
  deletedProjects,
  loading,
  filters,
  sortBy,
  pagination,
  hasActiveFilters,
  isSearching,
  fetchDeletedProjects,
  handleSearch,
  applyFilters,
  clearFilters,
  changeSort,
  onPaginationChange,
  restoreProject,
  permanentDeleteProject,
} = useDeletedProjects()

// Options for filters
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const healthOptions = [
  { label: 'Good', value: 'good' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
]

const sortOptions = [
  { label: 'Last Updated (Newest)', value: '-last_updated' },
  { label: 'Last Updated (Oldest)', value: 'last_updated' },
  { label: 'Title (A-Z)', value: 'title' },
  { label: 'Title (Z-A)', value: '-title' },
  { label: 'Progress (High to Low)', value: '-progress' },
  { label: 'Progress (Low to High)', value: 'progress' },
  { label: 'Created (Newest)', value: '-created_at' },
  { label: 'Created (Oldest)', value: 'created_at' },
]

// Handle restore project
const handleRestore = async (project) => {
  try {
    await restoreProject(project.id)

    Notify.create({
      type: 'positive',
      message: `Project "${project.title}" restored successfully!`,
      icon: 'restore',
      position: 'top',
    })
  } catch (error) {
    console.error('Error restoring project:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to restore project',
      icon: 'error',
      position: 'top',
    })
  }
}

// Handle permanent delete
const handlePermanentDelete = async (project) => {
  try {
    await permanentDeleteProject(project.id)

    Notify.create({
      type: 'positive',
      message: `Project "${project.title}" permanently deleted!`,
      icon: 'delete_forever',
      position: 'top',
    })
  } catch (error) {
    console.error('Error permanently deleting project:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to permanently delete project',
      icon: 'error',
      position: 'top',
    })
  }
}

// Load deleted projects on mount
onMounted(() => {
  fetchDeletedProjects()
})
</script>

<style lang="scss" scoped>
.search-input {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;

  :deep(.q-field__control) {
    border-radius: 8px;
  }
}

.projects-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
