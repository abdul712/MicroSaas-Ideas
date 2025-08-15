'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import SimplePeer from 'simple-peer'

export interface CallState {
  isConnected: boolean
  currentCall: {
    id: string
    peer: SimplePeer.Instance | null
    isInitiator: boolean
    remoteNumber: string
    status: 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed'
    startTime?: Date
    duration: number
  } | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isOnHold: boolean
  isVideoEnabled: boolean
}

export interface CallMetrics {
  latency: number
  jitter: number
  packetLoss: number
  audioLevel: number
}

export function useCall() {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    currentCall: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isOnHold: false,
    isVideoEnabled: false
  })

  const [callMetrics, setCallMetrics] = useState<CallMetrics>({
    latency: 0,
    jitter: 0,
    packetLoss: 0,
    audioLevel: 0
  })

  const socketRef = useRef<Socket | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize WebRTC and Socket.io connection
  const initializeCall = useCallback(async () => {
    try {
      // Initialize socket connection
      socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
      
      socketRef.current.on('connect', () => {
        setCallState(prev => ({ ...prev, isConnected: true }))
      })

      socketRef.current.on('disconnect', () => {
        setCallState(prev => ({ ...prev, isConnected: false }))
      })

      // Handle incoming call signals
      socketRef.current.on('call-signal', handleCallSignal)
      socketRef.current.on('call-ended', handleCallEnded)
      socketRef.current.on('call-declined', handleCallDeclined)

    } catch (error) {
      console.error('Failed to initialize call system:', error)
    }
  }, [])

  // Get user media (audio/video)
  const getUserMedia = useCallback(async (video = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video
      })

      setCallState(prev => ({ ...prev, localStream: stream, isVideoEnabled: video }))
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      return stream
    } catch (error) {
      console.error('Failed to get user media:', error)
      throw error
    }
  }, [])

  // Start a call
  const startCall = useCallback(async (remoteNumber: string, video = false) => {
    try {
      const stream = await getUserMedia(video)
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream
      })

      peer.on('signal', (signal) => {
        socketRef.current?.emit('call-user', {
          callId,
          remoteNumber,
          signal,
          video
        })
      })

      peer.on('stream', (remoteStream) => {
        setCallState(prev => ({
          ...prev,
          remoteStream
        }))
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
      })

      peer.on('connect', () => {
        setCallState(prev => ({
          ...prev,
          currentCall: prev.currentCall ? {
            ...prev.currentCall,
            status: 'connected',
            startTime: new Date()
          } : null
        }))
        startDurationTimer()
      })

      peer.on('error', (error) => {
        console.error('Peer error:', error)
        setCallState(prev => ({
          ...prev,
          currentCall: prev.currentCall ? {
            ...prev.currentCall,
            status: 'failed'
          } : null
        }))
      })

      setCallState(prev => ({
        ...prev,
        currentCall: {
          id: callId,
          peer,
          isInitiator: true,
          remoteNumber,
          status: 'ringing',
          duration: 0
        }
      }))

    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }, [getUserMedia])

  // Answer an incoming call
  const answerCall = useCallback(async (callData: any) => {
    try {
      const stream = await getUserMedia(callData.video)

      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream
      })

      peer.on('signal', (signal) => {
        socketRef.current?.emit('answer-call', {
          callId: callData.callId,
          signal
        })
      })

      peer.on('stream', (remoteStream) => {
        setCallState(prev => ({
          ...prev,
          remoteStream
        }))
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
      })

      peer.on('connect', () => {
        setCallState(prev => ({
          ...prev,
          currentCall: prev.currentCall ? {
            ...prev.currentCall,
            status: 'connected',
            startTime: new Date()
          } : null
        }))
        startDurationTimer()
      })

      peer.signal(callData.signal)

      setCallState(prev => ({
        ...prev,
        currentCall: {
          id: callData.callId,
          peer,
          isInitiator: false,
          remoteNumber: callData.fromNumber,
          status: 'connecting',
          duration: 0
        }
      }))

    } catch (error) {
      console.error('Failed to answer call:', error)
    }
  }, [getUserMedia])

  // End the current call
  const endCall = useCallback(() => {
    if (callState.currentCall?.peer) {
      callState.currentCall.peer.destroy()
    }

    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop())
    }

    socketRef.current?.emit('end-call', {
      callId: callState.currentCall?.id
    })

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }

    setCallState(prev => ({
      ...prev,
      currentCall: prev.currentCall ? {
        ...prev.currentCall,
        status: 'ended'
      } : null,
      localStream: null,
      remoteStream: null
    }))

    // Clear call state after a short delay
    setTimeout(() => {
      setCallState(prev => ({
        ...prev,
        currentCall: null
      }))
    }, 2000)
  }, [callState.currentCall, callState.localStream])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = callState.isMuted
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }))
      }
    }
  }, [callState.localStream, callState.isMuted])

  // Toggle hold
  const toggleHold = useCallback(() => {
    if (callState.currentCall?.peer) {
      // Implement hold logic here
      setCallState(prev => ({ ...prev, isOnHold: !prev.isOnHold }))
    }
  }, [callState.currentCall])

  // Handle incoming call signals
  const handleCallSignal = useCallback((data: any) => {
    if (callState.currentCall && data.callId === callState.currentCall.id) {
      callState.currentCall.peer?.signal(data.signal)
    }
  }, [callState.currentCall])

  // Handle call ended
  const handleCallEnded = useCallback(() => {
    endCall()
  }, [endCall])

  // Handle call declined
  const handleCallDeclined = useCallback(() => {
    setCallState(prev => ({
      ...prev,
      currentCall: prev.currentCall ? {
        ...prev.currentCall,
        status: 'ended'
      } : null
    }))
  }, [])

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    durationIntervalRef.current = setInterval(() => {
      setCallState(prev => ({
        ...prev,
        currentCall: prev.currentCall ? {
          ...prev.currentCall,
          duration: prev.currentCall.duration + 1
        } : null
      }))
    }, 1000)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      if (callState.localStream) {
        callState.localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    callState,
    callMetrics,
    localVideoRef,
    remoteVideoRef,
    initializeCall,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleHold
  }
}