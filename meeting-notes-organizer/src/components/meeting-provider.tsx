'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

interface Meeting {
  id: string
  title: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  startTime: string
  endTime?: string
  participants: string[]
  isRecording: boolean
}

interface MeetingState {
  currentMeeting: Meeting | null
  meetings: Meeting[]
  socket: Socket | null
  isConnected: boolean
  transcription: {
    isActive: boolean
    text: string
    speaker?: string
    confidence?: number
  }
}

type MeetingAction =
  | { type: 'SET_CURRENT_MEETING'; payload: Meeting }
  | { type: 'UPDATE_MEETINGS'; payload: Meeting[] }
  | { type: 'SET_SOCKET'; payload: Socket }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'UPDATE_TRANSCRIPTION'; payload: any }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }

const initialState: MeetingState = {
  currentMeeting: null,
  meetings: [],
  socket: null,
  isConnected: false,
  transcription: {
    isActive: false,
    text: '',
  },
}

function meetingReducer(state: MeetingState, action: MeetingAction): MeetingState {
  switch (action.type) {
    case 'SET_CURRENT_MEETING':
      return { ...state, currentMeeting: action.payload }
    case 'UPDATE_MEETINGS':
      return { ...state, meetings: action.payload }
    case 'SET_SOCKET':
      return { ...state, socket: action.payload }
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload }
    case 'UPDATE_TRANSCRIPTION':
      return { ...state, transcription: { ...state.transcription, ...action.payload } }
    case 'START_RECORDING':
      return {
        ...state,
        currentMeeting: state.currentMeeting
          ? { ...state.currentMeeting, isRecording: true }
          : null,
        transcription: { ...state.transcription, isActive: true },
      }
    case 'STOP_RECORDING':
      return {
        ...state,
        currentMeeting: state.currentMeeting
          ? { ...state.currentMeeting, isRecording: false }
          : null,
        transcription: { ...state.transcription, isActive: false },
      }
    default:
      return state
  }
}

const MeetingContext = createContext<{
  state: MeetingState
  dispatch: React.Dispatch<MeetingAction>
  startMeeting: (meetingId: string) => void
  endMeeting: () => void
  startRecording: () => void
  stopRecording: () => void
}>({
  state: initialState,
  dispatch: () => null,
  startMeeting: () => null,
  endMeeting: () => null,
  startRecording: () => null,
  stopRecording: () => null,
})

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(meetingReducer, initialState)

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001')
    
    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true })
    })

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false })
    })

    socket.on('transcription', (data) => {
      dispatch({ type: 'UPDATE_TRANSCRIPTION', payload: data })
    })

    dispatch({ type: 'SET_SOCKET', payload: socket })

    return () => {
      socket.disconnect()
    }
  }, [])

  const startMeeting = (meetingId: string) => {
    // Implementation for starting a meeting
    if (state.socket) {
      state.socket.emit('start-meeting', { meetingId })
    }
  }

  const endMeeting = () => {
    // Implementation for ending a meeting
    if (state.socket && state.currentMeeting) {
      state.socket.emit('end-meeting', { meetingId: state.currentMeeting.id })
      dispatch({ type: 'SET_CURRENT_MEETING', payload: null })
    }
  }

  const startRecording = () => {
    dispatch({ type: 'START_RECORDING' })
    if (state.socket && state.currentMeeting) {
      state.socket.emit('start-recording', { meetingId: state.currentMeeting.id })
    }
  }

  const stopRecording = () => {
    dispatch({ type: 'STOP_RECORDING' })
    if (state.socket && state.currentMeeting) {
      state.socket.emit('stop-recording', { meetingId: state.currentMeeting.id })
    }
  }

  return (
    <MeetingContext.Provider
      value={{
        state,
        dispatch,
        startMeeting,
        endMeeting,
        startRecording,
        stopRecording,
      }}
    >
      {children}
    </MeetingContext.Provider>
  )
}

export const useMeeting = () => {
  const context = useContext(MeetingContext)
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider')
  }
  return context
}