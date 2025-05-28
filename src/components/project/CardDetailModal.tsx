
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, MessageSquare, Tag, X, Send } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface CardDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: any;
  onCardUpdate: () => void;
}

const CardDetailModal: React.FC<CardDetailModalProps> = ({ 
  open, 
  onOpenChange, 
  card, 
  onCardUpdate 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(card?.tags || []);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    card?.due_date ? new Date(card.due_date) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (card?.id) {
      fetchComments();
      setTags(card.tags || []);
      setDueDate(card.due_date ? new Date(card.due_date) : undefined);
    }
  }, [card?.id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('card_id', card.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          card_id: card.id,
          user_id: user?.id,
          content: newComment
        }]);

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag)) return;
    
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    updateCardTags(updatedTags);
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    updateCardTags(updatedTags);
  };

  const updateCardTags = async (newTags: string[]) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ tags: newTags })
        .eq('id', card.id);

      if (error) throw error;
      onCardUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateDueDate = async (date: Date | undefined) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ due_date: date?.toISOString() || null })
        .eq('id', card.id);

      if (error) throw error;
      
      setDueDate(date);
      onCardUpdate();
      
      toast({
        title: "Due date updated",
        description: date ? `Due date set to ${format(date, 'PPP')}` : "Due date removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{card.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {card.description && (
            <div>
              <Label className="text-gray-300">Description</Label>
              <p className="text-gray-400 mt-1">{card.description}</p>
            </div>
          )}

          {/* Due Date */}
          <div>
            <Label className="text-gray-300">Due Date</Label>
            <div className="mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Set due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={updateDueDate}
                    initialFocus
                    className="bg-gray-800"
                  />
                  {dueDate && (
                    <div className="p-3 border-t border-gray-700">
                      <Button
                        onClick={() => updateDueDate(undefined)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-gray-400 hover:text-white"
                      >
                        Clear due date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-gray-300 flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </Label>
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(tag)}
                      className="ml-1 h-auto p-0 text-white hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button onClick={addTag} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <Label className="text-gray-300 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments ({comments.length})
            </Label>
            
            <div className="mt-2 space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-3">
                    <div className="text-sm text-gray-400 mb-1">
                      {format(new Date(comment.created_at), 'PPp')}
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white resize-none"
                  rows={2}
                />
                <Button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardDetailModal;
