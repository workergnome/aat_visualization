<!-- ###################   HTML   ################### -->
<template>
  <div id="app">
    <AATVisualization :root-id="id"/>
  </div>
</template>

<!-- ################### JAVACRIPT ################### -->
<script>
import AATVisualization from './components/AATVisualization.vue'

// Sample Data
const PROVENANCE        = "http://vocab.getty.edu/aat/300055863"
const COMINGS_OUT       = "http://vocab.getty.edu/aat/300248002"
const RHYTA             = "http://vocab.getty.edu/aat/300198841"
const MULTICULTURALISM  = "http://vocab.getty.edu/aat/300233662"
const GOLD              = "http://vocab.getty.edu/aat/300011021"
const ETHICS            = "http://vocab.getty.edu/aat/300054290"
const PUBLISHING_HOUSES = "http://vocab.getty.edu/aat/300386627"
const ROBES             = "http://vocab.getty.edu/aat/300209852"
const FOMECOR           = "http://vocab.getty.edu/aat/300196645"

export default {
  name: 'app',
  data () {
    return {
      id: PUBLISHING_HOUSES
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