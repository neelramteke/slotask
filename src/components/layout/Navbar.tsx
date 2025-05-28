
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Zap, Settings } from 'lucide-react';
import { useParams } from 'react-router-dom';
import SettingsModal from './SettingsModal';

const Navbar = () => {
  const { user } = useAuth();
  const { projectId } = useParams();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">SloTask</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
        projectId={projectId}
      />
    </>
  );
};

export default Navbar;
