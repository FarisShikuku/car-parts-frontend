import { useState } from 'react';
import { matchImage, getSubmissionDetail } from '../api/client';
import type { Match } from '../types';

export const TestMatch = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState('+1234567890');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageUrl('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    if (e.target.value) {
      setImagePreview(e.target.value);
      setImageFile(null);
    }
  };

  const uploadFileToTemp = async (file: File): Promise<string> => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/vision/submissions/upload-temp/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    return data.image_url;
  };

  const handleMatch = async () => {
    setLoading(true);
    setError('');
    setMatches([]);

    try {
      let finalImageUrl = imageUrl;

      if (uploadMethod === 'file' && imageFile) {
        try {
          finalImageUrl = await uploadFileToTemp(imageFile);
          setImagePreview(finalImageUrl);
        } catch (uploadErr: any) {
          setError(uploadErr.message || 'Failed to upload image');
          setLoading(false);
          return;
        }
      }

      if (!finalImageUrl) {
        setError('Please provide an image URL or select a file');
        setLoading(false);
        return;
      }

      const res = await matchImage(finalImageUrl, customerPhone);
      const submissionId = res.data.submission_id;

      console.log('Match initiated, submission ID:', submissionId);

      // Poll for results – allow up to 90 seconds (max 60 attempts * 1500ms)
      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const detail = await getSubmissionDetail(submissionId);
          console.log(`Poll attempt ${attempts}:`, detail.data);

          if (detail.data.status === 'processed' && detail.data.matches) {
            if (detail.data.matches.length > 0) {
              setMatches(detail.data.matches);
              clearInterval(pollInterval);
              setLoading(false);
            } else {
              setError('No matches found for this image');
              clearInterval(pollInterval);
              setLoading(false);
            }
          } else if (detail.data.status === 'failed') {
            setError('Matching failed. Please try a different image.');
            clearInterval(pollInterval);
            setLoading(false);
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setError('Matching is taking too long. Please try again later.');
            setLoading(false);
          }
        } catch (err) {
          console.error('Polling error:', err);
          if (attempts >= maxAttempts) {
            setError('Failed to retrieve results. Check backend logs.');
            clearInterval(pollInterval);
            setLoading(false);
          }
        }
      }, 1500);

    } catch (err: any) {
      console.error('Match error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to process image');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Image Matching (Gemini AI)</h1>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-6">
        <div className="space-y-4">
          <div className="flex gap-4 border-b pb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="url"
                checked={uploadMethod === 'url'}
                onChange={() => setUploadMethod('url')}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Image URL</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="file"
                checked={uploadMethod === 'file'}
                onChange={() => setUploadMethod('file')}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Upload File</span>
            </label>
          </div>

          {uploadMethod === 'url' && (
            <div>
              <label className="block text-sm font-medium mb-1">Customer Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/car-part.jpg"
                className="w-full p-2 border rounded-lg dark:bg-slate-700"
              />
            </div>
          )}

          {uploadMethod === 'file' && (
            <div>
              <label className="block text-sm font-medium mb-1">Upload Customer Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded-lg dark:bg-slate-700"
              />
            </div>
          )}

          {imagePreview && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full max-h-48 rounded-lg border object-contain"
                onError={() => setError('Invalid image URL')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Customer Phone (optional)</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full p-2 border rounded-lg dark:bg-slate-700"
            />
          </div>

          <button
            onClick={handleMatch}
            disabled={loading || (uploadMethod === 'url' ? !imageUrl : !imageFile)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing with Gemini AI...' : 'Run Gemini Match'}
          </button>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}
        </div>
      </div>

      {matches.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">🎯 Top Matches from Gemini AI</h2>
          <div className="space-y-4">
            {matches.map((match, idx) => (
              <div key={idx} className="border rounded-lg p-4 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                        Rank #{match.rank || idx + 1}
                      </span>
                      <p className="font-bold text-lg">{match.product.name}</p>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">SKU: {match.product.sku}</p>
                    <div className="flex gap-4 mt-2">
                      <p className="text-sm">
                        📦 Stock: <span className={match.product.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}>
                          {match.product.stock_quantity}
                        </span>
                      </p>
                      <p className="text-sm">💰 Price: KES {match.product.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">
                      {(match.similarity_score * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-slate-500">similarity</p>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${match.similarity_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};