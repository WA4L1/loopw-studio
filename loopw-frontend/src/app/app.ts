import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsoleComponent } from './features/loopstation/components/console/console';

@Component({
  imports: [RouterOutlet, ConsoleComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('loopw-frontend');
}
