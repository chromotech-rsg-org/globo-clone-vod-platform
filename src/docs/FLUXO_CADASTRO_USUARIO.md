# Fluxo de Cadastro de Usuário com Integração MOTV

## Visão Geral

Este documento descreve o fluxo completo de cadastro de usuários implementado para integração com a API do MOTV. O fluxo é robusto, seguro e segue as melhores práticas de desenvolvimento.

## Arquitetura

### Serviços Implementados

1. **UserRegistrationFlowService** (`src/services/userRegistrationFlow.ts`)
   - Serviço principal que gerencia todo o fluxo de cadastro
   - Implementa a lógica de negócio completa
   - Integra com API MOTV e Supabase

2. **UserRegistrationForm** (`src/components/UserRegistrationForm.tsx`)
   - Componente de interface para cadastro de usuários
   - Validação de formulário client-side
   - Seleção opcional de planos

3. **Páginas**
   - `src/pages/Register.tsx` - Página de cadastro
   - `src/pages/ResetPassword.tsx` - Página de redefinição de senha

## Fluxo de Cadastro

### 1. Verificação de Usuário Existente

**Endpoint:** `Customer Find (Buscar Cliente)`

```typescript
POST /api/customer/getDataV2
{
  "data": {
    "email": "usuario@exemplo.com"
  }
}
```

### 2. Cenários de Resposta

#### 2.1 Usuário NÃO Existe no MOTV

1. **Criar usuário no MOTV**
   ```typescript
   POST /api/integration/createMotvCustomer
   {
     "data": {
       "name": "Nome Usuário",
       "login": "usuario@exemplo.com",
       "password": "senha123",
       "email": "usuario@exemplo.com",
       "cpf": "123.456.789-00",
       "phone": "(11) 99999-9999"
     }
   }
   ```

2. **Criar usuário no sistema local**
   - Registrar no Supabase Auth
   - Criar perfil no banco de dados
   - Salvar `viewers_id` do MOTV

3. **Gerenciar planos**
   - Se plano selecionado: cancelar existentes → aplicar novo
   - Se nenhum plano: aplicar pacote de suspensão

#### 2.2 Usuário EXISTE no MOTV - Autenticação Bem-sucedida

1. **Autenticar no MOTV**
   ```typescript
   POST /api/devices/motv/apiLoginV2
   {
     "data": {
       "login": "usuario@exemplo.com",
       "password": "senha123",
       "vendors_id": 6843842
     }
   }
   ```

2. **Criar no sistema local**
   - Registrar no Supabase Auth com senha fornecida
   - Buscar histórico de planos no MOTV
   - Atribuir pacote baseado no histórico
   - Realizar login automático

#### 2.3 Usuário EXISTE no MOTV - Autenticação Falha

1. **Criar com senha temporária**
   - Registrar no Supabase Auth com hash provisória
   - Buscar histórico de planos no MOTV
   - Atribuir pacote baseado no histórico
   - Solicitar redefinição de senha

### 3. Gerenciamento de Pacotes de Suspensão

```typescript
// Buscar pacote de suspensão
const suspensionPackage = await getSuspensionPackage();

if (suspensionPackage.code === "0") {
  // Cancelar todos os planos
  await cancelAllPlansInMotv(viewersId);
} else {
  // Cancelar planos existentes e aplicar suspensão
  await cancelAllPlansInMotv(viewersId);
  await subscribePlanInMotv(viewersId, suspensionPackage.code);
}
```

## Endpoints MOTV Utilizados

### Customer Find
- **URL:** `/api/customer/getDataV2`
- **Método:** POST
- **Função:** Verificar se usuário existe no MOTV

### Customer Create
- **URL:** `/api/integration/createMotvCustomer`
- **Método:** POST
- **Função:** Criar usuário no MOTV

### Authenticate
- **URL:** `/api/devices/motv/apiLoginV2`
- **Método:** POST
- **Função:** Autenticar usuário no MOTV

### Plan History
- **URL:** `/api/subscription/getCustomerSubscriptionInfo`
- **Método:** POST
- **Função:** Buscar histórico de planos do usuário

