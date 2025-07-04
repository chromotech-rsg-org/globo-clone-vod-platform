
import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutHeader = () => {
  return (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center space-x-2">
        <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">G</div>
        <span className="text-white font-bold text-2xl">Globoplay</span>
      </Link>
    </div>
  );
};

export default CheckoutHeader;
