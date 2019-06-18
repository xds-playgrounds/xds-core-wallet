import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { ModalService } from '../../shared/services/modal.service';
import { WalletInfo } from '../../shared/models/wallet-info';
import { SignMessageRequest } from '../../shared/models/wallet-signmessagerequest';

import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'txbit',
  templateUrl: './txbit.component.html',
  styleUrls: ['./txbit.component.css'],
})

export class TxbitComponent {
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    private modalService: NgbModal,
    private genericModalService: ModalService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.buildLinkForm();
  }

  public linkForm: FormGroup;
  public allAddresses: any;
  public showUnusedAddresses: boolean = false;
  
  public getAllAddresses() {
    this.getAddresses();
  }

  public onShowUnusedAddressedChanged(checkbox) {
    this.showUnusedAddresses = checkbox.checked;
    this.getAddresses();
  }

  public onLinkButtonClick(button) {
    button.disabled = true;
    this.linkAddress(button);
  }

  ngOnInit() {
    this.getAddresses();
  }

  ngOnDestroy() {
   
  }

  private linkAddress(button) {
    const walletName = this.globalService.getWalletName();
    const message = this.linkForm.get("address").value;
    const address = this.linkForm.get("address").value;
    const password = this.linkForm.get("password").value;

    const signMessageRequest = new SignMessageRequest(walletName, password, address, message);

    this.apiService.signMessage(signMessageRequest)
      .subscribe(
        response => {
          button.disabled = false;
          window.open(`https://txbit.io/Login/?s=${encodeURIComponent(response)}&a=${encodeURIComponent(address)}`);
        }
      );
  }

  private getAddresses() {
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getAllAddresses(walletInfo)
      .subscribe(
        response => {
          this.allAddresses = [];

          for (let address of response.addresses) {
            if ((!address.isUsed && this.showUnusedAddresses) || address.isUsed) {
              this.allAddresses.push(address);
            }
          }
        }
      );
  }

  private buildLinkForm(): void {
    this.linkForm = this.fb.group({
      "address": ["", Validators.required],
      "password": ["", Validators.required]
    });

    this.linkForm.valueChanges.pipe(debounceTime(300))
      .subscribe(data => this.onLinkFormValueChanged(data));
  }

  onLinkFormValueChanged(data?: any) {
    if (!this.linkForm) { return; }
    const form = this.linkForm;
    for (const field in this.linkFormErrors) {
      this.linkFormErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.linkValidationMessages[field];
        for (const key in control.errors) {
          this.linkFormErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  linkFormErrors = {
    "address": "",
    "password": ""
  };

  linkValidationMessages = {
    "address": {
      "required": "An address is required."
    },
    "password": {
      "required": "Your password is required."
    }
  };
}
