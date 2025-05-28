
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Note {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

interface NotesPageProps {
  projectId: string;
}

const NotesPage: React.FC<NotesPageProps> = ({ projectId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editNote, setEditNote] = useState({ title: '', content: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title: newNote.title,
          content: newNote.content || null,
          project_id: projectId
        }])
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote({ title: '', content: '' });
      setIsCreating(false);
      toast({
        title: "Success",
        description: "Note created successfully!",
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note.",
        variant: "destructive",
      });
    }
  };

  const updateNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: editNote.title,
          content: editNote.content || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.map(note => 
        note.id === noteId 
          ? { ...note, title: editNote.title, content: editNote.content, updated_at: new Date().toISOString() }
          : note
      ));
      setEditingId(null);
      toast({
        title: "Success",
        description: "Note updated successfully!",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note.",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditNote({ title: note.title, content: note.content || '' });
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
        <h2 className="text-2xl font-bold text-white">Notes</h2>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <Input
              value={newNote.title}
              onChange={(e) => setNewNote({...newNote, title: e.target.value})}
              placeholder="Note title"
              className="bg-gray-800 border-gray-700 text-white text-lg font-semibold"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newNote.content}
              onChange={(e) => setNewNote({...newNote, content: e.target.value})}
              placeholder="Write your note content here..."
              className="bg-gray-800 border-gray-700 text-white min-h-[200px]"
            />
            <div className="flex space-x-2">
              <Button onClick={createNote} size="sm" className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                onClick={() => {
                  setIsCreating(false);
                  setNewNote({ title: '', content: '' });
                }}
                size="sm" 
                variant="outline"
                className="border-gray-700 text-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !isCreating ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No notes yet</h3>
          <p className="text-gray-500 mb-6">Create your first note to start documenting your project</p>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {notes.map((note) => (
            <Card key={note.id} className="bg-gray-900 border-gray-800">
              <CardHeader>
                {editingId === note.id ? (
                  <Input
                    value={editNote.title}
                    onChange={(e) => setEditNote({...editNote, title: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white text-lg font-semibold"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{note.title}</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(note)}
                        className="text-gray-400 hover:text-white h-8 w-8 p-0"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNote(note.id)}
                        className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === note.id ? (
                  <>
                    <Textarea
                      value={editNote.content}
                      onChange={(e) => setEditNote({...editNote, content: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white min-h-[150px]"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => updateNote(note.id)}
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        onClick={() => setEditingId(null)}
                        size="sm" 
                        variant="outline"
                        className="border-gray-700 text-gray-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {note.content || 'No content'}
                    </div>
                    <div className="text-sm text-gray-500 border-t border-gray-800 pt-3">
                      Last updated: {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesPage;
