'use client';

import React from 'react';
import { Card } from '../../components/ui';
import { useAuth } from '../../components/auth/AuthProvider';
import { Button } from '../../components/ui';

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
        
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
