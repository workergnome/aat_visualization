<!-- ###################   HTML   ################### -->
<template>
  <div id='p5_viz'/>
</template>

<!-- ################### JAVACRIPT ################### -->
<script>
import p5 from "p5";
import ChainBuilder from "./ChainBuilder.js";
import P5Visualization from './P5Visualization.js';

export default { 
  // Externally-passed properties
  // ------------------------------------------------------
  props: ["idNumber"],

  // Internal state
  // ------------------------------------------------------
  data: function() {
    return {
      sketch: null
    }
  },

  // Lifecycle hooks
  // ------------------------------------------------------
  created: function() {
    new ChainBuilder(this.idNumber, chains => this.sketch.chains = chains)
  },
  mounted: function() {
    this.sketch = new p5(P5Visualization,"p5_viz");
  },
  beforeDestroy: function() {
    this.sketch.remove();
  }
}
</script>

<!-- ###################    CSS    ################### -->
<style lang="sass">
  
</style>