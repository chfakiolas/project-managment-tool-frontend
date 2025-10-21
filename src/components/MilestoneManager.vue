<template>
  <div class="milestone-manager">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h6 text-weight-bold">Milestones</div>
        <div class="text-caption text-grey-6">
          {{ completedCount }} of {{ totalCount }} completed
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          label="Add Milestone"
          icon="add"
          @click="showCreateDialog = true"
          size="sm"
        />
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="q-mb-md">
      <q-linear-progress
        size="20px"
        :value="progressPercentage / 100"
        :color="getProgressColor(progressPercentage)"
        rounded
      >
        <div class="absolute-full flex flex-center">
          <q-badge
            :color="getProgressColor(progressPercentage)"
            text-color="white"
            :label="`${progressPercentage}%`"
          />
        </div>
      </q-linear-progress>
    </div>

    <!-- Milestones List -->
    <div class="milestones-list">
      <milestone-item
        v-for="milestone in milestones"
        :key="milestone.id"
        :milestone="milestone"
        @update="handleMilestoneUpdate"
        @delete="handleMilestoneDelete"
        @edit="handleMilestoneEdit"
      />
    </div>

    <!-- Empty State -->
    <div v-if="milestones.length === 0" class="text-center q-pa-lg">
      <q-icon name="flag" size="48px" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">No milestones yet</div>
      <div class="text-body2 text-grey-5 q-mt-sm">
        Add your first milestone to track project progress
      </div>
    </div>

    <!-- Edit Milestone Dialog -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Edit Milestone</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="updateMilestone" class="q-gutter-md">
            <!-- Milestone Name -->
            <q-input
              v-model="editData.name"
              label="Milestone Name *"
              outlined
              :rules="[(val) => !!val || 'Name is required']"
              lazy-rules
            />

            <!-- Description -->
            <q-input
              v-model="editData.description"
              label="Description"
              outlined
              type="textarea"
              rows="3"
            />

            <!-- Due Date -->
            <q-input v-model="editData.due_date" label="Due Date" outlined type="date" />

            <!-- Priority -->
            <q-select
              v-model="editData.priority"
              label="Priority"
              outlined
              :options="priorityOptions"
              emit-value
              map-options
            />

            <!-- Assigned To -->
            <q-select
              v-model="editData.assigned_to"
              label="Assigned To (Optional)"
              outlined
              :options="userOptions"
              emit-value
              map-options
              clearable
              hint="Leave empty if no specific assignment"
            />

            <div class="row q-mt-md">
              <q-space />
              <q-btn flat label="Cancel" color="grey-7" v-close-popup class="q-mr-sm" />
              <q-btn
                unelevated
                label="Update Milestone"
                type="submit"
                color="primary"
                :loading="updating"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Create Milestone Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Add Milestone</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="createMilestone" class="q-gutter-md">
            <!-- Milestone Name -->
            <q-input
              v-model="newMilestone.name"
              label="Milestone Name *"
              outlined
              :rules="[(val) => !!val || 'Name is required']"
              lazy-rules
            />

            <!-- Description -->
            <q-input
              v-model="newMilestone.description"
              label="Description"
              outlined
              type="textarea"
              rows="3"
            />

            <!-- Due Date -->
            <q-input v-model="newMilestone.due_date" label="Due Date" outlined type="date" />

            <!-- Priority -->
            <q-select
              v-model="newMilestone.priority"
              label="Priority"
              outlined
              :options="priorityOptions"
              emit-value
              map-options
            />

            <!-- Assigned To -->
            <q-select
              v-model="newMilestone.assigned_to"
              label="Assigned To (Optional)"
              outlined
              :options="userOptions"
              emit-value
              map-options
              clearable
              hint="Leave empty if no specific assignment"
            />

            <div class="row q-mt-md">
              <q-space />
              <q-btn flat label="Cancel" color="grey-7" v-close-popup class="q-mr-sm" />
              <q-btn
                unelevated
                label="Create Milestone"
                type="submit"
                color="primary"
                :loading="creating"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'
