import axios from "axios";

class ChainBuilder {
  constructor(idNumber, callback) {
    this.chains = []
    this.links = {}
    this.slots = []
    this.isLoaded = false
    this.root_url = "http://vocab.getty.edu/aat/" + idNumber;
    this.undownloadedIds = [idNumber];
    this.downloadIds();
    this.callback = callback;
  }

  // ---------------------------------------------------
  // Step 1. Recursively get the list of parents and children 
  downloadIds() {
    var id = this.undownloadedIds.pop();
    if (!id) {
      this.createChains()
      return true;
    };
    var url = "http://localhost:8080/aat/"+id+".json"
    axios.get(url)
      .then(function (response) {
        var data = response.data;
        var obj = {
          id: data.id,
          label: data.label,
          children: data.has_child,
          parents: data.has_parent
        }
        //console.log(`downloaded ${obj.label}`)
        this.links[obj.id] = obj
        for (var i = 0; i < obj.parents.length; i++) {
          if (!this.links.hasOwnProperty(obj.parents[i])) {
            this.undownloadedIds.push(obj.parents[i].match(/.*\/(\d+)/)[1])
          }
        }
        this.downloadIds();
      }.bind(this))
      .catch(function (error) {
        console.log("error downloading:", error);
      });
   }

  // ---------------------------------------------------
  // Step 2: starting with the root node, recursively construct the chains
  //      - add each each link having it's ups and downs.
  //      - add a new starting node for each up that you haven't seen
  //      - add all ups and downs for each link
  createChains() {
    var startingNode = [{id: this.root_url, currentChain: []}];

    while(startingNode.length){
      var node = startingNode.pop();
      var currentChain = node.currentChain;
      var ref = this.links[node.id];
      var id = {id: ref.id, parents: ref.parents, children: ref.children, label: ref.label};
      while (id && id.parents && id.parents.length) {
        currentChain.push(id);
        var parents = id.parents.slice();
        id = this.links[parents.pop()];
        for (var i = 0; i < parents.length; i++) {
          startingNode.push({id: parents[i],currentChain: currentChain.slice()});
        }
      }
      currentChain.push(id);
      this.chains.push(currentChain)
    } 
    this.pruneChains();
  }
  
  // ---------------------------------------------------
  // Step 3. Prune each chain's links to only those that haven't been seen
  //      - remove children and parents that aren't part of the tree
  pruneChains() {
    this.chains.sort(this.chainSort)
    var seenIds = [];
    var newChains = []
    for (var i = 0; i < this.chains.length; i++) {
      var chain = this.chains[i]
      var newChain = []
      for (var j = 0; j < chain.length; j++) {
        var link = chain[j]
        if (seenIds.indexOf(link.id) == -1) {
          seenIds.push(link.id)
          link.parents = link.parents.filter(function(p) {
            return Object.keys(this.links).indexOf(p) >= 0
          }.bind(this))
          link.children = link.children.filter(function(p) {
            return Object.keys(this.links).indexOf(p) >= 0
          }.bind(this))
          newChain.unshift(link)
        }
      }
      newChains.push(newChain)
    }
    
    this.chains = newChains.sort(this.chainSort)

    let adjList = {};
    for (var chain of this.chains ) {
      for (var link of chain) {
        adjList[link.label] = link.children.map(e=> this.links[e].label)
      }
    }
    
    console.log(JSON.stringify(adjList))



    this.callback(this.chains)
    // this.generateSlots()
  }

  //# Create an array of slots, one for each of the longest chains
  //# insert a link into each slot
  //# starting with the shortest chain remaining, add that to the slots
  //# if there are more slots than links, start with the top, then add downwards
  //# if there are more links than slots, 
  //      add a slot between the bottom one and the final parent? (not implemented yet)
  generateSlots() {
    let mainChain = this.chains.shift()
    for(var link of mainChain) {
      let arr = [link.id] 
      this.slots.push(arr)
    }

    for(var chain of this.chains){
      for (var link of chain) {
        let parentSlot = null;
        let found = false;
        for (var i = 0; i < this.slots.length; i++) {
          for(var parent of link.parents) {
            if (!found && this.slots[i].includes(parent)) {
              found = true
              parentSlot = i
              break;
            }
            if(found) {break;}
          }
        }
        let siblingIsChild = false
        let slotIds = this.slots[parentSlot+1].map(i => i)
        for(var child of link.children) {
          if (slotIds.includes(child)) {console.log("found sib:",child); siblingIsChild = true}
        }
        if (siblingIsChild) {
          this.slots.splice(parentSlot,0,[link_id])
        }
        else {
          this.slots[parentSlot+1].unshift(link.id)
        }
      }
    }

    var l = this.links
    this.slots = this.slots.map(function(slot){
      return slot.map(id => l[id])
    }.bind(this))

    this.callback(this.slots)
  }

   // ---------------------------------------------------
   // Helper Functions
   chainSort(a,b){ return b.length - a.length}

}

export default ChainBuilder;