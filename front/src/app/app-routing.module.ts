import { NgModule } from '@angular/core';
import { RouterModule, Routes /*, PreloadAllModules, PreloadingStrategy,NoPreloading*/ } from '@angular/router';

import { MainRoutes } from './model/types';

import { AlbumsComponent }  from './albums.component';
import { ArtistsComponent }  from './artists.component';
import { OngoingMusicComponent } from './ongoing-music.component';

const appRoutes: Routes= [
  {
    path: MainRoutes.albums,
    component: AlbumsComponent
  },
  {
    path: MainRoutes.artists,
    component: ArtistsComponent
  },
  {
    path: MainRoutes.ongoing,
    component: OngoingMusicComponent
  },
  { path: '', redirectTo: '/albums', pathMatch: 'full' }
];


@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      {
        useHash: true,
        //enableTracing: true,
        //preloadingStrategy: NoPreloading
      }
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
