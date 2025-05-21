import { Component, OnInit, Input, DoCheck, KeyValueDiffers, ViewChild, TemplateRef } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import cytoscape from 'cytoscape';
import euler from 'cytoscape-euler';
import dagre from 'cytoscape-dagre';
import spread from 'cytoscape-spread';
import cola from 'cytoscape-cola';
import { CytographAdditionalData, ExtendableNode } from 'src/app/interfaces/cytograph-additional-data';
import { GoCytoscapeComponent } from '../../go-cytoscape-page/go-cytoscape.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';


interface DetailItem {
  title: string;
  detail: any;
}

interface FilterItem {
  type: string;
  operator: string;
  value: any;
  property: string;
  filter: string;
}

interface StyleItem {
  selector: string;
  style: {
    [key: string]: any;
  };
}

interface EdgeData {
  source: string;
  target: string;
}

@Component({
  selector: 'app-go-cytoscape-network',
  templateUrl: './go-cytoscape-network.component.html',
  styleUrls: ['./go-cytoscape-network.component.scss']
})
export class GoCytoscapeNetworkComponent implements OnInit {
  @Input() cytoData;
  @Input() optionalData?: CytographAdditionalData;
  differ: any;
  @ViewChild('warningSearchDialog') warningSearchDialog!: TemplateRef<any>;
  

  hover_data: DetailItem[] = [];
  clickedEdge_Data: DetailItem[] = [];
  details: DetailItem[] = [];

  filters: FilterItem[] = [];
  styles: StyleItem[] = [];

  graph;  
  graphElements;

  layouts = [
    { value: 'Euler', ref: euler },
    { value: 'Dagre', ref: dagre },
    { value: 'Spread', ref: spread },
    { value: 'Cola', ref: cola,
  
    ready: e => {
        e.cy.fit()
        e.cy.center()}}
    

  ];
  selected = {
    name: ['id', 'group', 'value 1', 'value 2'],
    display: ['ID', 'Group', 'Value 1', 'Value 2'],
    data: [],
  };
  showSelected = false;
  showProteinInfo = false;
  isPtmViewer = true;
  showNodeInfo = false;
  searchForm!: FormGroup;
  filterForm;
  styleForm;


  // these are used for the filter form
  edgeKeys: string[] = [];
  nodeKeys: string[] = [];

  cytoDataFull;
  // sayeeraField;
  clickedNodeId: any;
  clickedNode: any;
  originalElements: any;
  isResetEnabled = false;
  layout;

  constructor(
    private fb: FormBuilder, 
    private differs: KeyValueDiffers , 
    private gc: GoCytoscapeComponent,
    private http: HttpClient,
    private dialog: MatDialog,
  ){
    this.layouts.forEach((x) => {
      cytoscape.use(x['ref']);
    });


    this.differ = differs.find({}).create();
    // this.kc.getData();
    console.log("Cytoscape constructor called");
    // this.sayeeraField= this.kc.sayeeraField;
    console.log('cytoData in Constructor',this.cytoData);
  }

  ngOnInit(): void {
    this.populateGraph();
    this.buildFilterForm();
    this.buildStyleForm();
    this.addDefaultStlyes();
    this.buildSearchForm();
    
  }

  changeLayout(layout) {

    this.graph
      .layout({
        name: layout.toLowerCase(),
      })
      .run();
  }
  
  
  

  // we need something more granular to check if our optiondata changes
  ngDoCheck() {
    var changes = this.differ.diff(this.optionalData);
    if (changes && this.optionalData && this.cytoData) {
      this.handleParentData();
    }
      
  }

  // temporary way to remove added extendablenodes
  addedNode: string = "";
  addedEdge: string = "";