import MilestoneItem from './MilestoneItem.vue'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true,
  },
  milestones: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['milestone-created', 'milestone-updated', 'milestone-deleted'])

// State
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const creating = ref(false)
const updating = ref(false)
const currentMilestone = ref(null)
const newMilestone = ref({
  name: '',
  description: '',
  due_date: '',
  priority: 'medium',
  assigned_to: null,
})
const editData = ref({
  name: '',
  description: '',
  due_date: '',
  priority: 'medium',
  assigned_to: null,
})

// Options
const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
]

// Get users from the project owner or use a default user
const userOptions = ref([])

// Load users when component mounts
const loadUsers = async () => {
  try {
    // Try to get users from the API, fallback to project owner
    const response = await api.get('/users/')
    if (response.data && response.data.length > 0) {
      userOptions.value = response.data.map((user) => ({
        label: user.username || `${user.first_name} ${user.last_name}`.trim() || `User ${user.id}`,
        value: user.id,
      }))
    } else {
      // Fallback: use project owner as default option
      userOptions.value = [{ label: 'Project Owner', value: props.projectId }]
    }
  } catch {
    console.warn('Could not load users, using project owner as default')
    // Fallback: use project owner as default option
    userOptions.value = [{ label: 'Project Owner', value: props.projectId }]
  }
}

// Computed
const totalCount = computed(() => props.milestones.length)
const completedCount = computed(() => props.milestones.filter((m) => m.completed).length)
const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

// Helper functions
const getProgressColor = (percentage) => {
  if (percentage >= 80) return 'positive'
  if (percentage >= 50) return 'warning'
  return 'negative'
}

// Event handlers
const createMilestone = async () => {
  creating.value = true

  try {
    const milestoneData = {
      ...newMilestone.value,
      project: props.projectId,
    }

    // Remove assigned_to if it's null or empty
    if (!milestoneData.assigned_to) {
      delete milestoneData.assigned_to
    }

    console.log('Creating milestone with data:', milestoneData)
    const response = await api.post('/milestones/', milestoneData)

    Notify.create({
      type: 'positive',
      message: 'Milestone created successfully!',
      icon: 'check_circle',
      position: 'top',
    })

    emit('milestone-created', response.data)
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Error creating milestone:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to create milestone',
      icon: 'error',
      position: 'top',
    })
  } finally {
    creating.value = false
  }
}

const handleMilestoneUpdate = (updatedMilestone) => {
  emit('milestone-updated', updatedMilestone)
}

const handleMilestoneDelete = (milestoneId) => {
  emit('milestone-deleted', milestoneId)
}

const handleMilestoneEdit = (milestone) => {
  currentMilestone.value = milestone
  editData.value = {
    name: milestone.name || '',
    description: milestone.description || '',
    due_date: milestone.due_date || '',
    priority: milestone.priority || 'medium',
    assigned_to: milestone.assigned_to || null,
  }
  showEditDialog.value = true
}

const updateMilestone = async () => {
  updating.value = true

  try {
    const milestoneData = {
      ...editData.value,
    }

    // Remove assigned_to if it's null or empty
    if (!milestoneData.assigned_to) {
      delete milestoneData.assigned_to
    }

    console.log('Updating milestone with data:', milestoneData)
    const response = await api.patch(`/milestones/${currentMilestone.value.id}/`, milestoneData)

    Notify.create({
      type: 'positive',
      message: 'Milestone updated successfully!',
      icon: 'check_circle',
      position: 'top',
    })

    emit('milestone-updated', response.data)
    showEditDialog.value = false
    currentMilestone.value = null
  } catch (error) {
    console.error('Error updating milestone:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to update milestone',
      icon: 'error',
      position: 'top',
    })
  } finally {
    updating.value = false
  }
}

const resetForm = () => {
  newMilestone.value = {
    name: '',
    description: '',
    due_date: '',
    priority: 'medium',
    assigned_to: null,
  }
}

// Watch for dialog close
watch(showCreateDialog, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

// Load users on component mount
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.milestone-manager {
  padding: 16px;
}

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
