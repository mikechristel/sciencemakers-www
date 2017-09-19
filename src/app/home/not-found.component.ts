import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../title-manager.service';

@Component({
    selector: 'thda-not-found',
    templateUrl: './not-found.component.html',
    styleUrls: ['./home.component.scss']
})
export class RouteNotFoundComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Page Not Found, The ScienceMakers Digital Archive");
    }

}
