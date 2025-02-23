// // import React, { useEffect, useState } from 'react';
// // import axios from 'axios';

// // function App() {
// //   const [figmaUrl, setFigmaUrl] = useState('');
// //   const [templateName, setTemplateName] = useState('');
// //   const [templates, setTemplates] = useState([]);
// //   const [selectedTemplate, setSelectedTemplate] = useState(null);

// //   // Fetch all templates from the backend
// //   const fetchTemplates = async () => {
// //     try {
// //       const res = await axios.get('http://localhost:5000/api/figma');
// //       setTemplates(res.data);
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchTemplates();
// //   }, []);

// //   // Import Figma file and save as template
// //   const handleImport = async (e) => {
// //     e.preventDefault();
// //     try {
// //       await axios.post('http://localhost:5000/api/figma/import', { figmaUrl, templateName });
// //       setFigmaUrl('');
// //       setTemplateName('');
// //       fetchTemplates();
// //       alert('Template imported successfully!');
// //     } catch (err) {
// //       console.error(err);
// //       alert('Error importing template.');
// //     }
// //   };

// //   // Update template (save edited JSON)
// //   const handleSave = async () => {
// //     try {
// //       await axios.put(`http://localhost:5000/api/figma/${selectedTemplate._id}`, {
// //         data: selectedTemplate.data,
// //         templateName: selectedTemplate.templateName,
// //       });
// //       alert('Template updated!');
// //       fetchTemplates();
// //     } catch (err) {
// //       console.error(err);
// //       alert('Error updating template.');
// //     }
// //   };

// //   return (
// //     <div style={{ padding: '20px' }}>
// //       <h1>Figma Template Importer & Editor</h1>

// //       <form onSubmit={handleImport}>
// //         <div>
// //           <label>Figma File URL: </label>
// //           <input
// //             type="text"
// //             value={figmaUrl}
// //             onChange={(e) => setFigmaUrl(e.target.value)}
// //             style={{ width: '400px' }}
// //             placeholder="https://www.figma.com/file/..."
// //           />
// //         </div>
// //         <div>
// //           <label>Template Name: </label>
// //           <input
// //             type="text"
// //             value={templateName}
// //             onChange={(e) => setTemplateName(e.target.value)}
// //             style={{ width: '400px' }}
// //             placeholder="Optional custom name"
// //           />
// //         </div>
// //         <button type="submit">Import Template</button>
// //       </form>

// //       <hr />

// //       <h2>Imported Templates</h2>
// //       <ul>
// //         {templates.map((template) => (
// //           <li key={template._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTemplate(template)}>
// //             {template.templateName}
// //           </li>
// //         ))}
// //       </ul>

// //       {selectedTemplate && (
// //         <div>
// //           <h2>Edit Template: {selectedTemplate.templateName}</h2>
// //           <textarea
// //             style={{ width: '600px', height: '400px' }}
// //             value={JSON.stringify(selectedTemplate.data, null, 2)}
// //             onChange={(e) => {
// //               try {
// //                 const updatedData = JSON.parse(e.target.value);
// //                 setSelectedTemplate({ ...selectedTemplate, data: updatedData });
// //               } catch (error) {
// //                 // Handle invalid JSON
// //               }
// //             }}
// //           ></textarea>
// //           <br />
// //           <button onClick={handleSave}>Save Changes</button>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default App;





// import React, { useEffect, useState } from "react";


// const App = () => {
//   const [figmaData, setFigmaData] = useState(null);
//   const [imageMap, setImageMap] = useState({}); // Stores image links from Figma

//   useEffect(() => {
//     console.log("Fetching Figma data...");
//     fetch("src/response.json") // Ensure the file is inside 'public' folder
//       .then((res) => res.json())
//       .then((data) => {
//         console.log("Fetched Data:", data);

//         const pageElements = data.document?.children?.[0]?.children || [];
//         console.log("Extracted Page Elements:", pageElements);

//         setFigmaData(pageElements);

