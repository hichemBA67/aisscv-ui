import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DefaultComponent } from './default/default.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MatIconModule } from '@angular/material/icon';
import { StateBarComponent } from './state-bar/state-bar.component';
import { StateComponent } from './state-bar/state/state.component';
import { AllPartsModalComponent } from './state-bar/parts-container/all-parts-box/all-parts-box.component';
import { StatePartsModelComponent } from './state-bar/parts-container/state-parts-box/state-parts-box.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

import {
  HttpClient,
  HttpClientModule,
  HttpHandler,
} from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  declarations: [
    AppComponent,
    DefaultComponent,
    HeaderComponent,
    SidebarComponent,
    StateBarComponent,
    StateComponent,
    AllPartsModalComponent,
    StatePartsModelComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    RouterOutlet,
    MatIconModule,
    HttpClientModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    SweetAlert2Module,
  ],
  providers: [HttpClient],
  bootstrap: [AppComponent],
})
export class AppModule {}
