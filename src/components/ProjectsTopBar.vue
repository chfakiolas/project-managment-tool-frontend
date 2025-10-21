<template>
  <q-header elevated class="bg-white text-grey-9">
    <q-toolbar class="q-px-md">
      <q-toolbar-title class="text-weight-bold text-primary">
        <q-icon name="dashboard" size="sm" class="q-mr-sm" />
        Project Dashboard
      </q-toolbar-title>

      <!-- Search Bar -->
      <q-input
        v-model="searchQuery"
        dense
        standout
        placeholder="Search in projects..."
        class="search-input q-mx-md"
        style="min-width: 400px"
        @update:model-value="handleSearch"
        debounce="300"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
        <template v-slot:append>
          <q-icon v-if="searchQuery" name="close" class="cursor-pointer" @click="clearSearch" />
        </template>
      </q-input>

      <q-space />

      <!-- Create Project Button -->
      <q-btn
        unelevated
        color="primary"
        label="New Project"
        icon="add"
        @click="showCreateDialog = true"
        class="q-ml-sm"
      />
    </q-toolbar>
  </q-header>

  <!-- Create Project Dialog -->
  <q-dialog v-model="showCreateDialog" persistent>
    <q-card style="min-width: 600px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Create New Project</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="createProject" class="q-gutter-md">
          <!-- Project Title -->
          <q-input
            v-model="newProject.title"
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
            v-model="newProject.description"
            label="Description *"
            outlined
            type="textarea"
            rows="3"
            :rules="[(val) => !!val || 'Description is required']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="description" />
            </template>
          </q-input>

          <!-- Project Owner -->
          <!-- <q-input
            v-model="newProject.owner"
            label="Project Owner *"
            outlined
            :rules="[(val) => !!val || 'Owner is required']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input> -->

          <!-- Project Status -->
          <q-select
            v-model="newProject.status"
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
            v-model="newProject.tags"
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

          <div class="row q-mt-md">
            <q-space />
            <q-btn flat label="Cancel" color="grey-7" v-close-popup class="q-mr-sm" />
            <q-btn
              unelevated
              label="Create Project"
              type="submit"
              color="primary"
              :loading="creating"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { api } from 'boot/axios'
// import { useQuasar } from 'quasar'
import { Notify } from 'quasar'
const emit = defineEmits(['search', 'project-created'])

// const $q = useQuasar()
const searchQuery = ref('')
// Dialog state
const showCreateDialog = ref(false)
const creating = ref(false)

// new project data
const newProject = ref({
  title: '',
  description: '',
  owner: 1,
  status: 'active',
  tags: [],
})

// status options for now
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

const handleSearch = (value) => {
  emit('search', value)
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('search', '')
}

const resetForm = () => {
  newProject.value = {
    title: '',
    description: '',
    owner: 1,
    status: 'active',
    tags: [],
  }
}

const createProject = async () => {
  creating.value = true

  try {
    const response = await api.post('/projects/', newProject.value)

    Notify.create({
      type: 'positive',
      message: 'Project created successfully!',
      icon: 'check_circle',
      position: 'top',
    })

    emit('project-created', response.data)
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Error creating project:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to create project',
      icon: 'error',
      position: 'top',
    })
  } finally {
    creating.value = false
  }
}
</script>

<style scoped lang="scss">
.search-input {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;

  :deep(.q-field__control) {
    border-radius: 8px;
  }
}
</style>