//         // Extract image links from Figma's "images" property
//         if (data.images) {
//           setImageMap(data.images);
//         }
//       })
//       .catch((error) => console.error("Error loading Figma data:", error));
//   }, []);

//   // Function to safely get color from Figma API
//   const getColor = (fills) => {
//     if (!fills || fills.length === 0 || !fills[0].color) return "black";
//     const { r, g, b, a } = fills[0].color;
//     return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
//   };

//   const fetchImageUrls = async (nodeIds) => {
//     const fileId = 'YOUR_FIGMA_FILE_ID';
//     const apiToken = 'YOUR_FIGMA_API_TOKEN';
//     const ids = nodeIds.join(',');

//     const response = await fetch(
//       `https://api.figma.com/v1/images/${fileId}?ids=${ids}&format=svg`,
//       {
//         headers: {
//           'X-Figma-Token': apiToken,
//         },
//       }
//     );

//     const data = await response.json();
//     return data.images; // This will be an object with node IDs as keys and image URLs as values
//   };


//   // Function to get image URL from fills
//   const getImageUrl = (fills) => {
//     if (!fills || fills.length === 0) return null;

//     const imageFill = fills.find((fill) => fill.type === "IMAGE");
//     if (imageFill && imageFill.imageRef) {
//       return imageMap[imageFill.imageRef] || null;
//     }
//     return null;
//   };

//   // Function to render elements recursively
//   const renderElements = (elements, imageMap) => {
//     if (!elements) return null;
  
//     return elements.map((element) => {
//       if (!element.absoluteBoundingBox) return null;
  
//       const { x, y, width, height } = element.absoluteBoundingBox;
//       const style = {
//         position: 'absolute',
//         left: x,
//         top: y,
//         width,
//         height,
//       };
  
//       switch (element.type) {
//         case 'TEXT':
//           return (
//             <div
//               key={element.id}
//               style={{
//                 ...style,
//                 fontSize: element.style?.fontSize || 16,
//                 fontFamily: element.style?.fontFamily || 'Arial',
//                 fontWeight: element.style?.fontWeight || 400,
//                 color: getColor(element.fills),
//                 whiteSpace: 'pre-wrap',
//               }}
//             >
//               {element.characters}
//             </div>
//           );
  
//         case 'RECTANGLE':
//           return (
//             <div
//               key={element.id}
//               style={{
//                 ...style,
//                 backgroundColor: getColor(element.fills),
//               }}
//             />
//           );
  
//         case 'IMAGE':
//           const imageUrl = imageMap[element.id];
//           if (!imageUrl) return null;
//           return (
//             <img
//               key={element.id}
//               src={imageUrl}
//               alt=""
//               style={{
//                 ...style,
//                 objectFit: 'cover',
//               }}
//             />
//           );
  
//         case 'FRAME':
//         case 'GROUP':
//           return (
//             <div key={element.id} style={style}>
//               {renderElements(element.children, imageMap)}
//             </div>
//           );
  
//         default:
//           return null;
//       }
//     });
//   };
  

//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "100vw",
//         height: "100vh",
//         backgroundColor: "#f0f0f0",
//         overflow: "auto",
//       }}
//     >
//       {figmaData ? renderElements(figmaData) : <p>Loading...</p>}
//     </div>
//   );
// };

// export default App;

// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Fetch existing projects on component mount
    axios.get('http://localhost:5000/api/projects')
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.error('Error fetching projects:', error);
      });
  }, []);

  const handleImport = (e) => {
    e.preventDefault();

    axios.post('http://localhost:5000/api/import', { figmaUrl, projectName })
      .then((response) => {
        setProjects([...projects, response.data.project]);
        setFigmaUrl('');
        setProjectName('');
      })
      .catch((error) => {
        console.error('Error importing project:', error);
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Figma Project Importer</h1>
      <form onSubmit={handleImport}>
        <div>
          <label>Figma Project URL:</label>
          <input
            type="text"
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Project Name:</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>
        <button type="submit">Import Project</button>
      </form>

      <h2>Imported Projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <h3>{project.name}</h3>
            {/* Render project details or a canvas here */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
