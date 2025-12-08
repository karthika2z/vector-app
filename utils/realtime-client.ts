import { floatTo16BitPCM, arrayBufferToBase64, base64ToArrayBuffer, resampleTo24k } from './audio-utils';

interface RealtimeClientConfig {
  apiKey: string;
  instructions: string;
  audioContext: AudioContext;
  onAudioOutput: (audio: Int16Array) => void;
  onJsonOutput: (json: any) => void;
  onStatusChange: (status: string) => void;
  onLog: (message: string, type: 'info' | 'error' | 'event') => void;
  onUserSpeaking?: (isSpeaking: boolean) => void;
}

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeClientConfig;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private muted: boolean = false;

  constructor(config: RealtimeClientConfig) {
    this.config = config;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.config.onLog(`Microphone ${muted ? 'muted' : 'unmuted'}`, 'event');
  }

  isMuted(): boolean {
    return this.muted;
  }

  async connect() {
    this.config.onLog("Initializing OpenAI Realtime Client...", 'info');
    this.config.onStatusChange('connecting');
    
    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
    
    try {
      this.config.onLog(`Connecting to WebSocket...`, 'info');
      this.ws = new WebSocket(url, [
        "realtime",
        "openai-insecure-api-key." + this.config.apiKey,
        "openai-beta.realtime-v1",
      ]);
    } catch (e: any) {
      console.error("WebSocket creation failed", e);
      this.config.onLog(`WebSocket creation failed: ${e.message}`, 'error');
      this.config.onStatusChange('error');
      return;
    }

    this.ws.onopen = () => {
      this.config.onLog("WebSocket Connected", 'info');
      this.config.onStatusChange('connected');
      this.sendSessionUpdate();
      this.startAudioCapture();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (e: any) {
        console.error("Failed to parse message", e);
        this.config.onLog(`JSON Parse Error: ${e.message}`, 'error');
      }
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      this.config.onLog("WebSocket Error occurred", 'error');
      this.config.onStatusChange('error');
    };

    this.ws.onclose = (ev) => {
      this.config.onLog(`WebSocket Closed: Code ${ev.code}, Reason: ${ev.reason || 'none'}`, 'info');
      this.config.onStatusChange('disconnected');
      this.stopAudioCapture();
    };
  }

  private sendSessionUpdate() {
    if (!this.ws) return;
    
    this.config.onLog("Sending session.update...", 'info');
    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: this.config.instructions,
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      }
    };
    
    this.ws.send(JSON.stringify(sessionUpdate));
  }

  // Trigger the assistant to speak first with the opening line
  triggerInitialResponse() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.config.onLog("Cannot trigger response - WebSocket not ready", 'error');
      return;
    }
    
    this.config.onLog("Triggering initial assistant response...", 'info');
    
    // Send a response.create to make the assistant speak first
    const responseCreate = {
      type: "response.create",
      response: {
        modalities: ["text", "audio"],
        instructions: "Begin the conversation now with your opening line. Introduce yourself as Vector and ask the user about the last time they lost track of time doing something."
      }
    };
    
    this.ws.send(JSON.stringify(responseCreate));
  }

  private async startAudioCapture() {
    try {
      this.config.onLog("Starting Audio Capture...", 'info');
      const ctx = this.config.audioContext;
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      this.config.onLog(`AudioContext Active. Sample Rate: ${ctx.sampleRate}`, 'info');

      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      this.config.onLog("Microphone access granted", 'info');

      this.source = ctx.createMediaStreamSource(this.stream);
      
      const bufferSize = 4096;
      this.processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      
      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = 0;
      
      this.source.connect(this.processor);
      this.processor.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);

      let packetCount = 0;

      this.processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (this.muted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        
        const sourceRate = ctx.sampleRate || 48000;
        
        const resampled = resampleTo24k(inputData, sourceRate);
        const pcmData = floatTo16BitPCM(resampled);
        const base64Audio = arrayBufferToBase64(pcmData);
        
        this.ws.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio
        }));

        packetCount++;
        if (packetCount % 100 === 0) {
           this.config.onLog(`Sent 100 packets. Mic Level (RMS): ${rms.toFixed(4)}`, rms > 0.01 ? 'event' : 'info');
        }
      };
      
    } catch (err: any) {
      console.error("Audio Capture Error:", err);
      this.config.onLog(`Audio Capture Error: ${err.message}`, 'error');
      this.config.onStatusChange('error');
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'session.created':
        this.config.onLog("Session created successfully", 'info');
        break;
        
      case 'session.updated':
        this.config.onLog("Session updated - triggering opening...", 'info');
        // Small delay to ensure everything is ready, then trigger the assistant to speak
        setTimeout(() => this.triggerInitialResponse(), 500);
        break;

      case 'input_audio_buffer.speech_started':
        this.config.onLog("VAD: Speech Started", 'event');
        this.config.onUserSpeaking?.(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        this.config.onLog("VAD: Speech Stopped", 'event');
        this.config.onUserSpeaking?.(false);
        break;
        
      case 'input_audio_buffer.committed':
        this.config.onLog("Audio buffer committed", 'info');
        break;

      case 'response.audio.delta':
        if (message.delta) {
          const buffer = base64ToArrayBuffer(message.delta);
          this.config.onAudioOutput(new Int16Array(buffer));
        }
        break;
      
      case 'response.created':
        this.config.onLog("Response Created", 'info');
        break;

      case 'response.done':
        if (message.response?.output) {
          message.response.output.forEach((item: any) => {
            if (item.content) {
              item.content.forEach((content: any) => {
                if (content.type === 'text') {
                   const text = content.text;
                   this.config.onLog(`Model Text: ${text.substring(0, 60)}...`, 'info');
                   if (text.includes('```json')) {
                     const match = text.match(/```json\n([\s\S]*?)\n```/);
                     if (match) {
                        try {
                          const json = JSON.parse(match[1]);
                          this.config.onJsonOutput(json);
                        } catch (e) {
                          this.config.onLog("Failed to parse JSON from response", 'error');
                        }
                     }
                   }
                }
              });
            }
          });
        }
        break;
        
      case 'error':
        console.error("OpenAI Error:", message);
        this.config.onLog(`OpenAI API Error: ${message.error?.message || JSON.stringify(message.error)}`, 'error');
        break;
        
      default:
        // Log other message types for debugging
        if (message.type && !message.type.includes('audio')) {
          this.config.onLog(`Event: ${message.type}`, 'info');
        }
    }
  }

  stopAudioCapture() {
    this.config.onLog("Stopping Audio Capture", 'info');
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  disconnect() {
    this.stopAudioCapture();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
