import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-playlist',
    templateUrl: './help-playlist.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpPlaylistComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, Playlist Creation and Sharing, The ScienceMakers Digital Archive");
    }

}
