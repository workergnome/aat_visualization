<!-- ###################   HTML   ################### -->
<template>
  <div id="app">
    <AATVisualization :id-number="id"/>
  </div>
</template>

<!-- ################### JAVACRIPT ################### -->
<script>
import AATVisualization from './components/AATVisualization.vue'

const PROVENANCE = 300055863
const COMINGS_OUT = 300248002
const RHYTA = 300198841
const MULTICULTURALISM = 300233662
const GOLD = 300011021

export default {
  name: 'app',
  data () {
    return {
      id: RHYTA
    }
  },
  components: {
    AATVisualization
  }
}
</script>


<!-- ###################    CSS    ################### -->
<style lang="sass">
</style>