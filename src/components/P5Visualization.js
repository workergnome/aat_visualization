import dagre from "dagre";

var p5_sketch = function(p) {

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

  const HIGHLIGHT_WIDTH  = 3
  const LINE_WIDTH       = 1
  const BACKGROUND_COLOR = 220
  const LINE_COLOR       = 0
  const TEXT_COLOR       = 0
  const BOX_COLOR        = 255


  // Initialize the canvas area
  //---------------------------------------------------
  p.setup = function(){
    p.createCanvas(canvasWidth, canvasHeight);
    p.textAlign(p.CENTER, p.CENTER)
  }

  // Core Draw Loop
  //---------------------------------------------------
  p.draw = function() {
    p.background(BACKGROUND_COLOR);
    if (!p.chains) {
      drawLoadingMessage(p,"loading visualization");
    }
    else {
      p.noLoop();
      const data = computeVisualization(p,p.chains);
      renderVisualization(p,data);
    }
  }

  // Draw the rendering message. 
  // Assume this'll be more sophisticated at some point.
  // TODO:  internationalize the message.
  //---------------------------------------------------
  const drawLoadingMessage =function(p, msg) {
    p.text(msg, 400,400)
  } 

  // Given the list of nodes, compute their positions
  // using the `dagre` library.
  //---------------------------------------------------
  const computeVisualization = function(p,chains) {

    // Initialize the graph library
    let g = new dagre.graphlib.Graph();

    // Set some defaults
    const config = {
      ranksep: marginY*2,
      nodesep: marginX*2,
      ranker: "network-simplex",
    }
    g.setGraph(config);
    g.setDefaultEdgeLabel(function() { return {}; });

    // Build the nodes and edges (and cache the children)
    let childLookup = {}
    chains.forEach((chain, chainIndex) => {
      chain.forEach((link, linkIndex) => {
          g.setNode(link.id,    { label: link.label,  width: boxWidth, height: boxHeight });
          childLookup[link.id] = link.children
          link.children.forEach(child => g.setEdge(link.id, child));
      }) 
    })

    // Run the layout code
    dagre.layout(g, config);
    
    // augment the graph with additional bits of data.
    let data = g.nodes().map( node => {
      let obj = g.node(node)
      obj.id = node
      obj.children = childLookup[node]
      return obj
    })

    return data;
  }

  // Actually do the drawing bits
  //---------------------------------------------------
  const renderVisualization = function(p,data) {


    // Draw the lines first, so they're under the boxes.
    for(var obj of data) {
      obj.children.forEach(childId => {
        let child = data.find(p => p.id == childId)

        // Calculate the x positions of the line.
        let x1 = p.map(obj.x,0,vizWidth,child.x+boxWidth*.2,child.x+boxWidth*.4)
        let x2 = p.map(child.x,0,vizWidth,obj.x+boxWidth*.2,obj.x+boxWidth*.4)

        // set the start and end point of the line
        let y1 = child.y;
        let y3 = obj.y + boxHeight;

        // calculate the middle y position of the line.
        // TODO:  handle calculating overlaps
        // There's probably clever matg that would work for calculating 
        //    the number of skipped rows, 
        //     but I'm just faking it for 1, 2, 3, and 4 skips.
        let y2 = null;
        if (y1-y3 == marginY*2) {
          y2 = p.map(child.x,vizWidth,0,y1-marginY/2,y3+marginY/2)
        }
        else if (y1-y3 == marginY*2+rowHeight){
          y2 = p.map(child.x,vizWidth,0,y1-marginY/2,y3+rowHeight+marginY/2)
        }
        else if (y1-y3 == marginY*2+rowHeight*2){
          y2 = p.map(child.x,vizWidth,0,y1-marginY/2,y3+rowHeight*2+marginY/2)
        }
        else if (y1-y3 == marginY*2+rowHeight*3){
          y2 = p.map(child.x,vizWidth,0,y1-marginY/2,y3+rowHeight*3+marginY/2)
        }
        else {
          y2 =  (y1 - marginY)
        }

        // draw the highlights under the lines
        p.noFill();
        p.stroke(BACKGROUND_COLOR)
        p.strokeWeight(HIGHLIGHT_WIDTH)
        p.beginShape();
        p.vertex(x1,y1);
        p.vertex(x1,y2);
        p.vertex(x2,y2);
        p.vertex(x2,y3);
        p.endShape();

        // Actually draw the lines.
        p.noFill();
        p.stroke(LINE_COLOR)
        p.strokeWeight(LINE_WIDTH)
        p.beginShape();
        p.vertex(x1,y1);
        p.vertex(x1,y2);
        p.vertex(x2,y2);
        p.vertex(x2,y3);
        p.endShape();
      })
    }

    // Draw the rectangles.
    // TODO:  internationalize these labels.
    for(var obj of data) {
      p.fill(BOX_COLOR);
      p.stroke(LINE_COLOR)
      p.rect(obj.x,obj.y,boxWidth, boxHeight)
      p.noStroke();
      p.fill(TEXT_COLOR)
      p.text(obj.label,obj.x,obj.y,boxWidth, boxHeight)
    }
  }

};
export default p5_sketch;