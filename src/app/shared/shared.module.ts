import { NgModule }             from '@angular/core';
import { CommonModule }         from '@angular/common';
import { FormsModule }          from '@angular/forms';
import { ScrollToMeDirective }  from './scroll-to-me.directive';
import { ScrollTranscript }  from './scroll-transcript.directive';
import { StorySearchComponent } from './story-search/story-search.component';
import { VideoJSComponent }       from './video-js/video-js.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';
import { ClipboardModule } from 'ngx-clipboard';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

// NOTE:  Template for this module is: https://angular.io/docs/ts/latest/guide/ngmodule.html#!#shared-module

@NgModule({
    imports: [
        CommonModule, 
        FormsModule,
        VgCoreModule,
        VgControlsModule,
        VgOverlayPlayModule,
        VgBufferingModule,
        ClipboardModule,
        TooltipModule.forRoot()
        ],
    declarations: [
        ScrollToMeDirective,
        ScrollTranscript,
        StorySearchComponent, 
        VideoJSComponent, 
        PlaylistComponent
        ],
    exports: [
        ScrollToMeDirective,
        ScrollTranscript,
        CommonModule, 
        FormsModule,
        StorySearchComponent, 
        VideoJSComponent, 
        PlaylistComponent
        ]
})
export class SharedModule { }