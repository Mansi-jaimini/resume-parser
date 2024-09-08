import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [details, setDetails] = useState({
    name: '',
    mobile: '',
    email: '',
    education: '',
    experience: '',
    skills: ''
  });
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const result = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDetails(result.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error uploading file.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails(prevDetails => ({
      ...prevDetails,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/update', details);
      alert('Details updated successfully!');
    } catch (error) {
      console.error('Error updating details:', error);
      setError('Error updating details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Resume Parser</h1>
        <input 
          type="file" 
          accept=".pdf,.docx" 
          onChange={handleFileChange} 
          className="mb-4"
        />
        <button 
          onClick={handleUpload} 
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Upload
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Extracted Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Name:</label>
              <input
                type="text"
                name="name"
                value={details.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-gray-700">Mobile:</label>
              <input
                type="text"
                name="mobile"
                value={details.mobile}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-gray-700">Email:</label>
              <input
                type="email"
                name="email"
                value={details.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-gray-700">Education:</label>
              <textarea
                name="education"
                value={details.education}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-gray-700">Experience:</label>
              <textarea
                name="experience"
                value={details.experience}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="4"
              />
            </div>
           
            <div>
              <label className="block text-gray-700">Skills:</label>
              <textarea
                name="skills"
                value={details.skills}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="4"
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Update Details
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
