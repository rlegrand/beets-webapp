import { NgModule } from '@angular/core';
import { RouterModule, Routes, /*PreloadAllModules, PreloadingStrategy,NoPreloading*/ } from '@angular/router';

const appRoutes: Routes= [
  {
    path: 'maingui',
    component: '
    loadChildren: 'app/maingui/maingui.module#MainGuiModule',
    canActivate:[AuthenticatedGuard]
  },
  {
    path: 'empty',
    component: Empty
  },
  { path: '', redirectTo: '/maingui', pathMatch: 'full' }
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
