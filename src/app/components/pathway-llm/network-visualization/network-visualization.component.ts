
import { Component, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter,
         NgZone, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { Network, DataSet } from 'vis-network/standalone';
import { firstValueFrom } from 'rxjs';
import { APIService } from 'src/app/services/api/api.service';

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

/**
 * Expected API response shape from the backend's cypher/ endpoint:
 * {
 *   nodes: Array<{ id: number, labels: string[], properties: Record<string, any> }>,
 *   relationships: Array<{ id: number, type: string, startNodeId: number, endNodeId: number, properties: Record<string, any> }>
 * }
 */

@Component({
  selector: 'app-network-visualization',
  templateUrl: './network-visualization.component.html',
  styleUrl: './network-visualization.component.scss'
})
export class NetworkVisualizationComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('vizContainer', { static: true }) vizContainer!: ElementRef<HTMLDivElement>;
  @Output() networkSummary = new EventEmitter<NetworkSummary>();
  @Input() pathwayId!: string;
  @Input() species!: string;

  private pathwayGradient: string = '';
  private pathwayEntryGradient: string = '';
  private reactionGradient: string = '';
  private geneGradient: string = '';
  private compoundGradient: string = '';
  private orthologGradient: string = '';
  private ecGradient: string = '';

  private gradientMap: Record<string, string> = {};

  private network!: Network;
  private nodes = new DataSet<any>([]);
  private edges = new DataSet<any>([]);
  private expandedReactions = new Set<string>();

  selectedNode: any = null;

  constructor(private ngZone: NgZone, private apiService: APIService) {}

  ngOnInit() {
    this.pathwayGradient       = this.createGradientImage(['#FFFFFF', '#ff7b00']);
    this.pathwayEntryGradient  = this.createGradientImage(['#FFFFFF', '#2d00f7']);
    this.reactionGradient      = this.createGradientImage(['#FFFFFF', '#a1ff0a']);
    this.geneGradient          = this.createGradientImage(['#FFFFFF', '#0aefff']);
    this.compoundGradient      = this.createGradientImage(['#FFFFFF', '#c200fb']);
    this.orthologGradient      = this.createGradientImage(['#FFFFFF', '#04e762']);
    this.ecGradient            = this.createGradientImage(['#FFFFFF', '#ee1ebaff']);

    this.gradientMap = {
      'Pathway':       this.pathwayGradient,
      'FunctionalUnit': this.pathwayEntryGradient,
      'Reaction':      this.reactionGradient,
      'Gene':          this.geneGradient,
      'Compound':      this.compoundGradient,
      'Ortholog':      this.orthologGradient,
      'EC':            this.ecGradient
    };
  }

  ngAfterViewInit() {
    const container = this.vizContainer.nativeElement;

    const options: any = {
      interaction: { zoomView: true },
      nodes: {
        shape: 'image',
        chosen: true,
        borderWidth: 3,
        size: 15,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', size: 3, x: 2, y: 2 }
      },
      edges: {
        arrows: { to: { enabled: true } },
        font: { align: 'top' },
        color: { color: '#848484', highlight: '#848484', hover: '#848484' }
      }
    };

    this.ngZone.runOutsideAngular(() => {
      this.network = new Network(container, { nodes: this.nodes, edges: this.edges }, options);
    });

    this.network.on('click', async (params: any) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeData = this.nodes.get(nodeId) as any;

        this.ngZone.run(() => {
          this.selectedNode = {
            id: nodeId,
            group: nodeData.group,
            properties: nodeData.rawProperties || {}
          };
        });

        if (nodeData.group === 'Reaction' && !this.expandedReactions.has(String(nodeId))) {
          const reactionId = nodeData.rawProperties?.id;
          if (reactionId) {
            await this.loadReactionDetails(reactionId);
            this.expandedReactions.add(String(nodeId));
          }
        }
      } else {
        this.ngZone.run(() => { this.selectedNode = null; });
      }
    });

    if (this.pathwayId) {
      this.renderGraph();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pathwayId'] && !changes['pathwayId'].isFirstChange()) {
      this.renderGraph();
    }
  }

  ngOnDestroy() {
    this.network?.destroy();
  }

  private async renderGraph() {
    this.nodes.clear();
    this.edges.clear();
    this.expandedReactions.clear();
    this.selectedNode = null;

    console.log(this.pathwayId);

    let cypher: string;
    if (this.pathwayId.includes('path:')) {
      cypher = `
        MATCH (p:Pathway {id:'${this.pathwayId}'})
        OPTIONAL MATCH (p:Pathway)-[p_pe_rel:CONTAINS]->(pe:FunctionalUnit)
        OPTIONAL MATCH (p:Pathway)-[p_r_rel:CONTAINS]->(r:Reaction)
        OPTIONAL MATCH (o1:Ortholog)-[o_pe_rel:MEMBER_OF]->(pe:FunctionalUnit)
        OPTIONAL MATCH (g3:Gene)-[g_pe_rel:MEMBER_OF]->(pe:FunctionalUnit)
        RETURN p,pe,p_pe_rel,o1,o_pe_rel,g3,g_pe_rel,r,p_r_rel
      `;
    } else {
      cypher = `
        MATCH (p:Pathway {id:'${this.pathwayId}'})
        OPTIONAL MATCH (p:Pathway)-[p_r_rel:CONTAINS]->(r:Reaction)
        RETURN p,r,p_r_rel
      `;
    }

    await this.fetchAndMerge(cypher);
    this.emitSummary();
  }

  private async loadReactionDetails(reactionId: string) {
    console.log(this.species.toLowerCase());
    const detailCypher = `
      MATCH (r:Reaction {id:'${reactionId}'})
      OPTIONAL MATCH (ec:EC)-[ec_r_rel:CATALYZES]->(r)
      OPTIONAL MATCH (o2:Ortholog)-[or_r_rel:CATALYZES]->(r)
      OPTIONAL MATCH (c1:Compound)-[c_r_rel:SUBSTRATE_OF]->(r)
      OPTIONAL MATCH (r)-[r_c_rel:PRODUCES]->(c2:Compound)
      OPTIONAL MATCH (g1:Gene)-[g_ec_rel:ENCODES]->(ec)
      WHERE g1.id STARTS WITH '${this.species.toLowerCase()}'
      OPTIONAL MATCH (g2:Gene)-[g_o_rel:BELONGS_TO]->(o2)
       WHERE g2.id STARTS WITH '${this.species.toLowerCase()}'
      RETURN r,ec,ec_r_rel,o2,or_r_rel,c1,c_r_rel,c2,r_c_rel,g1,g_ec_rel,g2,g_o_rel
    `;

    try {
      await this.fetchAndMerge(detailCypher);
      this.emitSummary();
    } catch (error) {
      console.error('Error loading reaction details:', error);
    }
  }

  // Maps Cypher return variable names to their Neo4j node labels
  private readonly columnLabelMap: Record<string, string> = {
    'p': 'Pathway', 'pe': 'FunctionalUnit',
    'r': 'Reaction',
    'o1': 'Ortholog', 'o2': 'Ortholog',
    'g1': 'Gene', 'g2': 'Gene', 'g3': 'Gene',
    'ec': 'EC',
    'c1': 'Compound', 'c2': 'Compound'
  };

  private readonly edgeLabelMap: Record<string, string> = {
    CONTAINS: 'c', CATALYZES: 'cat', HAS_ENZYME_FUNCTION: 'h',
    SUBSTRATE_OF: 's', PRODUCES: 'p', ENCODES: 'e', MEMBER_OF: 'm', BELONGS_TO: 'b'
  };

  private async fetchAndMerge(cypher: string) {
    const response: any = await firstValueFrom(this.apiService.getCypherResult(cypher));
    this.processApiResponse(response);
  }

  // API returns: { results: [ { colName: nodeProps | [startProps, "TYPE", endProps] | null, ... }, ... ] }
  private processApiResponse(response: any) {
    for (const record of (response.results || [])) {
      for (const key of Object.keys(record)) {
        const value = record[key];
        if (!value) continue;

        if (Array.isArray(value) && value.length === 3 && typeof value[1] === 'string') {
          // Relationship: [startNodeProps, "TYPE", endNodeProps]
          this.mergeEdge(value[0], value[1], value[2]);
        } else if (typeof value === 'object') {
          // Node: look up label by column name
          const label = this.columnLabelMap[key];
          if (label) this.mergeNode(value, label);
        }
      }
    }
  }

  private mergeNode(props: Record<string, any>, label: string) {
    const id: string = props['id'];
    if (!id || this.nodes.get(id)) return;

    let displayLabel = id;
    const image = this.gradientMap[label] || this.pathwayGradient;

    if (label === 'Pathway') {
      displayLabel = props['title'] || id;
    } else if (label === 'FunctionalUnit') {
      const parts = id.split('_');
      displayLabel = parts.length > 1 ? parts[1] : id;
    }

    this.nodes.add({ id, label: displayLabel, group: label, shape: 'image', image, rawProperties: props });
  }

  private mergeEdge(startProps: any, type: string, endProps: any) {
    const from: string = startProps['id'];
    const to: string = endProps['id'];
    if (!from || !to) return;

    const edgeId = `${from}__${type}__${to}`;
    if (this.edges.get(edgeId)) return;

    this.edges.add({ id: edgeId, from, to, label: this.edgeLabelMap[type] || type });
  }

  private emitSummary() {
    const allNodes = this.nodes.get();
    const allEdges = this.edges.get();
    const groupCounts = allNodes.reduce((acc: Record<string, number>, n: any) => {
      const g = n.group || 'unknown';
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});
    this.networkSummary.emit({ totalNodes: allNodes.length, totalEdges: allEdges.length, groupCounts });
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

  public updateEdgeNodeLabelSize(graphConfig: GraphConfig) {
    if (!this.network) return;
    this.network.setOptions({
      edges: { font: { size: graphConfig.edgeLabelFontSize || 14 } },
      nodes: { font: { size: graphConfig.nodeLabelFontSize || 14 } }
    });
  }

  public updateGlobalNodeSize(graphConfig: GraphConfig) {
    if (!this.network) return;
    const updates = this.nodes.get().map((n: any) => ({ id: n.id, size: graphConfig.nodeSize || 15 }));
    if (updates.length > 0) this.nodes.update(updates);
  }

  public updateNodeGroup(graphConfig: GraphConfig) {
    if (!this.network) return;
    const updates = this.nodes.get().map((n: any) => {
      const styleConfig = this.getNodeStyle(n.group, graphConfig);
      const update: any = { id: n.id };

      if (styleConfig?.color) {
        update.shape = 'image';
        update.image = this.createGradientImage(['#FFFFFF', styleConfig.color]);
      } else {
        update.image = this.gradientMap[n.group];
        update.shape = 'image';
      }

      update.size = styleConfig?.size || graphConfig.nodeSize || 15;
      return update;
    });

    if (updates.length > 0) this.nodes.update(updates);
  }

  private getNodeStyle(label: string, graphConfig: GraphConfig) {
    return graphConfig?.nodeStyles?.[label as keyof GraphConfig['nodeStyles']];
  }
}
