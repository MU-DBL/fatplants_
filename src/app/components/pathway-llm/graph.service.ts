import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import Sigma from 'sigma';
import Graph from 'graphology';

export interface CustomSigmaGraph extends Sigma {
}

@Injectable({
  providedIn: 'root'
})

export class GraphService {
  private _sigmaInstance = new BehaviorSubject<CustomSigmaGraph | null>(null);
  sigmaInstance$: Observable<CustomSigmaGraph | null> = this._sigmaInstance.asObservable();

  private cameraSettings = { duration: 200, factor: 1.5 }; // Shared camera settings

  setSigmaInstance(sigma: CustomSigmaGraph): void {
    this._sigmaInstance.next(sigma);
  }

  zoomIn(): void {
    const sigma = this._sigmaInstance.getValue();
    if (sigma) {
      sigma.getCamera().animate({ ratio: sigma.getCamera().ratio / this.cameraSettings.factor }, { duration: this.cameraSettings.duration });
    }
  }

  zoomOut(): void {
    const sigma = this._sigmaInstance.getValue();
    if (sigma) {
      sigma.getCamera().animate({ ratio: sigma.getCamera().ratio * this.cameraSettings.factor }, { duration: this.cameraSettings.duration });
    }
  }

  private refreshSigma(): void {
    const sigma = this._sigmaInstance.getValue();
    if (sigma) {
      sigma.refresh();
    }
  }

   updateNodeSize(newSize: number): void {
    const graph = this.getGraph();
    if (graph) {
      graph.forEachNode((nodeId) => { 
        graph.setNodeAttribute(nodeId, 'size', newSize);
      });
      this.refreshSigma(); 
    }
  }

  updateLabelSize(newLabelSize: number): void {
    const graph = this.getGraph();
    if (graph) {
      graph.forEachNode((nodeId) => {
        graph.setNodeAttribute(nodeId, 'labelSize', newLabelSize);
      });
      this.refreshSigma(); 
    } 
  }

  private getGraph(): Graph | null {
    const sigma = this._sigmaInstance.getValue();
    return sigma ? sigma.getGraph() : null;
  }

  updateSingleNodeAttribute(nodeId: string, key: string, value: any): void {
    const graph = this.getGraph();
    if (graph && graph.hasNode(nodeId)) {
      graph.setNodeAttribute(nodeId, key, value);
      this._sigmaInstance.getValue()?.refresh(); // Refresh to show changes
      console.log(`Updated node ${nodeId} attribute ${key} to: ${value}`);
    } else {
      console.warn(`Graph or node ${nodeId} not available for updateSingleNodeAttribute.`);
    }
  }
}