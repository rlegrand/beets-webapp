import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import { SongsResponse } from './model/songs-response';
import { BeetApi } from './services/apis.service';
import { Utils } from './services/utils.service';
import { DisplaySongsHelper } from './services/displaySongsHelper.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {

  textRequest: string;

  constructor(private dsh: DisplaySongsHelper) {
    dsh.textRequest.subscribe((tr: string) => { console.log(tr); if (this.textRequest !== tr) this.textRequest = tr; })
  }

  ngOnInit() { }

  search = () => {
    if (this.textRequest === undefined || this.textRequest.length === 0) {
      return;
    }

    this.dsh.getAndDisplaySongs(this.textRequest);
    return false;
  }


}
