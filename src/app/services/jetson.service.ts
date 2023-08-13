import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError } from 'rxjs/operators';
import { Observable, EMPTY } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JetsonService {
  public socket$!: WebSocketSubject<any>;

  constructor() {}

  public connect(url: string): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket(url);
    }
  }

  private getNewWebSocket(url: string) {
    return webSocket({
      url: url,
      // ... any other WebSocketConfig parameters needed
    });
  }

  public messages(): Observable<any> {
    return this.socket$.pipe(
      catchError((e) => {
        console.error(e);
        return EMPTY;
      })
    );
  }

  public close(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}
