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

import {BeetApi} from './apis.service';
import {Utils} from './utils.service';

@NgModule({
  imports:      [ BrowserModule, HttpClientModule, FormsModule, AppRoutingModule ],
  declarations: [ AppComponent, AlbumsComponent, ArtistsComponent, Player ],
  providers: [BeetApi, Utils],
  bootstrap:    [ AppComponent ]

})
export class AppModule { }
