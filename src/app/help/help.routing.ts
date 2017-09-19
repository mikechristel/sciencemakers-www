import { ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HelpComponent } from './help.component';
import { HelpSearchComponent } from './help-topics/help-search.component';
import { HelpSearchInOneComponent } from './help-topics/help-search-in-one.component';
import { HelpAckComponent } from './help-topics/help-ack.component';
import { HelpCiteComponent } from './help-topics/help-cite.component';
import { HelpDataComponent } from './help-topics/help-data.component';
import { HelpFacetsComponent } from './help-topics/help-facets.component';
import { HelpPlaylistComponent } from './help-topics/help-playlist.component';
import { HelpPrivacyComponent } from './help-topics/help-privacy.component';
import { HelpPublicationsComponent } from './help-topics/help-publications.component';
import { HelpTermsComponent } from './help-topics/help-terms.component';

// NOTE: decided AGAINST having helper topics be child routes, as in:
// export const helpRoutes: Routes = [
//     { path: 'help', component: HelpComponent,
//       children: [
//         { path: 'search', component: HelpSearchComponent }
//       ]
//     }
// ];
// Reason:  too much of page is consumed with list of help topics presented by HelpComponent.
// Instead, have full page be given over to topics like HelpSearchComponent, i.e., separate routes:
export const helpRoutes: Routes = [
    { path: 'help', component: HelpComponent },
    { path: 'help/search', component: HelpSearchComponent },
    { path: 'help/search-one', component: HelpSearchInOneComponent },
    { path: 'help/ack', component: HelpAckComponent },
    { path: 'help/cite', component: HelpCiteComponent },
    { path: 'help/data', component: HelpDataComponent },
    { path: 'help/facets', component: HelpFacetsComponent },
    { path: 'help/playlist', component: HelpPlaylistComponent },
    { path: 'help/privacy', component: HelpPrivacyComponent },
    { path: 'help/pubs', component: HelpPublicationsComponent },
    { path: 'help/terms', component: HelpTermsComponent }
];

export const helpRouting: ModuleWithProviders = RouterModule.forChild(helpRoutes);
