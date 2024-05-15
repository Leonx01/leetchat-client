<script lang="ts">
export default {
  setup() {
    return {}
  },
  data() {
    return {
      uid: this.$route.query.uid
    }
  },
}
</script>

<template>
  <ChatRoom :uid="uid"/>
</template>

<style scoped lang="scss">

</style>
