'use client';

import { useState } from 'react';
import { uploadCoreData, validateCoreData } from '@/utils/simple-upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<string | null>(null);

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      const success = await uploadCoreData();
      setUploadStatus(success ? '✅ Complete data upload successful!' : '❌ Upload failed!');
    } catch (error) {
      setUploadStatus(`❌ Upload error: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationStatus(null);
    
    try {
      const isValid = await validateCoreData();
      setValidationStatus(isValid ? '✅ Complete data validation passed!' : '❌ Data validation failed!');
    } catch (error) {
      setValidationStatus(`❌ Validation error: ${error}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Swiss Emergency Management Platform
          </h1>
          <p className="text-xl text-gray-600">
            Data Upload & Setup
          </p>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Firebase Data Upload</h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Complete Simulation Data</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• 1 Emergency Event (Blatten Glacier Collapse)</li>
                <li>• 5 Monitoring Stations (WSL, Seismic, Weather)</li>
                <li>• 6 Authorities (Police, FOCP, Municipality, etc.)</li>
                <li>• 31 Resources (Expanded: Fire stations, hospitals, helicopters, shelters)</li>
                <li>• 3 Evacuee Groups (Residents, tourists, livestock)</li>
                <li>• 12 Platform Events (AI detection, coordination, decisions)</li>
                <li>• 8 Resource Movements (GPS tracking, deployments)</li>
                <li>• 13 Activity Logs (System performance, efficiency metrics)</li>
              </ul>
              <p className="text-blue-700 text-sm mt-2">
                <em>Complete hackathon demo dataset with 79 total data points</em>
              </p>
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
              >
                {isUploading ? '⏳ Uploading...' : '🚀 Upload Complete Data to Firebase'}
              </Button>
              
              <Button 
                onClick={handleValidate}
                disabled={isValidating}
                variant="outline"
                className="px-6 py-3"
              >
                {isValidating ? '⏳ Validating...' : '🔍 Validate Data'}
              </Button>
            </div>

            {uploadStatus && (
              <div className={`p-4 rounded-lg ${
                uploadStatus.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={uploadStatus.includes('✅') ? 'text-green-800' : 'text-red-800'}>
                  {uploadStatus}
                </p>
              </div>
            )}

            {validationStatus && (
              <div className={`p-4 rounded-lg ${
                validationStatus.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={validationStatus.includes('✅') ? 'text-green-800' : 'text-red-800'}>
                  {validationStatus}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. <strong>Upload Data:</strong> Click the upload button above to load all simulation data to Firebase</p>
            <p>2. <strong>Validate:</strong> Use the validate button to confirm the data was uploaded correctly</p>
            <p>3. <strong>Start Simulation:</strong> Go to <a href="/simulation" className="text-blue-600 hover:underline">/simulation</a> to run the emergency scenario</p>
            <p>4. <strong>View Dashboard:</strong> Return to <a href="/" className="text-blue-600 hover:underline">/</a> to see the main dashboard</p>
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Firebase Configuration</h2>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Current Firebase Project:</p>
            <p className="font-mono text-sm">swissrehack.firebaseapp.com</p>
            <p className="text-xs text-gray-500 mt-2">
              Make sure Firestore Database is enabled in your Firebase console.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
