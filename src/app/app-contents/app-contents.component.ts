import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-contents',
    templateUrl: './app-contents.component.html',
    styleUrls: ['./app-contents.component.scss'],
    imports: [RouterOutlet]
})
export class AppContentsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
