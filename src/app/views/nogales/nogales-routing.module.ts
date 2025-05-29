import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProviderComponent } from './components/provider/provider.component';
import { NogalesComponent } from './nogales.component';

const routes: Routes = [{ path: '', component: NogalesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NogalesRoutingModule {}
