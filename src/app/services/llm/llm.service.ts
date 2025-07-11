import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LLMService {
  private readonly URL = 'http://digbio-xugpu-3.missouri.edu:8000/'; 

  constructor(private http: HttpClient) {}

  ask(prompt: string): Observable<any> {
    const params = new HttpParams().set('prompt', prompt);
    return this.http.get<any>(this.URL+"ask", { params });
  }
}