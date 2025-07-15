
import { Component, AfterViewInit,ViewChild, ElementRef, Output, EventEmitter, NgZone, Input, OnChanges, SimpleChanges } from '@angular/core';
import NeoVis, { NeovisConfig, NeoVisEvents } from 'neovis.js';
import { environment } from 'src/environments/environment';
import type { Edge as VisEdge } from 'vis-network/standalone';

export interface NetworkSummary {
  totalNodes: number;
  totalEdges: number;
  groupCounts: Record<string, number>;
}

@Component({
  selector: 'app-network-visualization',
  templateUrl: './network-visualization.component.html',
  styleUrl: './network-visualization.component.scss'
})
export class NetworkVisualizationComponent implements AfterViewInit, OnChanges {

  @ViewChild('vizContainer', { static: true }) vizContainer!: ElementRef<HTMLDivElement>;
  @Output() networkSummary = new EventEmitter<NetworkSummary>();
  @Input() pathwayId!: string;

  constructor(private ngZone: NgZone) { }
  
  selectedNode: any = null;

  ngAfterViewInit() {
    if (this.pathwayId) {
      this.renderGraph();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pathwayId'] && !changes['pathwayId'].isFirstChange()) {
      this.renderGraph();
    }
  }

  private renderGraph() {
    const pathwayGradient = this.createGradientImage(['#F0F0F0', '#ff7b00']);
    const pathwayEntryGradient = this.createGradientImage(['#F0F0F0', '#2d00f7']);
    const reactionGradient = this.createGradientImage(['#F0F0F0', '#a1ff0a']);
    const geneGradient = this.createGradientImage(['#F0F0F0', '#0aefff']);
    const compoundGradient = this.createGradientImage(['#F0F0F0', '#c200fb']);
    const orthologGradient = this.createGradientImage(['#F0F0F0', '#04e762']);

    const config: NeovisConfig = {
      containerId: this.vizContainer.nativeElement.id,
      neo4j: {
       	serverUrl: environment.neo4j_url,
       	serverUser: environment.neo4j_username,
       	serverPassword: environment.neo4j_password,
        // driverConfig: { 
        //   encrypted: "ENCRYPTION_ON",
        //   trust: "TRUST_SYSTEM_CA_SIGNED_CERTIFICATES"
        // }	
       },

      labels: {
          Pathway:{ label: 'title', value: "pagerank", 
          [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => pathwayGradient,
              shape: () => 'image'
            }
          }},
          PathwayEntry: { label: 'id', value: "pagerank",  
            [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
              function: {
                image: () => pathwayEntryGradient,
                shape: () => 'image',
                label: (neo4jNode) => {
                  const rawId = neo4jNode.properties.id as string;  
                  const parts = rawId.split('_');            
                  return parts.length > 1 ? parts[1] : rawId; 
                }
              }
            }},
          Reaction: { label: 'id', value: "pagerank",[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => reactionGradient,
              shape: () => 'image'
            }
          }},
          Gene: { label: 'id', value: "pagerank",[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => geneGradient,
              shape: () => 'image'
            }
          }},
          Compound: { label: 'id', value: "pagerank",[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => compoundGradient,
              shape: () => 'image'
            }
          }},
          Ortholog: { label: 'id', value: "pagerank",[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => orthologGradient,
              shape: () => 'image'
            }
          }},
        },

      relationships: {
          CONTAINS: {[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'c';            // show the relationship TYPE
              },
            }
            }},
          INCLUDES:       {[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'c';            // show the relationship TYPE
              },
            }
            }},
          BELONGS_TO:     { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'b';            // show the relationship TYPE
              },
            }
            }},
          INTERACTS_WITH: { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'i';            // show the relationship TYPE
              },
            }
            }},
      },

      initialCypher: `
        MATCH (p:Pathway {id:'${this.pathwayId}'}) 
        OPTIONAL MATCH (p)-[con:CONTAINS]->(pe:PathwayEntry)
        OPTIONAL MATCH (p)-[inc:INCLUDES]->(r:Reaction)
        OPTIONAL MATCH (g:Gene)-[gen_bel:BELONGS_TO]->(pe)
        OPTIONAL MATCH (c:Compound)-[com_bel:BELONGS_TO]->(pe)
        OPTIONAL MATCH (o:Ortholog)-[ort_bel:BELONGS_TO]->(pe)
        OPTIONAL MATCH (pe)-[int:INTERACTS_WITH]-(pe2:PathwayEntry)
        RETURN p, pe, pe2, r, g, c, o, con, inc, gen_bel, com_bel, ort_bel, int
      `,

      visConfig: {
         interaction: {
            zoomView: true,   // allow zooming by wheel/pinch :contentReference[oaicite:0]{index=0}
          },
					nodes: {
						shape: 'dot',
            chosen: true,
            borderWidth:3,
            size:15,
            shadow: {
              enabled:true,    
              color: 'rgba(0,0,0,0.3)', 
              size:3,      
              x:2,       
              y: 2        
            }
					},
					edges: {
						arrows: {
							to: {enabled: true}
						},
            font: { align: 'top' },
            color: {
              color: '#848484',
              highlight: '#848484',
              hover: '#848484'
            }
					}
        }
    };

    
      const viz = new NeoVis(config);
      viz.render();
      viz.registerOnEvent(NeoVisEvents.ClickNodeEvent, () => {
        if (viz.network) {
          viz.network.on('click', (params: any) => {
            if (params.nodes.length > 0) {
              const nodeId = params.nodes[0];
              const nodeData = viz.nodes.get(nodeId);
              const node = Array.isArray(nodeData) ? nodeData[0] : nodeData;
              this.selectedNode = {
                id: nodeId,
                group: node.group,
                properties: node?.raw.properties || {}
              };
            } else {
              this.selectedNode = null;
            }
          });
        }
      });

      viz.registerOnEvent(NeoVisEvents.CompletionEvent, () => {
     
        const nodes = viz.nodes.get();
        const edges = viz.edges.get();
        const groupCounts = nodes.reduce((acc, n) => {
          const g = n.group || 'unknown';
          acc[g] = (acc[g] || 0) + 1;
          return acc;
        }, {} as Record<string,number>);
        this.networkSummary.emit({
          totalNodes: nodes.length,
          totalEdges: edges.length,
          groupCounts
        });
      });
  }

  
  getKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  private createGradientImage(colors: string[], type: 'radial' | 'linear' = 'radial'): string {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    const ctx = canvas.getContext('2d')!;
    
    let gradient;
    if (type === 'radial') {
      gradient = ctx.createRadialGradient(30, 30, 0, 30, 30, 30);
    } else {
      gradient = ctx.createLinearGradient(0, 0, 60, 60);
    }
    
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(30, 30, 30, 0, 2 * Math.PI);
    ctx.fill();
    
    return canvas.toDataURL();
  }
}
