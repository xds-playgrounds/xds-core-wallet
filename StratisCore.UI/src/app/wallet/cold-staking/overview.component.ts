import { Component, OnInit, OnDestroy } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { GlobalService } from '../../shared/services/global.service';
import { ApiService } from '../../shared/services/api.service';
import { TxbitService } from '../../shared/services/txbit.service';
import { ColdStakingService } from '../../shared/services/coldstaking.service';
import { ColdStakingCreateAddressComponent } from './create-address/create-address.component';
import { ColdStakingWithdrawComponent } from './withdraw/withdraw.component';
import { ColdStakingCreateComponent } from './create/create.component';
import { TransactionDetailsComponent } from '../transaction-details/transaction-details.component';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { WalletInfo } from '../../shared/models/wallet-info';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-staking-scene',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.css']
})
export class ColdStakingOverviewComponent implements OnInit, OnDestroy {

    constructor(private apiService: ApiService, private globalService: GlobalService, private stakingService: ColdStakingService, private modalService: NgbModal, private txbitService: TxbitService) { }

    public coldWalletAccountExists: boolean;
    public transactions: TransactionInfo[];
    public pageNumber: number = 1;
    public coldStakingAccount: string = "coldStakingColdAddresses";
    public hotStakingAccount: string = "coldStakingHotAddresses";

    public coinUnit: string;

    public confirmedColdBalance: number;
    public confirmedHotBalance: number;

    public unconfirmedColdBalance: number;
    public unconfirmedHotBalance: number;

    public spendableColdBalance: number;
    public spendableHotBalance: number;

    public hasColdBalance: boolean = false;
    public hasHotBalance: boolean = false;

    public lastPrice: number;
    public spendableColdBalanceBaseValue: number;
    public spendableHotBalanceBaseValue: number;

    private walletHistorySubscription: Subscription;
    private walletColdBalanceSubscription: Subscription;
    private walletHotBalanceSubscription: Subscription;

    ngOnInit() {
        this.coinUnit = this.globalService.getCoinUnit();
        this.startSubscriptions();
        this.stakingService.getInfo(this.globalService.getWalletName()).subscribe(x => this.coldWalletAccountExists = x.coldWalletAccountExists);
    }

    ngOnDestroy() {
        this.cancelSubscriptions();
    }

    onWalletGetFirstUnusedAddress(walletComponent) {
        this.modalService.open(ColdStakingCreateAddressComponent);
    }

    onWalletWithdraw(walletComponent) {
        this.modalService.open(ColdStakingWithdrawComponent);
    }

    onSetup() {
        this.modalService.open(ColdStakingCreateComponent);
    }

    private getHistory() {
        let walletInfo = new WalletInfo(this.globalService.getWalletName());
        walletInfo.accountName = this.coldStakingAccount;

        let historyResponse;
        this.walletHistorySubscription = this.apiService.getWalletHistory(walletInfo)
            .subscribe(
                response => {
                    if (!!response.history && response.history[0].transactionsHistory.length > 0) {
                        historyResponse = response.history[0].transactionsHistory;
                        this.getTransactionInfo(historyResponse);
                    }
                },
                error => {
                    if (error.status === 0) {
                        this.cancelSubscriptions();
                    } else if (error.status >= 400) {
                        if (!error.error.errors[0].message) {
                            this.cancelSubscriptions();
                            this.startSubscriptions();
                        }
                    }
                }
            );
    };

    private getTransactionInfo(transactions: any) {
        this.transactions = [];

        for (let transaction of transactions) {
            let transactionType;
            if (transaction.type === "send") {
                transactionType = "sent";
            } else if (transaction.type === "received") {
                transactionType = "received";
            } else if (transaction.type === "staked") {
                transactionType = "staked";
            }
            let transactionId = transaction.id;
            let transactionAmount = transaction.amount;
            let transactionFee;
            if (transaction.fee) {
                transactionFee = transaction.fee;
            } else {
                transactionFee = 0;
            }
            let transactionConfirmedInBlock = transaction.confirmedInBlock;
            let transactionTimestamp = transaction.timestamp;
            let transactionConfirmed;

            this.transactions.push(new TransactionInfo(transactionType, transactionId, transactionAmount, transactionFee, transactionConfirmedInBlock, transactionTimestamp));
        }
    };

    private getWalletBalance(callBack, isColdWallet) {
        let walletInfo = new WalletInfo(this.globalService.getWalletName());
        walletInfo.accountName = this.coldStakingAccount;

        this.walletColdBalanceSubscription = this.apiService.getWalletBalance(walletInfo)
          .subscribe(
            coldBalanceResponse => {
              this.confirmedColdBalance = coldBalanceResponse.balances[0].amountConfirmed;
              this.unconfirmedColdBalance = coldBalanceResponse.balances[0].amountUnconfirmed;
              this.spendableColdBalance = coldBalanceResponse.balances[0].spendableAmount;
            },
            error => {
              if (error.status === 0) {
                this.cancelSubscriptions();
              } else if (error.status >= 400) {
                if (!error.error.errors[0].message) {
                  this.cancelSubscriptions();
                  this.startSubscriptions();
                }
              }
            }
          );

        walletInfo.accountName = this.hotStakingAccount;
        this.walletHotBalanceSubscription = this.apiService.getWalletBalance(walletInfo)
          .subscribe(
            hotBalanceResponse => {
              this.confirmedHotBalance = hotBalanceResponse.balances[0].amountConfirmed;
              this.unconfirmedHotBalance = hotBalanceResponse.balances[0].amountUnconfirmed;
              this.spendableHotBalance = hotBalanceResponse.balances[0].spendableAmount;
            },
            error => {
              if (error.status === 0) {
                this.cancelSubscriptions();
              } else if (error.status >= 400) {
                if (!error.error.errors[0].message) {
                  this.cancelSubscriptions();
                  this.startSubscriptions();
                }
              }
            }
          );

        if (callBack)
          callBack();
    }

    private getMarketSummary() {
        this.txbitService.getMarketSummary()
            .subscribe(
                response => {
                    this.lastPrice = response.result.Last;
                    this.spendableColdBalanceBaseValue = parseFloat(((this.lastPrice * this.spendableColdBalance) / parseFloat("100000000")).toFixed(2));
                    this.spendableHotBalanceBaseValue = parseFloat(((this.lastPrice * this.spendableHotBalance) / parseFloat("100000000")).toFixed(2));
                });
    }

    public openTransactionDetailDialog(transaction: TransactionInfo) {
      const modalRef = this.modalService.open(TransactionDetailsComponent, { backdrop: "static", keyboard: false });
      modalRef.componentInstance.transaction = transaction;
    }

    private cancelSubscriptions() {
        if (this.walletHistorySubscription) {
            this.walletHistorySubscription.unsubscribe();
        }
        if (this.walletColdBalanceSubscription) {
            this.walletColdBalanceSubscription.unsubscribe();
        }
        if (this.walletHotBalanceSubscription) {
          this.walletHotBalanceSubscription.unsubscribe();
        }
    };

    private startSubscriptions() {
        this.getWalletBalance(() => {
            this.getWalletBalance(() => {
                this.getMarketSummary();
            },
                false);
        }, true);
        this.getHistory();
    };
}
