import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class LLMService {

  private clientIp: string | null = null;

  constructor(private http: HttpClient) { }

  private async getClientIp(): Promise<string> {
    if (this.clientIp) return this.clientIp;
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      this.clientIp = data.ip ?? 'unknown';
    } catch {
      this.clientIp = 'unknown';
    }
    return this.clientIp!;
  }

  queryStream(query: string, LLMModelType: string): Observable<string> {

    const url = environment.CHATBOT_BASE_API_URL + 'stream';

    return new Observable<string>(observer => {

      const controller = new AbortController();

      this.getClientIp().then(client_ip => {
        const body = {
          llm_type: LLMModelType.split(":")[0],
          query: query,
          top_k: 10,
          fuse: "rrf",
          per: "chunk",
          rrf_k: "60",
          client_ip: client_ip,
        };

        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
      })
        .then(response => {

          if (!response.ok || !response.body) {
            observer.error(new Error(`HTTP ${response.status}`));
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          let buffer = '';

          // ---- Parse one SSE event ----
          const processEvent = (event: string): boolean => {

            // collect all data: lines (SSE spec allows multi-line)
            const dataLines = event
              .split('\n')
              .filter(l => l.startsWith('data:'))
              .map(l => l.slice(5).trim());

            if (!dataLines.length) return false;

            const payload = dataLines.join('\n');

            // stream finished
            if (payload === '[DONE]') {
              observer.complete();
              return true;
            }

            // backend error
            if (payload.startsWith('[ERROR]')) {
              observer.error(new Error(payload.slice(7)));
              return true;
            }

            // ---- OpenAI chunk parsing ----
            try {
              const json = JSON.parse(payload);
              const token = json?.choices?.[0]?.delta?.content;

              if (token !== undefined && token !== null) {
                observer.next(token);
              }

            } catch {
              // ignore non-JSON keepalive packets
            }

            return false;
          };

          // ---- Read stream loop ----
          const read = (): void => {
            reader.read()
              .then(({ done, value }) => {

                if (done) {
                  if (buffer.trim()) processEvent(buffer);
                  observer.complete();
                  return;
                }

                buffer += decoder.decode(value, { stream: true });

                // SSE events separated by double newline
                let boundary = buffer.indexOf('\n\n');

                while (boundary !== -1) {
                  const event = buffer.slice(0, boundary);
                  buffer = buffer.slice(boundary + 2);

                  if (processEvent(event)) return;

                  boundary = buffer.indexOf('\n\n');
                }

                read();
              })
              .catch(err => observer.error(err));
          };

          read();

        })
        .catch(err => observer.error(err));

      // cleanup if unsubscribed
      return () => controller.abort();
    });
  }
}
