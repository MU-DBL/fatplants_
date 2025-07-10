import { Injectable, NgZone } from '@angular/core';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  Simulation,
  SimulationLinkDatum,
} from 'd3-force';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Sigma from 'sigma';
import  Graph from 'graphology';

// Import your custom interfaces
import {ForceSettings, ForceWorker, NodeAttributes, EdgeAttributes, NodeLabelProperties } from './data-interface'; // Adjust path as necessary

@Injectable({
  providedIn: 'root', // Makes the service a singleton available throughout the app
})
export class ForceLayoutService {
  private simulation: Simulation<NodeAttributes, SimulationLinkDatum<NodeAttributes>> | undefined;
  private nodes: NodeAttributes[] = [];
  private edges: SimulationLinkDatum<NodeAttributes>[] = [];
  private sigmaInstance: Sigma<NodeAttributes, EdgeAttributes> | undefined;
  private graph: Graph | undefined;

  private _settings = new BehaviorSubject<ForceSettings | null>(null);
  readonly settings$ = this._settings.asObservable();

  private _defaultNodeSize = new BehaviorSubject<number>(1);
  readonly defaultNodeSize$ = this._defaultNodeSize.asObservable();

  private destroy$ = new Subject<void>();

  private _forceWorker = new BehaviorSubject<ForceWorker | null>(null);
  readonly forceWorker$ = this._forceWorker.asObservable();

  constructor(private ngZone: NgZone) {}

  /**
   * Initializes the D3 force simulation with the Sigma.js graph instance and initial settings.
   * This method should be called once when the Sigma.js graph is ready.
   * @param sigma The Sigma.js graph instance.
   * @param initialSettings Initial force settings (e.g., linkDistance).
   * @param initialDefaultNodeSize Initial default node size for collision force.
   */
  init(
    sigma: Sigma<NodeAttributes, EdgeAttributes>,
    initialSettings: ForceSettings,
    initialDefaultNodeSize: number,
  ): void {
    if (this.sigmaInstance === sigma && this.simulation) {
      return;
    }

    this.sigmaInstance = sigma;
    this.graph = this.sigmaInstance.getGraph();
    this._settings.next(initialSettings);
    this._defaultNodeSize.next(initialDefaultNodeSize);

    this.nodes = sigma.getGraph().mapNodes((nodeId, attributes) => ({
      ...attributes, 
      ID: nodeId,
    }));
    this.edges = sigma.getGraph().mapEdges((_edgeId, attributes, sourceId, targetId) => ({
      source: sourceId,
      target: targetId,
      ...attributes, 
    }));

    this.ngZone.runOutsideAngular(() => {
      this.simulation = forceSimulation<NodeAttributes, SimulationLinkDatum<NodeAttributes>>(this.nodes)
        .force(
          'link',
          forceLink<NodeAttributes, SimulationLinkDatum<NodeAttributes>>(this.edges)
            .id(d => d.ID!) // Use the 'ID' property of nodes for linking
            .distance(this._settings.value?.linkDistance || 50), // Set initial link distance
        )
        .force('charge', forceManyBody().strength(initialSettings.chargeStrength || -200).theta(0.8)) // Set initial charge strength
        .force('collide', forceCollide((this._defaultNodeSize.value || 1) * (initialSettings.collideRadiusFactor || 8))) // Set initial collision radius
        .on('tick', () => this.tick()); // Bind the tick function to update Sigma.js

      // Expose start/stop methods via the forceWorker observable
      this._forceWorker.next({
        start: () => this.start(),
        stop: () => this.stop(),
      });
    });


    this.settings$.pipe(takeUntil(this.destroy$)).subscribe(settings => {
      if (this.simulation && settings) {
        (this.simulation.force('link') as any)?.distance(settings.linkDistance);
        (this.simulation.force('charge') as any)?.strength(settings.chargeStrength || -200);
        (this.simulation.force('collide') as any)?.radius((this._defaultNodeSize.value || 1) * (settings.collideRadiusFactor || 8));

        this.simulation.alpha(0.3).restart(); // Restart simulation with new force parameters
      }
    });

    // Subscribe to default node size changes to update collision force
    this.defaultNodeSize$.pipe(takeUntil(this.destroy$)).subscribe(size => {
      if (this.simulation && size) {
        (this.simulation.force('collide') as any)?.radius(size * (this._settings.value?.collideRadiusFactor || 8));
        this.simulation.alpha(0.3).restart(); // Restart simulation with new collision radius
      }
    });

    // Initial restart to get the simulation running
    this.start();
  }

  private tick(): void {
    if (!this.sigmaInstance || !this.nodes.length) return;

    // Run inside Angular's zone to ensure changes to node attributes are detected by Sigma.js
    // and potentially by any Angular components that might be rendering based on these attributes.
    this.ngZone.run(() => {
      for (const node of this.nodes) {
        this.sigmaInstance!.getGraph().setNodeAttribute(node.ID, 'x', node.x);
        this.sigmaInstance!.getGraph().setNodeAttribute(node.ID, 'y', node.y);
      }
    });
  }

  /**
   * Updates the force settings for the simulation.
   * @param newSettings The new ForceSettings object.
   */
  updateSettings(newSettings: ForceSettings): void {
    this._settings.next(newSettings);
  }

  /**
   * Updates the default node size for the simulation (primarily for collision force).
   * @param newSize The new default node size.
   */
  updateDefaultNodeSize(newSize: number): void {
    this._defaultNodeSize.next(newSize);
  }

  /**
   * Starts or restarts the D3 force simulation.
   * Runs outside Angular's zone.
   */
  start(): void {
    this.ngZone.runOutsideAngular(() => {
      this.simulation?.alpha(1).restart();
    });
  }

  /**
   * Stops the D3 force simulation.
   * Runs outside Angular's zone.
   */
  stop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.simulation?.stop();
    });
  }

  /**
   * Cleans up the simulation and all subscriptions.
   * Should be called when the component using this service is destroyed.
   */
  destroy(): void {
    this.stop(); // Stop the simulation
    this.simulation = undefined; // Clear simulation instance
    this.nodes = []; // Clear node data
    this.edges = []; // Clear edge data
    this.sigmaInstance = undefined; // Clear sigma instance reference

    // Complete the destroy subject to unsubscribe from all ongoing subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }
}