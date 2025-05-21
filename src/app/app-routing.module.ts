import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TeamComponent } from './components/team-page/team.component';
import { ProteinDetailComponent } from './components/protein-details-summary-page/protein-detail.component';
import { CustomPathwayComponent } from './components/custom-pathway-page/custom-pathway.component';
import { ProteinSoybeanComponent } from './components/protein-soybean-summary-page/protein-soybean.component';
import { ProteinCamelinaComponent } from './components/protein-camelina-summary-page/protein-camelina.component';
import { HomeComponent } from './components/home-page/home/home.component';
import { ProteinDetailsPageComponent } from './components/protein-details-page/protein-details-page.component';
import { BlastPageComponent } from './components/blast-page/blast-page.component';
import { GlmolStructurePageComponent } from './components/glmol-structure-page/glmol-structure-page.component';
import { PathwayViewerPageComponent } from './components/pathway-viewer-page/pathway-viewer-page.component';
import { DataComponent } from './components/datasets-page/data.component';
import { ContactUsComponent } from './components/contact-page/contactus.component';
import { GoCytoscapeComponent } from './components/go-cytoscape-page/go-cytoscape.component';
import { LatestNewsPageComponent } from './components/latest-news-page/latest-news-page.component';
import { ResearchPapersPageComponent } from './components/research-papers-page/research-papers-page.component';
import { AralipMenuComponent } from './components/aralip/aralip-menu/aralip-menu.component';
import { EnzymesComponent } from './components/aralip/enzymes/enzymes.component';
import { HehosComponent } from './components/aralip/hehos/hehos.component';
import { DownloadPageComponent } from './components/download-page/download-page.component';
import { PagenotfoundComponent } from './components/pagenotfound/pagenotfound.component';
import { PlantMetabolioNetworkComponent } from './components/plant-metabolio-network-page/plant-metabolio-network.component'
import { VisitDashboardComponent } from './components/visit-dashboard/visit-dashboard.component'

const routes: Routes = [{path: '', redirectTo: '/home', pathMatch: 'full'},
{path: 'team', component: TeamComponent},
{path: 'custom-pathway', component: CustomPathwayComponent},
{path: 'datasets', redirectTo: '/datasets/arabidopsis', pathMatch: 'full'},
{path: 'datasets/:dataset', component: DataComponent},
{path: 'protein/:uniprot_id', component: ProteinDetailComponent},
{path: 'soybean_prot/:uniprot_id', component: ProteinSoybeanComponent}, 
{path: 'camelina_prot/:uniprot_id', component: ProteinCamelinaComponent},
{path: 'home', component:HomeComponent},
{path: 'go-network-page', component:GoCytoscapeComponent},
{path: 'blast-page', component:BlastPageComponent},
{path: 'glmol-page', component:GlmolStructurePageComponent}, 
{path: 'pathway-viewer-page', component:PathwayViewerPageComponent}, 
{path: 'details/:database_name/:uniprot_id',component:ProteinDetailsPageComponent},
{path: 'contact', component: ContactUsComponent },
{path: 'latest-news', component: LatestNewsPageComponent },
{path: 'research-papers', component: ResearchPapersPageComponent },
{path: 'aralip-menu/:page', component: AralipMenuComponent },
{path: 'aralip-menu/enzymes/:id', component: EnzymesComponent },
{path: 'enzymes/:id', component: EnzymesComponent },
{path: 'aralip-menu/:page/:pathway_id', component: AralipMenuComponent },
{path: 'hehos/:id', component: HehosComponent },
{path: 'download', component: DownloadPageComponent},
{path: 'plmn-pathways', component: PlantMetabolioNetworkComponent},
{path: 'traffic-dashboard', component: VisitDashboardComponent},
{path: '**', pathMatch: 'full',  component: PagenotfoundComponent }]; 

@NgModule({
  imports: [RouterModule.forRoot(routes,{ anchorScrolling: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
