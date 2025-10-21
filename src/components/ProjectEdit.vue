<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)" persistent>
    <q-card style="min-width: 600px; max-width: 800px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Project</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="updateProject" class="q-gutter-md">
          <!-- Project Title -->
          <q-input
            v-model="editData.title"
            label="Project Title *"
            outlined
            :rules="[(val) => !!val || 'Title is required']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="title" />
            </template>
          </q-input>

          <!-- Description -->
          <q-input
            v-model="editData.description"
            label="Description *"
            outlined
            type="textarea"
            rows="4"
            :rules="[(val) => !!val || 'Description is required']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="description" />
            </template>
          </q-input>

          <!-- Project Owner -->
          <q-select
            v-model="editData.owner"
            label="Project Owner *"
            outlined
            :options="userOptions"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Owner is required']"
            :loading="loadingUsers"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-select>

          <!-- Project Status -->
          <q-select
            v-model="editData.status"
            label="Project Status *"
            outlined
            :options="statusOptions"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Status is required']"
          >
            <template v-slot:prepend>
              <q-icon name="flag" />
            </template>
          </q-select>

          <!-- Tags -->
          <q-select
            v-model="editData.tags"
            label="Tags"
            outlined
            multiple
            use-chips
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            hint="Press Enter to add custom tags"
            :options="tagOptions"
          >
            <template v-slot:prepend>
              <q-icon name="label" />
            </template>
          </q-select>

          <!-- Team Roster -->
          <div class="q-mt-md">
            <div class="text-subtitle1 q-mb-sm">Team Roster</div>
            <q-select
              v-model="editData.team_roster"
              label="Team Members"
              outlined
              multiple
              use-chips
              :options="userOptions"
              emit-value
              map-options
              hint="Select team members for this project"
              :loading="loadingUsers"
            >
              <template v-slot:prepend>
                <q-icon name="groups" />
              </template>
            </q-select>
          </div>

          <div class="row q-mt-md">
            <q-space />
            <q-btn flat label="Cancel" color="grey-7" v-close-popup class="q-mr-sm" />
            <q-btn
              unelevated
              label="Update Project"
              type="submit"
              color="primary"
              :loading="updating"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { api } from 'boot/axios'
import { Notify } from 'quasar'

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

const emit = defineEmits(['update:show', 'project-updated'])

const updating = ref(false)
const loadingUsers = ref(false)
const userOptions = ref([])
const editData = ref({
  title: '',
  description: '',
  status: '',
  tags: [],
  owner: null,
  team_roster: [],
})

// Status options
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const tagOptions = ref([
  'Frontend',
  'Backend',
  'Mobile',
  'DevOps',
  'Design',
  'Testing',
  'High Priority',
  'Low Priority',
])

// Load users from backend
const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await api.get('/users/')
    if (response.data && response.data.length > 0) {
      userOptions.value = response.data.map((user) => ({
        label: user.username || `${user.first_name} ${user.last_name}`.trim() || `User ${user.id}`,
        value: user.id,
      }))
    } else {
      userOptions.value = []
    }
  } catch {
    console.warn('Could not load users')
    userOptions.value = []
  } finally {
    loadingUsers.value = false
  }
}

// Watch for project changes
watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      editData.value = {
        title: newProject.title || '',
        description: newProject.description || '',
        status: newProject.status || 'active',
        tags: newProject.tags || [],
        owner: newProject.owner || null,
        team_roster: newProject.team_roster || [],
      }
    }
  },
  { immediate: true },
)

// Load users on mount
onMounted(() => {
  loadUsers()
})

// Update project
const updateProject = async () => {
  updating.value = true

  try {
    const response = await api.put(`/projects/${props.project.id}/`, editData.value)

    Notify.create({
      type: 'positive',
      message: 'Project updated successfully!',
      icon: 'check_circle',
      position: 'top',
    })

    emit('project-updated', response.data)
    emit('update:show', false)
  } catch (error) {
    console.error('Error updating project:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to update project',
      icon: 'error',
      position: 'top',
    })
  } finally {
    updating.value = false
  }
}
</script>
