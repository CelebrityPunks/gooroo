import React from 'react';
import { Button, Card } from '../components/ui';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          AI Guru Meditation
        </h1>
        <p className="text-center text-lg text-gray-600 mb-8">
          A voice-first meditation app where users speak to an AI Guru who guides meditation in real time
        </p>
        
        <Card className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Get Started</h2>
          <div className="space-y-3">
            <Button className="w-full" size="lg">
              Let Guru Decide
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              Pick Technique
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
