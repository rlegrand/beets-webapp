import { NgModule } from '@angular/core';
import { RouterModule, Routes /*, PreloadAllModules, PreloadingStrategy,NoPreloading*/ } from '@angular/router';

import { AlbumsComponent }  from './albums.component';
import { ArtistsComponent }  from './artists.component';

const appRoutes: Routes= [
  {
    path: 'albums',
    component: AlbumsComponent
  },
  {
    path: 'artists',
    component: ArtistsComponent
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
