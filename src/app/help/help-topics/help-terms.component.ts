import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-terms',
    templateUrl: './help-terms.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpTermsComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, Terms and Conditions, The ScienceMakers Digital Archive");
    }

}