### Subscribe Plan
- **URL:** `/api/integration/subscribe`
- **Método:** POST
- **Função:** Criar/atribuir plano ao usuário

### Cancel Plan
- **URL:** `/api/integration/cancel`
- **Método:** POST
- **Função:** Cancelar planos do usuário

## Segurança

### Autenticação API MOTV
```typescript
const generateAuthToken = (login, secret) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToHash = timestamp + login + secret;
  const tokenHash = CryptoJS.SHA1(stringToHash).toString();
  return login + ":" + timestamp + ":" + tokenHash;
};
```

### Validações
- E-mail válido obrigatório
- Senha mínima de 6 caracteres
- Dados sanitizados antes do envio
- Tratamento de erros robusto

### Senha Temporária
```typescript
// Gera hash provisória que impede login
const temporaryPassword = CryptoJS.lib.WordArray.random(32).toString();
```

## Banco de Dados

### Tabelas Envolvidas

#### profiles
```sql
- id (UUID) - FK para auth.users
- name (TEXT)
- email (TEXT)
- motv_user_id (TEXT) - Viewers ID do MOTV
- role (TEXT)
```

#### subscriptions
```sql
- user_id (UUID) - FK para profiles
- plan_id (UUID) - FK para plans
- status (TEXT)
- start_date (TIMESTAMP)
```

#### packages
```sql
- code (TEXT) - Código no MOTV
- suspension_package (BOOLEAN)
```

## Interface de Usuário

### Formulário de Cadastro
- Nome completo (obrigatório)
- E-mail (obrigatório)
- Senha (obrigatório, mín. 6 caracteres)
- CPF (opcional)
- Telefone (opcional)
- Seleção de plano (opcional)

### Fluxos de Redirecionamento
- **Cadastro bem-sucedido:** → Dashboard
- **Senha incorreta:** → Redefinição de senha
- **Erro:** → Mensagem de erro detalhada

## Logs e Auditoria

### Logs Implementados
```typescript
console.log('Starting user registration flow for:', userData.email);
console.log('User exists in MOTV, attempting authentication');
console.log('Authentication successful, creating user in system');
```

### Histórico de Testes
- Todos os testes da API são salvos no banco
- Inclui dados da requisição e resposta
- Login da API utilizado
- Status de sucesso/falha

## Demonstração e Testes

### Componente de Demonstração
`UserRegistrationDemo` na página de Integração Admin permite testar o fluxo completo com dados configuráveis.

### Rotas Implementadas
- `/register` - Formulário de cadastro
- `/reset-password` - Redefinição de senha

## Tratamento de Erros

### Tipos de Erro
1. **Validação:** Dados inválidos no formulário
2. **API MOTV:** Falhas na comunicação com MOTV
3. **Sistema:** Erros internos do Supabase/Auth
4. **Rede:** Problemas de conectividade

### Mensagens de Erro
- Mensagens claras e específicas
- Orientações para resolução
- Logs detalhados para debugging

## Configuração

### Variáveis Necessárias
- `api_base_url` - URL base da API MOTV
- `api_login` - Login da API MOTV  
- `api_secret` - Senha da API MOTV
- `vendor_id` - ID do vendedor MOTV

### Dependências
- `crypto-js` - Para geração de tokens
- `react-helmet-async` - Para SEO
- Supabase Auth - Para autenticação
- React Router - Para navegação

## Manutenção

### Monitoramento
- Acompanhar logs de erro
- Verificar taxa de sucesso dos cadastros
- Monitorar tempo de resposta da API MOTV

### Atualizações
- Manter documentação atualizada
- Revisar fluxos periodicamente
- Atualizar dependências regularmente

## Considerações Futuras

### Melhorias Possíveis
1. **Cache** - Implementar cache para dados do MOTV
2. **Retry** - Implementar retry automático em falhas
3. **Analytics** - Adicionar métricas de conversão
4. **Validação** - Validação de CPF mais robusta
5. **Performance** - Otimização de consultas ao banco

### Integrações
- Sistema de e-mail para notificações
- SMS para verificação de telefone
- Integração com outros provedores de pagamento