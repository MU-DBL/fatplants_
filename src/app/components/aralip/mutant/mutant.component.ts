import { Component } from '@angular/core';

@Component({
  selector: 'app-mutants',
  templateUrl: './mutant.component.html',
  styleUrls: ['./mutant.component.css']
})
export class MutantsComponent {

  constructor() { }

  downloadFile(fileName: string): void {
    const path = `/app/assets/aralip_files/${fileName}`; 
    const link = document.createElement('a');
    link.href = path;
    link.download = fileName; 
    link.click(); 
  }
}
