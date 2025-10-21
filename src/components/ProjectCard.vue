<template>
  <q-card flat bordered class="my-card project-card" @click="openProjectDetail">
    <q-card-section>
      <div class="row items-start">
        <div class="col">
          <div class="text-h6 text-weight-bold">{{ project.title }}</div>
          <div class="text-caption text-grey-6 q-mt-xs">
            by {{ project.owner_name || 'Unknown' }}
          </div>
        </div>
        <div class="col-auto">
          <q-chip
            :color="getStatusColor(project.status)"
            text-color="white"
            :label="project.status"
            size="sm"
          />
        </div>
      </div>
    </q-card-section>

    <q-separator inset />

    <q-card-section>
      <div class="text-body2 text-grey-8 q-mb-sm">{{ project.description }}</div>

      <!-- Progress Section -->
      <div class="q-mb-sm">
        <div class="text-caption text-weight-medium q-mb-xs">Progress</div>
        <q-linear-progress
          size="20px"
          :value="project.progress / 100"
          :color="getProgressColor(project.progress)"
          rounded
        >
          <div class="absolute-full flex flex-center">
            <q-badge
              :color="getProgressColor(project.progress)"
              text-color="white"
              :label="`${project.progress}%`"
            />
          </div>
        </q-linear-progress>
      </div>

      <!-- Health Status -->
      <div class="row items-center q-mb-sm">
        <div class="text-caption text-weight-medium">Health:</div>
        <q-chip
          :color="getHealthColor(project.health)"
          text-color="white"
          :label="project.health"
          size="sm"
          class="q-ml-sm"
        />
      </div>

      <!-- Tags -->
      <div v-if="project.tags && project.tags.length > 0" class="q-mb-sm">
        <div class="text-caption text-weight-medium q-mb-xs">Tags</div>
        <div class="q-gutter-xs">
          <q-chip
            v-for="tag in project.tags"
            :key="tag"
            color="primary"
            text-color="white"
            :label="tag"
            size="sm"
            outline
          />
        </div>
      </div>

      <!-- Last Updated -->
      <div class="text-caption text-grey-6">
        <q-icon name="schedule" size="xs" class="q-mr-xs" />
        Updated {{ formatDate(project.last_updated) }}
      </div>
    </q-card-section>

    <!-- Action Buttons -->
    <q-card-actions align="right" class="q-pa-md">
      <q-btn
        flat
        round
        icon="edit"
        color="primary"
        size="sm"
        @click.stop="editProject"
        title="Edit Project"
      />
      <q-btn
        flat
        round
        icon="delete"
        color="negative"
        size="sm"
        @click.stop="deleteProject"
        title="Delete Project"
      />
      <q-btn
        flat
        round
        icon="visibility"
        color="info"
        size="sm"
        @click.stop="openProjectDetail"
        title="View Details"
      />
    </q-card-actions>
  </q-card>
</template>
<script setup>
// import { Notify } from 'quasar'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['view-detail', 'edit-project', 'delete-project'])

// Event handlers
const openProjectDetail = () => {
  emit('view-detail', props.project)
}

const editProject = () => {
  emit('edit-project', props.project)
}

const deleteProject = () => {
  emit('delete-project', props.project)
}

// Helper functions for styling
const getStatusColor = (status) => {
  const colors = {
    active: 'positive',
    on_hold: 'warning',
    completed: 'info',
    cancelled: 'negative',
  }
  return colors[status] || 'grey'
}

const getHealthColor = (health) => {
  const colors = {
    good: 'positive',
    warning: 'warning',
    critical: 'negative',
  }
  return colors[health] || 'grey'
}

const getProgressColor = (progress) => {
  if (progress >= 80) return 'positive'
  if (progress >= 50) return 'warning'
  return 'negative'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.project-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.q-card-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.project-card:hover .q-card-actions {
  opacity: 1;
}
</style>
