/// <reference path="../typings/modules/d3/index.d.ts"/>;

import * as GT from '../types/GraphTypes';
import Topology from './topology/Topology';
import NetworkStatsManager from './NetworkStatsManager';
import * as d3 from 'd3';


class GraphVisualizer {
    private container: SVGElement;
    private topology: Topology;
    private networkStats: NetworkStatsManager;
    private nodes: GT.Node[];
    private edges: GT.Edge[];
    private options: any;
    
    //testing
    private d3edges;

    constructor(container:SVGElement, 
                topology: Topology,
                networkStats: NetworkStatsManager,
                options: GT.VisualizerOptions = {height: 900, width: 900, radius: 25, linkDistance: 400, charge: -10000}) {
        this.container = container;
        this.topology = topology;
        this.networkStats = networkStats;
        this.options = options;

        //testing
        this.d3edges = null;
    }

    public updateGraph(): void {
        this.nodes = this.topology.getNodes();
        this.edges = this.topology.getEdges();
        this.draw();
    }

    public updateLoads(): void {
        this.d3edges = this.d3edges.data(this.edges);
        console.log('set data again');
    }

    public draw(): void {
        this.container.innerHTML = "";  //should clear it?
        let self = this;

        let svg = d3.select(this.container).attr('height', this.options.height).attr('width', this.options.width);
        

        let force = d3.layout.force()
            .size([this.options.width, this.options.height])
            .nodes(this.nodes)
            .links(this.edges)
            .linkDistance(this.options.linkDistance)
            .charge(this.options.charge);

        
        this.d3edges = svg.selectAll('.link')
            .data(this.edges);
        
        //this.d3edges.attr('stroke', function(d,i) { console.log('resetting stroke color'); return self.getColor(self.networkStats.getFractionalLoadOn(i)); });


        let d3edges = this.d3edges.enter()
            .append('g')
            .attr('class', 'link');
        
        let d3text = d3edges.append('text')
            .text( function(d) {
                return "" + d.latency;
            });
            
        let d3links = d3edges.append('line')
            .attr('class', 'line')
            .attr('id', function(d,i) { return "edge-" + i; })
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
        setTimeout( function() {
            force.start();
            for (let i = 0; i < 300; i++) {
                (<any>force).tick();
            }
            force.stop();
        }.bind(this), 10);

    }

    // How to color Edge given a fractional load from 0 to 1
    private getColor(fraction: number): string {
        let r = 255 * fraction;
        let g = 0;
        let b = (1-fraction) * 255;
        return "rgb(" + r + "," + g + "," + b + ")";
    }
}

export default GraphVisualizer;