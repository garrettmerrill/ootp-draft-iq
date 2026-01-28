'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<{ total: number; batters: number; pitchers: number } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/players/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(true);
      setStats(data.stats);
      
      // Redirect to draft board after short delay
      setTimeout(() => {
        router.push('/dashboard/draft');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dugout-900 dark:text-white">
          Upload Draft Data
        </h1>
        <p className="text-dugout-500 dark:text-dugout-400 mt-1">
          Import your OOTP Baseball CSV export file
        </p>
      </div>

      {/* Success state */}
      {success && stats && (
        <div className="card p-6 border-l-4 border-l-greenFlag">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-greenFlag/10">
              <CheckCircle className="w-6 h-6 text-greenFlag" />
            </div>
            <div>
              <h2 className="font-semibold text-dugout-900 dark:text-white">
                Upload Successful!
              </h2>
              <p className="text-sm text-dugout-500 dark:text-dugout-400 mt-1">
                Imported {stats.total} players ({stats.batters} batters, {stats.pitchers} pitchers)
              </p>
              <p className="text-sm text-dugout-400 dark:text-dugout-500 mt-2">
                Redirecting to draft board...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card p-4 border-l-4 border-l-redFlag">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-redFlag flex-shrink-0" />
            <p className="text-sm text-redFlag">{error}</p>
          </div>
        </div>
      )}

      {/* Upload area */}
      {!success && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`card p-8 border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-diamond-500 bg-diamond-50 dark:bg-diamond-950/20'
              : file
              ? 'border-greenFlag bg-greenFlag/5'
              : 'border-dugout-300 dark:border-dugout-700'
          }`}
        >
          <div className="text-center">
            {file ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-greenFlag/10 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-greenFlag" />
                </div>
                <h3 className="font-semibold text-dugout-900 dark:text-white">
                  {file.name}
                </h3>
                <p className="text-sm text-dugout-500 dark:text-dugout-400 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setFile(null)}
                    className="btn-secondary btn-sm"
                    disabled={uploading}
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn-primary btn-sm"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload & Analyze
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-dugout-100 dark:bg-dugout-800 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-dugout-400" />
                </div>
                <h3 className="font-semibold text-dugout-900 dark:text-white">
                  Drop your CSV file here
                </h3>
                <p className="text-sm text-dugout-500 dark:text-dugout-400 mt-1">
                  or click to browse
                </p>
                <label className="btn-primary btn-sm mt-6 cursor-pointer inline-flex">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  Select File
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card p-6">
        <h2 className="font-semibold text-dugout-900 dark:text-white mb-4">
          How to Export from OOTP
        </h2>
        <ol className="space-y-3 text-sm text-dugout-600 dark:text-dugout-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-diamond-100 dark:bg-diamond-900 text-diamond-700 dark:text-diamond-300 flex items-center justify-center text-xs font-medium">
              1
            </span>
            <span>Open your OOTP Baseball game and go to the draft pool</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-diamond-100 dark:bg-diamond-900 text-diamond-700 dark:text-diamond-300 flex items-center justify-center text-xs font-medium">
              2
            </span>
            <span>Select all players and choose Export to CSV</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-diamond-100 dark:bg-diamond-900 text-diamond-700 dark:text-diamond-300 flex items-center justify-center text-xs font-medium">
              3
            </span>
            <span>Make sure to include all available columns in the export</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-diamond-100 dark:bg-diamond-900 text-diamond-700 dark:text-diamond-300 flex items-center justify-center text-xs font-medium">
              4
            </span>
            <span>Upload the saved CSV file here</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
