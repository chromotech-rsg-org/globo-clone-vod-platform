
import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutFooter = () => {
  return (
    <div className="mt-6 text-center space-y-2">
      <p className="text-gray-400 text-sm">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-blue-400 hover:text-blue-300">
          Faça login
        </Link>
      </p>
      <p className="text-gray-400 text-sm">
        Ou{' '}
        <Link to="/" className="text-green-400 hover:text-green-300">
          Voltar para home
        </Link>
      </p>
    </div>
  );
};

export default CheckoutFooter;
