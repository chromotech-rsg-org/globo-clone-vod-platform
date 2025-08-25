
import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useUserProfile();
  const { toast } = useToast();

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateProfile({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
      });
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar suas informações.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-admin-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-admin-text mb-2">Meu Perfil</h1>
          <p className="text-admin-muted-foreground">
            Gerencie suas informações pessoais e configurações da conta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-text flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-admin-muted rounded-lg">
                <Mail className="h-4 w-4 text-admin-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-admin-text">{user?.email}</p>
                  <p className="text-xs text-admin-muted-foreground">Email da conta</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-admin-muted rounded-lg">
                <Shield className="h-4 w-4 text-admin-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-admin-text capitalize">{user?.role || 'user'}</p>
                  <p className="text-xs text-admin-muted-foreground">Tipo de conta</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-admin-muted rounded-lg">
                <Calendar className="h-4 w-4 text-admin-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-admin-text">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-xs text-admin-muted-foreground">Membro desde</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <div className="lg:col-span-2">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-text">Editar Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-admin-text">Nome Completo</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={profile?.name || ''}
                        className="bg-admin-muted border-admin-border text-admin-text"
                        placeholder="Digite seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-admin-text">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={profile?.email || user?.email || ''}
                        className="bg-admin-muted border-admin-border text-admin-text"
                        placeholder="Digite seu email"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-admin-primary hover:bg-admin-primary/90">
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
