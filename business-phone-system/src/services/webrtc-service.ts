import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

export interface CallOffer {
  callId: string;
  from: string;
  to: string;
  signal: SimplePeer.SignalData;
  metadata?: {
    audio: boolean;
    video: boolean;
    displayName?: string;
  };
}

export interface CallAnswer {
  callId: string;
  signal: SimplePeer.SignalData;
}

export interface CallCandidate {
  callId: string;
  candidate: RTCIceCandidate;
}

export enum CallState {
  IDLE = 'idle',
  CALLING = 'calling',
  RINGING = 'ringing',
  CONNECTED = 'connected',
  ENDED = 'ended',
  FAILED = 'failed'
}

export interface CallSession {
  callId: string;
  peer: SimplePeer.Instance;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  state: CallState;
  isInitiator: boolean;
  remoteUserId: string;
  metadata: {
    audio: boolean;
    video: boolean;
    startTime?: Date;
    endTime?: Date;
  };
}

interface WebRTCServiceCallbacks {
  onIncomingCall: (offer: CallOffer) => void;
  onCallStateChange: (callId: string, state: CallState) => void;
  onRemoteStream: (callId: string, stream: MediaStream) => void;
  onCallEnded: (callId: string, reason: string) => void;
  onError: (error: string) => void;
}

export class WebRTCService {
  private socket: Socket | null = null;
  private activeCalls: Map<string, CallSession> = new Map();
  private callbacks: WebRTCServiceCallbacks;
  private userId: string | null = null;
  
