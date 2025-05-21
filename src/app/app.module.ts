import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { ClipboardModule } from 'ngx-clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatPaginatorModule} from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { CdkTableModule } from '@angular/cdk/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider'; 

import { TeamComponent } from './components/team-page/team.component';
import {MatTabsModule} from "@angular/material/tabs";
import {MatRadioModule} from "@angular/material/radio";
import {MatDividerModule} from "@angular/material/divider";

import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatExpansionModule} from "@angular/material/expansion";
import {DataService} from 'src/app/services/blast_data/data.service';
import { StructureViewerComponent } from './components/commons/structure-viewer/structure-viewer.component';
import { UserModalComponent } from './components/commons/user-modal/user-modal.component';
import { ProteinDetailComponent } from './components/protein-details-summary-page/protein-detail.component';
import { CustomPathwayComponent } from './components/custom-pathway-page/custom-pathway.component';
import { CustomPathwayDialogComponent } from './components/commons/custom-pathway-dialog/custom-pathway-dialog.component';
import { ProteinSoybeanComponent } from './components/protein-soybean-summary-page/protein-soybean.component';
import { ProteinCamelinaComponent } from './components/protein-camelina-summary-page/protein-camelina.component';
import { GptDialogComponent } from './components/commons/gpt-dialog/gpt-dialog.component';
import { MenuComponent } from './components/home-page/menu/menu.component';
import { FooterComponent } from './components/home-page/footer/footer.component';
import { HomeComponent } from './components/home-page/home/home.component';
import { SearchComponent } from './components/home-page/search/search.component';
import { ProteinDetailsPageComponent } from './components/protein-details-page/protein-details-page.component';
import { GlmolStructurePageComponent } from './components/glmol-structure-page/glmol-structure-page.component';
import { PathwayViewerPageComponent } from './components/pathway-viewer-page/pathway-viewer-page.component';
import { BlastPageComponent } from './components/blast-page/blast-page.component';
import { CustomPathwayViewerComponent } from './components/pathway-viewer-page/custom-pathway-viewer/custom-pathway-viewer.component';
import { KeggPathwayViewerComponent } from './components/pathway-viewer-page/kegg-pathway-viewer/kegg-pathway-viewer.component';
import { ExtendedPathwayViewerComponent } from './components/pathway-viewer-page/extended-pathway-viewer/extended-pathway-viewer.component';
import { DataComponent } from './components/datasets-page/data.component';
import { GoCytoscapeComponent } from './components/go-cytoscape-page/go-cytoscape.component';
import { GoCytoscapeNetworkComponent } from './components/commons/go-cytoscape-network/go-cytoscape-network.component';
import { CounterComponent } from './components/home-page/counter/counter.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ResearchPapersPageComponent } from './components/research-papers-page/research-papers-page.component';
import { LatestNewsPageComponent } from './components/latest-news-page/latest-news-page.component';
import { EnzymePageComponent } from './components/aralip/enzyme-page/enzyme-page.component';
import { LipidPageComponent } from './components/aralip/lipid-page/lipid-page.component';
import { AralipMenuComponent } from './components/aralip/aralip-menu/aralip-menu.component';
import { ContributorsComponent } from './components/aralip/about/contributors/contributors.component'; 
import { AralipSiteComponent } from './components/aralip/about/aralip-site/aralip-site.component';
import { AralipPathwayComponent } from './components/aralip/aralip-pathway/aralip-pathway.component';
import{ MutantsComponent } from './components/aralip/mutant/mutant.component';
import { EnzymesComponent } from './components/aralip/enzymes/enzymes.component';
import { CommentsComponent } from './components/aralip/comments/comments.component';
import { LociSummaryComponent } from './components/aralip/loci-summary/loci-summary.component';
import { HehosComponent } from './components/aralip/hehos/hehos.component';
import { AralipPathwayMainComponent } from './components/aralip/aralip-pathway-main/aralip-pathway-main.component';
import { DownloadPageComponent } from './components/download-page/download-page.component';
import { PagenotfoundComponent } from './components/pagenotfound/pagenotfound.component';
import { PlantMetabolioNetworkComponent } from './components/plant-metabolio-network-page/plant-metabolio-network.component'
import { MemoryofjohnComponent } from './components/aralip/memoryofjohn/memoryofjohn.component'
import { NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { NgxMatomoRouterModule } from '@ngx-matomo/router';
import { environment } from 'src/environments/environment';
import { VisitDashboardComponent } from './components/visit-dashboard/visit-dashboard.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AralipDownloadComponent } from './components/aralip/Download/download.component';
import { CdkDetailRowDirective } from './directives/cdk-detail-row.directive';
import { ExcludeListItemPipe } from './components/pathway-viewer-page/extended-pathway-viewer/extended-pathway-viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    TeamComponent,
    StructureViewerComponent,
    UserModalComponent,
    ProteinDetailComponent,
    CustomPathwayComponent,
    CustomPathwayDialogComponent,
    ProteinSoybeanComponent,
    ProteinCamelinaComponent,
    GptDialogComponent,
    MenuComponent,
    FooterComponent,
    HomeComponent,
    SearchComponent,
    ProteinDetailsPageComponent,
    GlmolStructurePageComponent,
    PathwayViewerPageComponent,
    BlastPageComponent,
    CustomPathwayViewerComponent,
    KeggPathwayViewerComponent,
    ExtendedPathwayViewerComponent,
    DataComponent,
    GoCytoscapeComponent,
    GoCytoscapeNetworkComponent,
    CounterComponent,
    ResearchPapersPageComponent,
    LatestNewsPageComponent,
    ContributorsComponent,
    AralipSiteComponent,
    EnzymePageComponent,
    LipidPageComponent,
    AralipMenuComponent,
    AralipPathwayComponent,
    EnzymesComponent,
    MutantsComponent,
    CommentsComponent,
    LociSummaryComponent,
    AralipDownloadComponent,
    HehosComponent,
    AralipPathwayMainComponent,
    DownloadPageComponent,
    PagenotfoundComponent,
    PlantMetabolioNetworkComponent,
    MemoryofjohnComponent,
    VisitDashboardComponent,
    CdkDetailRowDirective,
    ExcludeListItemPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    CdkTableModule,
    HttpClientModule,
    FormsModule,
    CommonModule,
    // CytoscapeModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatRadioModule,
    MatDividerModule,
    MatProgressBarModule,
    MatListModule,
    HttpClientModule,
    FormsModule,
    MatMenuModule,
    MatSidenavModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatGridListModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    NgCircleProgressModule.forRoot({
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: "#78C000",
      innerStrokeColor: "#C7E596",
      animationDuration: 300,
    }),
    MatExpansionModule,
    MatDialogModule,
    MatSnackBarModule,
    ClipboardModule,
    NgxMatomoTrackerModule.forRoot({
      trackerUrl: environment.matomo_url,
      siteId: environment.matomo_site_id
    }),
    NgxMatomoRouterModule,
    LeafletModule,
    NgxChartsModule,
    MatSliderModule 
  ],
  providers: [],
  bootstrap: [AppComponent]
})

export class AppModule { }
