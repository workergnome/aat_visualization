<!-- ###################   HTML   ################### -->
<template>
  <div id='p5_viz'/>
</template>

<!-- ################### JAVACRIPT ################### -->
<script>
import p5 from "p5";
import NodeDownloader from "./NodeDownloader.js";
import P5Visualization from './P5Visualization.js';

export default { 
  // Externally-passed properties
  // ------------------------------------------------------
  props: ["rootId", "language"],

  // Internal state
  // ------------------------------------------------------
  data: function() {
    return {
      sketch: null
    }
  },

  // Lifecycle hooks
  // ------------------------------------------------------
  mounted: function() {
    this.sketch = new p5(P5Visualization,"p5_viz");
    this.sketch.rootId = this.rootId;
    new NodeDownloader(this.rootId, this.language, nodes => this.sketch.nodes = nodes)
  },
  beforeDestroy: function() {
    this.sketch.remove();
  }
}
</script>

<!-- ###################    CSS    ################### -->
<style lang="sass">
  
</style>