// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function App() {
//   const [figmaUrl, setFigmaUrl] = useState('');
//   const [templateName, setTemplateName] = useState('');
//   const [templates, setTemplates] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);

//   // Fetch all templates from the backend
//   const fetchTemplates = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/figma');
//       setTemplates(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchTemplates();
//   }, []);

//   // Import Figma file and save as template
//   const handleImport = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post('http://localhost:5000/api/figma/import', { figmaUrl, templateName });
//       setFigmaUrl('');
//       setTemplateName('');
//       fetchTemplates();
//       alert('Template imported successfully!');
//     } catch (err) {
//       console.error(err);
//       alert('Error importing template.');
//     }
//   };

//   // Update template (save edited JSON)
//   const handleSave = async () => {
//     try {
//       await axios.put(`http://localhost:5000/api/figma/${selectedTemplate._id}`, {
//         data: selectedTemplate.data,
//         templateName: selectedTemplate.templateName,
//       });
//       alert('Template updated!');
//       fetchTemplates();
//     } catch (err) {
//       console.error(err);
//       alert('Error updating template.');
//     }
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Figma Template Importer & Editor</h1>

//       <form onSubmit={handleImport}>
//         <div>
//           <label>Figma File URL: </label>
//           <input
//             type="text"
//             value={figmaUrl}
//             onChange={(e) => setFigmaUrl(e.target.value)}
//             style={{ width: '400px' }}
//             placeholder="https://www.figma.com/file/..."
//           />
//         </div>
//         <div>
//           <label>Template Name: </label>
//           <input
//             type="text"
//             value={templateName}
//             onChange={(e) => setTemplateName(e.target.value)}
//             style={{ width: '400px' }}
//             placeholder="Optional custom name"
//           />
//         </div>
//         <button type="submit">Import Template</button>
//       </form>

//       <hr />

//       <h2>Imported Templates</h2>
//       <ul>
//         {templates.map((template) => (
//           <li key={template._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTemplate(template)}>
//             {template.templateName}
//           </li>
//         ))}
//       </ul>

//       {selectedTemplate && (
//         <div>
//           <h2>Edit Template: {selectedTemplate.templateName}</h2>
//           <textarea
//             style={{ width: '600px', height: '400px' }}
//             value={JSON.stringify(selectedTemplate.data, null, 2)}
//             onChange={(e) => {
//               try {
//                 const updatedData = JSON.parse(e.target.value);
//                 setSelectedTemplate({ ...selectedTemplate, data: updatedData });
//               } catch (error) {
//                 // Handle invalid JSON
//               }
//             }}
//           ></textarea>
//           <br />
//           <button onClick={handleSave}>Save Changes</button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
import React, { useEffect, useState } from "react";
import Home from "./home";

const App = () => {
  const [figmaData, setFigmaData] = useState(null);
  const [imageMap, setImageMap] = useState({}); // Stores image links from Figma

  useEffect(() => {
    console.log("Fetching Figma data...");
    fetch("src/response.json") // Ensure the file is inside 'public' folder
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched Data:", data);

        const pageElements = data.document?.children?.[0]?.children || [];
        console.log("Extracted Page Elements:", pageElements);

        setFigmaData(pageElements);

        // Extract image links from Figma's "images" property
        if (data.images) {
          setImageMap(data.images);
        }
      })
      .catch((error) => console.error("Error loading Figma data:", error));
  }, []);

  // Function to safely get color from Figma API
  const getColor = (fills) => {
    if (!fills || fills.length === 0 || !fills[0].color) return "black";
    const { r, g, b, a } = fills[0].color;
    return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
  };

  // Function to get image URL from fills
  const getImageUrl = (fills) => {
    if (!fills || fills.length === 0) return null;

    const imageFill = fills.find((fill) => fill.type === "IMAGE");
    if (imageFill && imageFill.imageRef) {
      return imageMap[imageFill.imageRef] || null;
    }
    return null;
  };

  // Function to render elements recursively
  const renderElements = (elements) => {
    if (!elements) return null;

    return elements.map((element) => {
      if (element.type === "CANVAS") {
        console.warn("Skipping CANVAS element:", element);
        return null;
      }

      if (!element.absoluteBoundingBox) {
        console.warn("Skipping element without bounding box:", element);
        return null;
      }

      console.log("Rendering element:", element);

      switch (element.type) {
        case "TEXT":
          return (
            <div
              key={element.id}
              style={{
                position: "absolute",
                left: element.absoluteBoundingBox.x,
                top: element.absoluteBoundingBox.y,
                fontSize: element.style?.fontSize || 16,
                fontFamily: element.style?.fontFamily || "Arial",
                fontWeight: element.style?.fontWeight || 400,
                color: getColor(element.fills),
                whiteSpace: "pre-wrap",
              }}
            >
              {element.characters}
            </div>
          );

        case "RECTANGLE":
          return (
            <div
              key={element.id}
              style={{
                position: "absolute",
                left: element.absoluteBoundingBox.x,
                top: element.absoluteBoundingBox.y,
                width: element.absoluteBoundingBox.width,
                height: element.absoluteBoundingBox.height,
                backgroundColor: getColor(element.fills),
              }}
            />
          );

        case "FRAME":
        case "GROUP":
          return (
            <div
              key={element.id}
              style={{
                position: "absolute",
                left: element.absoluteBoundingBox.x,
                top: element.absoluteBoundingBox.y,
                width: element.absoluteBoundingBox.width,
                height: element.absoluteBoundingBox.height,
                overflow: "hidden",
              }}
            >
              {renderElements(element.children)}
            </div>
          );

        case "COMPONENT":
        case "INSTANCE":
          return (
            <button
              key={element.id}
              style={{
                position: "absolute",
                left: element.absoluteBoundingBox.x,
                top: element.absoluteBoundingBox.y,
                width: element.absoluteBoundingBox.width,
                height: element.absoluteBoundingBox.height,
                backgroundColor: getColor(element.fills),
                border: "none",
                cursor: "pointer",
              }}
            >
              {renderElements(element.children)}
            </button>
          );

        case "VECTOR":
        case "ELLIPSE":
          return (
            <div
              key={element.id}
              style={{
                position: "absolute",
                left: element.absoluteBoundingBox.x,
                top: element.absoluteBoundingBox.y,
                width: element.absoluteBoundingBox.width,
                height: element.absoluteBoundingBox.height,
                borderRadius: "50%",
                backgroundColor: getColor(element.fills),
              }}
            />
          );

        case "IMAGE":
          const imageUrl = getImageUrl(element.fills);
          if (!imageUrl) return null;
          return (
            <img
              key={element.id}
              src={imageUrl}
              alt="Figma Image"
              style={{
                position: "absolute",
                left: element.absoluteBoundingBox.x,
                top: element.absoluteBoundingBox.y,
                width: element.absoluteBoundingBox.width,
                height: element.absoluteBoundingBox.height,
                objectFit: "cover",
              }}
            />
          );

        default:
          return null;
      }
    });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f0f0f0",
        overflow: "auto",
      }}
    >
      {figmaData ? renderElements(figmaData) : <p>Loading...</p>}
    </div>
  );
};

export default App;
