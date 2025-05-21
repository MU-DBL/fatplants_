import { Component, ViewChildren, ElementRef, AfterViewInit, Renderer2, QueryList } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-plant-metabolio-network',
  templateUrl: './plant-metabolio-network.component.html',
  styleUrls: ['./plant-metabolio-network.component.scss']
})
export class PlantMetabolioNetworkComponent {
  @ViewChildren('iframes') iframes!: QueryList<ElementRef>; // Collects all iframes
  dataset: string = 'aegilops_tauschii';  
  searchQuery: string = '';  
  
  constructor(private renderer: Renderer2,private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadAbs();
    this.loadYAHOO();
    this.loadWGpackage();
    this.route.fragment.subscribe((fragment) => {
      if (fragment === 'acknowledgment') {
        const element = document.getElementById('acknowledgment');
        if (element) {
          this.changeDataset('acknowledgment') 
        }
      }else {
        this.changeDataset('fatty_acid_biosynthesis_initiation');
      }
    });
  }

  changeDataset(newDataset: string) {
    this.dataset = newDataset;
    switch(newDataset){
      case "glycolipid_desaturation":{
        this.loadWGjson("pwy-782");
        break;
      }
      case "fatty_acid_biosynthesis_initiation":{
        this.loadWGjson("pwy-4381");
        break;
      }
      case "palmitate_biosynthesis_II":{
        this.loadWGjson("pwy-5971");
        break;
      }
      case "very_long_chain_fatty_acid_biosynthesis_II":{
        this.loadWGjson("pwy-7036");
        break;
      }
      case "fatty_acid_β-oxidation_III":{
        this.loadWGjson("pwy-5137");
        break;
      }
      case "fatty_acid_elongation":{
        this.loadWGjson("fasyn-elong-pwy");
        break;
      }
      case "tetradecanoate_biosynthesis":{
        this.loadWGjson("pwy66-430");
        break;
      }
      case "superpathway_of_fatty_acid_biosynthesis_II":{
        this.loadWGjson("pwy-5156");
        break;
      }
      case "fatty_acid_α-oxidation_I":{
        this.loadWGjson("pwy-2501");
        break;
      }
      case "phospholipid_desaturation":{
        this.loadWGjson("pwy-762");
        break;
      }
      case "long-chain_fatty_acid_activation":{
        this.loadWGjson("pwy-5143");
        break;
      }
      case "fatty_acid_β-oxidation_II":{
        this.loadWGjson("pwy-5136");
        break;
      }
      case "fatty_acid_β-oxidation_V":{
        this.loadWGjson("pwy-6837");
        break;
      }
      case "poly-very_long_chain_fatty_acid_biosynthesis_I":{
        this.loadWGjson("");
        break;
      }
      case "very_long_chain_fatty_acid_biosynthesis_I":{
        this.loadWGjson("pwy-5080");
        break;
      }
      case "fatty_acid_β-oxidation_IV":{
        this.loadWGjson("pwy-5138");
        break;
      }
      case "galactolipid_biosynthesis_I":{
        this.loadWGjson("pwy-401");
        break;
      }
      case "1D-myo-inositol_hexakisphosphate_biosynthesis_III":{
        this.loadWGjson("pwy-4661");
        break;
      }
      case "superpathway_of_phospholipid_biosynthesis_II":{
        this.loadWGjson("phoslipsyn2-pwy");
        break;
      }
      case "lipid-dependent_phytate_biosynthesis_I":{
        this.loadWGjson("pwy-4541");
        break;
      }
      case "phospholipid_remodeling":{
        this.loadWGjson("pwy-7409");
        break;
      }
      case "sphingolipid_biosynthesis":{
        this.loadWGjson("pwy-5129");
        break;
      }
      case "cholesterol_biosynthesis":{
        this.loadWGjson("pwy18c3-1");
        break;
      }
      case "sterol:steryl_ester_interconversion":{
        this.loadWGjson("pwy-7424");
        break;
      }
      case "phytosterol_biosynthesis ":{
        this.loadWGjson("pwy-2541");
        break;
      }
      case "poly-hydroxy_fatty_acids_biosynthesis":{
        this.loadWGjson("pwy-6710");
        break;
      }
    }
  }

