<template>
  <q-card flat bordered class="my-card">
    <q-card-section>
      <div class="text-h6">{{ project.title }}</div>
    </q-card-section>

    <q-separator inset />

    <q-card-section>
      <div class="flex">
        <div>
          <span>Progress:</span>
        </div>

        <q-linear-progress size="20px" :value="project.progress" color="accent" rounded>
          <div class="absolute-full flex flex-center">
            <q-badge color="white" text-color="accent" :label="`${project.progress}%`" />
          </div>
        </q-linear-progress>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      {{ project.description }}
    </q-card-section>
  </q-card>
</template>
<script setup>
defineProps({
  project: {
    type: Object,
    required: true,
  },
})
</script>
