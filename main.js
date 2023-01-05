
const peopleData = {
    nodes: [],
    links: []
};

// Load the peopleData nodes from file
const fetchPromise = fetch('trees/jackson.json')

fetchPromise.then(response => {
    return response.json()
})
.then(jsonresponse => {
    peopleData.nodes = jsonresponse
    createNodeLinks()
    markUpstreamColours()
})
.then(drawGraph)

const highlightNodes = new Set();
const highlightLinks = new Set();
let hoverNode = null;

// Controls for different graph orientation.
const controls = { 'DAG Orientation': 'td'};
const gui = new dat.GUI();
gui.add(controls, 'DAG Orientation', ['td', 'bu', 'lr', 'rl', 'zout', 'zin', 'radialout', 'radialin', null])
    .onChange(orientation => Graph && Graph.dagMode(orientation));

const Graph = ForceGraph3D()

function createNodeLinks() {
    var colourLink = ""
    // Create links based on mother and father data in each node. 0 = no link
    for (var i = 0; i < peopleData.nodes.length; i++){
        // If sharedDNA present, we will colour the upstream link
        // TODO: This could get messy for matches like half siblings.
        // TODO: We should only colour the upstream link if the parent also has sharedDNA?
        //       - This would rely on assuming sharedDNA values for people without tests
        colourLink = false
        if ( peopleData.nodes[i].sharedDNA != 0 ) {
            colourLink = true
        }

        if ( peopleData.nodes[i].mother != 0 ) {
            if ( colourLink ) {
                peopleData.links.push({
                    source: peopleData.nodes[i].id,
                    target: peopleData.nodes[i].mother,
                    color: "lightgreen",
                })
            } else {
                peopleData.links.push({
                    source: peopleData.nodes[i].id,
                    target: peopleData.nodes[i].mother,
            })}
        };

        if ( peopleData.nodes[i].father != 0 ) {
            if ( colourLink ) {
                peopleData.links.push({
                    source: peopleData.nodes[i].id,
                    target: peopleData.nodes[i].father,
                    color: "lightgreen",
                })
            } else {
                peopleData.links.push({
                    source: peopleData.nodes[i].id,
                    target: peopleData.nodes[i].father,
                })
            };
        }
    }

    // Cross-link node objects
    peopleData.links.forEach(link => {
        const source = peopleData.nodes.find(node => node.id === link.source)
        const target = peopleData.nodes.find(node => node.id === link.target)

        !source.neighbors && (source.neighbors = []);
        !target.neighbors && (target.neighbors = []);
        source.neighbors.push(target);
        target.neighbors.push(source);

        !source.links && (source.links = []);
        !target.links && (target.links = []);
        source.links.push(link);
        target.links.push(link);
        }
    );
}

function markUpstreamColours() {
    // Mark all sharedDNA node parents as upstreamColour
    peopleData.nodes.filter(node => node.sharedDNA > 0).forEach(node => {
        console.log("SharedDNA node", node.name, ", recursing parents")
        // Then recursively update each parent if they exist
        markUpstreamColoursRecurse(node)
    })
    // TODO: After we've marked all nodes, we need to re-traverse the tree backwards (from leaves) and uncolour until we find a branch that contains a sharedDNA end

    // TODO: Iterate over all nodes with sharedDNA and try finding path back to centre.
    // TODO: Each link to parent in the path will need to be recoloured and resized
    // TODO: Each sharedDNA node attempt to find path back to root node, any nodes in between are marked green.
}

function markUpstreamColoursRecurse(node) {
    node.neighbors.forEach(item => {
        if (node.father === item.id) {
            item.upstreamColour = true
            markUpstreamColoursRecurse(item)
        }
        if (node.mother === item.id) {
            item.upstreamColour = true
            markUpstreamColoursRecurse(item)
        }
    })
}

function drawGraph() {
    // Create our graph
    Graph(document.getElementById('3d-graph'))
    .graphData(peopleData)
    .linkDirectionalArrowLength(3.5)
    .linkDirectionalArrowRelPos(1)
    // Override node label with more information
    .nodeLabel(node => getNodeLabel(node))
    .nodeColor(node => {
        // Assign colour for sharedDNA nodes. More DNA = more green
        if (node.sharedDNA > 0 ) {
            //console.log("SharedDNA node", node.name)
            return d3.interpolateGreens(normaliseColor(node.sharedDNA))
        }

        if (node.upstreamColour) {
            return d3.interpolateOranges(0.5)
        } else {
            return d3.interpolateReds(0.8)
        }
    })
    // Override link label with more information
    .linkLabel(link => getLinkLabel(link))
    .linkWidth(link => highlightLinks.has(link) ? 4 : 1)
    .linkDirectionalParticles(link => highlightLinks.has(link) ? 4 : 0)
    .linkDirectionalParticleWidth(4)
    // Highlight nodes and links when we hover
    .onNodeHover(node => {
        // no state change
        if ((!node && !highlightNodes.size) || (node && hoverNode === node)) return;

        highlightNodes.clear();
        highlightLinks.clear();
        if (node) {
            highlightNodes.add(node);
            node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
            node.links.forEach(link => highlightLinks.add(link));
        }
        hoverNode = node || null;

        updateHighlight();
        })
        .onLinkHover(link => {
        highlightNodes.clear();
        highlightLinks.clear();

        if (link) {
            highlightLinks.add(link);
            highlightNodes.add(link.source);
            highlightNodes.add(link.target);
        }

        updateHighlight();
    })
}

function updateHighlight() {
// trigger update of highlighted objects in scene
    Graph
    .nodeColor(Graph.nodeColor())
    .linkWidth(Graph.linkWidth())
    .linkColor(Graph.linkColor())
    .linkDirectionalParticles(Graph.linkDirectionalParticles());
}

// Format node label for display
function getNodeLabel(node) {
    if (node.sharedDNA > 0) {
        return `${node.name}, born ${node.born}, shares ${node.sharedDNA}cM`
    } else {
        return `${node.name}, born ${node.born}`
    }
}

// Format link label for display
function getLinkLabel(link) {
    return link.target.group
}

// Normalise sharedDNA values to colour scale
function normaliseColor(val) {
    var min = 7
    var max = 300
    // eg. (300 - 1) / (500 - 1) = 0.599
    return (val - min) / (max - min);
}
