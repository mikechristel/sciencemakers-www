import { Component, OnInit, Input, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfig } from '../../config/app-config';

import { StoryDetailService } from '../../story/story-detail.service';
import { PlaylistManagerService } from '../../playlist-manager/playlist-manager.service';
import { Playlist } from './playlist';
import { GlobalState } from '../../app.global-state';
import { Subscription }   from 'rxjs/Subscription';

@Component({
  selector: 'playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss']
})

export class PlaylistComponent implements OnInit {
  @Input() allowMyPlaylistView: boolean;

  private subscription: Subscription;
  public playlist: Playlist[];
  public url: string;
  public playlistPreview: Playlist[];
  public maxLength: number = 140;
  public playlistTitle: string = "";
  public overMaxLength: boolean = false;

  public myMediaBase: string; // NOTE: data repository is not hard-coded here; get via constructor

  constructor(private config: AppConfig,
    private router: Router, private playlistManagerService: PlaylistManagerService) {
        this.myMediaBase = this.config.getConfig('mediaBase');
        this.subscription = playlistManagerService.playlist$.subscribe((value) => {
        this.url = this.playlistManagerService.TitledPlaylistAsURL();
        this.playlist = value;
    })
  }

  ngOnInit() {
    this.url = this.playlistManagerService.TitledPlaylistAsURL();
    this.playlist = this.playlistManagerService.initializePlaylist();
    this.getPlaylistPreview();
    this.playlistTitle = this.playlistManagerService.getTitle();
    if (this.playlistTitle === undefined) this.playlistTitle = "";
  }

  ngDoCheck() {
    this.getPlaylistPreview();
  }

  getPlaylistPreview() {
    if (this.playlist.length > 4) {
      this.playlistPreview = this.playlist.slice(0,4);
    }
    else this.playlistPreview = this.playlist;
  }

  removeFromPlaylist(story) {
    this.playlistManagerService.toggleAddToPlaylist(story);
  }

  routeToPlaylist() {
    this.router.navigate(['stories/4']);
  }

  routeToStory(storyID) {
    this.router.navigate(['/story', storyID]);
  }

  addPlaylistTitle(playlistTitle: string) {
    this.playlistManagerService.addPlaylistTitle(playlistTitle);
  }

}
