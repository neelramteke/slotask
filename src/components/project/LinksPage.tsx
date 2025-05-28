
import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Link {
  id: string;
  title: string;
  url: string;
  description: string | null;
  favicon_url: string | null;
  created_at: string;
}

interface LinksPageProps {
  projectId: string;
}

const LinksPage: React.FC<LinksPageProps> = ({ projectId }) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, [projectId]);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    // Ensure URL has protocol
    let formattedUrl = newLink.url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const { data, error } = await supabase
        .from('links')
        .insert([{
          title: newLink.title,
          url: formattedUrl,
          description: newLink.description || null,
          project_id: projectId
        }])
        .select()
        .single();

      if (error) throw error;

      setLinks([data, ...links]);
      setNewLink({ title: '', url: '', description: '' });
      setShowDialog(false);
      toast({
        title: "Success",
        description: "Link added successfully!",
      });
    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: "Error",
        description: "Failed to add link.",
        variant: "destructive",
      });
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setLinks(links.filter(link => link.id !== linkId));
      toast({
        title: "Success",
        description: "Link deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: "Error",
        description: "Failed to delete link.",
        variant: "destructive",
      });
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Link Repository</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Link</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add an important link to your project repository.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="linkTitle" className="text-gray-300">Title</Label>
                <Input
                  id="linkTitle"
                  value={newLink.title}
                  onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  placeholder="Enter link title"
                />
              </div>
              <div>
                <Label htmlFor="linkUrl" className="text-gray-300">URL</Label>
                <Input
                  id="linkUrl"
                  value={newLink.url}
                  onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label htmlFor="linkDescription" className="text-gray-300">Description</Label>
                <Textarea
                  id="linkDescription"
                  value={newLink.description}
                  onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  placeholder="Link description (optional)"
                />
              </div>
              <Button onClick={createLink} className="w-full bg-purple-600 hover:bg-purple-700">
                Add Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No links yet</h3>
          <p className="text-gray-500 mb-6">Add important project links to keep them organized</p>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Link
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link) => (
            <Card key={link.id} className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg truncate flex-1 mr-2">{link.title}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteLink(link.id)}
                    className="text-gray-400 hover:text-red-400 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Globe className="h-4 w-4" />
                  <span className="truncate">{getDomain(link.url)}</span>
                </div>
                {link.description && (
                  <p className="text-gray-300 text-sm">{link.description}</p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">
                    Added {new Date(link.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => window.open(link.url, '_blank')}
                    className="bg-purple-600 hover:bg-purple-700 h-8"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LinksPage;
