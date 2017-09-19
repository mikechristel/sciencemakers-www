import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-search-in-one',
    templateUrl: './help-search-in-one.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpSearchInOneComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, Search Inside Person, The ScienceMakers Digital Archive");
    }

}
