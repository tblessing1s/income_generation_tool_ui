// src/app/covered-call-estimator.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {CoveredCallFormData} from './interfaces/covered-call-form-data.interface';

@Injectable({
  providedIn: 'root'
})
export class CoveredCallEstimatorService {
  // private apiUrl = 'http://127.0.0.1:5000/api/';
  private apiUrl = 'https://income-generation-tool-backend.onrender.com/api/';

  constructor(private http: HttpClient) {}

  estimateIncome(data: CoveredCallFormData): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'estimate-income', data);
  }

  getOptionsData(ticker: string, strategy: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}options_chain_data?ticker=${ticker}&strategy=${strategy}`);
  }
}
