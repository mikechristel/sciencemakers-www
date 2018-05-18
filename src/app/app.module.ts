import { APP_INITIALIZER, NgModule } from '@angular/core';

import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent }  from './app.component';
import { routing, appRoutingProviders } from './app.routing';
import { AuthInterceptor } from './auth/auth.interceptor';

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
import { UserSettingsModule } from './user-settings/user-settings.module';

import { TitleManagerService } from './title-manager.service';
import { HistoryMakerService } from './historymakers/historymaker.service';
import { StoryDetailService } from './story/story-detail.service';
import { TextSearchService } from './text-search/text-search.service';
import { IDSearchService } from './id-search/id-search.service';
import { FeedbackService } from './feedback/feedback.service';
import { BiographyStorySetService } from './biography-storyset/biography-storyset.service';
import { MenuService } from './menu/menu.service';
import { PlaylistManagerService } from './playlist-manager/playlist-manager.service';
import { UserSettingsManagerService } from './user-settings/user-settings-manager.service';
import { GoogleAnalyticsEventsService } from './google-analytics-events.service';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';

import { GlobalState } from './app.global-state';
import { SharedModule } from './shared/shared.module';

@NgModule({
    declarations: [
          AppComponent
      ],
      imports: [
        BrowserModule,
        FormsModule,
        routing,
        HttpClientModule,
        HistoryMakersModule,
        BiographyStampModule,
        StoryStampModule,
        StorySetModule,
        TagModule,
        HelpModule,
        StoryAdvancedSearchModule,
        BiographyStorySetModule,
        BiographyAdvancedSearchModule,
        UserSettingsModule,
        StoryModule,
        SharedModule,
        ScrollToModule.forRoot(),
        HomeModule // NOTE: HomeModule must be last in this list, with its wildcard support to catch router-not-found paths
      ],
      providers: [
        {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
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
        UserSettingsManagerService,
        GoogleAnalyticsEventsService,
        GlobalState
      ],
      bootstrap: [ AppComponent ]
})
export class AppModule { }
