// pathway-network-llm.component.ts
import { MatSelect } from '@angular/material/select';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import {Species, PathwayDropdown, Message } from '../data-interface';
import { LLMService } from '../../../services/llm/llm.service';
import { NetworkSummary } from '../network-visualization/network-visualization.component';

@Component({
  selector: 'app-pathway-network-llm',
  templateUrl: './pathway-network-llm.component.html',
  styleUrls: ['./pathway-network-llm.component.scss']
})

export class PathwayNetworkLlmComponent implements AfterViewInit {

  specieses: Species[] = [];
  selectedSpecies: Species | null = null;

  pathwayDropdowns: PathwayDropdown[] = [];
  filteredPathwayDropdowns: PathwayDropdown[] = [];
  selectedPathwayDropdown: PathwayDropdown | null = null;
  searchPathwayTerm: string = '';

  imageURL="";

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('matSelect') matSelect!: MatSelect;
  @ViewChild('graphContainer') graphContainer!: ElementRef<HTMLDivElement>;

  nodeSize: number = 5;
  nodeLabelSize: number = 8;
  labelDensity: number = 3.9;

  isDisclaimerVisible: boolean = true;
  messageText = '';
  isMinimized = true;

  @ViewChild('messagesList') private messagesListRef!: ElementRef;
  messages: Message[] = [];

  summary?: NetworkSummary;
  onSummaryChange(summary: NetworkSummary) {
    this.summary = summary;
  }
  getKeys = Object.keys;

  constructor(private llmService: LLMService) {
  }

  ngAfterViewInit(): void {
  }

  ngOnInit() {
    this.loadPathways();
    this.loadSpecies();
  }

  loadSpecies() {
    this.specieses = [
      { id: "1", name: 'Arabidopsis' },
      { id: "2", name: 'Soybean' },
    ];
  }

  loadPathways() {
    this.pathwayDropdowns = [
      {
        id: "path:ath00510", name: 'path:ath00510', source: 'KEGG',
        species: 'Arabidopsis'
      },
      {
        id: "path:ath00062", name: 'path:ath00062', source: 'KEGG',
        species: 'Arabidopsis'
      },
      {
        id: "path:triacylglycerol_biosynthesis", name: 'Triacylglycerol Biosynthesis', source: 'ARALIP',
        species: 'Arabidopsis'
      },
      {
        id: "path:triacylglycerol_fatty_acid_degradation", name: 'Triacylglycerol & Fatty Acid Degradation', source: 'ARALIP',
        species: 'Arabidopsis'
      },
    ];
    this.filteredPathwayDropdowns = [...this.pathwayDropdowns];
  }

  filterPathways() {
    if (!this.searchPathwayTerm) {
      this.filteredPathwayDropdowns = [...this.pathwayDropdowns]; // Show all if search term is empty
    } else {
      const lowerCaseSearchTerm = this.searchPathwayTerm.toLowerCase();
      this.filteredPathwayDropdowns = this.pathwayDropdowns.filter(pathway =>
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
      var str = event.source.value.id.split(':').slice(1);
      if (str[0].includes("ath")) {//note: "console.log(str)"->['ath00062'], "console.log(str[0])"->ath00062
        this.imageURL = "http://rest.kegg.jp/get/" + str + "/image";
      } else {
        this.imageURL = "https://fatplants.net/static/aralip/" + str + ".GIF";
      }
      //console.log('img: ',"http://rest.kegg.jp/get/"+event.source.value.name.split(':').slice(1)+"/image");
      this.selectedPathwayDropdown = event.source.value;
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
        content: currentMessage,
        sender:'user'
      };
      // Add user message immediately to the chat
      this.messages = [...this.messages, newMessage];

      // Call the LLM service
      this.getLlmResponse(currentMessage);

      // Clear input and scroll to bottom
      this.messageText = '';
      this.scrollToBottom();
    }
  }

  private getLlmResponse(userMessage: string): void {
    // Add a placeholder message for the LLM response while waiting
    const loadingMessage: Message = {
      id: this.messages.length + 1,
      content: 'Thinking...', // Or a spinner/loading indicator
      sender: 'llm',
      isLoading: true // Custom property to indicate loading state
    };
    this.messages = [...this.messages, loadingMessage];
    this.scrollToBottom(); // Scroll to show the loading message

    this.llmService.ask(userMessage).subscribe({
      next: (response) => {
        // Find the loading message and update it
        const index = this.messages.findIndex(msg => msg.id === loadingMessage.id && msg.isLoading);
        if (index !== -1) {
          this.messages[index] = {
            ...this.messages[index],
            content: response.toString(), // Convert response to string if it's not already
            isLoading: false
          };
          // Create a new array reference to trigger change detection if needed (especially with OnPush strategy)
          this.messages = [...this.messages];
        } else {
          // If for some reason the loading message wasn't found, just add a new one
          const llmResponse: Message = {
            id: this.messages.length + 1,
            content: response.toString(), // Convert response to string
            sender: 'llm'
          };
          this.messages = [...this.messages, llmResponse];
        }
        console.log('API Response:', response);
        this.scrollToBottom(); // Scroll after response is loaded
      },
      error: (error) => {
        console.error('API Error:', error);
        // Find the loading message and update it with an error message
        const index = this.messages.findIndex(msg => msg.id === loadingMessage.id && msg.isLoading);
        if (index !== -1) {
          this.messages[index] = {
            ...this.messages[index],
            content: 'Error: Could not get a response from LLM. Please try again.',
            sender: 'llm', // Assign sender for error too
            isError: true, // Custom property for error state
            isLoading: false
          };
          this.messages = [...this.messages];
        } else {
          // If loading message not found, add a new error message
          this.messages = [...this.messages, {
            id: this.messages.length + 1,
            content: 'Error: Could not get a response from LLM. Please try again.',
            sender: 'llm',
            isError: true
          }];
        }
        this.scrollToBottom(); // Scroll to show the error message
      }
    });
    // Removed the setTimeout and direct push here, as it's handled in the subscribe's next/error blocks
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

  formatLabel(value: number): string {
    return `${value}`;
  }
}
