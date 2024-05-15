<script setup lang="ts">
const router = useRouter();
</script>

<template>
<div>
  <PageHeader>
    <template #title>
      测试页面
    </template>
  </PageHeader>
  <PageMain>
    <el-button @click="()=>{
      this.$router.push({
        path: '/MailBox/index',
        query: {
          id: 1
        }
      })
    }">测试</el-button>

<!--    <VideoWindow :src="src"></VideoWindow>-->
  </PageMain>
</div>
</template>

<style scoped lang="scss">

</style>
