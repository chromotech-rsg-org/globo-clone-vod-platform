
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const auctionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  youtube_url: z.string().url().optional().or(z.literal('')),
  initial_bid_value: z.number().min(0, 'Valor inicial deve ser maior que 0'),
  bid_increment: z.number().min(0.01, 'Incremento deve ser maior que 0'),
  increment_mode: z.enum(['fixed', 'custom']),
  min_custom_bid: z.number().optional(),
  max_custom_bid: z.number().optional(),
  registration_wait_value: z.number().min(1, 'Tempo de espera deve ser maior que 0'),
  registration_wait_unit: z.enum(['minutes', 'hours', 'days']),
  auction_type: z.enum(['rural', 'judicial']),
  status: z.enum(['active', 'inactive']),
  is_live: z.boolean()
}).refine((data) => {
  if (data.increment_mode === 'custom') {
    return data.min_custom_bid !== undefined && 
           data.max_custom_bid !== undefined && 
           data.min_custom_bid < data.max_custom_bid;
  }
  return true;
}, {
  message: "Para incremento personalizado, informe valores mín. e máx. válidos",
  path: ["min_custom_bid"]
});

type AuctionFormData = z.infer<typeof auctionSchema>;

interface AuctionFormProps {
  auction?: any;
  onSuccess?: () => void;
}

const AuctionForm = ({ auction, onSuccess }: AuctionFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AuctionFormData>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      name: auction?.name || '',
      description: auction?.description || '',
      youtube_url: auction?.youtube_url || '',
      initial_bid_value: auction?.initial_bid_value || 0,
      bid_increment: auction?.bid_increment || 100,
      increment_mode: auction?.increment_mode || 'fixed',
      min_custom_bid: auction?.min_custom_bid || undefined,
      max_custom_bid: auction?.max_custom_bid || undefined,
      registration_wait_value: auction?.registration_wait_value || 5,
      registration_wait_unit: auction?.registration_wait_unit || 'minutes',
      auction_type: auction?.auction_type || 'rural',
      status: auction?.status || 'inactive',
      is_live: auction?.is_live || false
    }
  });

  const incrementMode = form.watch('increment_mode');

  const onSubmit = async (data: AuctionFormData) => {
    setLoading(true);
    try {
      const auctionData = {
        ...data,
        current_bid_value: data.initial_bid_value,
        // Only include custom bid fields if mode is custom
        min_custom_bid: data.increment_mode === 'custom' ? data.min_custom_bid : null,
        max_custom_bid: data.increment_mode === 'custom' ? data.max_custom_bid : null,
      };

      if (auction?.id) {
        const { error } = await supabase
          .from('auctions')
          .update(auctionData)
          .eq('id', auction.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Leilão atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('auctions')
          .insert(auctionData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Leilão criado com sucesso"
        });
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving auction:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar leilão",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {auction?.id ? 'Editar Leilão' : 'Novo Leilão'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Leilão</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Leilão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rural">Rural</SelectItem>
                        <SelectItem value="judicial">Judicial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtube_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do YouTube (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://youtube.com/watch?v=..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="initial_bid_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lance Inicial (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="increment_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modo de Incremento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Incremento Fixo</SelectItem>
                        <SelectItem value="custom">Incremento Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {incrementMode === 'fixed' && (
              <FormField
                control={form.control}
                name="bid_increment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incremento Fixo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {incrementMode === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_custom_bid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lance Mínimo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_custom_bid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lance Máximo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registration_wait_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de Espera para Nova Habilitação</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registration_wait_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Tempo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_live"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Transmissão Ao Vivo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Salvando...' : auction?.id ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AuctionForm;
