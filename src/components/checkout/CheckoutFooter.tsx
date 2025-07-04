
import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutFooter = () => {
  return (
    <div className="mt-6 text-center">
      <p className="text-gray-400 text-sm">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-blue-400 hover:text-blue-300">
          Faça login
        </Link>
      </p>
    </div>
  );
};

export default CheckoutFooter;
