import { APP_INITIALIZER } from '@angular/core';
import { AppConfig }       from './config/app-config';

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
import { SharedModule } from './shared/shared.module';

// NOTE: following advice in https://gist.github.com/fernandohu/122e88c3bcd210bbe41c608c36306db9 to load
// configuration data before application startup in Angular 2; such config data will then initialize
// both config.serviceBase and config.mediaBase via constructor(private config: AppConfig) instead of
// just declaring variables here like var myServiceBase: string = 'blahblah'; all this work is done to
// keep blahblah out of the source code repository, i.e., the config files used for AppConfig are listed
// in .gitignore to keep them out of the source code repository; connection to service and media is
// private knowledge as these are private resources.
export function initConfig(config: AppConfig) {
  return () => config.load()
 }


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
    // NOTE:  via https://gist.github.com/fernandohu/122e88c3bcd210bbe41c608c36306db9,
    // The first line makes AppConfig class available to Angular2.
    // The second line uses APP_INITIALIZER to execute Config.load() method before application startup. The 'multi: true' is being used because an application can have more than one line of APP_INITIALIZER.
    providers: [
        AppConfig,
        { provide: APP_INITIALIZER, useFactory: initConfig, deps: [AppConfig], multi: true },
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
        GlobalState
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }
