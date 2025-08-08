import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Source {
  id: number;
  name: string;
  description: string;
  launch_date: string;
  image_url: string;
  type: string;
  status: string;
}

const Sources: React.FC = () => {
  const [images, setImages] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('/api/sources');
        setImages(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch space images');
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">NASA Space Images</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {image.image_url && (
              <img
                src={image.image_url}
                alt={image.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{image.name}</h2>
              <p className="text-gray-600 mb-2 line-clamp-3">{image.description}</p>
              <p className="text-sm text-gray-500 mb-4">
                {image.launch_date && new Date(image.launch_date).toLocaleDateString()}
              </p>
              {image.image_url && (
                <a
                  href={image.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  View Full Image
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sources; 