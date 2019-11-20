export class ColdStakingSetup {
  constructor(
      hotWalletAddress: string,
      coldWalletAddress: string,
      amount: number,
      walletName: string,
      walletPassword: string,
      walletAccount: string,
      fees: number,
      segwitChangeAddress: boolean,
      payToScript: boolean
  ) {
    this.hotWalletAddress = hotWalletAddress;
    this.coldWalletAddress = coldWalletAddress;
    this.amount = amount;
    this.walletName = walletName;
    this.walletPassword = walletPassword;
    this.walletAccount = walletAccount;
    this.fees = fees;
    this.segwitChangeAddress = segwitChangeAddress;
    this.payToScript = payToScript;
  }
  public hotWalletAddress: string;
  public coldWalletAddress: string;
  public amount: number;
  public walletName: string;
  public walletPassword: string;
  public walletAccount: string;
  public fees: number;
  public segwitChangeAddress: boolean;
  public payToScript: boolean;
}
