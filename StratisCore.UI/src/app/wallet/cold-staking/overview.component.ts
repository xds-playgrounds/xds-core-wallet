import { Component, OnInit, OnDestroy } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { GlobalService } from '../../shared/services/global.service';
import { ApiService } from '../../shared/services/api.service';
import { TxbitService } from '../../shared/services/txbit.service';
import { ColdStakingService } from '../../shared/services/coldstaking.service';
import { ColdStakingCreateAddressComponent } from './create-address/create-address.component';
import { ColdStakingWithdrawComponent } from './withdraw/withdraw.component';
import { ColdStakingCreateComponent } from './create/create.component';
import { ColdStakingCreateHotComponent } from './create-hot/create-hot.component';
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

    constructor(private apiService: ApiService, private globalService: GlobalService, private stakingService: ColdStakingService, private modalService: NgbModal, private txbitService: TxbitService, private fb: FormBuilder) { }

    public coldWalletAccountExists: boolean;
    public transactions: TransactionInfo[];
    public pageNumber: number = 1;
    public coldStakingAccount: string = "coldStakingColdAddresses";
    public hotStakingAccount: string = "coldStakingHotAddresses";

    public coinUnit: string;

    public confirmedColdBalance: number = 0;
    public confirmedHotBalance: number = 0;

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
    private walletColdWalletExistsSubscription: Subscription;
    private marketSummarySubscription: Subscription;

    public setupForm: FormGroup;

    ngOnInit() {
        this.buildSetupForm();
        this.coinUnit = this.globalService.getCoinUnit();
        this.startSubscriptions();
    }

    ngOnDestroy() {
        this.cancelSubscriptions();
    }

    private buildSetupForm(): void {
        this.setupForm = this.fb.group({
            "setupType": ["", Validators.compose([Validators.required])]
        });
    }

    onWalletGetFirstUnusedAddress(isColdStaking: boolean) {
        var modelRef = this.modalService.open(ColdStakingCreateAddressComponent);
        modelRef.componentInstance.isColdStaking = isColdStaking;
    }

    onWalletWithdraw(isColdStaking: boolean) {
        var modalRef = this.modalService.open(ColdStakingWithdrawComponent);
        modalRef.componentInstance.isColdStaking = isColdStaking;
    }

    onSetup() {
        var setupType = this.setupForm.get("setupType").value;
        if (setupType === "cold") {
            this.modalService.open(ColdStakingCreateComponent);
        } else if (setupType === "hot") {
            this.modalService.open(ColdStakingCreateHotComponent);
        }
    }

    onColdSetup() {
      this.modalService.open(ColdStakingCreateComponent);
    }

    private getColdWalletExists() {
        this.walletColdWalletExistsSubscription = this.stakingService.getInfo(this.globalService.getWalletName()).subscribe(x => {
            var isChanged = (x.coldWalletAccountExists !== this.coldWalletAccountExists);

            if (isChanged)
                this.cancelSubscriptions();

            this.coldWalletAccountExists = x.coldWalletAccountExists;

            if (isChanged)
                setTimeout(() => {
                    this.startSubscriptions();
                }, 2000);
        });
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
            } else {
                transactionType = "unknown";
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

            this.transactions.push(new TransactionInfo(transactionType, transactionId, transactionAmount, transactionFee, transactionConfirmedInBlock, transactionTimestamp));
        }
    };

    private getWalletBalance() {
        let walletInfo = new WalletInfo(this.globalService.getWalletName());
        walletInfo.accountName = this.coldStakingAccount;

        this.walletColdBalanceSubscription = this.apiService.getWalletBalance(walletInfo)
            .subscribe(
                coldBalanceResponse => {
                    this.confirmedColdBalance = coldBalanceResponse.balances[0].amountConfirmed;
                    this.unconfirmedColdBalance = coldBalanceResponse.balances[0].amountUnconfirmed;
                    this.spendableColdBalance = coldBalanceResponse.balances[0].spendableAmount;
                }
            );

        walletInfo.accountName = this.hotStakingAccount;
        this.walletHotBalanceSubscription = this.apiService.getWalletBalance(walletInfo)
            .subscribe(
                hotBalanceResponse => {
                    this.confirmedHotBalance = hotBalanceResponse.balances[0].amountConfirmed;
                    this.unconfirmedHotBalance = hotBalanceResponse.balances[0].amountUnconfirmed;
                    this.spendableHotBalance = hotBalanceResponse.balances[0].spendableAmount;
                }
            );
    }

    private getMarketSummary() {
        this.marketSummarySubscription = this.txbitService.getMarketSummary()
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
        if (this.walletColdWalletExistsSubscription) {
            this.walletColdWalletExistsSubscription.unsubscribe();
        }
        if (this.marketSummarySubscription) {
            this.marketSummarySubscription.unsubscribe();
        }
    };

    private startSubscriptions() {
        this.getColdWalletExists();

        if (!this.coldWalletAccountExists)
            return;

        this.getMarketSummary();
        this.getWalletBalance();
        this.getHistory();
    };
}
