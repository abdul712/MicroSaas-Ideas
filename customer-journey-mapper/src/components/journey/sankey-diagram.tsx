'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatPercentage } from '@/lib/utils'

export interface SankeyNode {
  id: string
  name: string
  stage: string
  value: number
  color?: string
}

export interface SankeyLink {
  source: string
  target: string
  value: number
  color?: string
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

interface SankeyDiagramProps {
  data: SankeyData
  width?: number
  height?: number
  onNodeClick?: (node: SankeyNode) => void
  className?: string
}

export function SankeyDiagram({
  data,
  width = 800,
  height = 400,
  onNodeClick,
  className,
}: SankeyDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
    const margin = { top: 20, right: 20, bottom: 20, left: 20 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Process data for D3 Sankey
    const sankeyData = {
      nodes: data.nodes.map((d, i) => ({
        ...d,
        index: i,
        x0: 0,
        x1: 0,
        y0: 0,
        y1: 0,
      })),
      links: data.links.map((d) => ({
        ...d,
        source: data.nodes.findIndex((n) => n.id === d.source),
        target: data.nodes.findIndex((n) => n.id === d.target),
      })),
    }

    // Create Sankey layout
    const sankey = d3
      .sankey<any, any>()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[0, 0], [innerWidth, innerHeight]])

    // Apply layout
    sankey(sankeyData)

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // Create gradient definitions
    const defs = svg.append('defs')

    sankeyData.links.forEach((link, i) => {
      const gradient = defs
        .append('linearGradient')
        .attr('id', `gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', (link.source as any).x1)
        .attr('x2', (link.target as any).x0)

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', (link.source as any).color || colorScale((link.source as any).stage))

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', (link.target as any).color || colorScale((link.target as any).stage))
    })

    // Create tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000)

    // Draw links
    g.selectAll('.sankey-link')
      .data(sankeyData.links)
      .enter()
      .append('path')
      .attr('class', 'sankey-link')
      .attr('d', (d: any) => d3.sankeyLinkHorizontal()(d))
      .attr('stroke', (d, i) => `url(#gradient-${i})`)
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.6)
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('opacity', 0.8)
        const sourceNode = data.nodes.find(n => n.id === data.links[d.index]?.source)
        const targetNode = data.nodes.find(n => n.id === data.links[d.index]?.target)
        const conversionRate = d.value / (sourceNode?.value || 1)
        
        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${sourceNode?.name} → ${targetNode?.name}</strong><br>
            Users: ${formatNumber(d.value)}<br>
            Conversion: ${formatPercentage(conversionRate)}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.6)
        tooltip.style('opacity', 0)
      })

    // Draw nodes
    const node = g
      .selectAll('.sankey-node')
      .data(sankeyData.nodes)
      .enter()
      .append('g')
      .attr('class', 'sankey-node')

    // Node rectangles
    node
      .append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any) => d.color || colorScale(d.stage))
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        onNodeClick?.(d as any)
      })
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('opacity', 0.8)
        const dropOffRate = d.sourceLinks?.length > 0 
          ? 1 - (d.sourceLinks.reduce((sum: number, link: any) => sum + link.value, 0) / d.value)
          : 0
        
        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${d.name}</strong><br>
            Stage: ${d.stage}<br>
            Users: ${formatNumber(d.value)}<br>
            ${dropOffRate > 0 ? `Drop-off: ${formatPercentage(dropOffRate)}` : ''}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1)
        tooltip.style('opacity', 0)
      })

    // Node labels
    node
      .append('text')
      .attr('x', (d: any) => d.x0 < innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < innerWidth / 2 ? 'start' : 'end')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d: any) => d.name)

    // Node values
    node
      .append('text')
      .attr('x', (d: any) => d.x0 < innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2 + 15)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < innerWidth / 2 ? 'start' : 'end')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d: any) => formatNumber(d.value))

    // Cleanup function
    return () => {
      tooltip.remove()
    }
  }, [data, width, height, onNodeClick])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border rounded-lg"
        />
      </CardContent>
    </Card>
  )
}