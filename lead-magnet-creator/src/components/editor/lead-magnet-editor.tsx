'use client'

import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Save, 
  Download, 
  Undo, 
  Redo,
  Palette,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react'

interface LeadMagnetEditorProps {
  initialData?: any
  onSave?: (data: any) => void
  onExport?: (format: 'pdf' | 'png' | 'jpg') => void
}

export function LeadMagnetEditor({ initialData, onSave, onExport }: LeadMagnetEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null)
  const [canvasHistory, setCanvasHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
    })

    setCanvas(fabricCanvas)

    // Event listeners
    fabricCanvas.on('selection:created', (e) => {
      setActiveObject(e.selected?.[0] || null)
    })

    fabricCanvas.on('selection:updated', (e) => {
      setActiveObject(e.selected?.[0] || null)
    })

    fabricCanvas.on('selection:cleared', () => {
      setActiveObject(null)
    })

    fabricCanvas.on('object:modified', () => {
      saveToHistory(fabricCanvas)
    })

    // Load initial data if provided
    if (initialData) {
      fabricCanvas.loadFromJSON(initialData, () => {
        fabricCanvas.renderAll()
        saveToHistory(fabricCanvas)
      })
    } else {
      // Add default elements
      addDefaultElements(fabricCanvas)
      saveToHistory(fabricCanvas)
    }

    return () => {
      fabricCanvas.dispose()
    }
  }, [])

  const saveToHistory = (canvas: fabric.Canvas) => {
    const state = JSON.stringify(canvas.toJSON())
    const newHistory = canvasHistory.slice(0, historyIndex + 1)
    newHistory.push(state)
    setCanvasHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const addDefaultElements = (canvas: fabric.Canvas) => {
    // Add title
    const title = new fabric.Text('Your Lead Magnet Title', {
      left: 50,
      top: 50,
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#333333'
    })
    canvas.add(title)

    // Add subtitle
    const subtitle = new fabric.Text('Subtitle or description here', {
      left: 50,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 18,
      fill: '#666666'
    })
    canvas.add(subtitle)

    // Add a shape
    const rect = new fabric.Rect({
      left: 50,
      top: 150,
      width: 500,
      height: 3,
      fill: '#007bff'
    })
    canvas.add(rect)

    canvas.renderAll()
  }

  const addText = () => {
    if (!canvas) return

    const text = new fabric.Text('New Text', {
      left: 100,
      top: 200,
      fontFamily: 'Arial',
      fontSize: 18,
      fill: '#333333'
    })
    
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const addRectangle = () => {
    if (!canvas) return

    const rect = new fabric.Rect({
      left: 100,
      top: 200,
      width: 200,
      height: 100,
      fill: '#007bff',
      stroke: '#0056b3',
      strokeWidth: 2
    })
    
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const addCircle = () => {
    if (!canvas) return

    const circle = new fabric.Circle({
      left: 100,
      top: 200,
      radius: 50,
      fill: '#28a745',
      stroke: '#1e7e34',
      strokeWidth: 2
    })
    
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !event.target.files?.[0]) return

    const file = event.target.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const imgElement = new Image()
      imgElement.onload = () => {
        const imgInstance = new fabric.Image(imgElement, {
          left: 100,
          top: 200,
          scaleX: 0.5,
          scaleY: 0.5
        })
        
        canvas.add(imgInstance)
        canvas.setActiveObject(imgInstance)
        canvas.renderAll()
        saveToHistory(canvas)
      }
      imgElement.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  }

  const updateTextProperty = (property: string, value: any) => {
    if (!canvas || !activeObject || activeObject.type !== 'text') return

    const textObject = activeObject as fabric.Text
    textObject.set(property, value)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const undo = () => {
    if (historyIndex > 0 && canvas) {
      const newIndex = historyIndex - 1
      canvas.loadFromJSON(canvasHistory[newIndex], () => {
        canvas.renderAll()
        setHistoryIndex(newIndex)
      })
    }
  }

  const redo = () => {
    if (historyIndex < canvasHistory.length - 1 && canvas) {
      const newIndex = historyIndex + 1
      canvas.loadFromJSON(canvasHistory[newIndex], () => {
        canvas.renderAll()
        setHistoryIndex(newIndex)
      })
    }
  }

  const handleSave = () => {
    if (!canvas) return
    
    const data = canvas.toJSON()
    onSave?.(data)
  }

  const handleExport = (format: 'pdf' | 'png' | 'jpg') => {
    if (!canvas) return
    
    if (format === 'png' || format === 'jpg') {
      const dataURL = canvas.toDataURL({
        format: format === 'jpg' ? 'jpeg' : 'png',
        quality: 1,
        multiplier: 2
      })
      
      // Create download link
      const link = document.createElement('a')
      link.download = `lead-magnet.${format}`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      onExport?.(format)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Elements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={addText}>
                <Type className="mr-2 h-4 w-4" />
                Add Text
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={addRectangle}>
                <Square className="mr-2 h-4 w-4" />
                Rectangle
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={addCircle}>
                <Circle className="mr-2 h-4 w-4" />
                Circle
              </Button>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Add Image
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Text Properties */}
          {activeObject?.type === 'text' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Text Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Font Size</label>
                  <Input
                    type="number"
                    value={(activeObject as fabric.Text).fontSize || 18}
                    onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
                    min="8"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Color</label>
                  <Input
                    type="color"
                    value={(activeObject as fabric.Text).fill as string || '#000000'}
                    onChange={(e) => updateTextProperty('fill', e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateTextProperty('fontWeight', 'bold')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateTextProperty('fontStyle', 'italic')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateTextProperty('underline', true)}
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateTextProperty('textAlign', 'left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateTextProperty('textAlign', 'center')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateTextProperty('textAlign', 'right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= canvasHistory.length - 1}>
                <Redo className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button onClick={() => handleExport('png')}>
                <Download className="mr-2 h-4 w-4" />
                Export PNG
              </Button>
              <Button onClick={() => handleExport('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-900">
          <div className="bg-white shadow-lg">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  )
}