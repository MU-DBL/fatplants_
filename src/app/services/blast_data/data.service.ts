import { Injectable } from '@angular/core';

@Injectable(
  {
  providedIn: 'root'
}
)
export class DataService {
  public BlastNeedUpdate: boolean;
  public seqence: string = '';
  public loading: boolean = false;
  public g2sLoading: boolean = false;
  private blastRes: string = '';

  constructor() {
    this.BlastNeedUpdate = true;
  }

  public updateBlastResult(result: any){
    this.BlastNeedUpdate = false;
    this.blastRes = result;
  }

  public getBlastRes(): string{
    return this.blastRes;
  }
}