  // given the proper structure, we can render additional nodes from
  // the data for an extendable node
  renderExtendableNode(node: ExtendableNode, details: any[]) {
    
    if (this.addedNode && this.addedEdge) {
      this.graph.remove('node[id = "'+this.addedNode+'"]');
      this.graph.remove('node[id = "'+this.addedEdge+'"]');
    }

    let connectedNodeId = "";
    details.forEach(e => {
      if (e.title == "Gene")
        connectedNodeId = e.detail;
    })

    this.addedNode = node.nodeTitle;
    this.addedEdge = node.nodeTitle + connectedNodeId;
    
    this.graph.add([{
      group: "nodes", 
      // we need tair_id because that's the label, it is not actually
      // a tair id
      data: {
        id: node.nodeTitle, tair_id: node.nodeTitle, ...node.data
      }
    }]);

    this.graph.add([{
      group: "edges", 
      data: {
        id: node.nodeTitle + connectedNodeId, source: connectedNodeId, target: node.nodeTitle, width: 5
      }
    }]);
  }

  //Updates the selected array to contain the elements selected on the graph
  updateSelected() {

    let elements = this.graph.elements('node:selected');
    let edge = this.graph.elements('edge:selected');

    console.log('node and edge selected is:',edge,elements);
    
    

    elements.forEach((element) => {
      let newDetails = JSON.parse(JSON.stringify(element.data()));
      console.log("the newDetails data is as follows : ",newDetails);
      for(let key in newDetails){      
        let key_upper = key[0].toUpperCase() + key.slice(1);
        key_upper = key_upper.replace(/_/g," ");
        let key_new = "";

        for(let item of key_upper.split(" ")){
          key_new += (item[0].toUpperCase() + item.slice(1)+" ");
        }

        key_new = key_new.substring(0, key_new.length-1)
        newDetails[key_new] = newDetails[key];
        delete newDetails[key]
      }

      this.showDetails(newDetails);

    });

    edge.forEach((element) => {

      let newDetails = JSON.parse(JSON.stringify(element.data()));

      console.log('edge elements are:', newDetails);
      
      for(let key in newDetails){      
        let key_upper = key[0].toUpperCase() + key.slice(1);
        key_upper = key_upper.replace(/_/g," ");

        let key_new = "";
        for(let item of key_upper.split(" ")){
          key_new += (item[0].toUpperCase() + item.slice(1)+" ");
        }

        key_new = key_new.substring(0, key_new.length-1)
        newDetails[key_new] = newDetails[key];
        delete newDetails[key];
      }

      this.showDetails(newDetails);
    });
  }

  showDetails(e) {

    let element = document.getElementById('detail_info') as HTMLDivElement;
    this.details = [];
    for (let key in e) {
      
        this.details.push({
          title: key,
          detail: e[key],
        });
      }
    console.log('details are:',this.details)
    for (let item in this.details){
      console.log(this.details[item]['title']);
    }
    }
  
