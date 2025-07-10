import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import Sigma from 'sigma'; // Import Sigma.js
import { ForceLayoutService } from './force-layout.service'; // Adjust path as necessary
import { ForceSettings, NodeAttributes, EdgeAttributes, ForceWorker } from './data-interface'; // Adjust path as necessary
import { Observable } from 'rxjs';

@Component({
  selector: 'app-force-layout',
  template: '', // This component doesn't render any HTML itself, it's purely logic
  standalone: true, // Mark as standalone for easier import
  providers: [ForceLayoutService], // Provide the service at the component level
})

export class ForceLayoutComponent implements OnInit, OnChanges, OnDestroy {
  @Input() sigmaInstance: Sigma<NodeAttributes, EdgeAttributes> | undefined;
  @Input() settings: ForceSettings | undefined;
  @Input() defaultNodeSize: number | undefined;

  // Expose the forceWorker for parent components to control start/stop
  forceWorker$: Observable<ForceWorker | null>;

  constructor(private forceLayoutService: ForceLayoutService) {
    this.forceWorker$ = this.forceLayoutService.forceWorker$;
  }

  ngOnInit(): void {

    if (this.sigmaInstance && this.settings && this.defaultNodeSize !== undefined) {
      this.forceLayoutService.init(
        this.sigmaInstance,
        this.settings,
        this.defaultNodeSize,
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings'] && this.settings) {
      this.forceLayoutService.updateSettings(this.settings);
    }
    if (changes['defaultNodeSize'] && this.defaultNodeSize !== undefined) {
      this.forceLayoutService.updateDefaultNodeSize(this.defaultNodeSize);
    }
  }

  ngOnDestroy(): void {
    this.forceLayoutService.destroy();
  }
}
