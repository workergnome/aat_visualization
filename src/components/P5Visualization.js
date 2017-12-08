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

  const BACKGROUND_COLOR = 220

  const HIGHLIGHT_WIDTH  = 5
  const LINE_WIDTH       = 2
  const LINE_COLOR       = 75

  const TEXT_COLOR       = 0
  const TEXT_MARGIN      = 6

  const BOX_COLOR        = 255
  const BOX_LINE_COLOR   = 100
  const ROOT_BOX_LINE_COLOR = 0
  const BOX_LINE_WIDTH   = 1

  const CHILD_COLOR      = 240
  const CHILD_LINE_COLOR = 180
  let data = null;

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
    if (!p.nodes) {
      drawLoadingMessage(p,"loading visualization");
    }
    else {
      // p.noLoop();
      if (!data) {
        data = computeVisualization(p,p.nodes);
      }
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
  const computeVisualization = function(p,nodes) {

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
    nodes.forEach((link, linkIndex) => {
        const nodeData = { 
          label: link.label,  
          width: boxWidth, 
          height: boxHeight, 
          children: link.children,
          parents: link.parents,
          id: link.id
        }

        g.setNode(link.id,nodeData)    
        link.children.forEach(child => g.setEdge(link.id, child));
    })

    // Run the layout code
    dagre.layout(g, config);
    
    // Return the nodes
    return g.nodes().map( node => g.node(node));
  }

  // Actually do the drawing bits
  //---------------------------------------------------
  const renderVisualization = function(p,data) {

    // Draw the lines first, so they're under the boxes.
    let seenLines = {};
    for(var obj of data) {
      let sortedChildren = obj.children.sort((a,b) => {
        const child1 = data.find(child => child.id == a)
        const child2 = data.find(child => child.id == b)
        let val = p.abs(obj.x - child1.x) >= p.abs(obj.x -child2.x) ? 1 : -1;
        return val
      })
      sortedChildren.forEach(childId => {
        let child = data.find(p => p.id == childId)

        // Calculate the x positions of the line.
        let x1 = p.map(obj.x,0,vizWidth,child.x+boxWidth*.15,child.x+boxWidth*.45)
        let x2 = p.map(child.x,0,vizWidth,obj.x+boxWidth*.15,obj.x+boxWidth*.45)

        // set the start and end point of the line
        let y1 = child.y;
        let y3 = obj.y + boxHeight;
        let y2 = (y1 - marginY);

        // if the vertical section of the line crosses a box, move it to the top.
        for(var box of data) {

          // if the box is not the obj or the child,
          if (box != obj && box != child) {
            // if the box overlaps horizontally,
            if (box.x < x2 && box.x + boxWidth > x2) {
              // and if overlaps horizontally,
              if (box.y < y1 && box.y > y3) {
                // we have a winner!  Flip it.
                y2 = y3 + marginY;
                break;
              }
            }
          }
        }    

        // If there's an overlap, move the line down a bit.
        if (seenLines[y2]) {
          for(var segment of seenLines[y2]) {
            let max1 = p.max(segment[0],segment[1])
            let max2 = p.max(x1,x2)
            let min1 = p.min(segment[0],segment[1])
            let min2 = p.min(x1,x2)
            if (p.max(0, p.min(max1, max2) - p.max(min1, min2)) > 0) {
              y2 -= HIGHLIGHT_WIDTH;
              break;
            }
          }
        }

        // Add the line segment to the known ones.
        if (x1 != x2) {
          if (!seenLines[y2]){seenLines[y2] = []}
          let arr = [x1,x2]
          seenLines[y2].push(arr)
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
        p.vertex(x1,y1-4);
        p.vertex(x1,y2);
        p.vertex(x2,y2);
        p.vertex(x2,y3);
        p.endShape();

        // draw the lovely little arrow ends
        p.triangle(x1,y1-1,x1-1,y1-4,x1+1,y1-4)
      })
    }

    // Draw the rectangles.
    // TODO:  internationalize these labels.
    for(var obj of data) {
      if (obj.parents && obj.parents.includes(p.rootId)) {
        p.fill(CHILD_COLOR)
        p.stroke(CHILD_LINE_COLOR)
      }
      else {
        p.fill(BOX_COLOR);
        p.stroke(BOX_LINE_COLOR)
      }


      // Draw the second border if it's the rootID
      if (obj.id == p.rootId) {
        p.stroke(ROOT_BOX_LINE_COLOR);
        p.strokeWeight(BOX_LINE_WIDTH + 0.5)
        p.rect(obj.x,obj.y,boxWidth, boxHeight)
        p.stroke(BOX_LINE_COLOR);
        p.strokeWeight(BOX_LINE_WIDTH )
        p.rect(obj.x+3,obj.y+2.5,boxWidth-6, boxHeight-6)
      }
      else {
        p.strokeWeight(BOX_LINE_WIDTH)
        p.rect(obj.x,obj.y,boxWidth, boxHeight)

      }

      // Draw the text.
      p.fill(TEXT_COLOR)
      p.noStroke();
      p.text(obj.label,obj.x+TEXT_MARGIN,obj.y+TEXT_MARGIN,boxWidth-TEXT_MARGIN*2, boxHeight-TEXT_MARGIN*2)
    }
  }

};
export default p5_sketch;