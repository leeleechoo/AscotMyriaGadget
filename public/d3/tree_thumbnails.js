function createThumbnailTree(svg, svgWidth, svgHeight, halo, particleExtent, maxTime) {

var minSharedParticle = particleExtent[0];
var maxSharedParticle = particleExtent[1];

var margin = {top: 10, right: 10, bottom: 10, left: 10},
width = 150-margin.left-margin.right,
height = 100-margin.top-margin.bottom;

var i = 0, root, nodesMap, linksMap, nodeDistance;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

// var massScale = d3.scale.log();
var linkScale = d3.scale.log();

//just for margin barriers, can remove
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "#111111")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "transform");

svg.select(".transform").append("g")
    .attr("class", "graph") 

var graph = svg.select(".graph");   
/*
//******************************LOAD DATA
raw_links = d3.csv.parse(linkstring);
raw_nodes = d3.csv.parse(nodesstring);
    //CREATE DATA DEPENDENT VARIABLES
var maxSharedParticle = 0, minSharedParticle;
var haloMassValues = [], haloParticleValues = [], haloMassValuesLog = [], haloParticleValuesLog = [];
minMass = raw_nodes[0].HaloMass;
minParticle = raw_nodes[0].TotalParticles;
minSharedParticle = raw_links[0].sharedParticleCount;

raw_links.forEach(function(d) {
    maxSharedParticle = Math.max(maxSharedParticle, +d.sharedParticleCount);
    minSharedParticle = Math.min(minSharedParticle, +d.sharedParticleCount);
});

raw_nodes.forEach(function(d){
    maxTime = Math.max(maxTime, +d.Timestep);
    maxMass = Math.max(maxMass, +d.HaloMass);
    minMass = Math.min(minMass, +d.HaloMass);
    maxParticle = Math.max(maxParticle, +d.TotalParticles);
    minParticle = Math.min(minParticle, +d.TotalParticles);
    haloMassValues.push(+d.HaloMass);
    haloMassValuesLog.push(+Math.log(d.HaloMass));
    haloParticleValues.push(+d.TotalParticles);
    haloParticleValuesLog.push(+Math.log(d.TotalParticles));
});
*/
//scale to fit all timesteps
nodeDistance = width/maxTime
linkScale.domain([minSharedParticle, maxSharedParticle]).range([0.5,2.5]);
/*
//CREATE HALO TREE MAPS
//basically makes an associative array but it's called a d3.map
//for each HaloID key, had an array of nodes with that key
//each array will be of length one
haloMap = d3.map();
var tempHaloNodesMap = d3.nest().key(function(d) { return d.NowGroup; }).map(raw_nodes, d3.map);
var tempHaloLinksMap = d3.nest().key(function(d) { return d.NowGroup; }).map(raw_links, d3.map);
var tempNodesMap, tempLinksMap, tempRoot;
tempHaloNodesMap.forEach(function(k, v) {
    tempNodesMap = d3.nest().key(function(d) { return d.HaloID; }).map(v, d3.map);
    tempLinksMap = d3.nest().key(function(d) { return d.NextHalo; }).map(tempHaloLinksMap.get(k), d3.map);

    //make tree structure from links
    tempHaloLinksMap.get(k).forEach(function(link) {
        //nodesMap array for each key has only one element
        var parent = tempNodesMap.get(link.CurrentHalo)[0];
        var child = tempNodesMap.get(link.NextHalo)[0];
        if (parent.children) {
            parent.children.push(child);
        } else {
            parent.children = [child];
        }
    });
    tempRoot = tempNodesMap.get(tempHaloLinksMap.get(k)[0].CurrentHalo)[0];
    tempRoot.x0 = height/2;
    tempRoot.y0 = 0;
    haloMap.set(k, {root: tempRoot, nodes: tempNodesMap, links: tempLinksMap});
});
*/
root = halo.root;
nodesMap = halo.nodes;
linksMap = halo.links;
update(root);

function update(source) {
    //compute the new tree layout.
    var nodes = tree.nodes(root);
    var links = tree.links(nodes);
    //console.log(nodes);
    //console.log(links)
    //normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * nodeDistance; });

    //update the links…
    var link = graph.selectAll("path.link")
        .data(links, function(d) { return d.target.HaloID; });

    //transition links to their new position.
     link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            return diagonal(d);
        })
        .style("stroke-width", function(d) { return linkScale(+linksMap.get(d.target.HaloID)[0].sharedParticleCount); })
        .style("stroke-opacity","1")
        .style("stroke-linecap", "round")
        .style("stroke", function(d) {
            if(d.target.Prog == '1') {
                return "#D44848";
            } else {
                return "#DDDDDD";
            }
        });
    graph.attr("transform", "translate(5,0)");
}
}