
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Calendar, Users, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/layout/Navbar';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
}

const HomePage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: newProject.name,
          description: newProject.description || null,
          color: newProject.color,
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setNewProject({ name: '', description: '', color: '#6366f1' });
      setShowDialog(false);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <div className="px-6 py-12 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="h-12 w-12 text-purple-400 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to <span className="text-purple-400">SloTask</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Organize your projects, manage tasks, and collaborate with your team in a beautiful, intuitive workspace.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Folder className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{projects.length}</div>
                <div className="text-gray-400">Projects</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-gray-400">Due Today</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">1</div>
                <div className="text-gray-400">Team Members</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">85%</div>
                <div className="text-gray-400">Productivity</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Your Projects</h2>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Project</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Start a new project to organize your tasks and collaborate with your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Project Name</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                      placeholder="Enter project name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                      placeholder="Project description (optional)"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Color</Label>
                    <div className="flex space-x-2 mt-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewProject({...newProject, color})}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newProject.color === color ? 'border-white' : 'border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={createProject} 
                    disabled={isCreating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isCreating ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Create your first project to get started</p>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link key={project.id} to={`/project/${project.id}`}>
                  <Card className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 group cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <CardTitle className="text-white group-hover:text-purple-300 transition-colors">
                          {project.name}
                        </CardTitle>
                      </div>
                      {project.description && (
                        <CardDescription className="text-gray-400">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
