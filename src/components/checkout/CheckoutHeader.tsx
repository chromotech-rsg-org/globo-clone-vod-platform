
import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomizations } from '@/hooks/useCustomizations';

const CheckoutHeader = () => {
  const { getCustomization } = useCustomizations('global');
  
  const siteName = getCustomization('global_site_name', 'Globoplay');
  const logoUrl = getCustomization('global_logo_url', '');

  return (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center space-x-2">
        {logoUrl ? (
          <img src={logoUrl} alt={siteName} className="h-8 w-auto" />
        ) : (
          <div className="bg-green-600 text-white px-3 py-1 rounded font-bold text-xl">
            {siteName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-white font-bold text-2xl">{siteName}</span>
      </Link>
    </div>
  );
};

export default CheckoutHeader;
