import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

//Components
import { AppComponent }  from './app.component';
import { AlbumsComponent }  from './albums.component';
import { ArtistsComponent }  from './artists.component';
import { Player } from './player.component';

import {BeetApi} from './services/apis.service';
import {Utils} from './services/utils.service';
import {Cache} from './services/cache.service';
import {DisplaySongsHelper} from './services/displaySongsHelper.service';
import { OngoingMusicComponent } from './ongoing-music.component';

@NgModule({
  imports:      [ BrowserModule, HttpClientModule, FormsModule, AppRoutingModule ],
  declarations: [ AppComponent, AlbumsComponent, ArtistsComponent, OngoingMusicComponent, Player ],
  providers: [BeetApi,Cache, Utils, DisplaySongsHelper],
  bootstrap:    [ AppComponent ]

})
export class AppModule { }
