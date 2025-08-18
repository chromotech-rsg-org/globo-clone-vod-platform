
import React from 'react';
import HeroSliderEditor from '@/components/admin/HeroSliderEditor';

const AdminHeroSlider = () => {
  return (
    <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-sidebar-text">Gerenciar Hero Slider</h1>
        </div>
      </header>
      
      <div className="p-6">
        <HeroSliderEditor />
      </div>
    </>
  );
};

export default AdminHeroSlider;
