import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatTableDataSource} from "@angular/material/table";
import {animate, state, style, transition, trigger} from '@angular/animations';
import { APIService } from '../../services/api/api.service';

@Component({
  selector: 'app-blast-page',
  templateUrl: './blast-page.component.html',
  styleUrls: ['./blast-page.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('void', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
      state('*', style({height: '*', visibility: 'visible'})),
      transition('void <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class BlastPageComponent implements OnInit {

 blastDataSource: MatTableDataSource<any> = new MatTableDataSource(); // Initialize with an empty MatTableDataSource
  blastRes: any[] = []; // Explicitly type blastRes as an array of any objects
  result: string | undefined;
  proteinSeq: string = '';
  database: string = 'Arabidopsis';
  matrix: string = "BLOSUM62";
  evalue: string = "1";
  method: string = '';
  isLoading: boolean = false;
  alertVisible: boolean = false;
  loading: boolean = false;
  blastError: boolean = false;

  blastForm: FormGroup;

  constructor(private http: HttpClient, private router: Router, private apiService: APIService, private fb: FormBuilder) {
    // Initialize form group in the constructor
    this.blastForm = this.fb.group({
      proteinSeq: ['', [Validators.required]],
      database: [this.database, Validators.required],
      matrix: [this.matrix, Validators.required],
      evalue: [this.evalue, Validators.required],
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.proteinSeq === undefined || this.proteinSeq.length < 1) {
      this.showAlert();
      return;
    }
    this.loading = true;
    this.blastError = false;

    this.apiService.getblast(this.database.toLowerCase(), this.proteinSeq, `-matrix ${this.matrix} -evalue ${this.evalue}`).subscribe(
      (res: any) => {
        console.log(this.database.toLowerCase());
        this.SplitRes(res);
        this.loading = false;
      },
      (error) => {
        console.error(error);
        this.blastError = true;
        this.loading = false;
      }
    );
  }

  SplitRes(result: string) {
    // Same code as in your example, no changes needed
  }

  changeDatabase(newDatabase: string) {
    this.database = newDatabase;
  }

  clear() {
    this.result = undefined;
    this.blastRes = [];
    this.blastDataSource = new MatTableDataSource();
  }

  setDefaultSearch() {
    this.proteinSeq = "MEVKARAPGKIILAGEHAVVHGSTAVAAAIDLYTYVTLRFPLPSAENNDRLTLQLKDISLEFSWSLARIKEAIPYDSSTLCRSTPASCSEETLKSIAVLVEEQNLPKEKMWLSSGISTFLWLYTRIIGFNPATVVINSELPYGSGLGSSAALCVALTAALLASSISEKTRGNGWSSLDETNLELLNKWAFEGEKIIHGKPSGIDNTVSAYGNMIKFCSGEITRLQSNMPLRMLITNTRVGRNTKALVSGVSQRAVRHPDAMKSVFNAVDSISKELAAIIQSKDETSVTEKEERIKELMEMNQGLLLSMGVSHSSIEAVILTTVKHKLVSKLTGAGGGGCVLTLLPTGTVVDKVVEELESSGFQCFTALIGGNGAQICY";
  }

  showAlert(): void {
    alert("Sequence should not be empty");
    console.log("alert");
  }
}