import {RouterModule, Routes} from "@angular/router";
import {DefaultComponent} from "./default/default.component";
import {NgModule} from "@angular/core";

const routes: Routes = [{
  path: '',
  component: DefaultComponent,
}]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
