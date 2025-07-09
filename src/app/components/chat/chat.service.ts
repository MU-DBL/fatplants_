import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly API_URL = 'https://echo.free.beeceptor.com'; // adjust as needed

  constructor(private http: HttpClient) {}

  postMessage(payload: { message: string }): Observable<any> {
    return this.http.post<any>(this.API_URL, payload);
  }
}