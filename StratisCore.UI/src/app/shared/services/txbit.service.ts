import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, interval, throwError } from 'rxjs';
import { catchError, switchMap, startWith} from 'rxjs/operators';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { MarketSummary } from "../models/txbit-marketsummary";

@Injectable({
  providedIn: 'root'
})
export class TxbitService {
  constructor(http: HttpClient) {
    this.http = http;
  }

  private apiBaseUrl: string = "https://api.txbit.io/api";
  private http: HttpClient;

  public getMarketSummary(): Observable<MarketSummary> {
    return this.http.get<MarketSummary>(this.apiBaseUrl + '/public/getmarketsummary?market=XLR/BTC').pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  private handleHttpError(error: HttpErrorResponse, silent?: boolean) {
    console.log(error);
    return throwError(error);
  }
}
