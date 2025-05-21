import { Component, Injectable, OnInit } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import * as node_Data from '../../assets/cyto_node.json';
import * as edge_Data from '../../assets/cyto_edge.json';

@Injectable({
  providedIn:'root'
})  
@Component({
  selector: 'app-go-cytoscape',
  templateUrl: './go-cytoscape.component.html',
  styleUrls: ['./go-cytoscape.component.scss']
})
export class GoCytoscapeComponent implements OnInit {
  
  node_description: any;
  ELEMENT_DATA;
  showCyto = false;
  layout;
  style=[];
  nodes:any;
  edges:any;

  constructor(private http: HttpClient){ 
    this.nodes=(JSON.parse(JSON.stringify(node_Data))).default.data;
    this.edges=(JSON.parse(JSON.stringify(edge_Data))).default.data;
    
  }
  
  //experimentFilter:CytographAdditionalData = {kicExperimentId: "all"};
  
  ngOnInit(): void {
    this.mapEdgesNodes(this.nodes,this.edges);  
  }

  mapEdgesNodes(nodes, edges) {
      
  
      for (let i = 0; i < nodes.length; i++) {
        // nodes[i]['name'] = nodes[i]['node_name'];
        nodes[i]['id'] = nodes[i]['Gene'];
        // nodes[i]['Sayeera']=nodes[i]['sayeera']; if we want to add this field to entire nodes dataset
        nodes[i]['width'] = nodes[i]['HitsCount'];
  
        nodes[i].network_type = "Direct";
        nodes[i] = { data: nodes[i] };
  
        
      }
      for (let i = 0; i < edges.length; i++) {
        edges[i]['source'] = edges[i]['node A'];
        edges[i].network_type = "Direct";
        //delete edges[i]['node A'];
        edges[i]['target'] = edges[i]['node B'];
        edges[i]['width'] = 2;//Math.log2(edges[i].Phosphorylated_Percentage) + 1;
  
        
        //delete edges[i]['node B'];
  
        edges[i] = { data: edges[i], classes: 'tooltip' };
      }
      // cy.$('#edge').style('line-style', 'dashed');
      this.ELEMENT_DATA = {
  
  
        style: [
          {
            selector: 'node[HitsCount <=40]',
            css: {
               content: 'data(Gene)',
              'border-color': '#f74f68',
              'border-opacity': 1,
              'border-width': '1px',
              'background-color': '#ff1a1a', //red
              'width': 'data(width)',
              'height':'data(width)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#000',
              'font-size': '15px',
              // 'shape':'diamond',
            },
          },
          {
            selector: 'node[HitsCount > 40][HitsCount <= 80]',
            css: {
               content: 'data(Gene)',
              'border-color': '#f74f68',
              'border-opacity': 1,
              'border-width': '1px',
              'background-color':'#ffff00', //yellow
              'width': 'data(width)',
              'height':'data(width)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#000',
              'font-size': '25px',
              // 'shape':'diamond',
            },
          },
          {
            selector: 'node[HitsCount > 80][HitsCount <= 120]',
            css: {
               content: 'data(Gene)',
              'border-color': '#f74f68',
              'border-opacity': 1,
              'border-width': '1px',
              'background-color': '#3333ff', //blue
              'width': 'data(width)',
              'height':'data(width)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#000',
              'font-size': '30px',
              // 'shape':'diamond',
            },
          },
          {
            selector: 'node[HitsCount > 120][HitsCount <= 150]',
            css: {
               content: 'data(Gene)',
              'border-color': '#f74f68',
              'border-opacity': 1,
              'border-width': '1px',
              'background-color': '#ff3399',  //pink
              'width': 'data(width)',
              'height':'data(width)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#000',
              'font-size': '40px',
              // 'shape':'diamond',
            },
          },
          {
            selector: 'node[HitsCount >= 150]',
            css: {
               content: 'data(Gene)',
              'border-color': '#f74f68',
              'border-opacity': 1,
              'border-width': '1px',
              'background-color': '#00ff00', //green
              'width': 'data(width)',
              'height':'data(width)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#000',
              'font-size': '50px',
              // 'shape':'diamond',
            },
          },
          {
            selector: 'edge',
            css: {
              content:'',
              width: 'data(width)',
              'target-arrow-shape': 'triangle',
              'line-color': '#401a4a',
              // 'line-style':'data(line_style)',
              // 'curve-style':'data(curve_style)',
              color: '#000000',
  
            },
  
          },
        ],
  
        elements: {
          nodes: nodes,
          edges: edges,
        },
  
      };

      
      this.showCyto = true;
    }
  }
  