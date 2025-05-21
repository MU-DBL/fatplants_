import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { APIService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-gpt-dialog',
  templateUrl: './gpt-dialog.component.html',
  styleUrls: ['./gpt-dialog.component.scss']
})
export class GptDialogComponent implements OnInit {

  constructor(
      private apiService: APIService,
      public dialogRef: MatDialogRef<GptDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

  gpt_output:string = "";
  display_name: string = "";

  ngOnInit(): void {
    this.generateData();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  generateData() {
    this.gpt_output = "";
    if (this.data.identifier.length > 20) {
      this.display_name = this.data.identifier.slice(0, 20) + '...';
    } 
    else {
      this.display_name = this.data.identifier;
    }

    this.apiService.askChatGPT("As a biology researcher, I'm interested in understanding the molecular mechanism and functional significance of the gene " + this.data.identifier + ". Could you provide me with detailed information about how " + this.data.identifier + " is activated, its downstream signaling pathways, and its roles in cellular processes such as cell growth, differentiation, and response to stress? Please include any relevant research findings or insights in your response.").subscribe((data:any) => {
      if (data.choices && data.choices.length > 0) {
        this.gpt_output = data.choices[0].message.content;
      }
      else {
        this.gpt_output = "Could not access the ChatGPT service. Please try again later.";
      }
    }, error => {
      this.gpt_output = "Could not access the ChatGPT service. Please try again later.";
    })
  }
}
