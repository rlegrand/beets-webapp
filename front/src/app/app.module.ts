import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

//Components
import { AppComponent }  from './app.component';
import { Player } from './player.component';
import { CriteriaListComponent } from './criterialist.component';

import {BeetApi} from './apis.service';
import {Utils} from './utils.service';

@NgModule({
  imports:      [ BrowserModule, HttpModule, FormsModule],
  declarations: [ AppComponent, Player, CriteriaListComponent],
  providers: [BeetApi, Utils],
  bootstrap:    [ AppComponent ]

})
export class AppModule { }
