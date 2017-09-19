import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';

import { Playlist } from '../shared/playlist/playlist';
import { GlobalState } from '../app.global-state';

@Injectable()
export class PlaylistManagerService {
  public playlist: Subject<Playlist[]> = new Subject<Playlist[]>();
  public playlist$ = this.playlist.asObservable();
  public playlistTitle: Subject<string> = new Subject<string>();
  public playlistTitle$ = this.playlistTitle.asObservable();
  public titleURIEncoded: string;
  public title: string;
  public localPlaylist: Playlist[] = [];

  constructor() {
      this.localPlaylist = JSON.parse(localStorage.getItem("sm-playlist") || "[]");
      this.playlist.next(this.localPlaylist);
      this.initializePlaylist();
  }

  ngOnInit() {
      this.playlist.next(this.localPlaylist);
  }

  initializePlaylist() {
    //   this.playlist.next(this.localPlaylist);
      return this.localPlaylist;
  }

  addPlaylistTitle(playlistTitle) {
    // NOTE: certain characters in router mess up router parsing, e.g., !
    // Rather than figure out nuances of router parsing, simplify what can be used as a title to just alphanumeric and space.
    var cleanedTitle: string = playlistTitle.replace(/\s\s+/g, ' '); // consecutive whitespace turned into single space
    cleanedTitle = cleanedTitle.replace(/[^a-zA-Z0-9 \-\'\"\_\.]/g, ''); // keep only alphanumeric, dash -, single or double quote ' ", underscore _, period . and space, nothing else
    this.title = cleanedTitle;
    this.titleURIEncoded = encodeURIComponent(cleanedTitle);
    this.playlistTitle.next(cleanedTitle);
    this.playlist.next(this.localPlaylist);
  }

  getTitle() {
      return this.title;
  }

  updatePlaylist() {
    this.playlist.next(this.localPlaylist);
  }

  toggleAddToPlaylist(story) {
        var idx: number;
        var item: Playlist;

        idx = this.localPlaylist.findIndex(x => x.storyID == story.storyID)
        if (idx >= 0) {
            this.localPlaylist.splice(idx, 1);
            localStorage.setItem("sm-playlist", JSON.stringify(this.localPlaylist));
        }
        else {
            // Add story into the list because it's not yet there:
            item = {
                storyID: story.storyID,
                title: story.title
            }
            this.localPlaylist.unshift(item);
            localStorage.setItem("sm-playlist", JSON.stringify(this.localPlaylist));
        }
        this.playlist.next(this.localPlaylist);
    }

    TitledPlaylistAsURL(): string {
        var retVal: string = "";
        var url: string = ""
        var favCount: number = this.localPlaylist.length;
        if (favCount > 0) {
            retVal = this.localPlaylist[0].storyID.toString();
            for (var i:number = 1; i < this.localPlaylist.length; i++)
                retVal = retVal + "%2C" + this.localPlaylist[i].storyID;
            url = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port: '') + "/stories/6;IDList=" + retVal;
            if (this.titleURIEncoded) url = url + ";ListTitle=" + this.titleURIEncoded;
        }
        else url = "";
        return url;
    }

    PlaylistAsPath(): string {
        var retVal: string = "";
        var url: string = ""
        var favCount: number = this.localPlaylist.length;
        if (favCount > 0) {
            retVal = this.localPlaylist[0].storyID.toString();
            for (var i:number = 1; i < this.localPlaylist.length; i++)
                retVal = retVal + "%2C" + this.localPlaylist[i].storyID;
            url = "/stories/7;IDList=" + retVal;
            // NOTE:  The user's playlist is NOT titled.  They can export it as a titled set of stories, which is the purpose of TitledPlaylistAsURL
        }
        else url = "";
        return url;
    }

    PlaylistAsString(): string {
        var retVal: string = "";
        var favCount: number = this.localPlaylist.length;
        if (favCount > 0) {
            retVal = this.localPlaylist[0].storyID.toString();
            for (var i:number = 1; i < this.localPlaylist.length; i++)
                retVal = retVal + "," + this.localPlaylist[i].storyID;
        }
        return retVal;
    }

}
