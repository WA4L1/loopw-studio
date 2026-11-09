import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioEngineService } from '../../../../core/services/audio-engine.service';
import { StorageService } from '../../../../core/services/storage.service';

interface TrackPad {
  id: number;
  name: string;
  isRecording: boolean;
  isUploading: boolean;
  audioUrl: string | null;
  s3Url: string | null;
  audioBlob: Blob | null;
}

@Component({
  selector: 'app-console',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './console.component.html',
  styleUrl: './console.component.css'
})
export class ConsoleComponent {
  public audioEngine = inject(AudioEngineService);
  private storageService = inject(StorageService);

  public tracks = signal<TrackPad[]>([
    { id: 1, name: 'Pista 1 (Kick / Rhythm)', isRecording: false, isUploading: false, audioUrl: null, s3Url: null, audioBlob: null },
    { id: 2, name: 'Pista 2 (Snare / Beat)', isRecording: false, isUploading: false, audioUrl: null, s3Url: null, audioBlob: null },
    { id: 3, name: 'Pista 3 (Bass / Loop)', isRecording: false, isUploading: false, audioUrl: null, s3Url: null, audioBlob: null },
    { id: 4, name: 'Pista 4 (Vocals / FX)', isRecording: false, isUploading: false, audioUrl: null, s3Url: null, audioBlob: null }
  ]);

  public activeTrackId = signal<number | null>(null);

  async enableMic(): Promise<boolean> {
    return await this.audioEngine.requestMicrophoneAccess();
  }

  async toggleRecord(trackId: number): Promise<void> {
    if (!this.audioEngine.isPermissionGranted()) {
      const granted = await this.enableMic();
      if (!granted) return;
    }

    const currentTrack = this.tracks().find(t => t.id === trackId);
    if (!currentTrack) return;

    if (currentTrack.isRecording) {
      // Detener grabación
      const blob = await this.audioEngine.stopRecording();
      const localUrl = URL.createObjectURL(blob);

      // Actualizar estado local
      this.tracks.update(list => list.map(t =>
        t.id === trackId ? { ...t, isRecording: false, isUploading: true, audioBlob: blob, audioUrl: localUrl } : t
      ));
      this.activeTrackId.set(null);

      // Subir a S3 en segundo plano
      try {
        const filename = `track_${trackId}_${Date.now()}.wav`;
        const s3PublicUrl = await this.storageService.uploadAudioToS3(blob, filename);

        this.tracks.update(list => list.map(t =>
          t.id === trackId ? { ...t, isUploading: false, s3Url: s3PublicUrl } : t
        ));
      } catch (error) {
        console.error('Error al subir a AWS S3:', error);
        this.tracks.update(list => list.map(t =>
          t.id === trackId ? { ...t, isUploading: false } : t
        ));
      }

    } else {
      // Iniciar grabación
      this.audioEngine.startRecording();
      this.tracks.update(list => list.map(t =>
        t.id === trackId ? { ...t, isRecording: true } : { ...t, isRecording: false }
      ));
      this.activeTrackId.set(trackId);
    }
  }
}
