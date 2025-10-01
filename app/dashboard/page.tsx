import React from 'react';
import { Card } from '../../components/ui';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
            <p className="text-gray-600">No sessions yet</p>
          </Card>
          
          <Card>
            <h2 className="text-xl font-semibold mb-4">Total Minutes</h2>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </Card>
          
          <Card>
            <h2 className="text-xl font-semibold mb-4">Current Streak</h2>
            <p className="text-2xl font-bold text-green-600">0 days</p>
          </Card>
        </div>
        
        <div className="mt-8">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Start New Session</h2>
            <p className="text-gray-600 mb-4">Ready to begin your meditation journey?</p>
            <div className="space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Let Guru Decide
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
                Pick Technique
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
