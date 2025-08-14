'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react'

export interface JourneyNode {
  id: string
  name: string
  type: 'touchpoint' | 'decision' | 'outcome'
  stage: string
  channel: string
  x?: number
  y?: number
  metrics: {
    users: number
    conversions: number
    dropOff: number
    averageTime: number
  }
  properties?: Record<string, any>
}

export interface JourneyLink {
  source: string
  target: string
  value: number // Number of users that took this path
  conversionRate: number
  averageTime: number
  properties?: Record<string, any>
}

export interface JourneyData {
  nodes: JourneyNode[]
  links: JourneyLink[]
  metadata: {
    totalUsers: number
    conversionRate: number
    averageJourneyTime: number
    dateRange: {
      start: Date
      end: Date
    }
  }
}

interface JourneyVisualizationProps {
  data: JourneyData
  width?: number
  height?: number
  onNodeClick?: (node: JourneyNode) => void
  onLinkClick?: (link: JourneyLink) => void
  className?: string
}

export function JourneyVisualization({
  data,
  width = 1200,
  height = 800,
  onNodeClick,
  onLinkClick,
  className,
}: JourneyVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
    const container = d3.select(containerRef.current)

    // Set up dimensions
    const margin = { top: 50, right: 50, bottom: 50, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create main group for zoom and pan
    const g = svg
      .append('g')
      .attr('class', 'journey-container')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Set up zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoomLevel(event.transform.k)
      })

    svg.call(zoom)

    // Create arrow marker for links
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('class', 'fill-gray-400')

    // Process data for D3
    const nodes = data.nodes.map((d) => ({ ...d }))
    const links = data.links.map((d) => ({
      ...d,
      source: nodes.find((n) => n.id === d.source)!,
      target: nodes.find((n) => n.id === d.target)!,
    }))

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force('collision', d3.forceCollide().radius(60))

    // Create gradient definitions for nodes
    const defs = svg.select('defs')
    const gradients = ['touchpoint', 'decision', 'outcome']
    
    gradients.forEach((type) => {
      const gradient = defs
        .append('radialGradient')
        .attr('id', `gradient-${type}`)
        .attr('cx', '30%')
        .attr('cy', '30%')

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', type === 'touchpoint' ? '#3b82f6' : 
                           type === 'decision' ? '#f59e0b' : '#10b981')
        .attr('stop-opacity', 0.8)

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', type === 'touchpoint' ? '#1e40af' : 
                           type === 'decision' ? '#d97706' : '#059669')
        .attr('stop-opacity', 1)
    })

    // Create links
    const linkGroup = g.append('g').attr('class', 'links')
    
    const link = linkGroup
      .selectAll('.journey-link')
      .data(links)
      .enter()
      .append('g')
      .attr('class', 'journey-link')

    // Link paths
    link
      .append('path')
      .attr('class', 'link-path')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', (d: any) => Math.max(2, Math.sqrt(d.value / 10)))
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)')
      .style('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation()
        onLinkClick?.(d as any)
      })
      .on('mouseover', function(event, d: any) {
        d3.select(this).style('opacity', 1).attr('stroke', '#3b82f6')
        showTooltip(event, `${d.value} users (${(d.conversionRate * 100).toFixed(1)}%)`)
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.7).attr('stroke', '#94a3b8')
        hideTooltip()
      })

    // Link labels
    link
      .append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text((d: any) => d.value > 10 ? d.value : '')

    // Create nodes
    const nodeGroup = g.append('g').attr('class', 'nodes')
    
    const node = nodeGroup
      .selectAll('.journey-node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'journey-node')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )

    // Node circles
    node
      .append('circle')
      .attr('r', 25)
      .attr('fill', (d: any) => `url(#gradient-${d.type})`)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeClick?.(d as any)
      })
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('r', 28)
        showTooltip(event, `${d.name}\n${d.metrics.users} users\n${(d.metrics.conversions / d.metrics.users * 100).toFixed(1)}% conversion`)
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 25)
        hideTooltip()
      })

    // Node labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .text((d: any) => d.name.length > 8 ? d.name.substring(0, 6) + '...' : d.name)

    // Node metrics
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '45px')
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .text((d: any) => `${d.metrics.users} users`)

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'journey-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000)

    function showTooltip(event: any, text: string) {
      tooltip
        .style('opacity', 1)
        .html(text.replace(/\n/g, '<br>'))
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    }

    function showTooltip(event: any, text: string) {
      tooltip
        .style('opacity', 1)
        .html(text.replace(/\n/g, '<br>'))
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    }

    function hideTooltip() {
      tooltip.style('opacity', 0)
    }

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link.select('.link-path').attr('d', (d: any) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
      })

      link.select('.link-label')
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // Cleanup function
    return () => {
      tooltip.remove()
    }
  }, [data, width, height, onNodeClick, onLinkClick])

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1.5
    )
  }

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1 / 1.5
    )
  }

  const handleReset = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    )
  }

  const handleExport = () => {
    const svg = svgRef.current
    if (!svg) return

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = 'customer-journey.svg'
    link.href = url
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button variant="outline" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleExport}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={toggleFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-2">
        <div className="text-sm font-medium">Journey Overview</div>
        <div className="text-xs text-muted-foreground">
          {data.metadata.totalUsers.toLocaleString()} total users • {(data.metadata.conversionRate * 100).toFixed(1)}% conversion
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border rounded-lg journey-grid"
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3">
        <div className="text-sm font-medium mb-2">Legend</div>
        <div className="flex space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Touchpoint</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Decision</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Outcome</span>
          </div>
        </div>
      </div>
    </Card>
  )
}