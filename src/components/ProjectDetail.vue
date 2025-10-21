<template>
  <q-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    persistent
    maximized
  >
    <q-card class="project-detail-card">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="col">
          <div class="text-h4 text-weight-bold">{{ project.title }}</div>
          <div class="text-subtitle1 text-grey-6 q-mt-xs">
            by {{ project.owner_name || 'Unknown' }} • Created {{ formatDate(project.created_at) }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn flat round icon="close" v-close-popup size="lg" />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Content -->
      <q-card-section class="q-pa-lg">
        <div class="row q-gutter-lg">
          <!-- Left Column - Main Info -->
          <div class="col-12 col-md-8">
            <!-- Description -->
            <div class="q-mb-lg">
              <div class="text-h6 text-weight-bold q-mb-md">Description</div>
              <div class="text-body1">{{ project.description || 'No description provided' }}</div>
            </div>

            <!-- Progress & Health -->
            <div class="row q-gutter-md q-mb-lg">
              <div class="col-12 col-sm-6">
                <div class="text-h6 text-weight-bold q-mb-md">Progress</div>
                <q-linear-progress
                  size="30px"
                  :value="localProgress / 100"
                  :color="getProgressColor(localProgress)"
                  rounded
                >
                  <div class="absolute-full flex flex-center">
                    <q-badge
                      :color="getProgressColor(localProgress)"
                      text-color="white"
                      :label="`${localProgress}%`"
                    />
                  </div>
                </q-linear-progress>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-h6 text-weight-bold q-mb-md">Health Status</div>
                <q-chip
                  :color="getHealthColor(localHealth)"
                  text-color="white"
                  :label="localHealth"
                  size="lg"
                  icon="favorite"
                />
              </div>
            </div>

            <!-- Milestones Management -->
            <div class="q-mb-lg">
              <milestone-manager
                :project-id="project.id"
                :milestones="localMilestones"
                @milestone-created="handleMilestoneCreated"
                @milestone-updated="handleMilestoneUpdated"
                @milestone-deleted="handleMilestoneDeleted"
              />
            </div>

            <!-- Tags -->
            <div class="q-mb-lg" v-if="project.tags && project.tags.length > 0">
              <div class="text-h6 text-weight-bold q-mb-md">Tags</div>
              <div class="q-gutter-sm">
                <q-chip
                  v-for="tag in project.tags"
                  :key="tag"
                  color="primary"
                  text-color="white"
                  :label="tag"
                  size="md"
                  outline
                />
              </div>
            </div>
          </div>

          <!-- Right Column - Sidebar Info -->
          <div class="col-12 col-md-4">
            <!-- Project Status -->
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="text-h6 text-weight-bold q-mb-md">Project Status</div>
                <q-chip
                  :color="getStatusColor(project.status)"
                  text-color="white"
                  :label="project.status"
                  size="lg"
                  icon="flag"
                />
                <div class="text-caption text-grey-6 q-mt-sm">
                  Last updated: {{ formatDate(project.last_updated) }}
                </div>
              </q-card-section>
            </q-card>

            <!-- Team Roster (Mock Data) -->
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="text-h6 text-weight-bold q-mb-md">Team Roster</div>
                <div v-if="teamMembers.length > 0">
                  <div v-for="member in teamMembers" :key="member.id" class="team-member q-mb-sm">
                    <div class="row items-center">
                      <q-avatar size="32px" color="primary" text-color="white">
                        {{ member.name.charAt(0) }}
                      </q-avatar>
                      <div class="col q-ml-sm">
                        <div class="text-body2">{{ member.name }}</div>
                        <div class="text-caption text-grey-6">{{ member.role }}</div>
                      </div>
                      <div class="col-auto">
                        <q-chip
                          :color="getCapacityColor(member.capacity)"
                          text-color="white"
                          :label="`${member.capacity}%`"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-grey-6">No team members assigned</div>
              </q-card-section>
            </q-card>

            <!-- Recent Activity (Mock Data) -->
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6 text-weight-bold q-mb-md">Recent Activity</div>
                <div v-if="recentActivity.length > 0">
                  <div
                    v-for="activity in recentActivity"
                    :key="activity.id"
                    class="activity-item q-mb-sm"
                  >
                    <div class="row items-start">
                      <q-icon
                        :name="activity.icon"
                        :color="activity.color"
                        size="sm"
                        class="q-mr-sm q-mt-xs"
                      />
                      <div class="col">
                        <div class="text-body2">{{ activity.description }}</div>
                        <div class="text-caption text-grey-6">
                          {{ formatDate(activity.timestamp) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-grey-6">No recent activity</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-lg">
        <q-btn flat label="Close" color="grey-7" v-close-popup />
        <q-btn
          unelevated
          label="Edit Project"
          color="primary"
          icon="edit"
          @click.stop="editProject"
        />
        <q-btn
          unelevated
          label="Delete Project"
          color="negative"
          icon="delete"
          @click="deleteProject"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import MilestoneManager from './MilestoneManager.vue'
// import { Notify } from 'quasar'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:show', 'edit-project', 'delete-project'])

// Create reactive references for milestones to avoid mutating props
const localMilestones = ref([...(props.project.milestones || [])])
const localProgress = ref(props.project.progress)
const localHealth = ref(props.project.health)

// Mock data for team roster
const teamMembers = ref([
  { id: 1, name: 'John Doe', role: 'Project Manager', capacity: 80 },
  { id: 2, name: 'Jane Smith', role: 'Frontend Developer', capacity: 60 },
  { id: 3, name: 'Mike Johnson', role: 'Backend Developer', capacity: 90 },
  { id: 4, name: 'Sarah Wilson', role: 'UI/UX Designer', capacity: 70 },
])

// Mock data for recent activity
const recentActivity = ref([
  {
    id: 1,
    description: 'Milestone "Design Phase" completed',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    icon: 'check_circle',
    color: 'positive',
  },
  {
    id: 2,
    description: 'Project status updated to Active',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    icon: 'update',
    color: 'info',
  },
  {
    id: 3,
    description: 'New team member Sarah Wilson added',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    icon: 'person_add',
    color: 'primary',
  },
  {
    id: 4,
    description: 'Project created',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    icon: 'add_circle',
    color: 'grey-6',
  },
])

// Helper functions
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

const getCapacityColor = (capacity) => {
  if (capacity >= 80) return 'negative'
  if (capacity >= 60) return 'warning'
  return 'positive'
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

// Event handlers
const editProject = () => {
  emit('edit-project', props.project)
  emit('update:show', false)
}

const deleteProject = () => {
  emit('delete-project', props.project)
  emit('update:show', false)
}

// Milestone event handlers
const handleMilestoneCreated = (milestone) => {
  // Add milestone to local milestones array
  localMilestones.value.push(milestone)

  // Update project progress and health
  updateProjectMetrics()
}

const handleMilestoneUpdated = (updatedMilestone) => {
  // Update milestone in local milestones array
  const index = localMilestones.value.findIndex((m) => m.id === updatedMilestone.id)
  if (index !== -1) {
    localMilestones.value[index] = updatedMilestone
  }

  // Update project progress and health
  updateProjectMetrics()
}

const handleMilestoneDeleted = (milestoneId) => {
  // Remove milestone from local milestones array
  const index = localMilestones.value.findIndex((m) => m.id === milestoneId)
  if (index !== -1) {
    localMilestones.value.splice(index, 1)
  }

  // Update project progress and health
  updateProjectMetrics()
}

const updateProjectMetrics = () => {
  // Calculate new progress and health based on local milestones
  const totalMilestones = localMilestones.value.length
  const completedMilestones = localMilestones.value.filter((m) => m.completed).length

  if (totalMilestones > 0) {
    localProgress.value = Math.round((completedMilestones / totalMilestones) * 100)
  } else {
    localProgress.value = 0
  }

  // Update health based on progress and overdue milestones
  const overdueCount = localMilestones.value.filter((m) => m.is_overdue).length

  if (localProgress.value >= 90 && overdueCount === 0) {
    localHealth.value = 'good'
  } else if (localProgress.value >= 70 && overdueCount <= 1) {
    localHealth.value = 'good'
  } else if (localProgress.value >= 50 && overdueCount <= 2) {
    localHealth.value = 'warning'
  } else if (localProgress.value >= 30 && overdueCount <= 3) {
    localHealth.value = 'warning'
  } else {
    localHealth.value = 'critical'
  }
}
</script>

<style scoped>
.project-detail-card {
  max-width: 1200px;
  width: 100%;
}

.milestone-item {
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
}

.team-member {
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
}

.activity-item {
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
