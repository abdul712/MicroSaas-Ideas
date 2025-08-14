import { useState, useEffect, useCallback, useRef } from 'react';
import { WebRTCService, CallState, CallSession, CallOffer } from '@/services/webrtc-service';
import { useSession } from 'next-auth/react';

interface UseWebRTCReturn {
  // State
  activeCall: CallSession | null;
  incomingCall: CallOffer | null;
  isInitialized: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  initiateCall: (targetUserId: string, options: { audio: boolean; video: boolean }) => Promise<string | null>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  muteAudio: (mute: boolean) => void;
  muteVideo: (mute: boolean) => void;
  holdCall: (hold: boolean) => void;
  
  // Media refs
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  
  // Cleanup
  cleanup: () => void;
}

export function useWebRTC(): UseWebRTCReturn {
  const { data: session } = useSession();
  const [webrtcService, setWebrtcService] = useState<WebRTCService | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallOffer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize WebRTC service
  useEffect(() => {
    if (!session?.user?.id || !session.accessToken) return;

    const initializeService = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        const service = new WebRTCService({
          onIncomingCall: (offer) => {
            setIncomingCall(offer);
          },
          onCallStateChange: (callId, state) => {
            const call = service.getCallSession(callId);
            if (call) {
              setActiveCall({ ...call, state });
              
              if (state === CallState.ENDED || state === CallState.FAILED) {
                setActiveCall(null);
                setIncomingCall(null);
              }
            }
          },
          onRemoteStream: (callId, stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
          },
          onCallEnded: (callId, reason) => {
            setActiveCall(null);
            setIncomingCall(null);
            
            // Clean up video elements
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = null;
            }
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
          },
          onError: (errorMessage) => {
            setError(errorMessage);
          }
        });

        await service.initialize(session.user.id, session.accessToken as string);
        setWebrtcService(service);
        setIsInitialized(true);
        setIsConnecting(false);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize WebRTC');
        setIsConnecting(false);
      }
    };

    initializeService();

    return () => {
      webrtcService?.disconnect();
    };
  }, [session?.user?.id, session?.accessToken]);

  // Update active call when service detects changes
  useEffect(() => {
    if (!webrtcService) return;

    const interval = setInterval(() => {
      const call = webrtcService.getActiveCall();
      if (call !== activeCall) {
        setActiveCall(call);
        
        // Update local video
        if (call?.localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = call.localStream;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [webrtcService, activeCall]);

  const initiateCall = useCallback(async (
    targetUserId: string, 
    options: { audio: boolean; video: boolean }
  ): Promise<string | null> => {
    if (!webrtcService || !isInitialized) {
      setError('WebRTC service not initialized');
      return null;
    }

    try {
      setError(null);
      const callId = await webrtcService.initiateCall(targetUserId, options);
      
      // Get the call session and update state
      const callSession = webrtcService.getCallSession(callId);
      if (callSession) {
        setActiveCall(callSession);
        
        // Set local video
        if (callSession.localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = callSession.localStream;
        }
      }
      
      return callId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate call');
      return null;
    }
  }, [webrtcService, isInitialized]);

  const answerCall = useCallback(async (): Promise<void> => {
    if (!webrtcService || !incomingCall) {
      setError('No incoming call to answer');
      return;
    }

    try {
      setError(null);
      await webrtcService.answerCall(incomingCall.callId);
      
      // Get updated call session
      const callSession = webrtcService.getCallSession(incomingCall.callId);
      if (callSession) {
        setActiveCall(callSession);
        
        // Set local video
        if (callSession.localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = callSession.localStream;
        }
      }
      
      setIncomingCall(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to answer call');
    }
  }, [webrtcService, incomingCall]);

  const rejectCall = useCallback((): void => {
    if (!webrtcService || !incomingCall) return;

    webrtcService.rejectCall(incomingCall.callId);
    setIncomingCall(null);
  }, [webrtcService, incomingCall]);

  const endCall = useCallback((): void => {
    if (!webrtcService || !activeCall) return;

    webrtcService.endCall(activeCall.callId);
    setActiveCall(null);
    setIncomingCall(null);
  }, [webrtcService, activeCall]);

  const muteAudio = useCallback((mute: boolean): void => {
    if (!webrtcService || !activeCall) return;
    webrtcService.muteAudio(activeCall.callId, mute);
  }, [webrtcService, activeCall]);

  const muteVideo = useCallback((mute: boolean): void => {
    if (!webrtcService || !activeCall) return;
    webrtcService.muteVideo(activeCall.callId, mute);
  }, [webrtcService, activeCall]);

  const holdCall = useCallback((hold: boolean): void => {
    if (!webrtcService || !activeCall) return;
    webrtcService.holdCall(activeCall.callId, hold);
  }, [webrtcService, activeCall]);

  const cleanup = useCallback((): void => {
    if (webrtcService) {
      webrtcService.disconnect();
      setWebrtcService(null);
      setIsInitialized(false);
    }
    
    setActiveCall(null);
    setIncomingCall(null);
    setError(null);
    
    // Clean up video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [webrtcService]);

  return {
    activeCall,
    incomingCall,
    isInitialized,
    isConnecting,
    error,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    muteAudio,
    muteVideo,
    holdCall,
    localVideoRef,
    remoteVideoRef,
    cleanup
  };
}