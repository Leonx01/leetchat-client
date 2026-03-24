<script lang="ts" setup>
import { computed } from 'vue'

const route = useRoute()

const uid = computed(() => {
  const raw = route.query.uid
  if (Array.isArray(raw)) {
    return raw[0] ?? ''
  }
  return raw ?? ''
})
</script>

<template>
  <ChatRoom :uid="uid" />
</template>

<style scoped lang="scss">

</style>
