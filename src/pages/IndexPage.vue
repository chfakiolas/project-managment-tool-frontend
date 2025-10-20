<template>
  <q-page class="flex flex-center">
    <!-- <img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    /> -->

    <div class="row">
      <div class="col-12 projects-container" v-if="totalProjects && totalProjects > 0">
        <q-card flat bordered class="my-card" v-for="project in projects" :key="project.id">
          <q-card-section>
            <div class="text-h6">{{ project.title }}</div>
          </q-card-section>

          <q-separator inset />

          <q-card-section class="q-pt-none">
            {{ project.description }}
          </q-card-section>
        </q-card>
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
  max-width: 250px;
}
.projects-container {
  display: flex;
  gap: 10px;
}
</style>
