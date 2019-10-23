import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError} from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
  private marketSummary: Observable<MarketSummary>;

  public getMarketSummary(): Observable<MarketSummary> {

    if (!this.marketSummary) {
      this.marketSummary = this.loadMarketSummary();

      setTimeout(() => {
        this.marketSummary = this.loadMarketSummary();
      }, 60 * 1000 * 15);
    }

    return this.marketSummary;
  }

  private loadMarketSummary(): Observable<MarketSummary> {
      return this.http.get<MarketSummary>(this.apiBaseUrl + '/public/getmarketsummary?market=XLR/BTC')
      .pipe(
        catchError(err => this.handleHttpError(err))
      );
  }

  private handleHttpError(error: HttpErrorResponse, silent?: boolean) {
    console.log(error);
    return throwError(error);
  }
}
