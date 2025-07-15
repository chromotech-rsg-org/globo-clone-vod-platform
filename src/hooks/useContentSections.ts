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
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('content_sections')
        .select('*')
        .eq('page', page)
        .eq('active', true)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      const sectionsWithItems = await Promise.all(
        sectionsData.map(async (section) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('content_items')
            .select('*')
            .eq('section_id', section.id)
            .eq('active', true)
            .order('order_index');

          if (itemsError) throw itemsError;

          return {
            id: section.id,
            title: section.title,
            type: section.type as 'horizontal' | 'vertical',
            page: section.page,
            order_index: section.order_index,
            active: section.active,
            items: itemsData || []
          };
        })
      );

      setSections(sectionsWithItems);
    } catch (error) {
      console.error('Erro ao buscar seções de conteúdo:', error);
    } finally {
      setLoading(false);
    }
  };

  return { sections, loading, refetch: fetchContentSections };
};