import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Fetch a  ll templates from the backend
  const fetchTemplates = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/figma');
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Import Figma file and save as template
  const handleImport = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/figma/import', { figmaUrl, templateName });
      setFigmaUrl('');
      setTemplateName('');
      fetchTemplates();
      alert('Template imported successfully!');
    } catch (err) {
      console.error(err);
      alert('Error importing template.');
    }
  };

  // Update template (save edited JSON)
  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/figma/${selectedTemplate._id}`, {
        data: selectedTemplate.data,
        templateName: selectedTemplate.templateName,
      });
      alert('Template updated!');
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert('Error updating template.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Figma Template Importer & Editor</h1>

      <form onSubmit={handleImport}>
        <div>
          <label>Figma File URL: </label>
          <input
            type="text"
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            style={{ width: '400px' }}
            placeholder="https://www.figma.com/file/..."
          />
        </div>
        <div>
          <label>Template Name: </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{ width: '400px' }}
            placeholder="Optional custom name"
          />
        </div>
        <button type="submit">Import Template</button>
      </form>

      <hr />

      <h2>Imported Templates</h2>
      <ul>
        {templates.map((template) => (
          <li key={template._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTemplate(template)}>
            {template.templateName}
          </li>
        ))}
      </ul>

      {selectedTemplate && (
        <div>
          <h2>Edit Template: {selectedTemplate.templateName}</h2>
          <textarea
            style={{ width: '600px', height: '400px' }}
            value={JSON.stringify(selectedTemplate.data, null, 2)}
            onChange={(e) => {
              try {
                const updatedData = JSON.parse(e.target.value);
                setSelectedTemplate({ ...selectedTemplate, data: updatedData });
              } catch (error) {
                // Handle invalid JSON
              }
            }}
          ></textarea>
          <br />
          <button onClick={handleSave}>Save Changes</button>
        </div>
      )}
    </div>
  );
}

export default Home;