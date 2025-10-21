<template>
  <q-page class="flex q-pa-xl">
    <projects-top-bar @project-created="loadProjects" />
    <div class="row">
      <div class="col-12 projects-container q-pa-xl" v-if="totalProjects && totalProjects > 0">
        <project-card v-for="project in projects" :key="project.id" :project="project" />
      </div>
      <div class="col-12" v-else>There are no projects yet</div>
      <div class="col-12">
        <q-btn v-if="previousPage" color="primary" label="Previous" />
        <q-btn v-if="nextPage" color="primary" label="Next" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from 'src/boot/axios'
import ProjectCard from 'src/components/ProjectCard.vue'
import ProjectsTopBar from 'src/components/ProjectsTopBar.vue'

const projects = ref([])
const totalProjects = ref(null)
const nextPage = ref(null)
const previousPage = ref(null)

async function loadProjects() {
  const res = await api.get('projects/')
  console.log(res.data.results, res)
  if (res.status === 200) {
    projects.value = res.data.results
    totalProjects.value = res.data.count
    nextPage.value = res.data.next
    previousPage.value = res.data.previous
  }
}

onMounted(() => {
  loadProjects()
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
</style>
