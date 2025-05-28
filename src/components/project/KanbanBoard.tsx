
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import CardDetailModal from './CardDetailModal';

interface Board {
  id: string;
  name: string;
  position: number;
}

interface CardData {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  board_id: string;
  tags: string[];
  due_date: string | null;
}

interface KanbanBoardProps {
  projectId: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [cards, setCards] = useState<Record<string, CardData[]>>({});
  const [loading, setLoading] = useState(true);
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState('');
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
      
      const cardsByBoard: Record<string, CardData[]> = {};
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

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceBoard = source.droppableId;
    const destBoard = destination.droppableId;
    const cardId = draggableId;

    // Update local state immediately for better UX
    const newCards = { ...cards };
    const sourceCards = [...(newCards[sourceBoard] || [])];
    const destCards = sourceBoard === destBoard ? sourceCards : [...(newCards[destBoard] || [])];

    const [movedCard] = sourceCards.splice(source.index, 1);
    movedCard.board_id = destBoard;
    destCards.splice(destination.index, 0, movedCard);

    newCards[sourceBoard] = sourceCards;
    newCards[destBoard] = destCards;
    setCards(newCards);

    try {
      // Update card's board and position in database
      await supabase
        .from('cards')
        .update({
          board_id: destBoard,
          position: destination.index
        })
        .eq('id', cardId);

      // Update positions of other cards in destination board
      const updates = destCards.map((card, index) => ({
        id: card.id,
        position: index
      }));

      for (const update of updates) {
        if (update.id !== cardId) {
          await supabase
            .from('cards')
            .update({ position: update.position })
            .eq('id', update.id);
        }
      }

      // Update positions in source board if different from destination
      if (sourceBoard !== destBoard) {
        const sourceUpdates = sourceCards.map((card, index) => ({
          id: card.id,
          position: index
        }));

        for (const update of sourceUpdates) {
          await supabase
            .from('cards')
            .update({ position: update.position })
            .eq('id', update.id);
        }
      }

    } catch (error) {
      console.error('Error updating card position:', error);
      // Revert on error
      fetchBoards();
      toast({
        title: "Error",
        description: "Failed to move card. Please try again.",
        variant: "destructive",
      });
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateBoardName = async (boardId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      const { error } = await supabase
        .from('boards')
        .update({ name: newName })
        .eq('id', boardId);

      if (error) throw error;

      setBoards(boards.map(board => 
        board.id === boardId ? { ...board, name: newName } : board
      ));
      setEditingBoardId(null);
      toast({
        title: "Success",
        description: "Board name updated!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
          position: boardCards.length,
          tags: []
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openCardDetail = (card: CardData) => {
    setSelectedCard(card);
    setShowCardDetail(true);
  };

  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500'
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
                <Droppable droppableId={board.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[500px] rounded-lg border transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : 'border-gray-800'
                      }`}
                    >
                      <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800 shadow-xl">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            {editingBoardId === board.id ? (
                              <div className="flex items-center space-x-2 flex-1">
                                <Input
                                  value={editingBoardName}
                                  onChange={(e) => setEditingBoardName(e.target.value)}
                                  className="bg-gray-800 border-gray-700 text-white text-lg font-semibold"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateBoardName(board.id, editingBoardName);
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => updateBoardName(board.id, editingBoardName)}
                                  className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingBoardId(null)}
                                  className="text-gray-400 hover:text-white h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center space-x-2 cursor-pointer" 
                                     onClick={() => {
                                       setEditingBoardId(board.id);
                                       setEditingBoardName(board.name);
                                     }}>
                                  <CardTitle className="text-white text-lg">{board.name}</CardTitle>
                                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                    {(cards[board.id] || []).length}
                                  </Badge>
                                  <Edit2 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
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
                              </>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(cards[board.id] || []).map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`transition-transform ${
                                    snapshot.isDragging ? 'rotate-2 scale-105' : ''
                                  }`}
                                >
                                  <Card 
                                    className="bg-gray-800/90 backdrop-blur-sm border-gray-700 cursor-pointer hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                                    onClick={() => openCardDetail(card)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-white font-medium">{card.title}</h4>
                                        <div className={`w-3 h-3 rounded-full ${priorityColors[card.priority]}`} />
                                      </div>
                                      
                                      {card.description && (
                                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{card.description}</p>
                                      )}
                                      
                                      {card.due_date && (
                                        <div className={`text-xs px-2 py-1 rounded mb-2 inline-block ${
                                          isOverdue(card.due_date) 
                                            ? 'bg-red-500/20 text-red-400' 
                                            : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                          Due: {format(new Date(card.due_date), 'MMM d')}
                                        </div>
                                      )}
                                      
                                      {card.tags && card.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {card.tags.slice(0, 3).map((tag) => (
                                            <Badge
                                              key={tag}
                                              variant="secondary"
                                              className="text-xs bg-purple-600/20 text-purple-300"
                                            >
                                              {tag}
                                            </Badge>
                                          ))}
                                          {card.tags.length > 3 && (
                                            <Badge variant="secondary" className="text-xs bg-gray-600 text-gray-300">
                                              +{card.tags.length - 3}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Droppable>
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

        {/* Card Detail Modal */}
        <CardDetailModal
          open={showCardDetail}
          onOpenChange={setShowCardDetail}
          card={selectedCard}
          onCardUpdate={fetchBoards}
        />
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
