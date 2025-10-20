import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})


export class LLMService {

  constructor(private http: HttpClient) { }

  queryPathway(query: string) {
    const url = environment.PATHBOT_BASE_API_URL + 'ask';
    const body = { query: query };
    const headers = { 'Content-Type': 'application/json' };

    return this.http.post(url, body, { headers });
  }

  searchMulti(query: string, top_k: number = 10) {
    const url = environment.RAGBOT_BASE_API_URL + 'search_multi';
    const body = {
      query: query,
      top_k: top_k
    };
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post(url, body, { headers });
  }
}