  // 
  populateGraph() {
    if (this.cytoData != null) {
  
      if (this.cytoDataFull == null)
        this.cytoDataFull = JSON.parse(JSON.stringify(this.cytoData));
      this.originalElements = JSON.parse(JSON.stringify(this.cytoData.elements));
      this.cytoData['container'] = document.getElementById('cy');
      const options = {
        maxZoom: 2,
        minZoom: 0.1,
        autoResize: true,
        layout:{
          name: 'cola',
          nodeSpacing: 30,
          idealEdgeLength: 100,
          nodeOverlap: 20,
          refresh: 20,
          fit: true,
          padding: 30,
          randomize: false,
          componentSpacing: 100,
          nodeRepulsion: 400000,
          edgeElasticity: 100,
          nestingFactor: 5,
        }
        
      };
      
      this.graph = cytoscape({ ...this.cytoData, ...options, });
    
      // this.graph
      //   .layout({
      //     name: 'cola',
      //     maxSimulationTime: 3000,
      //     animate: true,
      //     infinite: true,
      //     fit: true,
      //   })
      //   .run();
  
      this.graphElements = this.graph.elements().clone();
  
      // Construct keys for nodes/edges
      this.nodeKeys = Object.keys(this.cytoData.elements.nodes[0].data);
      this.edgeKeys = Object.keys(this.cytoData.elements.edges[0].data);
  
      // We can't filter on this... yet
      this.edgeKeys.splice(this.edgeKeys.indexOf("experiment_data"), 1);
      
      // Add click event listener to item detail value
      // this.graph.on('tap', 'node', (event) => {
      //   const clickedNode = event.target;
      //   this.clickedNodeId = clickedNode.id(); // Store clicked node ID
      //   const clickedItemDetailValue = clickedNode.data().item_detail; // Get item detail value of clicked node
  
      //   if (clickedItemDetailValue) {
      //     this.onClickItemDetail(clickedItemDetailValue);
      //     {clickedItemDetailValue && console.log(1)}
      //   }
      // });

      // Add click event listener to nodes
      this.graph.on('tap', 'node', (event) => {     
        const clickedNode = event.target;
        this.displaySubNetwork(clickedNode.id());
      });
      this.graph.on('tap','edge',(event)=>{
        const clickedEdge =event.target;
        console.log('clicked edge is:',clickedEdge);
        this.showEdgeDetails(clickedEdge);

      })

     this.setupEventListeners_mousehover()
    }
  }
  setupEventListeners_mousehover() {
    this.clickedEdge_Data=[];
    this.graph.on('mouseover', 'node', (event) => {
      let node = event.target;
      console.log("Mouseover on node: ", node.id());
      this.details=[]
      this.clickedEdge_Data=[];
      this.showNodeDetails(node);
  });

  this.graph.on('mouseout', 'node', () => {
    console.log("Mouseout on node");
    this.hideNodeDetails();
  });
  }
  hideNodeDetails() {
    let tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
    this.hover_data=[];
  }
  showNodeDetails(node: any) {
    this.hover_data=[];
    this.clickedEdge_Data=[];
    console.log('node',node)
    let content = `
    <b>ID: </b>${node.id()}<br/>
    <b>Description: </b>${node.data('Description')}`; 
    console.log('content for tooltip:', content);
    let keys =['Gene','Description','Category','Enrichment']
    for (let k in keys){
      this.hover_data.push({
        title: keys[k],
        detail: node.data(keys[k]),
      });
      
    }

    console.log('hover_data:',this.hover_data)
  let tooltip = document.getElementById('tooltip'); // Make sure this element exists in your HTML

  if (tooltip) {
    tooltip.innerHTML = content;
    tooltip.style.display = 'block';
    let position = node.renderedPosition(); // Get the rendered position of the node
    tooltip.style.top = position.y + 20 + 'px'; // Adjust `20` for tooltip offset if needed
    tooltip.style.left = position.x + 'px';
  }
    //throw new Error('Method not implemented.');
  }

  showEdgeDetails(edge :any){
    this.clickedEdge_Data=[];
    edge.forEach((element) => {

      let newDetails = JSON.parse(JSON.stringify(element.data()));
      let keys=['source','target','SCORE','TYPE',]
      
      for (let k in keys){
        this.clickedEdge_Data.push({
          title: keys[k],
          detail: newDetails[keys[k]],
        });
      }
    });
  }

  
  displaySubNetwork(nodeId: string) {
    this.details=[];
    this.clickedEdge_Data=[];
    //logic to filter nodes and edges based on the clicked node
    console.log('nodeID',nodeId);

    this.isResetEnabled = true;

    console.log('Display Sub Network called with Node',nodeId);
    const connectedEdges = this.graph.elements().edges().filter(edge => edge.source().id() === nodeId || edge.target().id() === nodeId);

  // Retrieve all connected node IDs from the edges
    const connectedNodeIds = connectedEdges.map(edge => [edge.source().id(), edge.target().id()]).flat();
    connectedNodeIds.push(nodeId); // Include the clicked node itself

    // Filter nodes to include only those that are connected
    const subNetworkNodes = this.graph.elements().nodes().filter(node => connectedNodeIds.includes(node.id()));

    // Combine nodes and edges into one collection for the sub-network
    const subNetworkElements = subNetworkNodes.union(connectedEdges);

    // Clear existing elements and display only the sub-network
    this.graph.elements().remove();
    this.graph.add(subNetworkElements);
    this.graph.layout({
      name: 'cola', // Use any layout that suits your visual needs
      fit: true
    }).run();

    this.setupEventListeners_mousehover();
  }

