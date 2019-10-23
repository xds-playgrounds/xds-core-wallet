import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MarketSummary } from "../models/txbit-marketsummary";
import { startWith, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TxbitService {
  constructor(http: HttpClient) {
    console.log("Construct txbit");
    this.http = http;
  }

  private apiBaseUrl: string = "https://api.txbit.io/api";
  private http: HttpClient;
  private pollingInterval = interval(60 * 1000 * 30);

  public getMarketSummary(): Observable<MarketSummary> {
    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get<MarketSummary>(this.apiBaseUrl + '/public/getmarketsummary?market=XLR/BTC'))
    );
  }
}
