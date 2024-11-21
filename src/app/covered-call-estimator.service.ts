// src/app/covered-call-estimator.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {CoveredCallFormData} from './interfaces/covered-call-form-data.interface';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CoveredCallEstimatorService {

  constructor(private http: HttpClient) {}

  estimateIncome(data: CoveredCallFormData): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}estimate-income`, data);
  }

  getOptionsData(ticker: string, strategy: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}options_chain_data?ticker=${ticker}&strategy=${strategy}`);
  }

  // Fetch ticker symbols and companies from the API
  fetchTickers(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}tickers`);
  }
}
