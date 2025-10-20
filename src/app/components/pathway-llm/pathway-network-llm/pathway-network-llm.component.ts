// pathway-network-llm.component.ts
import { MatSelect } from '@angular/material/select';
import { AfterViewInit, Component, ElementRef, ViewChild, HostListener  } from '@angular/core';
import {Species, PathwayDropdown, Message, Relationship, Literature } from '../data-interface';
import { LLMService } from '../../../services/llm/llm.service';
import { NetworkVisualizationComponent,GraphConfig, NetworkSummary } from '../network-visualization/network-visualization.component';
import panzoom, { PanZoom } from 'panzoom';
import * as pathway_dropdown from '../../../assets/records.json';
import { Observable } from 'rxjs';

type View = 'a' | 'b';

@Component({
  selector: 'app-pathway-network-llm',
  templateUrl: './pathway-network-llm.component.html',
  styleUrls: ['./pathway-network-llm.component.scss']
})

export class PathwayNetworkLlmComponent implements AfterViewInit {
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // block newline
      if (this.messageText.trim()) {
        this.handleSendMessage();
      }
    }
    // If Shift+Enter → do nothing, textarea will insert newline normally
  }


  view: View = 'a';
  set(v: View) { this.view = v; }

  slider_min = 5;
  slider_max = 50;

  selectedSpecies: Species | undefined;
  specieses: Species[] = [];

  pathwayDropdowns: PathwayDropdown[] = [];
  filteredPathwayDropdowns: PathwayDropdown[] = [];
  selectedPathwayDropdown: PathwayDropdown | null = null;
  searchPathwayTerm: string = '';

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('matSelect') matSelect!: MatSelect;
  @ViewChild('networkVisualizationComponent') networkVisualizationComponent!: NetworkVisualizationComponent;
  @ViewChild('imageContainer', { static: true }) imageContainer!: ElementRef;
  @ViewChild('imageRef', { static: true }) imageRef!: ElementRef;

  isDisclaimerVisible: boolean = true;
  messageText = '';
  isMinimized = true;

  @ViewChild('messagesList') private messagesListRef!: ElementRef;
  messages: Message[] = [];

  imageURL="";
  llmQueryTypeOptions = ['QueryLiterature', 'QueryPathway'];
  selectedOption = this.llmQueryTypeOptions[0];

  summary: NetworkSummary = {
    totalNodes: 0,
    totalEdges: 0,
    groupCounts: {
      'Pathway': 0,
      'Reaction': 0,
      'EC': 0,
      'Compound': 0,
      'Gene': 0,
      'Ortholog': 0
    }
  };

  relationships:Relationship[] = [
    { id: 'c', name: 'CONTAINS' },
    { id: 'cat', name: 'CATALYZES' },
    { id: 's', name: 'SUBSTRATE_OF' },
    { id: 'p', name: 'PRODUCES' },
    { id: 'e', name: 'ENCODES' },
    { id: 'm', name: 'MEMBER_OF' },
    { id: 'b', name: 'BELONGS_TO' }
  ]

  onSummaryChange(summary: NetworkSummary) {
    this.summary = summary;
  }
  getKeys = Object.keys;

  graphConfig: GraphConfig = {
    edgeLabelFontSize: 20,
    nodeLabelFontSize: 20,
    nodeSize: 16,
    nodeStyles: {
      Reaction: { color: '#a1ff0a', size: 16 },
      Gene: { color: '#0aefff', size: 16 },
      Compound: { color: '#c200fb', size: 16 },
      Ortholog: { color: '#04e762', size: 16 },
      EC: { color: '#e44413ff', size: 16 }
    }
  }

  constructor(private llmService: LLMService) {
  }


 ngAfterViewInit() {
    const image = this.imageRef.nativeElement;

    panzoom(image, {
      smoothScroll: false,
      zoomSpeed: 0.065,
      bounds: true,
      boundsPadding: 0.1,
      maxZoom: 5, 
      minZoom: 0.5 
    });
  }

  ngOnInit() {
    this.loadPathways();
    this.loadSpecies();
  }

 loadSpecies() {
  this.specieses = [
    { id: 'ATH', name: 'Arabidopsis' },
    { id: 'GMX', name: 'Soybean' },
    { id: 'CSAT', name: 'Cameline' }
  ];
  
  // Auto-select the first species
  this.selectedSpecies = this.specieses[0];
 }

  onSpeciesSelected(event: any, matSelect: MatSelect) {
    this.selectedSpecies = event.value;
    this.searchPathwayTerm = "";
    this.selectedPathwayDropdown = null;
    this.filterPathways();
    matSelect.close();
  }

  loadPathways() {
    const rawData = (pathway_dropdown as any).default;
    
    this.pathwayDropdowns = rawData
      .filter((item: any) => item.pathway_properties.title.toLowerCase() !== 'unknown')
      .map((item: any) => ({
        id: item.pathway_properties.id,
        title: item.pathway_properties.title,
        species: item.pathway_properties.species,
        source: item.pathway_properties.source,
        link: item.pathway_properties.link,
        image: item.pathway_properties.image
      }));

    console.log(this.pathwayDropdowns)
    this.filterPathways();
  }

  filterPathways() {
    let tempPathways = [...this.pathwayDropdowns];

    if (this.selectedSpecies) {
      tempPathways = tempPathways.filter(pathway => pathway.species === this.selectedSpecies?.id);
    }

    if (this.searchPathwayTerm != "") {
      const lowerCaseSearchTerm = this.searchPathwayTerm.toLowerCase();
      tempPathways = tempPathways.filter(pathway =>
        pathway.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        pathway.source.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    this.filteredPathwayDropdowns = tempPathways;
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 0);
  }

  onOptionSelected(event: any, matSelect: MatSelect) {
    if (event.isUserInput) { 
      if(event.source.value.source === "KEGG"){
        var id = event.source.value.id.replace("path:", "");
        this.imageURL = "http://rest.kegg.jp/get/" + id + "/image";
      } else if (event.source.value.source === "ARALIP"){
        var image = event.source.value.image;
        this.imageURL = "/static/aralip/" + image + ".GIF";
      }
      this.selectedPathwayDropdown = event.source.value;
      this.searchPathwayTerm = ''; 
      matSelect.close(); 
  }
}

  onOpenedChange(opened: boolean) {
    if (!opened) {
      this.searchPathwayTerm = '';
      this.filterPathways();
    }
  }

  handleSendMessage() {
    const currentMessage = this.messageText
    if (currentMessage.trim()) {
      this.isMinimized = false;
      const newMessage: Message = {
        id: this.messages.length + 1,
        answer: currentMessage,
        sender:'user'
      };
      // Add user message immediately to the chat
      this.messages = [...this.messages, newMessage];

      // Call the LLM service
      this.getLlmResponse(currentMessage, this.selectedOption);

      // Clear input and scroll to bottom
      this.messageText = '';
      this.scrollToBottom();
    }
  }

  private getLlmResponse(userMessage: string, queryType: string): void {
    // Add a placeholder message for the LLM response while waiting
    const loadingMessage: Message = {
      id: this.messages.length + 1,
      answer: 'Thinking...', // Or a spinner/loading indicator
      sender: 'llm',
      isLoading: true // Custom property to indicate loading state
    };
    this.messages = [...this.messages, loadingMessage];
    this.scrollToBottom(); // Scroll to show the loading message
    if (queryType === this.llmQueryTypeOptions[1]) {
      this.handleLLMQuery(this.llmService.queryPathway(userMessage), loadingMessage);
    } else {
      this.handleLLMQuery(this.llmService.searchMulti(userMessage), loadingMessage);
    }
  }

  private handleLLMQuery(observable: Observable<any>, loadingMessage: Message): void {
    observable.subscribe({
      next: (response) => {
        const answer = JSON.stringify(response, null, 2); ;
        // console.log(answer)
        const index = this.messages.findIndex(msg => msg.id === loadingMessage.id && msg.isLoading);

        if (index !== -1) {
          this.messages[index] = {
            ...this.messages[index],
            answer: answer,
            isLoading: false
          };
          this.messages = [...this.messages];
        } else {
          const llmResponse: Message = {
            id: this.messages.length + 1,
            answer: answer,
            sender: 'llm'
          };
          this.messages = [...this.messages, llmResponse];
        }
        // console.log('API Response:', response);
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('API Error:', error);
        const index = this.messages.findIndex(msg => msg.id === loadingMessage.id && msg.isLoading);
        
        if (index !== -1) {
          this.messages[index] = {
            ...this.messages[index],
            answer: 'Error: Could not get a response from LLM. Please try again.',
            sender: 'llm',
            isError: true,
            isLoading: false
          };
          this.messages = [...this.messages];
        } else {
          this.messages = [...this.messages, {
            id: this.messages.length + 1,
            answer: 'Error: Could not get a response from LLM. Please try again.',
            sender: 'llm',
            isError: true
          }];
        }
        this.scrollToBottom();
      }
    });
  }

  clearChat() {
    if (confirm('Are you sure you want to delete this chat?')) {
      this.messages = [];
    }
  }

  setIsMinimized() {
    this.isMinimized = true;
  }

  closeDisclaimerDiv(): void {
    this.isDisclaimerVisible = false; // Initialize to true to show it by default
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesListRef) {
        const element = this.messagesListRef.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 0);
  }


  updateNodeColor(nodeType: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (this.graphConfig.nodeStyles[nodeType]) {
      this.graphConfig = {
        ...this.graphConfig,
        nodeStyles: {
          ...this.graphConfig.nodeStyles,
          [nodeType]: {
            ...this.graphConfig.nodeStyles[nodeType],
            color: inputElement.value
          }
        }
      };
      this.networkVisualizationComponent.updateNodeGroup(this.graphConfig);
    }
  }


  updateNodeSize(nodeType: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (this.graphConfig.nodeStyles[nodeType]) {
      this.graphConfig = {
        ...this.graphConfig,
        nodeStyles: {
          ...this.graphConfig.nodeStyles,
          [nodeType]: {
            ...this.graphConfig.nodeStyles[nodeType],
            size: parseInt(inputElement.value, 10)
          }
        }
      };
      this.networkVisualizationComponent.updateNodeGroup(this.graphConfig);
    }
  }

  updateGlobalEdgeLabelFontSize(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.graphConfig = {
      ...this.graphConfig,
      edgeLabelFontSize: parseInt(inputElement.value, 10)
    };

    this.networkVisualizationComponent.updateEdgeNodeLabelSize(this.graphConfig);
  }

  updateGlobalNodeLabelFontSize(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.graphConfig = {
      ...this.graphConfig,
      nodeLabelFontSize: parseInt(inputElement.value, 10)
    };
    this.networkVisualizationComponent.updateEdgeNodeLabelSize(this.graphConfig);
  }

  updateGlobalNodeSize(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.graphConfig = {
      ...this.graphConfig,
      nodeSize: parseInt(inputElement.value, 10)
    };
    this.networkVisualizationComponent.updateGlobalNodeSize(this.graphConfig);
  }
}
