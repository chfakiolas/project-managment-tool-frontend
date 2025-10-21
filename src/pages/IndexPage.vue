<template>
  <q-page class="q-pa-xl">
    <projects-top-bar
      @project-created="handleProjectCreated"
      @search="handleSearch"
      @clear-search="handleClearSearch"
    />

    <!-- Bulk Actions Bar -->
    <q-slide-transition>
      <div v-if="selectedProjects.length > 0" class="q-mb-md">
        <q-banner class="bg-primary text-white" rounded>
          <template v-slot:avatar>
            <q-icon name="check_circle" color="white" />
          </template>
          <div class="row items-center">
            <div class="col">
              <strong>{{ selectedProjects.length }}</strong> project(s) selected
            </div>
            <div class="col-auto">
              <q-btn
                flat
                label="Bulk Edit"
                icon="edit"
                color="white"
                @click="showBulkEditDialog = true"
                class="q-mr-sm"
              />
              <q-btn
                flat
                label="Clear Selection"
                icon="clear"
                color="white"
                @click="clearSelection"
              />
            </div>
          </div>
        </q-banner>
      </div>
    </q-slide-transition>

    <div class="row">
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
    </div>

    <!-- Bulk Selection Controls -->
    <div class="row" v-if="!loading && projects.length > 0">
      <div class="col-12 q-mb-md">
        <q-btn
          flat
          :label="selectionMode ? 'Exit Selection Mode' : 'Select Projects'"
          :icon="selectionMode ? 'close' : 'checklist'"
          color="primary"
          @click="toggleSelectionMode"
        />
        <q-btn
          v-if="selectionMode"
          flat
          label="Select All"
          icon="select_all"
          color="primary"
          @click="selectAll"
          class="q-ml-sm"
        />
      </div>
    </div>

    <div class="row">
      <!-- Loading State -->
      <div class="col-12" v-if="loading">
        <q-spinner-dots size="50px" color="primary" />
        <div class="text-center q-mt-md">Loading projects...</div>
      </div>

      <!-- Projects Grid -->
      <div class="col-12 projects-container" v-else-if="projects.length > 0">
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-card-wrapper"
          :class="{ 'selection-mode': selectionMode }"
        >
          <q-checkbox
            v-if="selectionMode"
            v-model="selectedProjects"
            :val="project.id"
            class="project-checkbox"
            color="primary"
          />
          <project-card
            :project="project"
            :class="{ selected: selectedProjects.includes(project.id) }"
            @view-detail="handleViewDetail"
            @edit-project="handleEditProject"
            @delete-project="handleDeleteProject"
          />
        </div>
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

    <!-- Bulk Edit Dialog -->
    <q-dialog v-model="showBulkEditDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Bulk Edit Projects</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="text-body2 q-mb-md">
            Editing <strong>{{ selectedProjects.length }}</strong> project(s)
          </div>

          <q-form @submit.prevent="handleBulkUpdate" class="q-gutter-md">
            <!-- Bulk Status Update -->
            <q-select
              v-model="bulkEditData.status"
              label="Update Status (optional)"
              outlined
              clearable
              :options="statusOptions"
              emit-value
              map-options
              hint="Leave empty to keep current values"
            >
              <template v-slot:prepend>
                <q-icon name="flag" />
              </template>
            </q-select>

            <!-- Bulk Tags Update -->
            <q-select
              v-model="bulkEditData.tags"
              label="Add Tags (optional)"
              outlined
              multiple
              use-chips
              use-input
              input-debounce="0"
              new-value-mode="add-unique"
              hint="Tags will be added to existing tags"
              :options="tagOptions"
            >
              <template v-slot:prepend>
                <q-icon name="label" />
              </template>
            </q-select>

            <q-banner class="bg-info text-white" rounded dense>
              <template v-slot:avatar>
                <q-icon name="info" color="white" />
              </template>
              Only filled fields will be updated. Empty fields will preserve existing values.
            </q-banner>

            <div class="row q-mt-md">
              <q-space />
              <q-btn flat label="Cancel" color="grey-7" v-close-popup class="q-mr-sm" />
              <q-btn
                unelevated
                label="Update Projects"
                type="submit"
                color="primary"
                :loading="bulkUpdating"
                :disable="!bulkEditData.status && bulkEditData.tags.length === 0"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
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

// Bulk edit state
const selectionMode = ref(false)
const selectedProjects = ref([])
const showBulkEditDialog = ref(false)
const bulkUpdating = ref(false)
const bulkEditData = ref({
  status: null,
  tags: [],
})

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
  showProjectDetail.value = false // Close detail dialog
  showProjectEdit.value = true // Open edit dialog
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

// Bulk operations
const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    selectedProjects.value = []
  }
}

const selectAll = () => {
  selectedProjects.value = projects.value.map((p) => p.id)
}

const clearSelection = () => {
  selectedProjects.value = []
}

const handleBulkUpdate = async () => {
  if (selectedProjects.value.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'No projects selected',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  if (!bulkEditData.value.status && bulkEditData.value.tags.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Please select at least one field to update',
      icon: 'warning',
      position: 'top',
    })
    return
  }

  bulkUpdating.value = true

  try {
    // Prepare the update data
    const updateData = {
      ids: selectedProjects.value,
    }

    if (bulkEditData.value.status) {
      updateData.status = bulkEditData.value.status
    }

    if (bulkEditData.value.tags.length > 0) {
      updateData.tags = bulkEditData.value.tags
    }

    // Call the bulk update endpoint
    const response = await api.post('/projects/bulk_update/', updateData)

    Notify.create({
      type: 'positive',
      message: `Successfully updated ${response.data.updated || selectedProjects.value.length} project(s)!`,
      icon: 'check_circle',
      position: 'top',
    })

    // Refresh the projects list
    await fetchProjects()

    // Reset state
    showBulkEditDialog.value = false
    bulkEditData.value = {
      status: null,
      tags: [],
    }
    clearSelection()
    selectionMode.value = false
  } catch (error) {
    console.error('Error updating projects:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to update projects',
      icon: 'error',
      position: 'top',
    })
  } finally {
    bulkUpdating.value = false
  }
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

.project-card-wrapper {
  position: relative;
  transition: all 0.2s ease;

  &.selection-mode {
    padding-left: 40px;
  }

  .project-checkbox {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
  }

  :deep(.project-card.selected) {
    border: 2px solid var(--q-primary);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }
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
