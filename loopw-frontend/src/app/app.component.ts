import { Component} from '@angular/core';
import { ConsoleComponent } from './features/loopstation/components/console/console.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ConsoleComponent],
  styleUrl: './app.component.css',
  templateUrl: './app.component.html',
})
export class App {
}
