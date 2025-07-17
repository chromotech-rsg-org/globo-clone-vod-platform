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

  const fetchContentSections = async () => {
    try {
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('content_sections')
        .select('*')
        .eq('page', page)
        .eq('active', true)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('content_items')
        .select('*')
        .eq('active', true)
        .order('order_index');

      if (itemsError) throw itemsError;

      const sectionsWithItems = (sectionsData || []).map(section => ({
        ...section,
        type: section.type as 'horizontal' | 'vertical',
        items: (itemsData || [])
          .filter(item => item.section_id === section.id)
          .sort((a, b) => a.order_index - b.order_index)
      }));

      setSections(sectionsWithItems);
    } catch (error) {
      console.error('Erro ao buscar seções de conteúdo:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentSections();
    
    // Listener para atualizações de conteúdo
    const handleContentUpdate = () => {
      fetchContentSections();
    };
    
    window.addEventListener('contentUpdated', handleContentUpdate);
    
    return () => {
      window.removeEventListener('contentUpdated', handleContentUpdate);
    };
  }, [page]);

  return { sections, loading, refetch: fetchContentSections };
};