
import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <main className="max-w-4xl w-full bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">LoRAForge</h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Enhanced Dataset Studio for LoRA Fine-Tuning
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
              Get Started
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition">
              Documentation
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Backend API Status: <span className="text-green-600 font-medium">Checking...</span>
          </p>
        </div>
      </main>
    </div>
  );
}
