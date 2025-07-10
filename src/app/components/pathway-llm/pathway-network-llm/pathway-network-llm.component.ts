// pathway-network-llm.component.ts
import { MatSelect } from '@angular/material/select';
import Sigma from 'sigma'; 
import { ForceLayoutService } from '../force-layout.service'; 
import Graph from 'graphology'; 
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import {ForceSettings, ForceWorker,Species, Pathway, NodeAttributes, EdgeAttributes } from '../data-interface';
import { AsyncPipe } from '@angular/common';
import { GraphService } from '../graph.service';

interface Message {
  id: number;
  type: 'info' | 'user' | 'assistant';
  content: string ;
  sender: string;
}

@Component({
  selector: 'app-pathway-network-llm',
  templateUrl: './pathway-network-llm.component.html',
  styleUrls: ['./pathway-network-llm.component.scss'],
  providers: [AsyncPipe],
})

export class PathwayNetworkLlmComponent implements AfterViewInit {

  specieses: Species[] = [];
  selectedSpecies: Species | null = null;

  pathways: Pathway[] = [];
  filteredPathways: Pathway[] = [];
  selectedPathway: Pathway | null = null;
  searchPathwayTerm: string = '';

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('matSelect') matSelect!: MatSelect;

  @ViewChild('graphContainer') graphContainer!: ElementRef<HTMLDivElement>;
  sigmaInstance: Sigma<NodeAttributes, EdgeAttributes> | undefined;
  forceSettings: ForceSettings = { linkDistance: 50, chargeStrength: -200, collideRadiusFactor: 8 };
  
  nodeSize: number = 5;
  nodeLabelSize: number = 8;
  labelDensity: number = 3.9;

  forceWorker: ForceWorker | null = null;

  isDisclaimerVisible: boolean = true;
  messageText = '';
  isMinimized = true;
  @ViewChild('messagesList') private messagesListRef!: ElementRef;
  messages: Message[] = [];
  private graph: Graph | undefined;

  constructor(private forceLayoutService: ForceLayoutService, private graphService: GraphService) {
     this.forceLayoutService.forceWorker$.subscribe(worker => {
      this.forceWorker = worker;
    });
  }

  ngAfterViewInit(): void {

    const graph = new Graph<NodeAttributes, EdgeAttributes>();
    graph.addNode('n1', { x: 0, y: 0, size: 10, label: 'Node 1', color: '#FF0000', ID: '1', labelProp:{size:12}  });
    graph.addNode('n2', { x: 1, y: 1, size: 8, label: 'Node 2', color: '#00FF00', ID: '2', labelProp:{size:12}  });
    graph.addNode('n3', { x: 2, y: 0, size: 12, label: 'Node 3', color: '#0000FF', ID: '3', labelProp:{size:12}  });
    graph.addNode('n4', { x: 0.5, y: -0.5, size: 7, label: 'Node 4', color: '#FFFF00', ID: '4', labelProp:{size:12}  });
    graph.addNode('n5', { x: -1, y: 0.5, size: 9, label: 'Node 5', color: '#00FFFF', ID: '5', labelProp:{size:12}  });
    graph.addEdge('n1', 'n2', { size: 2, color: '#CCC' });
    graph.addEdge('n2', 'n3', { size: 2, color: '#CCC' });
    graph.addEdge('n3', 'n1', { size: 2, color: '#CCC' });
    graph.addEdge('n1', 'n4', { size: 2, color: '#CCC' });
    graph.addEdge('n4', 'n5', { size: 2, color: '#CCC' });
    graph.addEdge('n5', 'n2', { size: 2, color: '#CCC' });

    this.sigmaInstance = new Sigma(graph, this.graphContainer.nativeElement, {
              defaultNodeColor: '#999',
              labelFont: 'Inter',
            });

    
    this.graphService.setSigmaInstance(this.sigmaInstance as any); 
    this.graph = this.sigmaInstance.getGraph();
  }


  ngOnDestroy(): void {
    this.sigmaInstance?.kill();
  }


  changeLinkDistance(): void {
    this.forceSettings = { ...this.forceSettings, linkDistance: this.forceSettings.linkDistance === 50 ? 150 : 50 };
  }

  ngOnInit() {
    this.loadPathways();
    this.loadSpecies(); 
  }

  loadSpecies() {
    this.specieses = [
      { id: 1, name: 'Arabidopsis' },
      { id: 2, name: 'Soybean' },
    ];
  }

  loadPathways() {
    this.pathways = [
      { id: 1, name: 'test', source:'KEGG' },
      { id: 2, name: 'test' , source:'ARALIP' },
    ];
    this.filteredPathways = [...this.pathways];
  }

  filterPathways() {
    if (!this.searchPathwayTerm) {
      this.filteredPathways = [...this.pathways]; // Show all if search term is empty
    } else {
      const lowerCaseSearchTerm = this.searchPathwayTerm.toLowerCase();
      this.filteredPathways = this.pathways.filter(pathway =>
        pathway.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        pathway.source.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 0);
  }

  onOptionSelected(event: any, matSelect: MatSelect) {
    if (event.isUserInput) { // Ensure it's a user selection, not programmatic
      this.selectedPathway = event.source.value;
      this.searchPathwayTerm = ''; // Clear search term on selection
      this.filterPathways(); // Reset filtered list
      matSelect.close(); // Programmatically close the select
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
        type: 'user',
        content: currentMessage,
        sender:'user'
      };
      this.messages = [...this.messages, newMessage];
      this.simulateLlmResponse(currentMessage);
      this.messageText = '';
      this.scrollToBottom();
    }
  }

  private simulateLlmResponse(currentMessage: string): void {
    let llmResponse: Message = {
        id: this.messages.length + 1,
        type: 'user',
        content: currentMessage,
        sender:'llm'};
    setTimeout(() => {
      this.messages.push(llmResponse);
    }, 500);
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

  updateNodeSize(size: number): void {
    this.nodeSize = Number(size);
    this.graphService.updateNodeSize(this.nodeSize);
  }

  updateLabelSize(size: number): void {
    this.nodeLabelSize = Number(size);
    this.graphService.updateLabelSize(this.nodeLabelSize);
  }

  formatLabel(value: number): string {
    return `${value}`;
  }
}