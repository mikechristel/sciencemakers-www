import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-cite',
    templateUrl: './help-cite.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpCiteComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, How to Cite, The ScienceMakers Digital Archive");
    }

}
