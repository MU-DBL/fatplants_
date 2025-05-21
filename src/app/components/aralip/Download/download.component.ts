import { Component } from '@angular/core';

@Component({
  selector: 'app-aralip-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.css']
})
export class AralipDownloadComponent {
  
  constructor() { }

  downloadFile(fileName: string): void {
    const path = `/app/assets/aralip_files/${fileName}`; 
    const link = document.createElement('a');
    link.href = path;
    link.download = fileName; 
    link.click(); 
  }
}