  // WebRTC Configuration
  private peerConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
    ]
  };

  constructor(callbacks: WebRTCServiceCallbacks) {
    this.callbacks = callbacks;
  }

  async initialize(userId: string, token: string): Promise<void> {
    this.userId = userId;
    
    try {
      // Connect to signaling server
      this.socket = io('/webrtc', {
        auth: { token },
        transports: ['websocket']
      });

      this.setupSocketListeners();
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        this.socket!.on('connect', () => resolve());
        this.socket!.on('connect_error', (error) => reject(error));
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
    } catch (error) {
      throw new Error(`Failed to initialize WebRTC service: ${error}`);
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Handle incoming call offers
    this.socket.on('call-offer', (data: CallOffer) => {
      this.handleIncomingCall(data);
    });

    // Handle call answers
    this.socket.on('call-answer', (data: CallAnswer) => {
      this.handleCallAnswer(data);
    });

    // Handle ICE candidates
    this.socket.on('ice-candidate', (data: CallCandidate) => {
      this.handleIceCandidate(data);
    });

    // Handle call termination
    this.socket.on('call-ended', (data: { callId: string; reason: string }) => {
      this.handleCallEnded(data.callId, data.reason);
    });

    // Handle errors
    this.socket.on('error', (error: string) => {
      this.callbacks.onError(error);
    });
  }

  async initiateCall(
    targetUserId: string, 
    options: { audio: boolean; video: boolean }
  ): Promise<string> {
    if (!this.socket || !this.userId) {
      throw new Error('WebRTC service not initialized');
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Get user media
      const constraints: MediaStreamConstraints = {
        audio: options.audio,
        video: options.video
      };
      
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create peer connection
      const peer = new SimplePeer({
        initiator: true,
        trickle: true,
        config: this.peerConfig,
        stream: localStream
      });

      // Create call session
      const session: CallSession = {
        callId,
        peer,
        localStream,
        remoteStream: null,
        state: CallState.CALLING,
        isInitiator: true,
        remoteUserId: targetUserId,
        metadata: {
          audio: options.audio,
          video: options.video,
          startTime: new Date()
        }
      };

      this.activeCalls.set(callId, session);
      this.setupPeerListeners(session);

      // Send call offer when peer generates signal
      peer.on('signal', (signal) => {
        const offer: CallOffer = {
          callId,
          from: this.userId!,
          to: targetUserId,
          signal,
          metadata: {
            audio: options.audio,
            video: options.video
          }
        };
        
        this.socket!.emit('call-offer', offer);
      });

      this.callbacks.onCallStateChange(callId, CallState.CALLING);
      return callId;
      
    } catch (error) {
      this.callbacks.onError(`Failed to initiate call: ${error}`);
      throw error;
    }
  }

  async answerCall(callId: string): Promise<void> {
    const session = this.activeCalls.get(callId);
    if (!session) {
      throw new Error('Call session not found');
    }

    try {
      // Get user media
      const constraints: MediaStreamConstraints = {
        audio: session.metadata.audio,
        video: session.metadata.video
      };
      
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      session.localStream = localStream;
      
      // Add stream to peer
      session.peer.addStream(localStream);
      
      // Update call state
      session.state = CallState.CONNECTED;
      this.callbacks.onCallStateChange(callId, CallState.CONNECTED);
      
    } catch (error) {
      this.callbacks.onError(`Failed to answer call: ${error}`);
      this.endCall(callId, 'media_error');
      throw error;
    }
  }

  rejectCall(callId: string): void {
    const session = this.activeCalls.get(callId);
    if (!session) return;

    this.socket?.emit('call-ended', { callId, reason: 'rejected' });
    this.cleanup(callId);
  }

  endCall(callId: string, reason: string = 'user_ended'): void {
    const session = this.activeCalls.get(callId);
    if (!session) return;

    this.socket?.emit('call-ended', { callId, reason });
    this.cleanup(callId);
    this.callbacks.onCallEnded(callId, reason);
  }

  muteAudio(callId: string, mute: boolean): void {
    const session = this.activeCalls.get(callId);
    if (!session?.localStream) return;

    session.localStream.getAudioTracks().forEach(track => {
      track.enabled = !mute;
    });
  }

  muteVideo(callId: string, mute: boolean): void {
    const session = this.activeCalls.get(callId);
    if (!session?.localStream) return;

    session.localStream.getVideoTracks().forEach(track => {
      track.enabled = !mute;
    });
  }

  holdCall(callId: string, hold: boolean): void {
    const session = this.activeCalls.get(callId);
    if (!session) return;

    // Pause/resume all tracks
    if (session.localStream) {
      session.localStream.getTracks().forEach(track => {
        track.enabled = !hold;
      });
    }

    // Notify peer about hold status
    this.socket?.emit('call-hold', { callId, hold });
  }

  private handleIncomingCall(offer: CallOffer): void {
    const { callId, from, signal, metadata } = offer;
    
    try {
      // Create peer connection for incoming call
      const peer = new SimplePeer({
        initiator: false,
        trickle: true,
        config: this.peerConfig
      });

      const session: CallSession = {
        callId,
        peer,
        localStream: null,
        remoteStream: null,
        state: CallState.RINGING,
        isInitiator: false,
        remoteUserId: from,
        metadata: {
          audio: metadata?.audio || true,
          video: metadata?.video || false
        }
      };

      this.activeCalls.set(callId, session);
      this.setupPeerListeners(session);

      // Signal the peer
      peer.signal(signal);

      // Send answer when peer generates signal
      peer.on('signal', (answerSignal) => {
        const answer: CallAnswer = {
          callId,
          signal: answerSignal
        };
        this.socket!.emit('call-answer', answer);
      });

      this.callbacks.onIncomingCall(offer);
      this.callbacks.onCallStateChange(callId, CallState.RINGING);
      
    } catch (error) {
      this.callbacks.onError(`Failed to handle incoming call: ${error}`);
    }
  }

  private handleCallAnswer(data: CallAnswer): void {
    const session = this.activeCalls.get(data.callId);
    if (!session) return;

    session.peer.signal(data.signal);
    session.state = CallState.CONNECTED;
    this.callbacks.onCallStateChange(data.callId, CallState.CONNECTED);
  }

  private handleIceCandidate(data: CallCandidate): void {
    const session = this.activeCalls.get(data.callId);
    if (!session) return;

    // Handle ICE candidate
    session.peer.signal(data.candidate);
  }

  private handleCallEnded(callId: string, reason: string): void {
    this.cleanup(callId);
    this.callbacks.onCallEnded(callId, reason);
  }

  private setupPeerListeners(session: CallSession): void {
    const { peer, callId } = session;

    peer.on('stream', (remoteStream: MediaStream) => {
      session.remoteStream = remoteStream;
      this.callbacks.onRemoteStream(callId, remoteStream);
    });

    peer.on('connect', () => {
      session.state = CallState.CONNECTED;
      this.callbacks.onCallStateChange(callId, CallState.CONNECTED);
    });

    peer.on('error', (error) => {
      session.state = CallState.FAILED;
      this.callbacks.onCallStateChange(callId, CallState.FAILED);
      this.callbacks.onError(`Peer error: ${error}`);
      this.cleanup(callId);
    });

    peer.on('close', () => {
      session.state = CallState.ENDED;
      this.callbacks.onCallStateChange(callId, CallState.ENDED);
      this.cleanup(callId);
    });
  }

  private cleanup(callId: string): void {
    const session = this.activeCalls.get(callId);
    if (!session) return;

    // Stop local stream
    if (session.localStream) {
      session.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (session.peer) {
      session.peer.destroy();
    }

    // Remove session
    this.activeCalls.delete(callId);
  }

  getActiveCall(): CallSession | null {
    const sessions = Array.from(this.activeCalls.values());
    return sessions.find(s => s.state === CallState.CONNECTED || s.state === CallState.RINGING) || null;
  }

  getCallSession(callId: string): CallSession | null {
    return this.activeCalls.get(callId) || null;
  }

  disconnect(): void {
    // End all active calls
    this.activeCalls.forEach((_, callId) => {
      this.endCall(callId, 'service_disconnected');
    });

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}