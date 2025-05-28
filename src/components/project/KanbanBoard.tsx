
import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Board {
  id: string;
  name: string;
  position: number;
}

interface Card {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  board_id: string;
}

interface KanbanBoardProps {
  projectId: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [cards, setCards] = useState<Record<string, Card[]>>({});
  const [loading, setLoading] = useState(true);
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [newBoard, setNewBoard] = useState({ name: '' });
  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    priority: 'medium' as const
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBoards();
  }, [projectId]);

  const fetchBoards = async () => {
    try {
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .eq('project_id', projectId)
        .order('position');

      if (boardsError) throw boardsError;

      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .in('board_id', boardsData?.map(b => b.id) || [])
        .order('position');

      if (cardsError) throw cardsError;

      setBoards(boardsData || []);
      
      const cardsByBoard: Record<string, Card[]> = {};
      (cardsData || []).forEach(card => {
        if (!cardsByBoard[card.board_id]) {
          cardsByBoard[card.board_id] = [];
        }
        cardsByBoard[card.board_id].push(card);
      });
      setCards(cardsByBoard);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async () => {
    if (!newBoard.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([{
          name: newBoard.name,
          project_id: projectId,
          position: boards.length
        }])
        .select()
        .single();

      if (error) throw error;

      setBoards([...boards, data]);
      setNewBoard({ name: '' });
      setShowBoardDialog(false);
      toast({
        title: "Success",
        description: "Board created successfully!",
      });
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: "Error",
        description: "Failed to create board.",
        variant: "destructive",
      });
    }
  };

  const createCard = async () => {
    if (!newCard.title.trim() || !selectedBoardId) return;

    try {
      const boardCards = cards[selectedBoardId] || [];
      const { data, error } = await supabase
        .from('cards')
        .insert([{
          title: newCard.title,
          description: newCard.description || null,
          priority: newCard.priority,
          board_id: selectedBoardId,
          position: boardCards.length
        }])
        .select()
        .single();

      if (error) throw error;

      setCards({
        ...cards,
        [selectedBoardId]: [...boardCards, data]
      });
      setNewCard({ title: '', description: '', priority: 'medium' });
      setShowCardDialog(false);
      setSelectedBoardId('');
      toast({
        title: "Success",
        description: "Card created successfully!",
      });
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Error",
        description: "Failed to create card.",
        variant: "destructive",
      });
    }
  };

  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500'
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
        <h2 className="text-2xl font-bold text-white">Kanban Board</h2>
        <Dialog open={showBoardDialog} onOpenChange={setShowBoardDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Board
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Board</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new board to organize your tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="boardName" className="text-gray-300">Board Name</Label>
                <Input
                  id="boardName"
                  value={newBoard.name}
                  onChange={(e) => setNewBoard({name: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  placeholder="Enter board name"
                />
              </div>
              <Button onClick={createBoard} className="w-full bg-purple-600 hover:bg-purple-700">
                Create Board
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No boards yet</h3>
          <p className="text-gray-500 mb-6">Create your first board to start organizing tasks</p>
          <Dialog open={showBoardDialog} onOpenChange={setShowBoardDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Board
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : (
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {boards.map((board) => (
            <div key={board.id} className="flex-shrink-0 w-80">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{board.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedBoardId(board.id)}
                            className="text-gray-400 hover:text-white h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(cards[board.id] || []).map((card) => (
                    <Card key={card.id} className="bg-gray-800 border-gray-700 cursor-pointer hover:border-purple-500 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-medium">{card.title}</h4>
                          <div className={`w-3 h-3 rounded-full ${priorityColors[card.priority]}`} />
                        </div>
                        {card.description && (
                          <p className="text-gray-400 text-sm">{card.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Create Card Dialog */}
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Card</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new task card to your board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardTitle" className="text-gray-300">Title</Label>
              <Input
                id="cardTitle"
                value={newCard.title}
                onChange={(e) => setNewCard({...newCard, title: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white mt-1"
                placeholder="Enter card title"
              />
            </div>
            <div>
              <Label htmlFor="cardDescription" className="text-gray-300">Description</Label>
              <Textarea
                id="cardDescription"
                value={newCard.description}
                onChange={(e) => setNewCard({...newCard, description: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white mt-1"
                placeholder="Card description (optional)"
              />
            </div>
            <div>
              <Label className="text-gray-300">Priority</Label>
              <Select value={newCard.priority} onValueChange={(value: any) => setNewCard({...newCard, priority: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createCard} className="w-full bg-purple-600 hover:bg-purple-700">
              Create Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KanbanBoard;