  onSearchChange(event: any) {
    this.searchQuery = event.target.value;
  }

  applySearchQuery() {
    console.log("Search Query Applied: ", this.searchQuery);
  }

  loadWGpackage() {//this .js is copied from the original PMN site, it generates the graph from .wg files
    const node = document.createElement('script');
    node.src = '/static/pmnwg/webgraphics.js';
    node.type = 'text/javascript';
    node.async = false;
    document.getElementsByTagName('body')[0].appendChild(node);
  }

  loadAbs() {//that css rule will be applied to the tips popup
    const node = document.createElement('style');
    node.innerHTML = `
      .yui-panel-container {
        position: absolute;
        z-index: 2;
        padding: 10px;
        border-style: solid;
        border-width: 1px;
        border-color: #808080;
        background-color: #f2f2f2;
        font: 13px / 1.231 arial, helvetica, clean, sans-serif;
      }
      `
    document.getElementsByTagName('head')[0].appendChild(node);
  }

  loadWGjson(digid: String) {
    const node = document.createElement('script');
    node.src = '/static/pmnwg/loadwg-'+digid+'.js';
    node.type = 'text/javascript';
    node.async = false;
    document.getElementsByTagName('body')[0].appendChild(node);
  }


  

  loadYAHOO() {//the original PMN site is built with YAHOO UI 2&3, without those .js files, tips popup will not work
    const node = document.createElement('script');
    //node.src = 'https://cdnjs.cloudflare.com/ajax/libs/yui/3.17.2/yui/yui-min.js';
    node.src = '/static/pmnwg/yahoo/yui-min.js';
    node.type = 'text/javascript';
    node.async = false;
    document.getElementsByTagName('body')[0].appendChild(node);
    
    const node2 = document.createElement('script');
    node2.src = '/static/pmnwg/yahoo/YAHOO.js';
    node2.type = 'text/javascript';
    node2.async = false;
    document.getElementsByTagName('body')[0].appendChild(node2);
    
    const node3 = document.createElement('script');
    node3.src = '/static/pmnwg/yahoo/combined-early.js';
    node3.type = 'text/javascript';
    node3.async = false;
    document.getElementsByTagName('body')[0].appendChild(node3);

    const node4 = document.createElement('script');
    node4.src = '/static/pmnwg/yahoo/Config.js';
    node4.type = 'text/javascript';
    node4.async = false;
    document.getElementsByTagName('body')[0].appendChild(node4);

    const node5 = document.createElement('script');
    node5.src = '/static/pmnwg/yahoo/Module.js';
    node5.type = 'text/javascript';
    node5.async = false;
    document.getElementsByTagName('body')[0].appendChild(node5);
    
    const node6 = document.createElement('script');
    node6.src = '/static/pmnwg/yahoo/Overlay.js';
    node6.type = 'text/javascript';
    node6.async = false;
    document.getElementsByTagName('body')[0].appendChild(node6);
  
    const node7 = document.createElement('script');
    node7.src = '/static/pmnwg/yahoo/Panel.js';
    node7.type = 'text/javascript';
    node7.async = false;
    document.getElementsByTagName('body')[0].appendChild(node7);
  
    const node8 = document.createElement('script');
    node8.src = '/static/pmnwg/yahoo/Dialog.js';
    node8.type = 'text/javascript';
    node8.async = false;
    document.getElementsByTagName('body')[0].appendChild(node8);
  
    const node9 = document.createElement('script');
    node9.src = '/static/pmnwg/yahoo/SimpleDialog.js';
    node9.type = 'text/javascript';
    node9.async = false;
    document.getElementsByTagName('body')[0].appendChild(node9);
  }
}
