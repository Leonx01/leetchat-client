<route lang="yaml">
name: reload
</route>

<script setup lang="ts">
import {ElMessage} from "element-plus";

const router = useRouter()

onMounted(() => {
  router.go(-1)
})
</script>

<template>
  <div />
</template>
