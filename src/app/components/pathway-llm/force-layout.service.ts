import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  Simulation,
  SimulationLinkDatum,
  ForceLink,
  ForceCollide,
} from 'd3-force';
import Sigma from 'sigma';
import Graph from 'graphology'; // Corrected import for Graphology

import {ForceSetting, NodeAttributes, EdgeAttributes } from './data-interface'; // Adjust path as necessary

@Injectable({
  providedIn: 'root', // Makes the service a singleton available throughout the app
})
export class ForceLayoutService implements OnDestroy { // Implement OnDestroy for clarity

  private simulation: Simulation<NodeAttributes, SimulationLinkDatum<NodeAttributes>> | undefined;
  private nodes: NodeAttributes[] = [];
  private edges: SimulationLinkDatum<NodeAttributes>[] = [];
  private sigmaInstance: Sigma<NodeAttributes, EdgeAttributes> | undefined;
  private graph: Graph | undefined; // Type for Graphology instance

  private currentForceSettings: ForceSetting = { linkDistance: 50 }; // Default values
  private currentDefaultNodeSize: number = 5; // Default value

  constructor(private ngZone: NgZone) {}

  /**
   * Initializes the force layout with a given Sigma instance and initial settings.
   * This should be called once the Sigma instance and its graph are ready.
   */
  initialize(
    sigma: Sigma<NodeAttributes, EdgeAttributes>,
    initialForceSettings: ForceSetting,
    initialDefaultNodeSize: number
  ): void {
    if (this.simulation) {
      this.stopLayout(); // Stop any existing simulation
    }

    this.sigmaInstance = sigma;
    this.graph = sigma.getGraph();
    this.currentForceSettings = { ...initialForceSettings }; // Copy to prevent mutation
    this.currentDefaultNodeSize = initialDefaultNodeSize;

    if (!this.graph || this.graph.order === 0) {
      console.warn('Graph is empty or not yet loaded, force simulation will not start.');
      return;
    }

    this.nodes = this.graph.mapNodes(nodeId => {
      const attributes = this.graph!.getNodeAttributes(nodeId);
      return {
        ID: nodeId,
        x: attributes['x'], // Ensure x and y are passed from existing graph attributes
        y: attributes['y'],
        // Copy over other attributes that D3 might need or that are useful for debugging
        ...attributes // Spread all existing attributes, including potentially vx, vy, etc.
      };
    });
    this.edges = this.graph.mapEdges((_edgeId, _attr, source, target) => ({
      source: source,
      target: target,
    }));

    this.simulation = forceSimulation<NodeAttributes, SimulationLinkDatum<NodeAttributes>>(this.nodes)
      .force(
        'link',
        forceLink<NodeAttributes, SimulationLinkDatum<NodeAttributes>>(this.edges)
          .id(d => d.ID!)
          .distance(this.currentForceSettings.linkDistance),
      )
      .force('charge', forceManyBody().strength(-200).theta(0.8))
      .force('collide', forceCollide(this.currentDefaultNodeSize * 8))
      .on('tick', () => this.ngZone.runOutsideAngular(() => this.tick()));

    console.log('ForceLayoutService: Simulation initialized.');
    this.startLayout(); // Start immediately upon initialization
  }

  /**
   * Starts the D3 force simulation.
   */
  startLayout(): void {
    if (this.simulation) {
      this.simulation.alpha(1).restart();
      console.log('ForceLayoutService: Simulation started.');
    }
  }

  /**
   * Stops the D3 force simulation.
   */
  stopLayout(): void {
    if (this.simulation) {
      this.simulation.stop();
      console.log('ForceLayoutService: Simulation stopped.');
    }
  }

  /**
   * Updates the D3 force simulation parameters based on current settings.
   */
  private updateForceSimulation(): void {
    if (!this.simulation) return;

    const linkForce = this.simulation.force('link') as ForceLink<NodeAttributes, SimulationLinkDatum<NodeAttributes>>;
    if (linkForce) {
      linkForce.distance(this.currentForceSettings.linkDistance);
    }

    const collideForce = this.simulation.force('collide') as ForceCollide<NodeAttributes>;
    if (collideForce) {
      collideForce.radius(this.currentDefaultNodeSize * 8);
    }

    this.simulation.alpha(0.3).restart(); // Restart with a lower alpha to smoothly apply changes
    console.log('ForceLayoutService: Simulation settings updated.');
  }

  /**
   * The D3 simulation tick function. Updates Sigma node positions.
   * Runs outside Angular's NgZone for performance.
   */
  private tick(): void {
    if (!this.graph || !this.nodes.length || !this.sigmaInstance) return;

    for (const node of this.nodes) {
      this.graph.setNodeAttribute(node.ID, 'x', node.x!);
      this.graph.setNodeAttribute(node.ID, 'y', node.y!);
    }
    this.sigmaInstance.refresh();
  }

  /**
   * Sets new force settings and triggers an update of the simulation.
   */
  setForceSettings(settings: ForceSetting): void {
    this.currentForceSettings = { ...settings };
    this.updateForceSimulation(); // <--- IMPORTANT: Call update here
  }

  /**
   * Sets a new default node size and triggers an update of the simulation.
   */
  setDefaultNodeSize(size: number): void {
    this.currentDefaultNodeSize = size;
    this.updateForceSimulation(); // <--- IMPORTANT: Call update here
  }

  /**
   * Handles node dragging start event from Sigma and updates D3 simulation.
   */
  handleNodeDragStart(nodeId: string, x: number, y: number): void {
    const d3Node = this.nodes.find(d => d.ID === nodeId);
    if (d3Node && this.simulation) {
      d3Node['fx'] = x;
      d3Node['fy'] = y;
      this.simulation.alphaTarget(0.3).restart();
    }
  }

  /**
   * Handles node dragging event from Sigma and updates D3 simulation.
   */
  handleNodeDragging(nodeId: string, x: number, y: number): void {
    const d3Node = this.nodes.find(d => d.ID === nodeId);
    if (d3Node) {
      d3Node['fx'] = x;
      d3Node['fy'] = y;
    }
  }

  /**
   * Handles node dragging end event from Sigma and updates D3 simulation.
   */
  handleNodeDragEnd(nodeId: string): void {
    const d3Node = this.nodes.find(d => d.ID === nodeId);
    if (d3Node && this.simulation) {
      d3Node['fx'] = null;
      d3Node['fy'] = null;
      this.simulation.alphaTarget(0);
    }
  }

  /**
   * Implements OnDestroy to clean up simulation when the service is destroyed.
   * For 'providedIn: root' services, this typically happens on app shutdown.
   */
  ngOnDestroy(): void {
    this.stopLayout();
    console.log('ForceLayoutService: Cleaned up.');
  }
}