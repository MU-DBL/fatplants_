
import { Component, AfterViewInit,ViewChild, ElementRef, Output, EventEmitter, NgZone, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import NeoVis, { NeovisConfig, NeoVisEvents } from 'neovis.js';
import { environment } from 'src/environments/environment';
import type { Edge as VisEdge } from 'vis-network/standalone';

export interface NetworkSummary {
  totalNodes: number;
  totalEdges: number;
  groupCounts: Record<string, number>;
}
export interface NodeStyleConfig {
  color?: string; 
  size?: number;  
}
export interface GraphConfig {
  edgeLabelFontSize?: number; 
  nodeLabelFontSize?: number; 
  nodeSize?: number;
  nodeStyles: {
    Reaction?: NodeStyleConfig;
    Gene?: NodeStyleConfig;
    Compound?: NodeStyleConfig;
    Ortholog?: NodeStyleConfig;
    EC?: NodeStyleConfig;
  };
}

@Component({
  selector: 'app-network-visualization',
  templateUrl: './network-visualization.component.html',
  styleUrl: './network-visualization.component.scss'
})
export class NetworkVisualizationComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild('vizContainer', { static: true }) vizContainer!: ElementRef<HTMLDivElement>;
  @Output() networkSummary = new EventEmitter<NetworkSummary>();
  @Input() pathwayId!: string;

  private pathwayGradient: string = '';
  private pathwayEntryGradient: string = '';
  private reactionGradient: string = '';
  private geneGradient: string = '';
  private compoundGradient: string = '';
  private orthologGradient: string = '';
  private ecGradient: string = '';

  private gradientMap: Record<string, string> = {};

  constructor(private ngZone: NgZone) { }

  private viz: any; 
  selectedNode: any = null;

  ngOnInit(){
    this.pathwayGradient = this.createGradientImage(['#FFFFFF', '#ff7b00']);
    this.pathwayEntryGradient = this.createGradientImage(['#FFFFFF', '#2d00f7']);
    this.reactionGradient = this.createGradientImage(['#FFFFFF', '#a1ff0a']);
    this.geneGradient = this.createGradientImage(['#FFFFFF', '#0aefff']);
    this.compoundGradient = this.createGradientImage(['#FFFFFF', '#c200fb']);
    this.orthologGradient = this.createGradientImage(['#FFFFFF', '#04e762']);
    this.ecGradient = this.createGradientImage(['#FFFFFF', '#ee1ebaff']);

    this.gradientMap = {
      'Pathway': this.pathwayGradient,
      'PathwayEntry': this.pathwayEntryGradient,
      'Reaction': this.reactionGradient,
      'Gene': this.geneGradient,
      'Compound': this.compoundGradient,
      'Ortholog': this.orthologGradient,
      'EC': this.ecGradient
    };
  }

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
    var cypher = ""
    // console.log(this.pathwayId)
    if (this.pathwayId.includes('path:')) {
      cypher = `
        MATCH (p:Pathway {id:'${this.pathwayId}'}) 
        OPTIONAL MATCH (p:Pathway)-[p_pe_rel:CONTAINS]->(pe:FunctionalUnit)
        OPTIONAL MATCH (p:Pathway)-[p_r_rel:CONTAINS]->(r:Reaction)
        OPTIONAL MATCH (o1:Ortholog)-[o_pe_rel:MEMBER_OF]->(pe:FunctionalUnit)
        OPTIONAL MATCH (g3:Gene)-[g_pe_rel:MEMBER_OF]->(pe:FunctionalUnit)
        RETURN p,pe,p_pe_rel,o1,o_pe_rel,g3,g_pe_rel,r,p_r_rel
      `
      } else {
        cypher = `
          MATCH (p:Pathway {id:'${this.pathwayId}'}) 
          OPTIONAL MATCH (p:Pathway)-[p_r_rel:CONTAINS]->(r:Reaction)
          RETURN p,r,p_r_rel
        `
      }

      if (this.viz && this.viz.network) {
        this.viz.network.destroy();
      }


    //   cypher = `
    //     MATCH (p:Pathway {id:'${this.pathwayId}'}) 
    //     OPTIONAL MATCH (p:Pathway)-[p_pe_rel:CONTAINS]->(pe:PathwayEntry)
    //     OPTIONAL MATCH (p:Pathway)-[p_r_rel:CONTAINS]->(r:Reaction)
    //     OPTIONAL MATCH (ec:EC)-[ec_r_rel:CATALYZES]->(r:Reaction)
    //     OPTIONAL MATCH (o2:Ortholog)-[or_r_rel:CATALYZES]->(r:Reaction)
    //     OPTIONAL MATCH (c1:Compound)-[c_r_rel:SUBSTRATE_OF]->(r:Reaction)
    //     OPTIONAL MATCH (r:Reaction)-[r_c_rel:PRODUCES]->(c2:Compound)
    //     OPTIONAL MATCH (g1:Gene)-[g_ec_rel:ENCODES]->(ec:EC)
    //     OPTIONAL MATCH (g2:Gene)-[g_o_rel:BELONGS_TO]->(o2:Ortholog)
    //     OPTIONAL MATCH (o1:Ortholog)-[o_pe_rel:MEMBER_OF]->(pe:PathwayEntry)
    //     OPTIONAL MATCH (g3:Gene)-[g_pe_rel:MEMBER_OF]->(pe:PathwayEntry)
    //     RETURN p,pe,p_pe_rel,o1,o_pe_rel,g3,g_pe_rel,r,p_r_rel,ec,ec_r_rel,o2,or_r_rel,c1,c_r_rel,c2,r_c_rel,g1,g_ec_rel,g2,g_o_rel
    //   `
    // }else{
    //     cypher = `
    //       MATCH (p:Pathway {id:'${this.pathwayId}'}) 
    //       OPTIONAL MATCH (p:Pathway)-[p_r_rel:CONTAINS]->(r:Reaction)
    //       OPTIONAL MATCH (ec:EC)-[ec_r_rel:CATALYZES]->(r:Reaction)
    //       OPTIONAL MATCH (o2:Ortholog)-[or_r_rel:CATALYZES]->(r:Reaction)
    //       OPTIONAL MATCH (c1:Compound)-[c_r_rel:SUBSTRATE_OF]->(r:Reaction)
    //       OPTIONAL MATCH (r:Reaction)-[r_c_rel:PRODUCES]->(c2:Compound)
    //       OPTIONAL MATCH (g1:Gene)-[g_ec_rel:ENCODES]->(ec:EC)
    //       OPTIONAL MATCH (g2:Gene)-[g_o_rel:BELONGS_TO]->(o2:Ortholog)
    //       RETURN p,r,p_r_rel,ec,ec_r_rel,o2,or_r_rel,c1,c_r_rel,c2,r_c_rel,g1,g_ec_rel,g2,g_o_rel
    //     `
    // }
    const config: NeovisConfig = {
      containerId: this.vizContainer.nativeElement.id,
      neo4j: {
       	serverUrl: environment.neo4j_url,
       	serverUser: environment.neo4j_username,
       	serverPassword: environment.neo4j_password,
       },

      labels: {
          Pathway:{ label: 'title', value: "pagerank", 
            [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
              function: {
                image: () => this.pathwayGradient,
                shape: () => 'image'
              }
            }},
      FunctionalUnit: { label: 'id', value: "pagerank",  
            [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
              function: {
                image: () => this.pathwayEntryGradient,
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
              image: () => this.reactionGradient,
              shape: () => 'image'
            }
          }},
          Gene: { label: 'id', value: "pagerank",[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => this.geneGradient,
              shape: () => 'image'
            }
          }},
          Compound: { label: 'id', value: "pagerank",[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => this.compoundGradient,
              shape: () => 'image'
            }
          }},
          Ortholog: { label: 'id', value: "pagerank",[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => this.orthologGradient,
              shape: () => 'image'
            }
          }},
          EC: { label: 'id', value: "pagerank",[NeoVis.NEOVIS_ADVANCED_CONFIG]: {
             function: {
              image: () => this.ecGradient,
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
          CATALYZES:     { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'cat';            // show the relationship TYPE
              },
            }
            }},
          HAS_ENZYME_FUNCTION:     { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'h';            // show the relationship TYPE
              },
            }
            }},
          SUBSTRATE_OF: { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 's';            // show the relationship TYPE
              },
            }
            }},
          PRODUCES: { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'p';            // show the relationship TYPE
              },
            }
            }},
          ENCODES: { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'e';            // show the relationship TYPE
              },
            }
            }},
          MEMBER_OF: { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'm';            // show the relationship TYPE
              },
            }
          }},
          BELONGS_TO: { [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
            function: {
              label: () => {
                return 'b';            // show the relationship TYPE
              },
            }
          }},
      },

      initialCypher: cypher,

      visConfig: {
         interaction: {
            zoomView: true,   // allow zooming by wheel/pinch :contentReference[oaicite:0]{index=0}
          },
					nodes: {
						shape: 'dot',
            chosen: true,
            borderWidth:3,
            size: 15,
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

      this.viz = new NeoVis(config);
      this.viz.render();
      
      // Track which reactions have been expanded
      const expandedReactions = new Set<string>() 

      this.viz.registerOnEvent(NeoVisEvents.ClickNodeEvent, () => {
        if (this.viz.network) {
          this.viz.network.on('click', async (params: any) => {
            if (params.nodes.length > 0) {
              const nodeId = params.nodes[0];
              const nodeData = this.viz.nodes.get(nodeId);
              const node = Array.isArray(nodeData) ? nodeData[0] : nodeData;
              this.selectedNode = {
                id: nodeId,
                group: node.group,
                properties: node?.raw.properties || {}
              };
              // If clicked node is a Reaction and hasn't been expanded yet
              if (node.group === 'Reaction' && !expandedReactions.has(nodeId)) {
                const reactionId = node?.raw.properties?.id;
                if (reactionId) {
                  await this.loadReactionDetails(reactionId);
                  expandedReactions.add(nodeId);
                }
              }

            } else {
              this.selectedNode = null;
            }
          });
        }
      });

      this.viz.registerOnEvent(NeoVisEvents.CompletionEvent, () => {
     
        const nodes = this.viz.nodes.get();
        const edges = this.viz.edges.get();
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

  // New method to load reaction details on demand
  private async loadReactionDetails(reactionId: string) {
    const detailCypher = `
      MATCH (r:Reaction {id:'${reactionId}'})
      OPTIONAL MATCH (ec:EC)-[ec_r_rel:CATALYZES]->(r)
      OPTIONAL MATCH (o2:Ortholog)-[or_r_rel:CATALYZES]->(r)
      OPTIONAL MATCH (c1:Compound)-[c_r_rel:SUBSTRATE_OF]->(r)
      OPTIONAL MATCH (r)-[r_c_rel:PRODUCES]->(c2:Compound)
      OPTIONAL MATCH (g1:Gene)-[g_ec_rel:ENCODES]->(ec)
      OPTIONAL MATCH (g2:Gene)-[g_o_rel:BELONGS_TO]->(o2)
      RETURN ec,ec_r_rel,o2,or_r_rel,c1,c_r_rel,c2,r_c_rel,g1,g_ec_rel,g2,g_o_rel
    `;

    try {
      // Update the graph with new data
      await this.viz.updateWithCypher(detailCypher);
      
      // Update network summary after loading new nodes
      const nodes = this.viz.nodes.get();
      const edges = this.viz.edges.get();
      const groupCounts = nodes.reduce((acc, n) => {
        const g = n.group || 'unknown';
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      this.networkSummary.emit({
        totalNodes: nodes.length,
        totalEdges: edges.length,
        groupCounts
      });
    } catch (error) {
      console.error('Error loading reaction details:', error);
    }
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

  public updateEdgeNodeLabelSize(graphConfig: GraphConfig){
    if (!this.viz || !this.viz.network ) {
        return;
    }

    const newOptions: any = {
    edges: {
        font: {
          size: graphConfig.edgeLabelFontSize || 14 
        }
    },
    nodes: {
        font: {
          size: graphConfig.nodeLabelFontSize || 14
        },
      }
    };

    this.viz.network.setOptions(newOptions);

  }

  public updateGlobalNodeSize(graphConfig: GraphConfig){
    if (!this.viz || !this.viz.network ) {
        return;
    }
    const nodesToUpdate: any[] = [];
    const currentNodes = this.viz.nodes.get();
    for (const node of currentNodes) {
      const updatedNodeProps: any = { id: node.id };
      updatedNodeProps.size =  graphConfig.nodeSize || 15; 
      nodesToUpdate.push(updatedNodeProps);
    }

    if (nodesToUpdate.length > 0) {
      this.viz.nodes.update(nodesToUpdate);
    }
  }

  public updateNodeGroup(graphConfig:GraphConfig) {

    if (!this.viz || !this.viz.network ) {
        return;
    }
    const nodesToUpdate: any[] = [];
    const currentNodes = this.viz.nodes.get();
    for (const node of currentNodes) {
      const nodeGroup = node.group;
      const nodeStyleConfig = this.getNodeStyle(nodeGroup, graphConfig);
      const updatedNodeProps: any = { id: node.id };
      
      if (nodeStyleConfig?.color) {
          updatedNodeProps.shape = 'image';
          updatedNodeProps.image = this.createGradientImage(['#FFFFFF', nodeStyleConfig.color]); // Ensure no image if color is set
      } else {
          updatedNodeProps.image = this.gradientMap[nodeGroup];
          updatedNodeProps.shape = 'image';
      }

      if (nodeStyleConfig?.size) {
        updatedNodeProps.size = nodeStyleConfig.size;
      } else {
        updatedNodeProps.size =  graphConfig.nodeSize || 15; 
      }  

      nodesToUpdate.push(updatedNodeProps);
    }

    // Batch update the nodes
    if (nodesToUpdate.length > 0) {
      this.viz.nodes.update(nodesToUpdate);
    }
  }

  private getNodeStyle(label: string, graphConfig: GraphConfig) {
    return graphConfig?.nodeStyles?.[label as keyof GraphConfig['nodeStyles']];
  }
}