  resetNetwork() {
    this.isResetEnabled = false;
    this.graph.elements().remove();
    window.location.reload();
  }
  
  getGraphData(){
    return this.graph.elements().map(node => node._private.data);
  }

  performSearch() {
    let searchType = this.searchForm.get('searchType')!.value;
    let searchvalue = this.searchForm.get('searchValue')!.value;
    console.log(searchType)
    console.log(searchvalue)

    if(searchType==='' || searchvalue === ''){
      window.alert('Search type and value are required.');
      return;
    }
    
    let SearchedNodeId = this.getGraphData().filter(item => item[searchType]?.toLowerCase().includes(searchvalue.toLowerCase()));
    console.log('searchedNodeID',SearchedNodeId);

    if(SearchedNodeId.length){
      this.displaySubNetwork(SearchedNodeId[0].id);
    }
    else{
      this.openDialogWithRef(this.warningSearchDialog)
    }
    this.searchForm.reset();
  }

  clearInput(inputElement: HTMLInputElement): void {
    inputElement.value = ''; // Clears the input field
  }
  openDialogWithRef(ref: TemplateRef<any>) {
    this.dialog.open(ref);
  }

  // onClickItemDetail(clickedItemDetailValue: string) {
  //   this.graph.nodes().lock(); // Lock all nodes to prevent further clicks during processing
  
  //   const existingNode = this.graph.$(`#${clickedItemDetailValue}`);
  //   if (!existingNode.empty()) {
  //     // Node with the same ID already exists, do not add new node and edge
  //     this.graph.nodes().unlock();
  //     return;
  //   }
  
  //   this.graph.add({
  //     group: 'nodes',
  //     data: {
  //       id: clickedItemDetailValue, // Set node ID as clicked item detail value
  //       // label: clickedItemDetailValue, // Set display text as clicked item detail value
  //     },
  //     style: {
  //       label: clickedItemDetailValue, // Set label as clicked item detail value
  //       'background-color': 'lightblue', // Set background color for the node
  //       color: 'black', // Set text color for the node
  //       'text-valign': 'center', // Set vertical alignment of the label
  //       'text-halign': 'center', // Set horizontal alignment of the label
  //       'text-wrap': 'wrap', // Enable text wrapping for long labels
  //       'text-max-width': '80px', // Set the maximum width of the label
  //       width: '100px', // Set the width of the node
  //       height: '50px', // Set the height of the node
  //       shape: 'roundrectangle', // Set the shape of the node
  //       'border-width': '2px', // Set the border width of the node
  //       'border-color': 'black', // Set the border color of the node
  //     },
  //   });
    
  
  //   // Add new edge with source as clicked item detail value and target as clicked node ID
  //   this.graph.add({
  //     group: 'edges',
  //     class: 'newEdge',
  //     style: {
  //       width: 2,
  //       'target-arrow-shape': 'triangle', // Set arrow shape for the target end of the edge
  //       'target-arrow-color': 'black', // Set arrow color for the target end of the edge
  //     },
  //     data: {
  //       id: clickedItemDetailValue + '-edge',
  //       source: clickedItemDetailValue, // Set source as clicked item detail value
  //       target: this.clickedNodeId, // Set target as clicked node ID (make sure this is defined)
  //     },
     
  //   });
    
