<template>
  <div id="app">
    <AATVisualization :id-number="id"/>
  </div>
</template>

<script>
import AATVisualization from './components/AATVisualization.vue'

export default {
  name: 'app',
  data () {
    return {
      id: "300233662"
    }
  },
  components: {
    AATVisualization
  }
}
</script>

<style lang="scss">
</style>
