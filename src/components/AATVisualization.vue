<template>
  <div v-if="isLoading">
    Loading
  </div>
  <div v-else>
    {{ idNumber}}
    <ul>
      <li v-for="(row, index) in rows">
        {{index}} - {{ row.map(e => e.label).join(", ") }}
      </li>
    </ul>
    <div id='p5_viz'/>
  </div>
</template>


<script>
import ChainBuilder from "./ChainBuilder.js";
import p5 from "p5";

export default {
  props: ["idNumber"],

  data: function() {
    return {
      isLoading: true,
      rows: [],
      sketch: null
    }
  },

  created: function() {
    new ChainBuilder(this.idNumber, this.chainCallback)
  },

  mounted: function() {
    if (this.sketch) {return;}

    var sketch = function(p) {

      // Rendering Constants
      //---------------------------------------------------
      
      let   canvasWidth  = 800;
      let   canvasHeight = 1200;
      const rowHeight    = 100;
      const colWidth     = 150;
      const marginX      = 10;
      const marginY      = 14;
      const boxHeight    = rowHeight-marginY*2;
      const boxWidth     = colWidth-marginX*2;
      let   vizWidth     = canvasWidth - marginX * 2
      let   vizHeight    = canvasWidth - marginY * 2
      let   rowOffset    = (600-boxWidth);

      // Initialize the canvas area
      //---------------------------------------------------
      p.setup = function(){
        p.createCanvas(canvasWidth, canvasHeight);
        p.textAlign(p.CENTER, p.CENTER)
      }

      // Core Draw Loop
      //---------------------------------------------------
      p.draw = function() {
        p.background(220);
        if (!p.rows) {
          drawLoadingMessage(p,"loading visualization");
        }
        else {
          p.noLoop();
          p.translate(marginX,marginY)
          rowOffset = 0//(vizWidth-boxWidth)/p.rows[0].length;
          const data = computeVisualization(p);
          renderVisualization(p,data);
        }
      }

      //---------------------------------------------------
      const drawLoadingMessage =function(p, msg) {
        p.text(msg, 400,400)
      } 

      //---------------------------------------------------
      const computeVisualization = function(p) {
        let data = {};

        p.rows.forEach((chain, chainIndex) => {
          chain.forEach((link, linkIndex) => {

            // Build dummy object
            let obj = {
              x: chainIndex*colWidth+ rowOffset*linkIndex,
              y: rowHeight*linkIndex,
              item: link
            }



            // let lastParentY = 0
            // for(var parent of link.parents) {
            //   let parentData = data[parent]
            //   if (parentData) {
            //     obj.x = parentData.x + rowOffset
            //     if (parentData.y > lastParentY) {
            //       lastParentY = parentData.y
            //     }
            //     if (parentData.item.children) {
            //       let seenSiblings = parentData.item.children.map(child => data[child]).filter(e=> e)
            //       let seenSiblingCount = parentData.item.children.map(child => data[child] ? 1 : 0).reduce((a,b) =>{return a+b}, 0)
            //       if (seenSiblingCount) {
            //         obj.x -= seenSiblingCount*colWidth + colWidth/2
            //       }
            //     }
            //   }
            //}
            //obj.y = lastParentY + rowHeight;
            
            // Store item in the 'seen' cache.
            data[link.id] = obj
          }) 
        })

        // center multiple parents
        data = centerBetweenParents(data)
    
        return data;
      }

      // Iterate through all keys and center any object 
      // with multiple parents between those parents
      //---------------------------------------------------
      const centerBetweenParents = function(data) {
        for(var key in data) {
          let obj = data[key]
          if (obj.item.parents.length > 1) {
            let centerSum = obj.item.parents
              .map(parent => data[parent].x)
              .reduce((a,b) => {return a + b},0)
            data[key].x = centerSum / obj.item.parents.length
          }
        }
        return data
      }

      //---------------------------------------------------
      const renderVisualization = function(p,data) {
        p.strokeCap(p.SQUARE)
        for(var key in data) {
          let obj = data[key]
          p.fill(255);
          p.stroke(0)
          p.rect(obj.x,obj.y,boxWidth, boxHeight)
          p.noStroke();
          p.fill(0)
          p.text(obj.item.label,obj.x,obj.y,boxWidth, boxHeight)
          obj.item.parents.forEach(parent => {
            parent = data[parent]

            const x1 = obj.x+boxWidth/4;
            const x2 = parent.x+boxWidth/4;
            const y1 = obj.y;
            const y3 = parent.y + boxHeight;
            const y2 = (y1 - marginY)
            p.noFill();
            p.stroke(0)
            p.beginShape();
            p.vertex(x1,y1);
            p.vertex(x1,y2);
            p.vertex(x2,y2);
            p.vertex(x2,y3);
            p.endShape();

          })
        }
      }

    };
    this.sketch = new p5(sketch,"p5_viz");
  },
  beforeDestroy: function() {
    this.sketch.remove()
  },

  watch: {
    rows: function(val) {
      this.sketch.rows = val
    }
  },
  methods: {
    chainCallback: function(rows) {
      this.rows = rows;
      this.isLoading = false;
    } 
  }

}
</script>

<style lang="sass">

</style>
