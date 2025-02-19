// const express = require('express');
// const axios = require('axios');
// const Template = require('../models/Template');

// const router = express.Router();

// // Helper: extract file key from Figma URL
// function extractFileKey(url) {
//   // Figma URL format: https://www.figma.com/file/<FILE_KEY>/<project-name>
//   const regex = /figma\.com\/file\/([^\/]+)/;
//   const match = url.match(regex);
//   return match ? match[1] : null;
// }

// // POST /api/figma/import
// // Body: { figmaUrl: string, templateName?: string }
// router.post('/import', async (req, res) => {
//   try {
//     const { figmaUrl, templateName } = req.body;
//     if (!figmaUrl) {
//       return res.status(400).json({ error: 'figmaUrl is required' });
//     }
//     const fileKey = extractFileKey(figmaUrl);
//     if (!fileKey) {
//       return res.status(400).json({ error: 'Invalid Figma URL' });
//     }
    
//     // Fetch Figma file JSON using the Figma API
//     const figmaResponse = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
//       headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN }
//     });
//     const data = figmaResponse.data;
    
//     // Save the template to MongoDB
//     const newTemplate = new Template({
//       fileKey,
//       templateName: templateName || `Template - ${fileKey}`,
//       data,
//     });
//     const savedTemplate = await newTemplate.save();
//     return res.status(200).json(savedTemplate);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error importing Figma file' });
//   }
// });

// // GET /api/figma - get all templates
// router.get('/', async (req, res) => {
//   try {
//     const templates = await Template.find().sort({ createdAt: -1 });
//     res.json(templates);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching templates' });
//   }
// });

// // GET /api/figma/:id - get a single template
// router.get('/:id', async (req, res) => {
//   try {
//     const template = await Template.findById(req.params.id);
//     if (!template) return res.status(404).json({ error: 'Template not found' });
//     res.json(template);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching template' });
//   }
// });

// // PUT /api/figma/:id - update a template (e.g. after editing)
// router.put('/:id', async (req, res) => {
//   try {
//     const updatedTemplate = await Template.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );
//     if (!updatedTemplate) return res.status(404).json({ error: 'Template not found' });
//     res.json(updatedTemplate);
//   } catch (error) {
//     res.status(500).json({ error: 'Error updating template' });
//   }
// });

// module.exports = router;
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');

const router = express.Router();

// Helper: extract file key from Figma URL (supports /file/ and /design/)
function extractFileKey(url) {
  const regex = /figma\.com\/(?:file|design)\/([^\/\?]+)/;
  const match = url.match(regex);
  if (match) {
    return match[1];
  } else {
    console.error(`Failed to extract file key from URL: ${url}`);
    return null;
  }
}

// Helper: download an image from a URL and save it locally
async function downloadImage(imageUrl, filename) {
  try {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream'
    });
    // Define the local file path (assets folder)
    const filePath = path.join(__dirname, '..', 'assets', filename);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', (err) => {
        console.error(`Error writing file ${filename}:`, err.message);
        reject(err);
      });
    });
  } catch (err) {
    console.error(`Error downloading image from ${imageUrl}:`, err.message);
    throw err;
  }
}

// Helper: process assets – download images and update JSON with local paths
async function processAssets(fileKey, data) {
  // Collect all node IDs that have image fills
  const ids = [];
  function traverse(node) {
    if (node.fills && Array.isArray(node.fills)) {
      node.fills.forEach(fill => {
        if (fill.type === "IMAGE") {
          // Collect this node's id if not already collected
          if (!ids.includes(node.id)) {
            ids.push(node.id);
          }
        }
      });
    }
    if (node.children) {
      node.children.forEach(child => traverse(child));
    }
  }
  // Start from the document node
  traverse(data.document);

  if (ids.length === 0) {
    console.log("No image assets found in Figma JSON.");
    return data;
  }

  console.log("Found image asset node IDs:", ids);

  // Call Figma images endpoint to get URLs for the image nodes
  const imagesRes = await axios.get(`https://api.figma.com/v1/images/${fileKey}`, {
    params: { ids: ids.join(','), format: 'png' },
    headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN }
  });
  const imageMap = imagesRes.data.images; // Mapping of nodeId -> image URL

  // Recursively update nodes with image fills to include a localImage path
  async function updateNode(node) {
    if (node.fills && Array.isArray(node.fills)) {
      for (let fill of node.fills) {
        if (fill.type === "IMAGE") {
          const imageUrl = imageMap[node.id];
          if (imageUrl) {
            try {
              // Download image and save as <nodeId>.png in the assets folder
              const localPath = await downloadImage(imageUrl, `${node.id}.png`);
              // Update the fill with a new property that holds the local path
              fill.localImage = localPath; // You could also override fill.imageRef if desired
              console.log(`Downloaded asset for node ${node.id} to ${localPath}`);
            } catch (err) {
              console.error(`Failed to download asset for node ${node.id}:`, err.message);
            }
          } else {
            console.error(`No image URL returned for node ${node.id}`);
          }
        }
      }
    }
    if (node.children) {
      for (let child of node.children) {
        await updateNode(child);
      }
    }
  }
  await updateNode(data.document);
  return data;
}

// POST /api/figma/import
// Request body: { figmaUrl: string, templateName?: string }
router.post('/import', async (req, res) => {
  try {
    const { figmaUrl, templateName } = req.body;
    if (!figmaUrl) {
      console.error("figmaUrl is missing in request body");
      return res.status(400).json({ error: 'figmaUrl is required' });
    }
    
    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) {
      console.error("File key extraction failed.");
      return res.status(400).json({ error: 'Invalid Figma URL. Could not extract file key.' });
    }
    
    // Fetch Figma file JSON using the Figma API
    const figmaResponse = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN }
    });
    let data = figmaResponse.data;
    
    // Process assets: download images and update JSON with local paths
    data = await processAssets(fileKey, data);
    
    // Save the updated template to MongoDB
    const newTemplate = new Template({
      fileKey,
      templateName: templateName || `Template - ${fileKey}`,
      data,
    });
    const savedTemplate = await newTemplate.save();
    console.log(`Successfully imported template: ${savedTemplate.templateName}`);
    return res.status(200).json(savedTemplate);
  } catch (error) {
    console.error("Error importing Figma file:", error.message);
    res.status(500).json({ error: 'Error importing Figma file', details: error.message });
  }
});

// Other routes (GET, PUT, etc.) remain unchanged, with console logs for errors

// GET /api/figma - get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error.message);
    res.status(500).json({ error: 'Error fetching templates', details: error.message });
  }
});

// GET /api/figma/:id - get a single template
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      console.error(`Template with ID ${req.params.id} not found.`);
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error(`Error fetching template ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Error fetching template', details: error.message });
  }
});

// PUT /api/figma/:id - update a template (after editing)
router.put('/:id', async (req, res) => {
  try {
    const updatedTemplate = await Template.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTemplate) {
      console.error(`Template with ID ${req.params.id} not found for update.`);
      return res.status(404).json({ error: 'Template not found' });
    }
    console.log(`Successfully updated template: ${updatedTemplate.templateName}`);
    res.json(updatedTemplate);
  } catch (error) {
    console.error(`Error updating template ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Error updating template', details: error.message });
  }
});

module.exports = router;