  // // Apply cola layout to automatically position the nodes
  // const layout = this.graph.layout({
  //   name: 'cola',
  //   animate: true,
  //   randomize: false, // Set to true if you want random initial node positions
  //   avoidOverlap: true, // Enable overlap avoidance
  //   handleDisconnected: true, // Handle disconnected components separately
  //   nodeSpacing: 50, // Set the desired node spacing
  //   edgeLength: 150, // Set the desired edge length
  // });

  
  //   // Update layout after adding new node and edge
  //   layout.run();

  //   layout.on('layoutstop', () => {
  //     this.graph.nodes().unlock(); // Unlock all nodes after layout is complete
  //   });
  // }
  
  
  alphaNumericValidator(control: FormControl): ValidationErrors | null {
    let ALPHA_NUMERIC_REGEX = /^[a-zA-Z0-9_/ ]*$/;
    let ALPHA_NUMERIC_VALIDATION_ERROR = {
      alphaNumericError: 'Only alphanumeric values are allowed',
    };

    return ALPHA_NUMERIC_REGEX.test(control.value)
      ? null
      : ALPHA_NUMERIC_VALIDATION_ERROR;
  }

  //builds the angular form for the filters section
  buildFilterForm() {
    this.filterForm = this.fb.group({
      filterType: ['', Validators.required],
      filterProp: ['', Validators.required],
      filterOperator: ['', Validators.required],
      filterValue: ['', [Validators.required, this.alphaNumericValidator]],
      filterAndOr: [false],
    });
  }

  //builds style form
  buildStyleForm() {
    this.styleForm = this.fb.group({
      selectorType: [''],
      selectorValue: [''],
      styleType: [''],
      styleValue: [''],
    });
  }

  buildSearchForm() {
    this.searchForm = this.fb.group({
      searchType: ['', Validators.required],
      searchValue: ['', Validators.required],
    });
  }

  //adds the filter in the form to the filter array
  addFilter() {
    let filterType = this.filterForm.get('filterType').value;

    let filterProp = this.filterForm.get('filterProp').value;
    let filterOperator = this.filterForm.get('filterOperator').value;
    let filterValue = this.filterForm.get('filterValue').value;

    this.filters.push({
      type: filterType,
      operator: filterOperator,
      value: filterValue,
      property: filterProp,
      filter:
        filterType +
        ': ' +
        filterProp +
        ' ' +
        filterOperator +
        ' ' +
        filterValue,
    });

    this.filter();
  }

  //adds the style in the form
  addStyle() {
    let selectorType = this.styleForm.get('selectorType').value;
    let selectorValue = this.styleForm.get('selectorValue').value;
    let styleType = this.styleForm.get('styleType').value;
    let styleValue = this.styleForm.get('styleValue').value;
    this.styles.push({
      selector: selectorType + '[' + selectorValue + ']',
      style: {
        [styleType]: styleValue,
      },
    });

    this.style();
  }

  //applies styles to graph
  style() {
    this.graph.style().fromJson(this.styles);
  }

  //set default styles
  addDefaultStlyes() {
    this.styles.push(
      {
        selector: 'node',
        style: {
          content: 'data(Gene)',
          'border-color': 'black',
          'border-opacity': 1,
          'border-width': '2px',
          
        },
      },
      {
        selector: 'edge',
        style: {
          'target-arrow-shape':'triangle',
          
        },
      }
      

    );
  }

   //removes filter from the filter array
  removeFilter(filt) {
    for (let x = 0; x < this.filters.length; x++) {
      if (filt == this.filters[x]) {
        this.filters.splice(x, 1);
        x = this.filters.length;
      }
    }
    this.filter();
  }

  //remove styles
  removeStyle(style) {
    for (let x = 0; x < this.styles.length; x++) {
      if (style == this.styles[x]) {
        this.styles.splice(x, 1);
        x = this.styles.length;
      }
    }
    this.style();
  }

