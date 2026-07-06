import { useRef, useEffect } from 'react';

export default function CartesianGrid({
  width = 280,
  height = 220,
  scale = 20,
  points = [],
  lines = [],
  shapes = [],
  showLabels = true,
  className = '',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;

    // Background
    ctx.fillStyle = '#f8f9ff';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#e0e3f5';
    ctx.lineWidth = 0.5;
    for (let x = cx % scale; x < width; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = cy % scale; y < height; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    // X axis
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
    // Y axis
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();

    // Arrow tips
    const arrowSize = 6;
    ctx.fillStyle = '#6366f1';
    // Right arrow
    ctx.beginPath();
    ctx.moveTo(width - 2, cy);
    ctx.lineTo(width - 2 - arrowSize, cy - arrowSize / 2);
    ctx.lineTo(width - 2 - arrowSize, cy + arrowSize / 2);
    ctx.fill();
    // Top arrow
    ctx.beginPath();
    ctx.moveTo(cx, 2);
    ctx.lineTo(cx - arrowSize / 2, 2 + arrowSize);
    ctx.lineTo(cx + arrowSize / 2, 2 + arrowSize);
    ctx.fill();

    // Axis labels
    if (showLabels) {
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('x', width - 10, cy - 6);
      ctx.fillText('y', cx + 6, 12);
      ctx.fillText('O', cx + 4, cy + 12);

      // Tick marks and numbers
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      for (let i = -Math.floor(cx / scale); i <= Math.floor(cx / scale); i++) {
        if (i === 0) continue;
        const px = cx + i * scale;
        ctx.beginPath(); ctx.moveTo(px, cy - 3); ctx.lineTo(px, cy + 3);
        ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillText(i, px, cy + 12);
      }
      ctx.textAlign = 'right';
      for (let i = -Math.floor(cy / scale); i <= Math.floor(cy / scale); i++) {
        if (i === 0) continue;
        const py = cy - i * scale;
        ctx.beginPath(); ctx.moveTo(cx - 3, py); ctx.lineTo(cx + 3, py);
        ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillText(i, cx - 5, py + 3);
      }
    }

    // Draw shapes
    shapes.forEach((shape) => {
      ctx.save();
      ctx.strokeStyle = shape.color || '#6366f1';
      ctx.fillStyle = (shape.color || '#6366f1') + '22';
      ctx.lineWidth = 2;

      if (shape.type === 'circle') {
        const rx = cx + (shape.x || 0) * scale;
        const ry = cy - (shape.y || 0) * scale;
        ctx.beginPath();
        ctx.arc(rx, ry, (shape.r || 2) * scale, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      } else if (shape.type === 'rect') {
        const rx = cx + (shape.x || 0) * scale;
        const ry = cy - (shape.y || 0) * scale - (shape.h || 2) * scale;
        ctx.beginPath();
        ctx.roundRect(rx, ry, (shape.w || 3) * scale, (shape.h || 2) * scale, 4);
        ctx.fill(); ctx.stroke();
      } else if (shape.type === 'triangle') {
        const ox = cx + (shape.x || 0) * scale;
        const oy = cy - (shape.y || 0) * scale;
        const s = (shape.size || 2) * scale;
        ctx.beginPath();
        ctx.moveTo(ox, oy - s);
        ctx.lineTo(ox - s, oy + s * 0.6);
        ctx.lineTo(ox + s, oy + s * 0.6);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      } else if (shape.type === 'line') {
        const x1 = cx + (shape.x1 || 0) * scale;
        const y1 = cy - (shape.y1 || 0) * scale;
        const x2 = cx + (shape.x2 || 0) * scale;
        const y2 = cy - (shape.y2 || 0) * scale;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      } else if (shape.type === 'point') {
        const px2 = cx + (shape.x || 0) * scale;
        const py2 = cy - (shape.y || 0) * scale;
        ctx.beginPath(); ctx.arc(px2, py2, 4, 0, Math.PI * 2);
        ctx.fillStyle = shape.color || '#6366f1'; ctx.fill();
        if (shape.label) {
          ctx.fillStyle = '#374151'; ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(shape.label, px2 + 6, py2 - 4);
        }
      } else if (shape.type === 'ellipse') {
        const ex = cx + (shape.x || 0) * scale;
        const ey = cy - (shape.y || 0) * scale;
        ctx.beginPath();
        ctx.ellipse(ex, ey, (shape.a || 2) * scale, (shape.b || 1) * scale, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      } else if (shape.type === 'hexagon') {
        const hx = cx + (shape.x || 0) * scale;
        const hy = cy - (shape.y || 0) * scale;
        const hs = (shape.size || 1.5) * scale;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px3 = hx + hs * Math.cos(angle);
          const py3 = hy + hs * Math.sin(angle);
          if (i === 0) ctx.moveTo(px3, py3); else ctx.lineTo(px3, py3);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    });

    // Draw extra lines
    lines.forEach((line) => {
      const x1 = cx + line.x1 * scale;
      const y1 = cy - line.y1 * scale;
      const x2 = cx + line.x2 * scale;
      const y2 = cy - line.y2 * scale;
      ctx.strokeStyle = line.color || '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash(line.dashed ? [5, 4] : []);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw extra points
    points.forEach((pt) => {
      const px2 = cx + pt.x * scale;
      const py2 = cy - pt.y * scale;
      ctx.beginPath(); ctx.arc(px2, py2, 5, 0, Math.PI * 2);
      ctx.fillStyle = pt.color || '#ef4444';
      ctx.fill();
      if (pt.label) {
        ctx.fillStyle = '#374151'; ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(pt.label, px2 + 7, py2 - 4);
      }
    });

  }, [width, height, scale, points, lines, shapes, showLabels]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-2xl ${className}`}
      style={{ display: 'block' }}
    />
  );
}
