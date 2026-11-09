import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioEngineService {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  // Usamos Signals de Angular para exponer el estado de grabación a la UI de forma reactiva
  public isRecording = signal<boolean>(false);
  public isPermissionGranted = signal<boolean>(false);

  constructor() {}

  /**
   * Solicita acceso al micrófono del usuario e inicializa el AudioContext
   */
  async requestMicrophoneAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Inicializar AudioContext nativo
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();

      // Configurar el MediaRecorder con el stream del micrófono
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.isPermissionGranted.set(true);
      return true;
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      this.isPermissionGranted.set(false);
      return false;
    }
  }

  /**
   * Inicia la grabación de un loop en la pista actual
   */
  startRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'inactive') return;

    this.audioChunks = [];
    this.mediaRecorder.start();
    this.isRecording.set(true);
  }

  /**
   * Detiene la grabación y devuelve el Blob de audio listo para reproducir/guardar
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject('El grabador no está activo');
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.isRecording.set(false);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }
}
