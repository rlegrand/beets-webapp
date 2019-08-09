import { NgModule } from '@angular/core';
import { RouterModule, Routes /*, PreloadAllModules, PreloadingStrategy,NoPreloading*/ } from '@angular/router';

import { MainRoutes, MetadataType } from './model/types';

import { MetadataComponent }  from './metadatas.component';
import { OngoingMusicComponent } from './ongoing-music.component';

const appRoutes: Routes= [
  {
    path: MainRoutes.albums,
    component: MetadataComponent,
    data: {
        metadataType: MetadataType.album
    }
  },
  {
    path: MainRoutes.artists,
    component: MetadataComponent,
    data: {
        metadataType: MetadataType.artist
    }
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
