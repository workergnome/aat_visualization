import dagre from "dagre";

var p5_sketch = function(p) {

  // Rendering Constants
  //---------------------------------------------------
  const ROW_HEIGHT    = 100;
  const COL_WIDTH     = 150;
  const MARGIN_X      = 10;
  const MARGIN_Y      = 14;
  const BOX_HEIGHT    = ROW_HEIGHT-MARGIN_Y*2;
  const BOX_WIDTH     = COL_WIDTH-MARGIN_X*2;

  const BACKGROUND_COLOR = 220

  const HIGHLIGHT_WIDTH     = 5
  const LINE_WIDTH          = 2
  const LINE_COLOR          = 75
   
  const TEXT_COLOR          = 0
  const TEXT_MARGIN         = 6

  const BOX_COLOR           = 250
  const BOX_LINE_COLOR      = 100
  const ROOT_BOX_LINE_COLOR = 0
  const ROOT_BOX_COLOR      = [240,240,255]
  const BOX_LINE_WIDTH      = 1

  const CHILD_COLOR         = 240
  const CHILD_LINE_COLOR    = 180

  // Global variables.  (Canvas width should be computed.)
  //---------------------------------------------------
  let canvasWidth  = 10;
  let canvasHeight = 10;
  let vizWidth     = canvasWidth - MARGIN_X * 2
  let vizHeight    = canvasHeight - MARGIN_Y * 2
  let horizontalSize = 0;
  let verticalSize = 0;
  let startX = 0;
  let startY = 0;

  let scaleFactor = 1;
  let xOffset = 0;
  let yOffset = 0;

  let data = null;

  // Initialize the canvas area
  //---------------------------------------------------
  p.setup = function(){
    p.createCanvas(canvasWidth, canvasHeight);
    p.textAlign(p.CENTER, p.CENTER)
    recalculateSize(p)
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
        recalculateSize(p);
      }

      p.scale(scaleFactor)
      p.translate(xOffset,yOffset);
      renderVisualization(p,data);
    }
  }

  p.windowResized = function() {
    recalculateSize(p);
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
    const g = new dagre.graphlib.Graph();

    // Set some defaults
    const config = {
      ranksep: MARGIN_Y*2,
      nodesep: MARGIN_X*2,
      ranker: "network-simplex",
    }
    g.setGraph(config);
    g.setDefaultEdgeLabel(function() { return {}; });

    // Build the nodes and edges (and cache the children)
    nodes.forEach((node, nodeIndex) => {
        const nodeData = { 
          label: node.label,  
          width: BOX_WIDTH, 
          height: BOX_HEIGHT, 
          children: node.children,
          parents: node.parents,
          id: node.id
        }

        g.setNode(node.id,nodeData)    
        node.children.forEach(child => g.setEdge(node.id, child));
    })

    // Run the layout code
    dagre.layout(g, config);
             console.log(g)

    const returnedNodes = g.nodes().map( node => g.node(node));
    
    // Calculate visualization size
    let maxX = 0;
    let minX = canvasWidth;
    let maxY = 0;
    let minY = canvasHeight;
    for (const n of returnedNodes) {
      maxX = p.max(maxX,n.x)
      minX = p.min(minX,n.x)
      maxY = p.max(maxY,n.y)
      minY = p.min(minY,n.y)
    }
    startX = minX;
    startY = minY;
    horizontalSize = (maxX+BOX_WIDTH - minX)
    verticalSize = (maxY+BOX_HEIGHT - minY)

    // Return the nodes
    return returnedNodes;
  }

  const recalculateSize = function(p) {
    // console.log(document.getElementById("p5_viz"))
    canvasWidth  = p.parent.offsetWidth;
    canvasHeight = p.parent.offsetHeight;
    p.resizeCanvas(canvasWidth, canvasHeight);
    vizWidth     = canvasWidth - MARGIN_X * 2
    vizHeight    = canvasHeight - MARGIN_Y * 2
    
    if (data) {
      const xScale = p.min(1,vizWidth/horizontalSize);
      const yScale = p.min(1,vizHeight/verticalSize);
      scaleFactor = p.min(xScale,yScale)
      xOffset = -startX+canvasWidth/scaleFactor/2-horizontalSize/2;
      yOffset = -startY+canvasHeight/scaleFactor/2-verticalSize/2;
    }
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
        const LEFTMOST = .15
        const RIGHTMOST = .45
        let x1 = p.map(obj.x,0,vizWidth,child.x+BOX_WIDTH*LEFTMOST,child.x+BOX_WIDTH*RIGHTMOST)
        let x2 = p.map(child.x,0,vizWidth,obj.x+BOX_WIDTH*LEFTMOST,obj.x+BOX_WIDTH*RIGHTMOST)

        // set the start and end point of the line
        let y1 = child.y;
        let y3 = obj.y + BOX_HEIGHT;
        let y2 = (y1 - MARGIN_Y);

        // if the vertical section of the line crosses a box, move it to the top.
        for(var box of data) {

          // if the box is not the obj or the child,
          if (box != obj && box != child) {
            // if the box overlaps horizontally,
            if (box.x < x2 && box.x + BOX_WIDTH > x2) {
              // and if overlaps horizontally,
              if (box.y < y1 && box.y > y3) {
                // we have a winner!  Flip it.
                y2 = y3 + MARGIN_Y;
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
        p.fill(ROOT_BOX_COLOR);
        p.stroke(ROOT_BOX_LINE_COLOR);
        p.strokeWeight(BOX_LINE_WIDTH + 0.5)
        p.rect(obj.x,obj.y,BOX_WIDTH, BOX_HEIGHT)
        p.stroke(BOX_LINE_COLOR);
        p.strokeWeight(BOX_LINE_WIDTH )
        p.rect(obj.x+3,obj.y+2.5,BOX_WIDTH-6, BOX_HEIGHT-6)
      }
      else {
        p.strokeWeight(BOX_LINE_WIDTH)
        p.rect(obj.x,obj.y,BOX_WIDTH, BOX_HEIGHT)

      }

      // Draw the text.
      if (obj.label) {
        p.fill(TEXT_COLOR)
        p.noStroke();
        p.text(obj.label,obj.x+TEXT_MARGIN,obj.y+TEXT_MARGIN,BOX_WIDTH-TEXT_MARGIN*2, BOX_HEIGHT-TEXT_MARGIN*2)
      }
    }
  }

};
export default p5_sketch;