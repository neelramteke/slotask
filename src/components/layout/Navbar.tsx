
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Zap, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Zap className="h-8 w-8 text-purple-500" />
          <h1 className="text-2xl font-bold text-white">SloTask</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-300">
            <User className="h-4 w-4" />
            <span className="text-sm">{user?.email}</span>
          </div>
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
