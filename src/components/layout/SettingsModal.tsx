
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Mail, Users, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange, projectId }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim() || !projectId) return;

    setIsInviting(true);
    try {
      const { error } = await supabase
        .from('project_invitations')
        .insert([{
          project_id: projectId,
          email: inviteEmail,
          invited_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Invitation sent!",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {projectId && <TabsTrigger value="collaborators">Collaborators</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{user?.email}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <Button
                    onClick={signOut}
                    variant="destructive"
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {projectId && (
            <TabsContent value="collaborators">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Project Collaborators
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Invite team members to collaborate on this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button
                      onClick={handleInviteCollaborator}
                      disabled={isInviting || !inviteEmail.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isInviting ? 'Sending...' : 'Invite'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
