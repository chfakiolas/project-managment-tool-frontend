<template>
  <q-card flat bordered class="milestone-item" :class="{ completed: milestone.completed }">
    <q-card-section class="q-pa-sm">
      <div class="row items-center">
        <!-- Checkbox -->
        <div class="col-auto q-mr-sm">
          <q-checkbox
            :model-value="milestone.completed"
            @update:model-value="toggleCompletion"
            :color="getPriorityColor(milestone.priority)"
          />
        </div>

        <!-- Milestone Info -->
        <div class="col">
          <div class="row items-center">
            <div class="col">
              <div
                class="text-body1 text-weight-medium"
                :class="{ 'text-strikethrough': milestone.completed }"
              >
                {{ milestone.name }}
              </div>
              <div v-if="milestone.description" class="text-caption text-grey-6 q-mt-xs">
                {{ milestone.description }}
              </div>
            </div>

            <!-- Priority Badge -->
            <div class="col-auto q-mr-sm">
              <q-chip
                :color="getPriorityColor(milestone.priority)"
                text-color="white"
                :label="milestone.priority"
                size="sm"
                :icon="getPriorityIcon(milestone.priority)"
              />
            </div>

            <!-- Status Indicators -->
            <div class="col-auto">
              <div class="row items-center q-gutter-xs">
                <!-- Overdue Indicator -->
                <q-icon
                  v-if="milestone.is_overdue"
                  name="warning"
                  color="negative"
                  size="sm"
                  title="Overdue"
                />

                <!-- Due Soon Indicator -->
                <q-icon
                  v-else-if="milestone.is_due_soon"
                  name="schedule"
                  color="warning"
                  size="sm"
                  title="Due Soon"
                />

                <!-- Completed Indicator -->
                <q-icon
                  v-if="milestone.completed"
                  name="check_circle"
                  color="positive"
                  size="sm"
                  title="Completed"
                />
              </div>
            </div>
          </div>

          <!-- Due Date and Assignee -->
          <div class="row items-center q-mt-xs">
            <div class="col">
              <div class="text-caption text-grey-6">
                <q-icon name="schedule" size="xs" class="q-mr-xs" />
                {{ formatDate(milestone.due_date) }}
              </div>
            </div>
            <div class="col-auto" v-if="milestone.assigned_to_name">
              <div class="text-caption text-grey-6">
                <q-icon name="person" size="xs" class="q-mr-xs" />
                {{ milestone.assigned_to_name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="col-auto">
          <q-btn
            flat
            round
            icon="edit"
            color="primary"
            size="sm"
            @click="editMilestone"
            title="Edit Milestone"
          />
          <q-btn
            flat
            round
            icon="delete"
            color="negative"
            size="sm"
            @click="deleteMilestone"
            title="Delete Milestone"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { api } from 'boot/axios'
import { Notify } from 'quasar'

const props = defineProps({
  milestone: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update', 'delete', 'edit'])

// Helper functions
const getPriorityColor = (priority) => {
  const colors = {
    low: 'grey',
    medium: 'blue',
    high: 'orange',
    critical: 'red',
  }
  return colors[priority] || 'grey'
}

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'keyboard_arrow_down',
    medium: 'remove',
    high: 'keyboard_arrow_up',
    critical: 'priority_high',
  }
  return icons[priority] || 'remove'
}

const formatDate = (dateString) => {
  if (!dateString) return 'No due date'

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays} days`

  return date.toLocaleDateString()
}

// Event handlers
const toggleCompletion = async () => {
  try {
    const response = await api.patch(`/milestones/${props.milestone.id}/`, {
      completed: !props.milestone.completed,
    })

    emit('update', response.data)

    Notify.create({
      type: 'positive',
      message: `Milestone ${props.milestone.completed ? 'reopened' : 'completed'}!`,
      icon: 'check_circle',
      position: 'top',
    })
  } catch (error) {
    console.error('Error updating milestone:', error)

    Notify.create({
      type: 'negative',
      message: 'Failed to update milestone',
      icon: 'error',
      position: 'top',
    })
  }
}

const editMilestone = () => {
  emit('edit', props.milestone)
}

const deleteMilestone = async () => {
  try {
    await api.delete(`/milestones/${props.milestone.id}/`)

    emit('delete', props.milestone.id)

    Notify.create({
      type: 'positive',
      message: 'Milestone deleted successfully!',
      icon: 'delete',
      position: 'top',
    })
  } catch (error) {
    console.error('Error deleting milestone:', error)

    Notify.create({
      type: 'negative',
      message: 'Failed to delete milestone',
      icon: 'error',
      position: 'top',
    })
  }
}
</script>

<style scoped>
.milestone-item {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.milestone-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.milestone-item.completed {
  opacity: 0.7;
  background-color: rgba(76, 175, 80, 0.05);
  border-left-color: #4caf50;
}

.text-strikethrough {
  text-decoration: line-through;
}
</style>
