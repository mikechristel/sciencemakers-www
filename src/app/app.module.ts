import { NgModule }      from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent }  from './app.component';
import { routing,
    appRoutingProviders } from './app.routing';

import { HomeModule } from './home/home.module';
import { HistoryMakersModule } from './historymakers/historymakers.module';
import { BiographyStampModule } from './biography-stamp/biography-stamp.module';
import { StoryStampModule } from './story-stamp/story-stamp.module';
import { StorySetModule } from './storyset/storyset.module';
import { HelpModule } from './help/help.module';
import { StoryAdvancedSearchModule } from './story-advanced-search/story-advanced-search.module';
import { StoryModule } from './story/story.module';
import { BiographyStorySetModule } from './biography-storyset/biography-storyset.module';
import { BiographyAdvancedSearchModule } from './biography-advanced-search/bio-advanced-search.module';

import { TitleManagerService } from './title-manager.service';
import { HistoryMakerService } from './historymakers/historymaker.service';
import { StoryDetailService } from './story/story-detail.service';
import { TextSearchService } from './text-search/text-search.service';
import { IDSearchService } from './id-search/id-search.service';
import { FeedbackService } from './feedback/feedback.service';
import { BiographyStorySetService } from './biography-storyset/biography-storyset.service';
import { MenuService } from './menu/menu.service';
import { PlaylistManagerService } from './playlist-manager/playlist-manager.service';
import { GoogleAnalyticsEventsService } from './google-analytics-events.service';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';

import { GlobalState } from './app.global-state';
import { ServiceBase } from './shared/config-paths';
import { MediaBase } from './shared/config-paths';
import { SharedModule } from './shared/shared.module';

// NOTE: the following WILL BE defined in an external configuration JS file appropriate to a particular deployment.
// TODO: !!!TBD!!!  For the moment, getting ng build to recognize the extra dependency is not yet implemented.
// So, the values are expressed here:
// Eventually something like: import { myServiceBase } from "myPaths.config";
//                            import { myMediaBase } from "myPaths.config";
// Placeholder for now:
var myServiceBase: string = 'api/';
var myMediaBase: string = 'https://thmdaprodmedia.blob.core.windows.net/media/';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
	    BrowserModule,
        FormsModule,
        routing,
        HttpModule,
        HistoryMakersModule,
        BiographyStampModule,
        StoryStampModule,
        StorySetModule,
        HelpModule,
        StoryAdvancedSearchModule,
        BiographyStorySetModule,
        BiographyAdvancedSearchModule,
        StoryModule,
        SharedModule,
        ScrollToModule.forRoot(),
        HomeModule // NOTE: HomeModule must be last in this list, with its wildcard support to catch router-not-found paths
    ],
    providers: [
        Title,
        TitleManagerService,
        appRoutingProviders,
        HistoryMakerService,
        TextSearchService,
        IDSearchService,
        StoryDetailService,
        FeedbackService,
        BiographyStorySetService,
        MenuService,
        PlaylistManagerService,
        GoogleAnalyticsEventsService,
        GlobalState,
        {provide: ServiceBase, useValue: myServiceBase},
        {provide: MediaBase, useValue: myMediaBase}
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }
