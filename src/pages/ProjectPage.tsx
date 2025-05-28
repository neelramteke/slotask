
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Kanban, FileText, Link as LinkIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import KanbanBoard from '@/components/project/KanbanBoard';
import NotesPage from '@/components/project/NotesPage';
import LinksPage from '@/components/project/LinksPage';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="kanban" className="space-y-6">
            <TabsList className="bg-gray-900 border-gray-800">
              <TabsTrigger value="kanban" className="data-[state=active]:bg-purple-600">
                <Kanban className="h-4 w-4 mr-2" />
                Kanban Board
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-purple-600">
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="links" className="data-[state=active]:bg-purple-600">
                <LinkIcon className="h-4 w-4 mr-2" />
                Links
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kanban">
              <KanbanBoard projectId={project.id} />
            </TabsContent>

            <TabsContent value="notes">
              <NotesPage projectId={project.id} />
            </TabsContent>

            <TabsContent value="links">
              <LinksPage projectId={project.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
