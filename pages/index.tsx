import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          FibreFlow DROPS Quality Control
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Velocity Fibre 14-Step Home Install Capture Checklist Management System
        </p>
        <div className="space-x-4">
          <Link
            href="/dashboard/drops-reviews"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to DROPS Dashboard
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Projects Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}