import { Component, OnDestroy } from '@angular/core';
import { GraphService, CustomSigmaGraph } from '../graph.service'; // Adjust path
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { fitViewportToNodes } from '@sigma/utils'; // Make sure this package is installed

@Component({
  selector: 'app-zoom-control',
  templateUrl: './zoom-control.component.html',
  styleUrls: ['./zoom-control.component.scss']
})
export class ZoomControlComponent implements OnDestroy {
  private sigmaInstance: CustomSigmaGraph | null = null;
  private subscription: Subscription = new Subscription();

  constructor(private graphService: GraphService) {
    // Subscribe to the Sigma.js instance from the service
    this.subscription.add(
      this.graphService.sigmaInstance$
        .pipe(filter(sigma => !!sigma)) // Only take non-null instances
        .subscribe(sigma => {
          this.sigmaInstance = sigma;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe(); // Unsubscribe to prevent memory leaks
  }

  zoomIn(): void {
    this.graphService.zoomIn();
  }

  zoomOut(): void {
    this.graphService.zoomOut();
  }

  resetView(): void {
    if (this.sigmaInstance) {
      const graph = this.sigmaInstance.getGraph();
      if (graph && graph.nodes().length > 0) {
        fitViewportToNodes(this.sigmaInstance, graph.nodes(), { animate: true });
      } else {
        console.warn('No graph or nodes available to fit viewport.');
        // Optionally, you might have a default reset if no nodes
        // this.sigmaInstance.getCamera().animate({ x: 0, y: 0, ratio: 1 }, { duration: 200 });
      }
    }
  }
}