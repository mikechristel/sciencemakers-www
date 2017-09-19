import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-facets',
    templateUrl: './help-facets.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpFacetsComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, Search Facets, The ScienceMakers Digital Archive");
    }

}
