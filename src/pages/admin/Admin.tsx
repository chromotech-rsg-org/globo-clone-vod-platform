
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Users from './Users';
import Packages from './Packages';
import Plans from './Plans';
import Subscriptions from './Subscriptions';
import Coupons from './Coupons';
import Auctions from './Auctions';
import Registrations from './Registrations';
import Bids from './Bids';
import Customization from './Customization';

const Admin = () => {
  return (
    <Routes>
      <Route path="usuarios" element={<Users />} />
      <Route path="pacotes" element={<Packages />} />
      <Route path="planos" element={<Plans />} />
      <Route path="assinaturas" element={<Subscriptions />} />
      <Route path="cupons" element={<Coupons />} />
      <Route path="leiloes" element={<Auctions />} />
      <Route path="habilitacoes" element={<Registrations />} />
      <Route path="lances" element={<Bids />} />
      <Route path="personalizacao" element={<Customization />} />
    </Routes>
  );
};

export default Admin;
