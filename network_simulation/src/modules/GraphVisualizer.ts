/// <reference path="../typings/modules/d3/index.d.ts"/>;

import * as GT from '../types/GraphTypes';
import * as d3 from 'd3';


class GraphVisualizer {
    private container: SVGElement;
    private nodes: GT.Node[];
    private edges: GT.Edge[];
    private options: any;

    constructor(htmlContainer, nodes: GT.Node[], edges: GT.Edge[], options={height: 500, width: 500}) {
        this.container = htmlContainer;
        this.nodes = nodes;
        this.edges = edges;
        this.options = options;
    }

    public draw(): void {
        let svg = d3.select(this.container).attr('height', this.options.height).attr('width', this.options.width);


        debugger

        let links = this.edges; /*.map(
            edge => {
                return {
                    source: edge.from, 
                    target: edge.to, 
                    latency: edge.latency,
                    weight: edge.latency
                }
            }
        );*/

        var force = d3.layout.force()
            .size([this.options.width, this.options.height])
            .nodes(this.nodes)
            .links(links)
            .linkDistance(60)
            .charge (-300)
            .start();


        let d3links = svg.selectAll('.link')
            .data(links)
            .enter().append('line')
            .attr('class', 'link');

        let d3nodes = svg.selectAll('.node')
            .data(this.nodes)
            .enter().append('circle')
            .attr('class', 'node');



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


            d3nodes.attr('r', 25)
                .attr('cx', function(d) { return d.x; })
                .attr('cy', function(d) { return d.y; });

            // We also need to update positions of the links.
            // For those elements, the force layout sets the
            // `source` and `target` properties, specifying
            // `x` and `y` values in each case.

            d3links.attr('x1', function(d) { return d.source['x']; })  // don't have to do this but do because of typescript not d3
                .attr('y1', function(d) { return d.source['y']; })
                .attr('x2', function(d) { return d.target['x']; })
                .attr('y2', function(d) { return d.target['y']; });

        });

    }
}

export default GraphVisualizer;