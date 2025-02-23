// import React, { useRef, useEffect, useState } from 'react';

// function CanvasEditor({ template, onUpdateTemplate }) {
//   const canvasRef = useRef(null);
//   const [nodes, setNodes] = useState([]);
//   const [draggingNodeId, setDraggingNodeId] = useState(null);
//   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

//   // On template load, extract rectangle nodes
//   useEffect(() => {
//     if (template) {
//       const extractedNodes = [];
//       function traverse(node) {
//         // For this demo, we process nodes of type "RECTANGLE" with absoluteBoundingBox
//         if (node.type === 'RECTANGLE' && node.absoluteBoundingBox) {
//           // Clone the node to avoid mutating the original JSON
//           extractedNodes.push({ ...node });
//         }
//         if (node.children) {
//           node.children.forEach(traverse);
//         }
//       }
//       traverse(template.document);
//       setNodes(extractedNodes);
//     }
//   }, [template]);

//   // Render the nodes on canvas
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     nodes.forEach(node => {
//       const { x, y, width, height } = node.absoluteBoundingBox;
//       let fillColor = '#CCCCCC';
//       if (node.fills && node.fills.length > 0 && node.fills[0].color) {
//         const color = node.fills[0].color;
//         const r = Math.floor(color.r * 255);
//         const g = Math.floor(color.g * 255);
//         const b = Math.floor(color.b * 255);
//         fillColor = `rgb(${r},${g},${b})`;
//       }
//       ctx.fillStyle = fillColor;
//       ctx.fillRect(x, y, width, height);
//       ctx.strokeStyle = 'black';
//       ctx.strokeRect(x, y, width, height);
//     });
//   }, [nodes]);

//   // Handle mouse down: check if the click is inside a node, then start dragging.
//   const handleMouseDown = (e) => {
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const mouseX = e.clientX - rect.left;
//     const mouseY = e.clientY - rect.top;
//     for (let node of nodes) {
//       const { x, y, width, height } = node.absoluteBoundingBox;
//       if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
//         setDraggingNodeId(node.id);
//         setDragOffset({ x: mouseX - x, y: mouseY - y });
//         break;
//       }
//     }
//   };

//   // Handle mouse move: if dragging, update node's position.
//   const handleMouseMove = (e) => {
//     if (!draggingNodeId) return;
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const mouseX = e.clientX - rect.left;
//     const mouseY = e.clientY - rect.top;
//     const updatedNodes = nodes.map(node => {
//       if (node.id === draggingNodeId) {
//         // Update position relative to drag offset.
//         const newX = mouseX - dragOffset.x;
//         const newY = mouseY - dragOffset.y;
//         return {
//           ...node,
//           absoluteBoundingBox: {
//             ...node.absoluteBoundingBox,
//             x: newX,
//             y: newY,
//           },
//         };
//       }
//       return node;
//     });
//     setNodes(updatedNodes);
//   };

//   // Handle mouse up: stop dragging and optionally update the template.
//   const handleMouseUp = () => {
//     if (draggingNodeId) {
//       setDraggingNodeId(null);
//       // Call update callback if provided
//       if (onUpdateTemplate) {
//         // In a real app you’d merge the updated node positions back into the full Figma JSON.
//         onUpdateTemplate(nodes);
//       }
//     }
//   };

//   return (
//     <canvas
//       ref={canvasRef}
//       width={800}
//       height={600}
//       style={{ border: '1px solid black' }}
//       onMouseDown={handleMouseDown}
//       onMouseMove={handleMouseMove}
//       onMouseUp={handleMouseUp}
//     />
//   );
// }

// export default CanvasEditor;


// text alignment applied
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import figmaData from "./response.json";

// const FigmaCanvas = () => {
//   const canvasRef = useRef(null);
//   const [imageMap, setImageMap] = useState({});

//   useEffect(() => {
//     const fetchImages = async () => {
//       const nodeIds = new Set();

//       const extractImageNodes = (node) => {
//         if (node.fills) {
//           node.fills.forEach((fill) => {
//             if (fill.type === "IMAGE") {
//               nodeIds.add(node.id);
//             }
//           });
//         }
//         if (node.children) node.children.forEach(extractImageNodes);
//       };

//       extractImageNodes(figmaData.document);
//       console.log("Extracted Image Node IDs:", nodeIds); // Debugging log
//       if (nodeIds.size === 0) return;

//       try {
//         const response = await axios.get(
//           `https://api.figma.com/v1/images/${figmaData.document.id}`,
//           {
//             headers: { "X-Figma-Token": "" },
//             params: { ids: Array.from(nodeIds).join(",") },
//           }
//         );
//         console.log("Image API Response:", response.data); // Debugging log
//         setImageMap(response.data.images);
//       } catch (error) {
//         console.error("Error fetching images: ", error);
//       }
//     };

//     fetchImages();
//   }, []);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     const getTextStyle = (element) => {
//       let style = element.style || {};
//       if (element.styleOverrideTable && element.charactersStyleOverrides?.length) {
//         const overrideIndex = element.charactersStyleOverrides[0];
//         style = element.styleOverrideTable[overrideIndex] || style;
//       }
//       return style;
//     };

//     const drawElement = (element) => {
//       if (!element || !element.absoluteBoundingBox) return;

//       const { type, absoluteBoundingBox, fills, characters, id } = element;
//       const { x, y, width, height } = absoluteBoundingBox;

//       let fillColor = "#000";
//       if (fills && fills.length > 0 && fills[0].color) {
//         const color = fills[0].color;
//         fillColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
//       }

//       if (type === "TEXT" && characters) {
//         const style = getTextStyle(element);
//         ctx.fillStyle = fillColor;
//         ctx.font = `${style.fontWeight || 400} ${style.fontSize || 16}px ${style.fontFamily || 'Arial'}`;
//         ctx.textAlign = style.textAlignHorizontal?.toLowerCase() || "left";
//         ctx.textBaseline = "top";

//         const words = characters.split(" ");
//         let line = "";
//         let lineHeight = style.lineHeightPx || style.fontSize || 16;
//         let yOffset = y;

//         words.forEach((word) => {
//           const testLine = line + word + " ";
//           const testWidth = ctx.measureText(testLine).width;
//           if (testWidth > width && line !== "") {
//             ctx.fillText(line, x, yOffset);
//             line = word + " ";
//             yOffset += lineHeight;
//           } else {
//             line = testLine;
//           }
//         });
//         ctx.fillText(line, x, yOffset);
//       } else if (type === "RECTANGLE") {
//         ctx.fillStyle = fillColor;
//         ctx.fillRect(x, y, width, height);
//       } else if (type === "VECTOR") {
//         ctx.strokeStyle = fillColor;
//         ctx.strokeRect(x, y, width, height);
//       } else if (imageMap[id]) {
//         const img = new Image();
//         img.src = imageMap[id];
//         img.onload = () => {
//           ctx.drawImage(img, x, y, width, height);
//         };
//         img.onerror = (err) => {
//           console.error(`Failed to load image for node ${id}:`, err);
//         };
//       }
//     };

//     const traverseChildren = (node) => {
//       if (node.children) {
//         node.children.forEach(traverseChildren);
//       }
//       drawElement(node);
//     };

//     traverseChildren(figmaData.document);
//   }, [imageMap]);

//   return <canvas ref={canvasRef} width={2000} height={1000} style={{ border: "1px solid black" }} />;
// };

// export default FigmaCanvas;



// fetching images urls but not displayed in canvas
const FigmaCanvas = () => {
  const canvasRef = useRef(null);
  const [imageMap, setImageMap] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      const nodeIds = new Set();

      const extractImageNodes = (node) => {
        if (node.fills) {
          node.fills.forEach((fill) => {
            if (fill.type === "IMAGE") {
              nodeIds.add(node.id);
            }
          });
        }
        if (node.children) node.children.forEach(extractImageNodes);
      };

      extractImageNodes(figmaData.document);
      console.log("Extracted Image Node IDs:", Array.from(nodeIds));

      if (nodeIds.size === 0) {
        console.warn("No image nodes found.");
        return;
      }

      const fileId = ""; // Your Figma File ID

      try {
        console.log("Fetching images for node IDs:", Array.from(nodeIds));
        const response = await axios.get(
          `https://api.figma.com/v1/images/${fileId}`,
          {
            headers: { "X-Figma-Token": "" }, 
            params: { ids: Array.from(nodeIds).join(","), format: "png", scale: 2 }, // Force PNG and higher quality
          }
        );

        console.log("Figma Image API Response:", response.data);

        if (response.status === 200 && response.data.images) {
          setImageMap(response.data.images);
        } else {
          console.error("Unexpected response:", response);
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (Object.keys(imageMap).length === 0) return;

    console.log("Images fetched, now drawing on canvas...");

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const getTextStyle = (element) => {
      let style = element.style || {};
      if (element.styleOverrideTable && element.charactersStyleOverrides?.length) {
        const overrideIndex = element.charactersStyleOverrides[0];
        style = element.styleOverrideTable[overrideIndex] || style;
      }
      return style;
    };

    const drawElement = (element) => {
      if (!element || !element.absoluteBoundingBox) return;

      const { type, absoluteBoundingBox, fills, characters, id } = element;
      const { x, y, width, height } = absoluteBoundingBox;

      let fillColor = "#000";
      if (fills && fills.length > 0 && fills[0].color) {
        const color = fills[0].color;
        fillColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
      }

      if (type === "TEXT" && characters) {
        const style = getTextStyle(element);
        ctx.fillStyle = fillColor;
        ctx.font = `${style.fontWeight || 400} ${style.fontSize || 16}px ${style.fontFamily || 'Arial'}`;
        ctx.textAlign = style.textAlignHorizontal?.toLowerCase() || "left";
        ctx.textBaseline = "top";

        const words = characters.split(" ");
        let line = "";
        let lineHeight = style.lineHeightPx || style.fontSize || 16;
        let yOffset = y;

        words.forEach((word) => {
          const testLine = line + word + " ";
          const testWidth = ctx.measureText(testLine).width;
          if (testWidth > width && line !== "") {
            ctx.fillText(line, x, yOffset);
            line = word + " ";
            yOffset += lineHeight;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, x, yOffset);
      } else if (type === "RECTANGLE") {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, width, height);
      } else if (type === "VECTOR") {
        ctx.strokeStyle = fillColor;
        ctx.strokeRect(x, y, width, height);
      } else if (imageMap[id]) {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Fixes CORS issue
        img.src = imageMap[id];

        img.onload = () => {
          console.log(`Drawing image for node ${id} at (${x}, ${y})`);
          ctx.drawImage(img, x, y, width, height);
          setImagesLoaded(true); // Trigger re-render after images load
        };

        img.onerror = (err) => {
          console.error(`Failed to load image for node ${id}:`, err);
        };
      }
    };

    const traverseChildren = (node) => {
      if (node.children) {
        node.children.forEach(traverseChildren);
      }
      drawElement(node);
    };

    setTimeout(() => {
      traverseChildren(figmaData.document);
    }, 500);
  }, [imageMap]); // Re-run when images are fetched

  return (
    <div>
      <canvas ref={canvasRef} width={2000} height={1000} style={{ border: "1px solid black" }} />
      {/* {!imagesLoaded && <p>Loading images...</p>} */}
    </div>
  );
};

export default FigmaCanvas;
