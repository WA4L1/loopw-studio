import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioEngineService } from '../../../../core/services/audio-engine';

interface TrackPad {
  id: number;
  name: string;
  isRecording: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
}

@Component({
  selector: 'app-console',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './console.html',
  styleUrl: './console.css'
})
export class ConsoleComponent {
  public audioEngine = inject(AudioEngineService);

  public tracks = signal<TrackPad[]>([
    { id: 1, name: 'Pista 1 (Kick / Rhythm)', isRecording: false, audioUrl: null, audioBlob: null },
    { id: 2, name: 'Pista 2 (Snare / Beat)', isRecording: false, audioUrl: null, audioBlob: null },
    { id: 3, name: 'Pista 3 (Bass / Loop)', isRecording: false, audioUrl: null, audioBlob: null },
    { id: 4, name: 'Pista 4 (Vocals / FX)', isRecording: false, audioUrl: null, audioBlob: null }
  ]);

  public activeTrackId = signal<number | null>(null);

  async enableMic(): Promise<boolean> {
  return await this.audioEngine.requestMicrophoneAccess();
}

async toggleRecord(trackId: number): Promise<void> {
  if (!this.audioEngine.isPermissionGranted()) {
    const granted = await this.enableMic(); // Ahora 'granted' es de tipo boolean
    if (!granted) return; // ✅ TypeScript ya no arrojará error
  }

  const currentTrack = this.tracks().find(t => t.id === trackId);
  if (!currentTrack) return;

  if (currentTrack.isRecording) {
    const blob = await this.audioEngine.stopRecording();
    const url = URL.createObjectURL(blob);

    this.tracks.update(list => list.map(t =>
      t.id === trackId ? { ...t, isRecording: false, audioBlob: blob, audioUrl: url } : t
    ));
    this.activeTrackId.set(null);
  } else {
    this.audioEngine.startRecording();
    this.tracks.update(list => list.map(t =>
      t.id === trackId ? { ...t, isRecording: true } : { ...t, isRecording: false }
    ));
    this.activeTrackId.set(trackId);
  }
}
}
