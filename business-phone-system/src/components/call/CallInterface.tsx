'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Pause,
  Play,
  Settings
} from 'lucide-react'
import { useCall } from '@/hooks/useCall'
import { formatDuration, formatPhoneNumber } from '@/lib/utils'
import { DialPad } from './DialPad'

interface CallInterfaceProps {
  className?: string
}

export function CallInterface({ className }: CallInterfaceProps) {
  const {
    callState,
    localVideoRef,
    remoteVideoRef,
    initializeCall,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleHold
  } = useCall()

  useEffect(() => {
    initializeCall()
  }, [initializeCall])

  const handleStartCall = (number: string) => {
    startCall(number, false) // Audio only for now
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ringing':
        return 'bg-blue-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'connected':
        return 'bg-green-500'
      case 'ended':
        return 'bg-gray-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ringing':
        return 'Ringing...'
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return 'Connected'
      case 'ended':
        return 'Call Ended'
      case 'failed':
        return 'Call Failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${callState.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {callState.isConnected ? 'Connected to Phone System' : 'Disconnected'}
              </span>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Call Interface */}
      {callState.currentCall && (
        <Card className="call-interface">
          <CardContent className="p-6">
            <div className="text-center text-white space-y-4">
              {/* Call Status */}
              <div className="space-y-2">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(callState.currentCall.status)} text-white`}>
                  {getStatusText(callState.currentCall.status)}
                </div>
                <h2 className="text-2xl font-bold">
                  {formatPhoneNumber(callState.currentCall.remoteNumber)}
                </h2>
                {callState.currentCall.status === 'connected' && (
                  <p className="text-lg opacity-80">
                    {formatDuration(callState.currentCall.duration)}
                  </p>
                )}
              </div>

              {/* Video Display */}
              {callState.isVideoEnabled && (
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="remote-video"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="local-video"
                  />
                </div>
              )}

              {/* Call Controls */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={toggleMute}
                >
                  {callState.isMuted ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={toggleHold}
                >
                  {callState.isOnHold ? (
                    <Play className="h-5 w-5" />
                  ) : (
                    <Pause className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  className="w-16 h-16 rounded-full"
                  onClick={endCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  disabled
                >
                  {callState.isVideoEnabled ? (
                    <VideoOff className="h-5 w-5" />
                  ) : (
                    <Video className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dial Pad - Show when no active call */}
      {!callState.currentCall && (
        <DialPad onCall={handleStartCall} />
      )}

      {/* Hidden video elements for audio-only calls */}
      {!callState.isVideoEnabled && (
        <div className="hidden">
          <video ref={localVideoRef} autoPlay playsInline muted />
          <video ref={remoteVideoRef} autoPlay playsInline />
        </div>
      )}
    </div>
  )
}