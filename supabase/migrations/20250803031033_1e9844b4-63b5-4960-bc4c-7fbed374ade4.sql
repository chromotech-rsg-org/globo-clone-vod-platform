-- Adicionar campos para controle de tempo de espera de habilitação
ALTER TABLE auctions 
ADD COLUMN registration_wait_value INTEGER DEFAULT 5,
ADD COLUMN registration_wait_unit TEXT DEFAULT 'minutes' CHECK (registration_wait_unit IN ('minutes', 'hours', 'days'));

-- Comentários para documentação
COMMENT ON COLUMN auctions.registration_wait_value IS 'Valor do tempo de espera para nova habilitação';
COMMENT ON COLUMN auctions.registration_wait_unit IS 'Unidade do tempo de espera: minutes, hours, days';