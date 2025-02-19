import React, { useRef, useEffect, useState } from 'react';

function CanvasEditor({ template, onUpdateTemplate }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // On template load, extract rectangle nodes
  useEffect(() => {
    if (template) {
      const extractedNodes = [];
      function traverse(node) {
        // For this demo, we process nodes of type "RECTANGLE" with absoluteBoundingBox
        if (node.type === 'RECTANGLE' && node.absoluteBoundingBox) {
          // Clone the node to avoid mutating the original JSON
          extractedNodes.push({ ...node });
        }
        if (node.children) {
          node.children.forEach(traverse);
        }
      }
      traverse(template.document);
      setNodes(extractedNodes);
    }
  }, [template]);

  // Render the nodes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(node => {
      const { x, y, width, height } = node.absoluteBoundingBox;
      let fillColor = '#CCCCCC';
      if (node.fills && node.fills.length > 0 && node.fills[0].color) {
        const color = node.fills[0].color;
        const r = Math.floor(color.r * 255);
        const g = Math.floor(color.g * 255);
        const b = Math.floor(color.b * 255);
        fillColor = `rgb(${r},${g},${b})`;
      }
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = 'black';
      ctx.strokeRect(x, y, width, height);
    });
  }, [nodes]);

  // Handle mouse down: check if the click is inside a node, then start dragging.
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    for (let node of nodes) {
      const { x, y, width, height } = node.absoluteBoundingBox;
      if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
        setDraggingNodeId(node.id);
        setDragOffset({ x: mouseX - x, y: mouseY - y });
        break;
      }
    }
  };

  // Handle mouse move: if dragging, update node's position.
  const handleMouseMove = (e) => {
    if (!draggingNodeId) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const updatedNodes = nodes.map(node => {
      if (node.id === draggingNodeId) {
        // Update position relative to drag offset.
        const newX = mouseX - dragOffset.x;
        const newY = mouseY - dragOffset.y;
        return {
          ...node,
          absoluteBoundingBox: {
            ...node.absoluteBoundingBox,
            x: newX,
            y: newY,
          },
        };
      }
      return node;
    });
    setNodes(updatedNodes);
  };

  // Handle mouse up: stop dragging and optionally update the template.
  const handleMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      // Call update callback if provided
      if (onUpdateTemplate) {
        // In a real app you’d merge the updated node positions back into the full Figma JSON.
        onUpdateTemplate(nodes);
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ border: '1px solid black' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}

export default CanvasEditor;
