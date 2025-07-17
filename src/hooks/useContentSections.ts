import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContentItem {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  rating: string | null;
  order_index: number;
}

interface ContentSection {
  id: string;
  title: string;
  type: 'horizontal' | 'vertical';
  page: string;
  order_index: number;
  active: boolean;
  items: ContentItem[];
}

export const useContentSections = (page: string) => {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContentSections();
  }, [page]);

  const fetchContentSections = async () => {
    try {
      // Buscar seções com seus itens em uma única query usando join
      const { data, error } = await supabase
        .from('content_sections')
        .select(`
          *,
          content_items (
            id,
            title,
            image_url,
            category,
            rating,
            order_index,
            active
          )
        `)
        .eq('page', page)
        .eq('active', true)
        .order('order_index');

      if (error) throw error;

      if (!data || data.length === 0) {
        setSections([]);
        return;
      }

      // Filtrar e mapear as seções com itens ativos
      const sectionsWithFilteredItems = data.map(section => ({
        id: section.id,
        title: section.title,
        type: section.type as 'horizontal' | 'vertical',
        page: section.page,
        order_index: section.order_index,
        active: section.active,
        items: (section.content_items || [])
          .filter(item => item.active)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      }));

      setSections(sectionsWithFilteredItems);
    } catch (error) {
      console.error('Erro ao buscar seções de conteúdo:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  return { sections, loading, refetch: fetchContentSections };
};