  //Handles the graph's filtering logic
  //Essentially removes nodes and edges that do not match the filters criteria
  filter() {
    var elementsToShow = this.graphElements;
    var orElements = [];

    this.cytoData = JSON.parse(JSON.stringify(this.cytoDataFull));

    // hash of ids to keep
    let nodesToRemove: { [key: string]: number } = {};
    let nodesWithEdges = {};

    for (var x = 0; x < this.filters.length; x++) {
      let curFilter = this.filters[x];

      // generic node filtration
      if (curFilter.type == 'node') {
        switch (curFilter.operator) {
          case '=':
            for (var i = 0; i < this.cytoData.elements.nodes.length; i++) {
              let curNode = this.cytoData.elements.nodes[i];

              if (curNode.data[curFilter.property] != curFilter.value || !curNode.data[curFilter.property]) {
                nodesToRemove[curNode.data.id] = 1;
              }
            }
            break;

          case '<':
            for (var i = 0; i < this.cytoData.elements.nodes.length; i++) {
              let curNode = this.cytoData.elements.nodes[i];

              if (curNode.data[curFilter.property] >= curFilter.value || !curNode.data[curFilter.property]) {
                nodesToRemove[curNode.data.id] = 1;
              }
            }
            break;

          case '>':
            for (var i = 0; i < this.cytoData.elements.nodes.length; i++) {
              let curNode = this.cytoData.elements.nodes[i];

              if (curNode.data[curFilter.property] <= curFilter.value || !curNode.data[curFilter.property]) {
                nodesToRemove[curNode.data.id] = 1;
              }
            }
            break;

          case '<=':
            for (var i = 0; i < this.cytoData.elements.nodes.length; i++) {
              let curNode = this.cytoData.elements.nodes[i];

              if (curNode.data[curFilter.property] > curFilter.value || !curNode.data[curFilter.property]) {
                nodesToRemove[curNode.data.id] = 1;
              }
            }
            break;

          case '>=':
            for (var i = 0; i < this.cytoData.elements.nodes.length; i++) {
              let curNode = this.cytoData.elements.nodes[i];

              if (curNode.data[curFilter.property] < curFilter.value || !curNode.data[curFilter.property]) {
                nodesToRemove[curNode.data.id] = 1;
              }
            }
            break;
        }
      }

      // generic edge filtration
      // these get spliced right away, so our comparisons are inverse
      if (curFilter.type == 'edge') {
        switch (curFilter.operator) {
          case '=':
            for (var i = this.cytoData.elements.edges.length - 1; i >= 0; i--) {
              let curEdge = this.cytoData.elements.edges[i];

              if (curEdge.data[curFilter.property] != curFilter.value) {
                this.cytoData.elements.edges.splice(i, 1);
              }
            }
            break;

          case '<':
            for (var i = this.cytoData.elements.edges.length - 1; i >= 0; i--) {
              let curEdge = this.cytoData.elements.edges[i];

              if (curEdge.data[curFilter.property] >= curFilter.value) {
                this.cytoData.elements.edges.splice(i, 1);
              }
            }
            break;

          case '>':
            for (var i = this.cytoData.elements.edges.length - 1; i >= 0; i--) {
              let curEdge = this.cytoData.elements.edges[i];

              if (curEdge.data[curFilter.property] <= curFilter.value) {
                this.cytoData.elements.edges.splice(i, 1);
              }
            }
            break;

          case '<=':
            for (var i = this.cytoData.elements.edges.length - 1; i >= 0; i--) {
              let curEdge = this.cytoData.elements.edges[i];

              if (curEdge.data[curFilter.property] > curFilter.value) {
                this.cytoData.elements.edges.splice(i, 1);
              }
            }
            break;

          case '>=':
            for (var i = this.cytoData.elements.edges.length - 1; i >= 0; i--) {
              let curEdge = this.cytoData.elements.edges[i];

              if (curEdge.data[curFilter.property] < curFilter.value) {
                this.cytoData.elements.edges.splice(i, 1);
              }
            }
            break;
        }
      }
    }

    // if a node is not in the filter but is neighbors with one that is,
    // we'll keep it
    // we need to add these nodes back at once to keep this from repeating unintentionally

    let nodesToAddBack: string[] = [];

    for (var i = 0; i < this.cytoData.elements.edges.length; i++) {
      let curEdge = this.cytoData.elements.edges[i].data as EdgeData;

      if (
        nodesToRemove[curEdge.target] != 1 ||
        nodesToRemove[curEdge.source] != 1
      ) {
        nodesToAddBack.push(curEdge.target);
        nodesToAddBack.push(curEdge.source);
      }
    }

    // add nodes to our list that have neighbors who survived the filter
    nodesToAddBack.forEach((id) => {
      nodesToRemove[id] = 0;
    });

    // now let's remove all nodes that got filtered out
    for (var i = this.cytoData.elements.nodes.length - 1; i >= 0; i--) {
      if (nodesToRemove[this.cytoData.elements.nodes[i].data.id] == 1)
        this.cytoData.elements.nodes.splice(i, 1);
    }

    for (var i = this.cytoData.elements.edges.length - 1; i >= 0; i--) {
      let curEdge = this.cytoData.elements.edges[i].data;

      if (
        nodesToRemove[curEdge.target] == 1 ||
        nodesToRemove[curEdge.source] == 1
      ) {
        this.cytoData.elements.edges.splice(i, 1);
      }
    }

    // remove nodes without edges (we need to create yet another dictionary)
    // this dict contains the ID's of all remaining target/sources in the remaining edges

    // construct dict
    let remainingEdgeDict = {};
    this.cytoData.elements.edges.forEach(edge => {
      remainingEdgeDict[edge.data.target] = 1;
      remainingEdgeDict[edge.data.source] = 1;
    });
    
    // remove nodes using dict
    for (var i = this.cytoData.elements.nodes.length - 1; i >= 0; i--) {
      let curNodeId = this.cytoData.elements.nodes[i].data.id;
      
      if (remainingEdgeDict[curNodeId] != 1)
        this.cytoData.elements.nodes.splice(i, 1);
    }

    this.populateGraph();
  }

