'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWebRTC } from '@/hooks/use-webrtc';
import { CallState } from '@/services/webrtc-service';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Pause,
  Play,
  Volume2
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

interface CallInterfaceProps {
  className?: string;
}

export function CallInterface({ className }: CallInterfaceProps) {
  const {
    activeCall,
    incomingCall,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    muteAudio,
    muteVideo,
    holdCall,
    localVideoRef,
    remoteVideoRef,
    error
  } = useWebRTC();

  const [callDuration, setCallDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  // Update call duration
  useEffect(() => {
    if (activeCall?.state === CallState.CONNECTED && activeCall.metadata.startTime) {
      const interval = setInterval(() => {
        const startTime = activeCall.metadata.startTime!;
        const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeCall?.state, activeCall?.metadata.startTime]);

  const handleInitiateCall = async (audio: boolean, video: boolean) => {
    if (!targetUserId.trim()) return;
    await initiateCall(targetUserId, { audio, video });
  };

  const handleMuteAudio = () => {
    muteAudio(!isAudioMuted);
    setIsAudioMuted(!isAudioMuted);
  };

  const handleMuteVideo = () => {
    muteVideo(!isVideoMuted);
    setIsVideoMuted(!isVideoMuted);
  };

  const handleHold = () => {
    holdCall(!isOnHold);
    setIsOnHold(!isOnHold);
  };

  // Show incoming call overlay
  if (incomingCall) {
    return (
      <div className="call-interface">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="space-y-6">
              <div>
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
                  <Phone className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-semibold">Incoming Call</h2>
                <p className="text-muted-foreground">
                  From: {incomingCall.from}
                </p>
                {incomingCall.metadata?.displayName && (
                  <p className="text-lg">{incomingCall.metadata.displayName}</p>
                )}
              </div>
              
              <div className="flex justify-center gap-8">
                <Button
                  variant="call-danger"
                  size="call-icon"
                  onClick={rejectCall}
                  className="pulse-ring"
                >
                  <PhoneOff className="w-8 h-8" />
                </Button>
                
                <Button
                  variant="call"
                  size="call-icon"
                  onClick={answerCall}
                  className="pulse-ring"
                >
                  <Phone className="w-8 h-8" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show active call interface
  if (activeCall) {
    const isVideoCall = activeCall.metadata.video;
    const isConnected = activeCall.state === CallState.CONNECTED;
    
    return (
      <div className="call-interface">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-4xl">
            {isVideoCall ? (
              <div className="video-container">
                <video
                  ref={remoteVideoRef}
                  className="video-remote"
                  autoPlay
                  playsInline
                  muted={false}
                />
                
                <video
                  ref={localVideoRef}
                  className="video-local"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <Phone className="w-16 h-16" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">
                  {activeCall.remoteUserId}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {activeCall.state === CallState.RINGING && 'Ringing...'}
                  {activeCall.state === CallState.CALLING && 'Calling...'}
                  {activeCall.state === CallState.CONNECTED && `Connected • ${formatDuration(callDuration)}`}
                </p>
              </div>
            )}
            
            {/* Call Controls */}
            <div className="call-controls p-6 border-t">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isAudioMuted ? "call-danger" : "call-secondary"}
                  size="call-icon"
                  onClick={handleMuteAudio}
                  disabled={!isConnected}
                >
                  {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                
                {isVideoCall && (
                  <Button
                    variant={isVideoMuted ? "call-danger" : "call-secondary"}
                    size="call-icon"
                    onClick={handleMuteVideo}
                    disabled={!isConnected}
                  >
                    {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                  </Button>
                )}
                
                <Button
                  variant={isOnHold ? "call" : "call-secondary"}
                  size="call-icon"
                  onClick={handleHold}
                  disabled={!isConnected}
                >
                  {isOnHold ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                </Button>
                
                <Button
                  variant="call-danger"
                  size="call-icon"
                  onClick={endCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show call initiation interface
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Make a Call</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Call to (User ID)
              </label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex gap-4">
              <Button
                variant="call"
                onClick={() => handleInitiateCall(true, false)}
                disabled={!targetUserId.trim()}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                Voice Call
              </Button>
              
              <Button
                variant="call"
                onClick={() => handleInitiateCall(true, true)}
                disabled={!targetUserId.trim()}
                className="flex-1"
              >
                <Video className="w-4 h-4 mr-2" />
                Video Call
              </Button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}