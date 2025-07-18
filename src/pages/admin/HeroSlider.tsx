import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import HeroSliderEditor from '@/components/admin/HeroSliderEditor';

const AdminHeroSlider = () => {
  return (
    <AdminLayout>
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Slider Hero</h1>
          <p className="text-gray-400">Configure as imagens e conteúdo do banner principal</p>
        </div>
      </header>

      <div className="p-6">
        <HeroSliderEditor />
      </div>
    </AdminLayout>
  );
};

export default AdminHeroSlider;