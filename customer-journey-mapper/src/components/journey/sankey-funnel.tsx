'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface FunnelStep {
  id: string
  name: string
  value: number
  conversions?: number
  dropoffs?: number
  color?: string
}

interface SankeyFunnelProps {
  data: FunnelStep[]
  width?: number
  height?: number
  onStepClick?: (step: FunnelStep) => void
  className?: string
}

export function SankeyFunnel({
  data,
  width = 600,
  height = 400,
  onStepClick,
  className
}: SankeyFunnelProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
    const margin = { top: 20, right: 60, bottom: 40, left: 60 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Calculate step positions and sizes
    const stepHeight = innerHeight / data.length
    const maxValue = Math.max(...data.map(d => d.value))

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, innerWidth])

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.id))
      .range([0, innerHeight])
      .padding(0.1)

    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.id))
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'])

    // Draw funnel steps
    const steps = g.selectAll('.funnel-step')
      .data(data)
      .enter().append('g')
      .attr('class', 'funnel-step')
      .style('cursor', 'pointer')
      .on('click', (event, d) => onStepClick?.(d))

    // Draw step rectangles
    steps.append('rect')
      .attr('x', 0)
      .attr('y', d => yScale(d.id)!)
      .attr('width', d => xScale(d.value))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d, i) => d.color || colorScale(d.id) as string)
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1)
        
        // Show tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'chart-tooltip')
          .style('position', 'absolute')
          .style('pointer-events', 'none')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="font-medium">${d.name}</div>
            <div class="text-sm text-gray-600">
              <div>Users: ${d.value.toLocaleString()}</div>
              ${d.conversions ? `<div>Conversions: ${d.conversions.toLocaleString()}</div>` : ''}
              ${d.dropoffs ? `<div>Drop-offs: ${d.dropoffs.toLocaleString()}</div>` : ''}
            </div>
          `)
        
        setTimeout(() => tooltip.remove(), 3000)
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8)
      })

    // Add step labels
    steps.append('text')
      .attr('x', 10)
      .attr('y', d => yScale(d.id)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(d => d.name)

    // Add value labels
    steps.append('text')
      .attr('x', d => xScale(d.value) + 10)
      .attr('y', d => yScale(d.id)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#374151')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text(d => d.value.toLocaleString())

    // Add conversion rate labels
    steps.append('text')
      .attr('x', d => xScale(d.value) + 10)
      .attr('y', d => yScale(d.id)! + yScale.bandwidth() / 2 + 15)
      .attr('dy', '0.35em')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .text((d, i) => {
        if (i === 0) return '100%'
        const previousValue = data[i - 1].value
        if (previousValue === 0) return '0%'
        return `${((d.value / previousValue) * 100).toFixed(1)}%`
      })

    // Draw flow lines between steps
    if (data.length > 1) {
      const flows = g.selectAll('.flow-line')
        .data(data.slice(1))
        .enter().append('path')
        .attr('class', 'flow-line')
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 2)
        .attr('opacity', 0.6)
        .attr('d', (d, i) => {
          const prevStep = data[i]
          const currentStep = d
          
          const x1 = xScale(prevStep.value)
          const y1 = yScale(prevStep.id)! + yScale.bandwidth()
          const x2 = 0
          const y2 = yScale(currentStep.id)!
          
          // Create a curved path
          const midY = (y1 + y2) / 2
          return `M ${x1} ${y1} 
                  C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`
        })
    }

    // Add drop-off indicators
    data.forEach((step, i) => {
      if (i === 0 || !step.dropoffs) return
      
      const dropoffWidth = xScale(step.dropoffs)
      const stepY = yScale(step.id)!
      
      g.append('rect')
        .attr('x', xScale(step.value))
        .attr('y', stepY)
        .attr('width', dropoffWidth)
        .attr('height', yScale.bandwidth())
        .attr('fill', '#ef4444')
        .attr('opacity', 0.3)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this).attr('opacity', 0.5)
          
          const tooltip = d3.select('body').append('div')
            .attr('class', 'chart-tooltip')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(`
              <div class="font-medium">Drop-offs</div>
              <div class="text-sm text-gray-600">
                <div>Users: ${step.dropoffs!.toLocaleString()}</div>
                <div>Rate: ${((step.dropoffs! / data[i-1].value) * 100).toFixed(1)}%</div>
              </div>
            `)
          
          setTimeout(() => tooltip.remove(), 3000)
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0.3)
        })
    })

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth - 100}, 20)`)

    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)

    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text('Conversions')

    legend.append('rect')
      .attr('y', 25)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.3)

    legend.append('text')
      .attr('x', 20)
      .attr('y', 37)
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text('Drop-offs')

  }, [data, width, height, onStepClick])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Conversion Funnel Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border rounded-lg bg-white"
        />
      </CardContent>
    </Card>
  )
}