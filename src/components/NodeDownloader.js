import axios from "axios";

class NodeDownloader {
  constructor(rootUrl, callback) {

    // Set up some instance variables
    this.nodes = {}
    this.callback = callback;
    this.rootUrl = rootUrl;

    // Prime the data
    this.undownloadedIds = [this.rootUrl];
    
    // Build the thing
    this.downloadIds();
  }

  // ---------------------------------------------------
  // Step 1. Recursively get the list of parents and children 
  //
  // TODO: Use promises to download all still-unseen ids, 
  //       rather than sequentially, recursively, asyncronously downloading them.
  //
  // TODO: Figure out how to let the endpoint be passed in as configuration.
  downloadIds() {
    let id = this.undownloadedIds.pop();
    if (!id) {
      this.pruneNodes();
    }
    else {
      id = id.match(/.*\/(\d+)/)[1];
      const url = "http://localhost:8080/aat/"+id+".json"

      axios.get(url)
        .then(function (response) {
          
          // Process the response and add it as a new node
          const data = response.data;
          const obj = {
            id: data.id,
            label: data.label,
            children: data.has_child,
            parents: data.has_parent
          }
          this.nodes[obj.id] = obj

          // If you are the root object, 
          // add your children to the queue
          if (obj.id == this.rootUrl) {
          for (const child of obj.children) {
              this.undownloadedIds.push(child)
            }
          }

          // if you're not a child of the root object, 
          // add your yet-unseen parents to the queue
          if (!obj.parents.includes(this.rootUrl)) {
            for (const parent of obj.parents) {
              if (!this.nodes.hasOwnProperty(parent)) {
                this.undownloadedIds.push(parent)
              }
            }
          }

          // Recursively call this function to download the next ID.
          this.downloadIds();

        }.bind(this))
        .catch(function (error) {
          console.log("error downloading:", error);
        });
      }
   }

   // ---------------------------------------------------
   // Step 2. Remove all parents and children that aren't part of the graph.
   pruneNodes() {
    const pruned_nodes = Object.keys(this.nodes).map(nodeId =>{
      let node = this.nodes[nodeId];

      node.parents = node.parents.filter(function(p) {
        return Object.keys(this.nodes).indexOf(p) >= 0
      }.bind(this));

      node.children = node.children.filter(function(p) {
        return Object.keys(this.nodes).indexOf(p) >= 0
      }.bind(this));
      
      return node;
    })
    this.callback(pruned_nodes);
   }
}

export default NodeDownloader;