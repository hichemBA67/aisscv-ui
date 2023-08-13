import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Part } from '../models/part.model';

@Injectable({
  providedIn: 'root',
})
export class PythonService {
  private baseUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {}

  getInstruction(assembly: boolean, state: number): Observable<any> {
    const params = new HttpParams()
      .set('assemblyMode', assembly ? 'assembly' : 'disassembly')
      .set('state', `state_${state}`);

    const headers = {
      'Content-Type': 'application/json',
      withCredentials: 'true',
    };

    return this.http.get(`${this.baseUrl}/instruction`, {
      params,
      headers,
    });
  }
  calculateFullSet(parts: Part[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    // Include the parts in the body of the request
    const body = parts;

    // Send the POST request with the headers and body
    return this.http.post(`${this.baseUrl}/full-set-check`, body, { headers });
  }

  calculateStateSet(parts: Part[], state: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const params = new HttpParams().set('state', `state_${state}`);

    // Include the parts in the body of the request
    const body = parts;

    // Send the POST request with the headers and body
    return this.http.post(`${this.baseUrl}/state-part-check`, body, {
      headers,
      params,
    });
  }
}
