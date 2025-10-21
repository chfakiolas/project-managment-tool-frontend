<template>
  <q-page class="flex q-pa-xl">
    <projects-top-bar
      @project-created="handleProjectCreated"
      @search="handleSearch"
      @clear-search="handleClearSearch"
    />

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

            <!-- Tags Filter -->
            <div class="col-12 col-md-3">
              <q-select
                v-model="filters.tags"
                label="Tags"
                outlined
                clearable
                multiple
                use-chips
                use-input
                input-debounce="0"
                new-value-mode="add-unique"
                :options="tagOptions"
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

    <div class="row">
      <!-- Loading State -->
      <div class="col-12" v-if="loading">
        <q-spinner-dots size="50px" color="primary" />
        <div class="text-center q-mt-md">Loading projects...</div>
      </div>

      <!-- Projects Grid -->
      <div class="col-12 projects-container q-pa-xl" v-else-if="projects.length > 0">
        <project-card
          v-for="project in projects"
          :key="project.id"
          :project="project"
          @view-detail="handleViewDetail"
          @edit-project="handleEditProject"
          @delete-project="handleDeleteProject"
        />
      </div>

      <!-- No Results -->
      <div class="col-12 text-center q-pa-xl" v-else>
        <q-icon name="search_off" size="64px" color="grey-5" />
        <div class="text-h6 q-mt-md text-grey-6">
          {{ isSearching ? 'No projects found matching your search' : 'There are no projects yet' }}
        </div>
        <div class="text-body2 text-grey-5 q-mt-sm" v-if="isSearching">
          Try adjusting your search terms or filters
        </div>
      </div>

      <!-- Pagination -->
      <div class="col-12 q-mt-md" v-if="projects.length > 0">
        <q-pagination
          v-model="pagination.page"
          :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
          direction-links
          outline
          color="primary"
          @update:model-value="onPaginationChange"
        />
        <div class="text-center q-mt-sm text-caption text-grey-6">
          Showing {{ projects.length }} of {{ pagination.rowsNumber }} projects
        </div>
      </div>
    </div>

    <!-- Project Detail Modal -->
    <project-detail
      v-if="selectedProject"
      :project="selectedProject"
      :show="showProjectDetail"
      @update:show="showProjectDetail = $event"
      @edit-project="handleEditProject"
      @delete-project="handleDeleteProject"
    />

    <!-- Project Edit Modal -->
    <project-edit
      v-if="selectedProject"
      :project="selectedProject"
      :show="showProjectEdit"
      @update:show="showProjectEdit = $event"
      @project-updated="handleProjectUpdated"
    />
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProjectSearch } from 'src/composables/useProjectSearch'
import ProjectCard from 'src/components/ProjectCard.vue'
import ProjectsTopBar from 'src/components/ProjectsTopBar.vue'
import ProjectDetail from 'src/components/ProjectDetail.vue'
import ProjectEdit from 'src/components/ProjectEdit.vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'

// Use the search composable
const {
  projects,
  loading,
  filters,
  sortBy,
  pagination,
  hasActiveFilters,
  isSearching,
  fetchProjects,
  handleSearch: handleSearchQuery,
  clearSearch,
  applyFilters,
  clearFilters,
  changeSort,
  onPaginationChange,
  addProject,
  updateProject,
  removeProject,
} = useProjectSearch()

// Modal state
const showProjectDetail = ref(false)
const showProjectEdit = ref(false)
const selectedProject = ref(null)

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

const tagOptions = [
  'Frontend',
  'Backend',
  'Mobile',
  'DevOps',
  'Design',
  'Testing',
  'High Priority',
  'Low Priority',
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

// Handle search from top bar
const handleSearch = async (query) => {
  await handleSearchQuery(query)
}

// Handle clear search from top bar
const handleClearSearch = async () => {
  await clearSearch()
}

// Handle new project creation
const handleProjectCreated = (project) => {
  addProject(project)
}

// Handle project detail view
const handleViewDetail = (project) => {
  selectedProject.value = project
  showProjectDetail.value = true
}

// Handle project edit
const handleEditProject = (project) => {
  selectedProject.value = project
  showProjectEdit.value = true
}

// Handle project delete
const handleDeleteProject = async (project) => {
  try {
    await api.delete(`/projects/${project.id}/`)

    Notify.create({
      type: 'positive',
      message: 'Project deleted successfully!',
      icon: 'check_circle',
      position: 'top',
    })

    removeProject(project.id)
  } catch (error) {
    console.error('Error deleting project:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to delete project',
      icon: 'error',
      position: 'top',
    })
  }
}

// Handle project updated
const handleProjectUpdated = (updatedProject) => {
  updateProject(updatedProject)
  showProjectEdit.value = false
}

// Load projects on mount
onMounted(() => {
  fetchProjects()
})
</script>
<style lang="scss" scoped>
.my-card {
  width: 100%;
  max-width: 350px;
  min-width: 300px;
}
.projects-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

// Quick filters styling
.q-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

// Active filter indicator
.text-primary {
  font-weight: 600;
}
</style>
