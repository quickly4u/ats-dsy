import React, { useRef, useEffect } from 'react';
import type { ChartData } from '../../types';

interface ChartProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  data: ChartData;
  options?: any;
  height?: number;
}

// Simple chart implementation using Canvas API
const Chart: React.FC<ChartProps> = ({ type, data, options = {}, height = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.datasets[0]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width } = canvas;
    const canvasHeight = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);
    
    // Set up dimensions
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = canvasHeight - 2 * padding;
    
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;
    
    // Find min and max values
    const maxValue = Math.max(...values);
    const minValue = Math.min(0, Math.min(...values));
    const valueRange = maxValue - minValue || 1;

    if (type === 'line') {
      // Draw line chart
      ctx.strokeStyle = dataset.borderColor || '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      values.forEach((value, index) => {
        const x = padding + (index * chartWidth) / (values.length - 1);
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();

      // Draw points
      ctx.fillStyle = dataset.borderColor || '#3B82F6';
      values.forEach((value, index) => {
        const x = padding + (index * chartWidth) / (values.length - 1);
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw fill area if specified
      if (dataset.backgroundColor) {
        ctx.fillStyle = dataset.backgroundColor;
        ctx.beginPath();
        
        values.forEach((value, index) => {
          const x = padding + (index * chartWidth) / (values.length - 1);
          const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, padding + chartHeight);
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.closePath();
        ctx.fill();
      }
    } else if (type === 'bar') {
      // Draw bar chart
      const barWidth = chartWidth / values.length * 0.6;
      const barSpacing = chartWidth / values.length * 0.4;

      ctx.fillStyle = dataset.backgroundColor || '#3B82F6';
      
      values.forEach((value, index) => {
        const x = padding + (index * (barWidth + barSpacing)) + barSpacing / 2;
        const barHeight = ((value - minValue) / valueRange) * chartHeight;
        const y = padding + chartHeight - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // Draw axes
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
      const x = padding + (index * chartWidth) / (labels.length - 1);
      const y = padding + chartHeight + 20;
      ctx.fillText(label, x, y);
    });

    // Draw Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange * i / 5);
      const y = padding + chartHeight - (i * chartHeight / 5);
      ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
    }
    
  }, [data, type, height]);

  return (
    <div className="w-full" style={{ height }}>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={height}
        className="w-full h-full"
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
};

export default Chart;