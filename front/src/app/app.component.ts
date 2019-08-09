import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import { SongsResponse } from './model/songs-response';
import { BeetApi } from './services/apis.service';
import { Utils } from './services/utils.service';
import { DisplaySongsHelper } from './services/displaySongsHelper.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent implements OnInit {

  textRequest: string;
  menuClasses: {hide: boolean};

  constructor(private dsh: DisplaySongsHelper) { }

  ngOnInit() {
    // register display song helper to update request input form
    this.dsh.textRequest.subscribe((tr: string) => { console.log(tr); if (this.textRequest !== tr) this.textRequest = tr; });

    // menu classes
    this.menuClasses = { 'hide': false };
    
   }

  search = () => {
    if (this.textRequest === undefined || this.textRequest.length === 0) {
      return;
    }

    this.dsh.getAndDisplaySongs(this.textRequest);
    return false;
  }

  toggleMenu= () => {
    this.menuClasses.hide=!this.menuClasses.hide;
  }


}
