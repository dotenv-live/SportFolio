import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* 404 */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-white">
            404
          </div>
        </div>

        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center mx-auto">
            <Search className="h-10 w-10 text-neutral-500" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-neutral-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link to="/">
            <Button className="w-full bg-white hover:bg-neutral-200 text-black font-medium h-11">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="outline" className="w-full border-white/[0.08] text-white hover:bg-white/5 h-11">
              Browse Athletes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
