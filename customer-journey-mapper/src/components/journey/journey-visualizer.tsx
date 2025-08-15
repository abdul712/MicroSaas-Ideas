'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react'

export interface JourneyNode {
  id: string
  name: string
  type: 'touchpoint' | 'stage' | 'decision'
  x?: number
  y?: number
  visitors?: number
  conversions?: number
  dropoffs?: number
  metadata?: Record<string, any>
}

export interface JourneyLink {
  source: string
  target: string
  value: number
  label?: string
  type?: 'conversion' | 'dropout' | 'branch'
}

export interface JourneyData {
  nodes: JourneyNode[]
  links: JourneyLink[]
}

interface JourneyVisualizerProps {
  data: JourneyData
  width?: number
  height?: number
  onNodeClick?: (node: JourneyNode) => void
  onLinkClick?: (link: JourneyLink) => void
  className?: string
}

export function JourneyVisualizer({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onLinkClick,
  className
}: JourneyVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
    const g = svg.append('g')

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoomLevel(event.transform.k)
      })

    svg.call(zoom)

    // Define arrow markers
    svg.append('defs').selectAll('marker')
      .data(['conversion', 'dropout', 'branch'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => {
        switch (d) {
          case 'conversion': return '#10b981'
          case 'dropout': return '#ef4444'
          case 'branch': return '#6b7280'
          default: return '#6b7280'
        }
      })

    // Create simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance(150)
        .strength(0.1))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60))

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('class', 'journey-link')
      .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value / 10)))
      .attr('stroke', d => {
        switch (d.type) {
          case 'conversion': return '#10b981'
          case 'dropout': return '#ef4444'
          case 'branch': return '#6b7280'
          default: return '#64748b'
        }
      })
      .attr('stroke-opacity', 0.7)
      .attr('marker-end', d => `url(#arrow-${d.type || 'branch'})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation()
        onLinkClick?.(d)
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke-opacity', 1)
        
        // Show tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'chart-tooltip')
          .style('position', 'absolute')
          .style('pointer-events', 'none')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="font-medium">${d.label || 'Transition'}</div>
            <div class="text-sm text-gray-600">${d.value.toLocaleString()} users</div>
          `)
        
        setTimeout(() => tooltip.remove(), 3000)
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-opacity', 0.7)
      })

    // Create link labels
    const linkLabel = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(data.links.filter(d => d.value > 100)) // Only show labels for significant flows
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .attr('dy', -5)
      .text(d => d.value.toLocaleString())

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'journey-node')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    // Add node circles
    node.append('circle')
      .attr('r', d => Math.max(20, Math.sqrt((d.visitors || 0) / 50)))
      .attr('fill', d => {
        switch (d.type) {
          case 'touchpoint': return '#3b82f6'
          case 'stage': return '#10b981'
          case 'decision': return '#f59e0b'
          default: return '#6b7280'
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedNode(d)
        onNodeClick?.(d)
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke-width', 4)
        
        // Show tooltip
        const conversionRate = d.conversions && d.visitors 
          ? ((d.conversions / d.visitors) * 100).toFixed(1) + '%'
          : 'N/A'
        
        const tooltip = d3.select('body').append('div')
          .attr('class', 'chart-tooltip')
          .style('position', 'absolute')
          .style('pointer-events', 'none')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="font-medium">${d.name}</div>
            <div class="text-sm text-gray-600">
              <div>Visitors: ${(d.visitors || 0).toLocaleString()}</div>
              <div>Conversions: ${(d.conversions || 0).toLocaleString()}</div>
              <div>Rate: ${conversionRate}</div>
            </div>
          `)
        
        setTimeout(() => tooltip.remove(), 3000)
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-width', 2)
      })

    // Add node labels
    node.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text(d => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name)

    // Add conversion rate labels
    node.append('text')
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .attr('pointer-events', 'none')
      .text(d => {
        if (d.conversions && d.visitors) {
          return `${((d.conversions / d.visitors) * 100).toFixed(1)}%`
        }
        return ''
      })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [data, width, height, onNodeClick, onLinkClick])

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      (svg.property('__zoom') as any).scaleBy as any,
      1.5
    )
  }

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      (svg.property('__zoom') as any).scaleBy as any,
      1 / 1.5
    )
  }

  const handleReset = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      (svg.property('__zoom') as any).transform as any,
      d3.zoomIdentity
    )
  }

  const handleExport = () => {
    const svg = svgRef.current
    if (!svg) return

    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
    
    const a = document.createElement('a')
    a.href = url
    a.download = 'customer-journey.svg'
    a.click()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Journey Visualization</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
            <div className="text-sm text-gray-600">
              Zoom: {(zoomLevel * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="border rounded-lg bg-gray-50"
          />
          
          {selectedNode && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
              <h4 className="font-medium mb-2">{selectedNode.name}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Type: {selectedNode.type}</div>
                <div>Visitors: {(selectedNode.visitors || 0).toLocaleString()}</div>
                <div>Conversions: {(selectedNode.conversions || 0).toLocaleString()}</div>
                {selectedNode.conversions && selectedNode.visitors && (
                  <div>Rate: {((selectedNode.conversions / selectedNode.visitors) * 100).toFixed(1)}%</div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => setSelectedNode(null)}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}