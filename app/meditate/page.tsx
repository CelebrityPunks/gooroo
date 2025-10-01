import { Card } from '../../components/ui';
import { Button } from '../../components/ui';

export default function MeditatePage() {
  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-3xl mx-auto space-y-8'>
        <header className='text-center space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Start a Meditation
          </h1>
          <p className='text-gray-600'>
            Choose how you would like to begin your next session.
          </p>
        </header>

        <div className='grid gap-6 md:grid-cols-2'>
          <Card className='flex flex-col h-full justify-between space-y-4'>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Let Guru Decide
              </h2>
              <p className='text-gray-600'>
                Answer a quick check-in and let the AI Guru pick the right
                meditation technique for you.
              </p>
            </div>
            <div className='space-y-2'>
              <Button type='button' className='w-full' disabled>
                Let Guru Decide
              </Button>
              <p className='text-sm text-gray-500 text-center'>
                Flow coming soon
              </p>
            </div>
          </Card>

          <Card className='flex flex-col h-full justify-between space-y-4'>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Pick Technique
              </h2>
              <p className='text-gray-600'>
                Browse the catalog of meditation styles and jump directly into a
                live session.
              </p>
            </div>
            <div className='space-y-2'>
              <Button
                type='button'
                className='w-full'
                variant='outline'
                disabled
              >
                Pick Technique
              </Button>
              <p className='text-sm text-gray-500 text-center'>
                Technique picker under construction
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