  // additional function to handle added data from parent components
  handleParentData() {
    // for kic assay, we will handle filter data passed as a prop
    if (this.optionalData?.kicExperimentId) {

      // remove existing experiment id filters
      for (var i = this.filters.length - 1; i >= 0; --i) {
        if (this.filters[i].property == "Experiments_ID") {
          this.filters.splice(i,1);
        }
      }

      if (this.optionalData?.kicExperimentId == 'all')
        this.filter();

      if (this.optionalData?.kicExperimentId != 'all') {

        this.filters.push({
          type: 'edge',
          operator: '=',
          value: this.optionalData?.kicExperimentId,
          property: 'Experiments_ID',
          filter: 'edge: Experiments_ID = ' + this.optionalData?.kicExperimentId
        });
    
        this.filter();
      }
    }
  }

  // substrate count update (really need to restructure all of this
  // because this is a kic specific thing)

  substrateRecount() {

    const maxNodeWidth = 100;
    const substrateHash = {};

    // count the number of substrates on the filtered edges
    this.cytoData.elements.edges.forEach(edge => {
      if (substrateHash[edge.data.source])
        substrateHash[edge.data.source] += 1;
      else
        substrateHash[edge.data.source] = 1
    });

    // apply the new substrate counts
    this.cytoData.elements.nodes.forEach(node => {
      if (node.data.type == 'kinase') {
        node.data.substrate_count = substrateHash[node.data.id];

        let newWidth = substrateHash[node.data.id] * 4 + 25;
        node.data.width = newWidth > maxNodeWidth ? maxNodeWidth : newWidth;
      }
    });
  }

}
