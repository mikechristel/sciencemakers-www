import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-publications',
    templateUrl: './help-publications.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpPublicationsComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, Publications, The ScienceMakers Digital Archive");
    }

}
