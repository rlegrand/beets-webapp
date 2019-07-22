import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import { Observable } from 'rxjs';

import { BeetApi } from './services/apis.service';
import { Utils } from './services/utils.service';
import { DisplaySongsHelper } from './services/displaySongsHelper.service';
import { Song } from './model/songs-response';

@Component({
  selector: 'ongoing-music',
  templateUrl: 'ongoing-music.component.html',
  styleUrls: ['ongoing-music.component.css'],

})
export class OngoingMusicComponent {

  constructor(public dsh: DisplaySongsHelper) { }

}


