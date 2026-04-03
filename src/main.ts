import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { provideRouter } from '@angular/router';

import { environment } from './environments/environment';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './app/auth/auth.interceptor';
import { Title, BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { TitleManagerService } from './app/shared/title-manager.service';
import { HistoryMakerService } from './app/historymakers/historymaker.service';
import { TextSearchService } from './app/text-search/text-search.service';
import { IDSearchService } from './app/id-search/id-search.service';
import { StoryDetailService } from './app/story/story-detail.service';
import { FeedbackService } from './app/feedback/feedback.service';
import { BiographyStorySetService } from './app/biography-storyset/biography-storyset.service';
import { SearchFormService } from './app/shared/search-form/search-form.service';
import { PlaylistManagerService } from './app/playlist-manager/playlist-manager.service';
import { TagChosenSetService } from './app/tag/tag-chosen-set.service';
import { TagService } from './app/tag/tag.service';
import { EventService } from './app/shared/my-video/services/event.service';
import { AuthManagerService } from './app/auth/auth-manager.service';
import { UserSettingsManagerService } from './app/user-settings/user-settings-manager.service';
import { StoryAdvancedSearchSettingsManagerService } from './app/story-advanced-search/story-advanced-search-manager.service';
import { USMapManagerService } from './app/US-map/US-map-manager.service';
import { StoryPlayLogService } from './app/story-play-log/story-play-log.service';
import { GlobalState } from './app/app.global-state';
import { FormsModule } from '@angular/forms';
import { CdkTableModule } from '@angular/cdk/table';
import { A11yModule } from '@angular/cdk/a11y';
import { BidiModule } from '@angular/cdk/bidi';
import { OverlayModule } from '@angular/cdk/overlay';
import { PlatformModule } from '@angular/cdk/platform';
import { ObserversModule } from '@angular/cdk/observers';
import { PortalModule } from '@angular/cdk/portal';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { AppComponent } from './app/app.component';

// Flag set in index.html indicating if the current browser
// environment passed prerequisite tests.
declare var _browserTestsPassed: any;

if (_browserTestsPassed) {
  if (environment.production) {
    enableProdMode();
  }

  bootstrapApplication(AppComponent, {
    providers: [
        provideZoneChangeDetection(),importProvidersFrom(BrowserModule, FormsModule, CdkTableModule, A11yModule, BidiModule, OverlayModule, PlatformModule, ObserversModule,
          PortalModule, CdkStepperModule, ClipboardModule
        ),
        provideRouter([
          { path: 'bioadvs', loadComponent: () => import('./app/biography-advanced-search/bio-advanced-search.component').then(m => m.BiographyAdvancedSearchComponent) },
          { path: 'storiesForBio', loadComponent: () => import('./app/biography-storyset/biography-storyset.component').then(m => m.BiographyStorySetComponent) },
          { path: 'contentlinks', loadComponent: () => import('./app/content-links/content-links.component').then(m => m.ContentLinksComponent) },
          { path: 'reorderMyClips', loadComponent: () => import('./app/reorder-myclips/reorder-myclips.component').then(m => m.ReorderMyClipsComponent) },
          { path: 'search', loadComponent: () => import('./app/search-simple/search-simple.component').then(m => m.SearchSimpleComponent) },
          { path: 'story/:ID', loadComponent: () => import('./app/story/story.component').then(m => m.StoryComponent) },
          { path: 'storyadvs', loadComponent: () => import('./app/story-advanced-search/story-advanced-search.component').then(m => m.StoryAdvancedSearchComponent) },
          { path: 'stories/:type', loadComponent: () => import('./app/storyset/storyset.component').then(m => m.StorySetComponent) },
          { path: 'tag', loadComponent: () => import('./app/tag/tag.component').then(m => m.TagComponent) },
          { path: 'settings', loadComponent: () => import('./app/user-settings/user-settings.component').then(m => m.UserSettingsComponent) },
          { path: 'help', loadComponent: () => import('./app/help/help.component').then(m => m.HelpComponent) },
          { path: 'help/search', loadComponent: () => import('./app/help/help-topics/help-search.component').then(m => m.HelpSearchComponent) },
          { path: 'help/search-one', loadComponent: () => import('./app/help/help-topics/help-search-in-one.component').then(m => m.HelpSearchInOneComponent) },
          { path: 'help/user-settings', loadComponent: () => import('./app/help/help-topics/help-user-settings.component').then(m => m.HelpUserSettingsComponent) },
          { path: 'help/ack', loadComponent: () => import('./app/help/help-topics/help-ack.component').then(m => m.HelpAckComponent) },
          { path: 'help/cite', loadComponent: () => import('./app/help/help-topics/help-cite.component').then(m => m.HelpCiteComponent) },
          { path: 'help/data', loadComponent: () => import('./app/help/help-topics/help-data.component').then(m => m.HelpDataComponent) },
          { path: 'help/facet-origins', loadComponent: () => import('./app/help/help-topics/help-facet-origins.component').then(m => m.HelpFacetOriginsComponent) },
          { path: 'help/facets', loadComponent: () => import('./app/help/help-topics/help-facets.component').then(m => m.HelpFacetsComponent) },
          { path: 'help/return-all', loadComponent: () => import('./app/help/help-topics/help-return-all.component').then(m => m.HelpReturnAllComponent) },
          { path: 'help/myclips', loadComponent: () => import('./app/help/help-topics/help-playlist.component').then(m => m.HelpPlaylistComponent) },
          { path: 'help/privacy', loadComponent: () => import('./app/help/help-topics/help-privacy.component').then(m => m.HelpPrivacyComponent) },
          { path: 'help/pubs', loadComponent: () => import('./app/help/help-topics/help-publications.component').then(m => m.HelpPublicationsComponent) },
          { path: 'help/terms', loadComponent: () => import('./app/help/help-topics/help-terms.component').then(m => m.HelpTermsComponent) },
          { path: 'all', loadComponent: () => import('./app/historymakers/historymakers.component').then(m => m.HistoryMakersComponent) },
          { path: '', redirectTo: '/home', pathMatch: 'full' },
          { path: 'home', loadComponent: () => import('./app/home/home.component').then(m => m.HomeComponent) },
          { path: '**', loadComponent: () => import('./app/home/not-found.component').then(m => m.RouteNotFoundComponent) }
        ]),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        Title,
        TitleManagerService,
        HistoryMakerService,
        TextSearchService,
        IDSearchService,
        StoryDetailService,
        FeedbackService,
        BiographyStorySetService,
        SearchFormService,
        PlaylistManagerService,
        TagChosenSetService,
        TagService,
        EventService,
        AuthManagerService,
        UserSettingsManagerService,
        StoryAdvancedSearchSettingsManagerService,
        USMapManagerService,
        StoryPlayLogService,
        GlobalState,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
    .catch(err => console.log(err));
} else {
  console.error("Digital Archive application not loaded; browser failed pre-flight checks.");
}

/* !!!TBD!!! Bringing back hot module loading, hmr stuff... import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { hmrBootstrap } from './hmr';

if (environment.production) {
  enableProdMode();
}

const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);

if (environment.hmr) {
  if (module[ 'hot' ]) {
    hmrBootstrap(module, bootstrap);
  } else {
    console.error('HMR is not enabled for webpack-dev-server!');
    console.log('Are you using the --hmr flag for ng serve?');
  }
} else {
  bootstrap();
}
*/
