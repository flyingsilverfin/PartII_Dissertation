/// <reference path="../typings/modules/d3/index.d.ts"/>;

import * as GT from '../types/GraphTypes';
import Topology from './topology/Topology';
import NetworkStatsManager from './NetworkStatsManager';
import * as d3 from 'd3';


class GraphVisualizer {
    private container: SVGElement;
    private topology: Topology;
    private networkStats: NetworkStatsManager;
    private nodes: GT.d3Node[];
    private edges: GT.d3Edge[];
    private options: any;
    private keyText: any;
    // coloring hack, map of edge ID to actual HTml element... will just set color through there
    private edgeHTMLElements: {[i: number] : HTMLElement};
    


    constructor(container:SVGElement, 
                topology: Topology,
                networkStats: NetworkStatsManager,
                options: GT.VisualizerOptions = {height: 900, width: 900, radius: 25, linkDistance: 400, charge: -10000}) {
        this.container = container;
        this.topology = topology;
        this.networkStats = networkStats;
        this.options = options;

        this.edgeHTMLElements = {};


    }
/*
    public graphTopologyChanged(): void {
        this.nodes = this.topology.getD3Nodes();
        this.edges = this.topology.getD3Edges();
        this.draw();
    }
*/
    public updateLoads(): void {
        console.log('updating loads/colors');
        /*let links = d3.selectAll('.link').data(this.edges, function(d) { return d.source + "-" + d.target; });
        let self = this;
        links.attr("stroke", function(d, i) {
            let actualEdge = this.lastChild;
            actualEdge.attributes.stroke.value = self.getColor(self.networkStats.getFractionalLoadOn(i));
            debugger;
            return self.getColor(self.networkStats.getFractionalLoadOn(i)); });
        */
        // above isn't working for quite a while... time to just hack it
        for (let i in this.edgeHTMLElements) {
            let edge = this.edgeHTMLElements[i];
            //edge.attributes.stroke.value = this.getColor(this.networkStats.getFractionalLoadOn(i));
            // hack, [2] is 'stroke'
            edge.attributes[2].value = this.getColor(this.networkStats.getFractionalLoadOn(i));
        }

        this.keyText[0][0].textContent = this.networkStats.getMaxLinkLoad() + " packets";

    }

    public draw(): void {

        this.nodes = this.topology.getD3Nodes();
        this.edges = this.topology.getD3Edges();
 

        this.container.innerHTML = "";  //should clear it?
        let self = this;

        let svg = d3.select(this.container).attr('height', this.options.height).attr('width', this.options.width);

       
        this.keyText = svg.append('g');
        this.keyText.append("rect")
                .attr("x", 10)
                .attr("y", 10)
                .attr("width", 10)
                .attr("height", 10)
                .attr('fill', 'red');
        this.keyText = this.keyText.append('text')
                .attr("x", 30)
                .attr("y", 20);
        this.keyText[0][0].textContent = this.networkStats.getMaxLinkLoad() + " packets";
                
            
        

        let force = d3.layout.force()
            .size([this.options.width, this.options.height])
            .nodes(this.nodes)
            .links(this.edges)
            .linkDistance(this.options.linkDistance)
            .charge(this.options.charge);

        
        let d3edges = svg.selectAll('.link')
            .data(this.edges, function(d) { return d.source + "-" + d.target; })
            .enter()
            .append('g')
            .attr('class', 'link');
        
        let d3text = d3edges.append('text')
            .text( function(d) {
                return "" + Math.round(10*d.latency)/10;
            });
            
        let d3links = d3edges.append('line')
            .attr('class', 'line')
            .attr('id', function(d,i) { self.edgeHTMLElements[i] = this; return "edge-" + i; })
            .attr("stroke", function(d, i) { console.log('resetting stroke color'); return self.getColor(self.networkStats.getFractionalLoadOn(i)); })




        let d3nodes = svg.selectAll('.node')
            .data(this.nodes)
            .enter().append('g')
            .attr('class', 'node')
            
        d3nodes.append('circle')
            .attr('class', 'circle')
            .attr('r', this.options.radius);


        force.on('end', function() {

            // When this function executes, the force layout
            // calculations have concluded. The layout will
            // have set various properties in our nodes and
            // links objects that we can use to position them
            // within the SVG container.

            // First let's reposition the nodes. As the force
            // layout runs it updates the `x` and `y` properties
            // that define where the node should be centered.
            // To move the node, we set the appropriate SVG
            // attributes to their new values. We also have to
            // give the node a non-zero radius so that it's visible
            // in the container.


            d3nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
/*          d3nodes.attr('r', 25)
                .attr('cx', function(d) { return d.x; })
                .attr('cy', function(d) { return d.y; });
*/
            // We also need to update positions of the links.
            // For those elements, the force layout sets the
            // `source` and `target` properties, specifying
            // `x` and `y` values in each case.

            d3text.attr('transform', function(d) {
                return "translate(" + (d.source['x'] + d.target['x'])/2 + "," + (d.source['y'] + d.target['y'])/2 + ")";
            });
            
            d3links.attr('x1', function(d) { return d.source['x']; })  // don't have to do this but do because of typescript not d3
                .attr('y1', function(d) { return d.source['y']; })
                .attr('x2', function(d) { return d.target['x']; })
                .attr('y2', function(d) { return d.target['y']; });
            
            /*
            d3links.attr("transform", function(d) { 
                return "translate(" + (d.source['x'] + d.target['x'])/2 + "," + (d.source['y'] + d.target['y'])/2 + ")" });
            */
            

            
        });


        // render the graph 
        //setTimeout( function() {
        force.start();
        for (let i = 0; i < 300; i++) {
            (<any>force).tick();
        }
        force.stop();
        //}.bind(this), 10);


        // create scale for colors


    }

    // How to color Edge given a fractional load from 0 to 1
    private getColor(fraction: number): string {

        fraction = fraction;   // for visibility

        let r = 255 * fraction;
        let g = 0;
        let b = (1-fraction)*255;
        return "rgb(" + Math.floor(r) + "," + Math.floor(g) + "," + Math.floor(b) + ")";
    }
}

export default GraphVisualizer;