import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MotvIntegrationService } from "@/services/motvIntegration";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Settings, History, Play, Eye, EyeOff, Wifi, User, ExternalLink, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CryptoJS from "crypto-js";

// Error codes mapping
const ERROR_CODES = {
  '-4': { pt: 'Pré-cálculo desconhecido', en: 'Unknown pre-calculation' },
  '-1': { pt: 'Exceção da classe pai', en: 'Parent class exception' },
  '0': { pt: 'Ocorreu um erro desconhecido, entre em contato com a equipe Jacon para resolução', en: 'Unknown error occurred, contact Jacon team for resolution' },
  '1': { pt: 'Sucesso', en: 'Success' },
  '3': { pt: 'Falta de direito para determinada ação/método', en: 'Lack of right for certain action/method' },
  '4': { pt: 'Módulo desconhecido usado', en: 'Unknown module used' },
  '5': { pt: 'Método desconhecido', en: 'Unknown method' },
  '6': { pt: 'Parâmetro ausente, mais informações sobre o parâmetro ausente estão na resposta', en: 'Missing parameter, more info about missing parameter is in response' },
  '7': { pt: 'Dados de solicitação inválidos - JSON inválido', en: 'Invalid request data - invalid JSON' },
  '8': { pt: 'Exceção de limite de memória do aplicativo', en: 'Application memory limit exception' },
  '9': { pt: 'Direito desconhecido', en: 'Unknown right' },
  '10': { pt: 'Tipo de parâmetro incorreto (por exemplo, o método que aceita inteiro recebeu uma string)', en: 'Incorrect parameter type (e.g., method accepting integer received string)' },
  '11': { pt: 'Erro no banco de dados, tente novamente. Caso o problema persista, entre em contato com a equipe do moTV.eu para resolução.', en: 'Database error, try again. If problem persists, contact moTV.eu team for resolution.' },
  '12': { pt: 'Valor de parâmetro inválido', en: 'Invalid parameter value' },
  '14': { pt: '`users_login` e `users_password` são necessários para criar o usuário', en: '`users_login` and `users_password` are required to create user' },
  '15': { pt: 'Exceção de erro de banco de dados', en: 'Database error exception' },
  '20': { pt: 'Formato de cabeçalho de autorização inválido, consulte a documentação para saber como o cabeçalho deve ser', en: 'Invalid authorization header format, check documentation for proper header format' },
  '21': { pt: 'Combinação incorreta de nome de usuário ou senha', en: 'Incorrect username or password combination' },
  '22': { pt: 'O usuário está em estado desativado', en: 'User is in disabled state' },
  '23': { pt: 'A função está em estado desativado', en: 'Function is in disabled state' },
  '24': { pt: 'O token de autorização expirou, calcule um novo', en: 'Authorization token expired, calculate a new one' },
  '25': { pt: 'Exceção de não logado', en: 'Not logged in exception' },
  '27': { pt: 'Exceção de revendedor inativo por login', en: 'Inactive reseller by login exception' },
  '28': { pt: 'Falta o direito para a ação/método fornecido (somente interno)', en: 'Missing right for provided action/method (internal only)' },
  '29': { pt: 'Ocorreu uma exceção no banco de dados durante a execução da consulta', en: 'Database exception occurred during query execution' },
  '30': { pt: 'Onde a seleção analisa a exceção', en: 'Where selection parses exception' },
  '40': { pt: 'Exceção de imagem desconhecida da galeria', en: 'Unknown gallery image exception' },
  '41': { pt: 'Exceção de arquivo de imagem de galeria não encontrado', en: 'Gallery image file not found exception' },
  '60': { pt: 'Exceção de revendedor desconhecido', en: 'Unknown reseller exception' },
  '61': { pt: 'Exceção de nome do revendedor não exclusivo', en: 'Non-unique reseller name exception' },
  '62': { pt: 'O revendedor não tem crédito suficiente para deduzir a exceção', en: 'Reseller does not have sufficient credit to deduct exception' },
  '63': { pt: 'O revendedor não tem crédito suficiente para adicionar uma exceção', en: 'Reseller does not have sufficient credit to add exception' },
  '64': { pt: 'O revendedor não pode ter exceção de crédito infinito', en: 'Reseller cannot have infinite credit exception' },
  '65': { pt: 'O dealer não pode visualizar nenhuma exceção de carta', en: 'Dealer cannot view any card exception' },
  '66': { pt: 'Exceção dos pais da circular do revendedor', en: 'Reseller circular parent exception' },
  '67': { pt: 'Exceção de não remoção do revendedor', en: 'Reseller non-removal exception' },
  '72': { pt: 'Exceção de função de mesmo pai', en: 'Same parent function exception' },
  '73': { pt: 'Exceção circular de função pai', en: 'Parent function circular exception' },
  '74': { pt: 'Exceção de função não pode ser removida', en: 'Function cannot be removed exception' },
  '80': { pt: 'Categoria exceção de categoria desconhecida', en: 'Unknown category exception' },
  '100': { pt: 'Exceção de cliente desconhecido', en: 'Unknown customer exception' },
  '101': { pt: 'Exceção de arquivo desconhecido do cliente', en: 'Unknown customer file exception' },
  '102': { pt: 'Exceção de critérios de pesquisa selvagem do cliente', en: 'Customer wildcard search criteria exception' },
  '103': { pt: 'O cliente pesquisa muitas exceções', en: 'Customer searches too many exceptions' },
  '104': { pt: 'Exceção de erro de validação de atualização do cliente', en: 'Customer update validation error exception' },
  '105': { pt: 'Exceção de contato desconhecido do cliente', en: 'Unknown customer contact exception' },
  '106': { pt: 'Exceção de endereço desconhecido do cliente', en: 'Unknown customer address exception' },
  '107': { pt: 'Exceção de nota de cliente desconhecida', en: 'Unknown customer note exception' },
  '108': { pt: 'Nota do cliente faltando exceção correta', en: 'Customer note missing correct exception' },
  '109': { pt: 'Exceção de muitos endereços encontrados pelo cliente', en: 'Too many addresses found by customer exception' },
  '200': { pt: 'Relatar exceção de relatório desconhecida', en: 'Unknown report exception' },
  '201': { pt: 'Relatar exceção de erro de consulta', en: 'Report query error exception' },
  '202': { pt: 'Relatar exceção de arquivo de relatório desconhecido', en: 'Unknown report file exception' },
  '203': { pt: 'Exceção de arquivo de relatório não encontrado', en: 'Report file not found exception' },
  '204': { pt: 'Relatar exceção não autorizada', en: 'Unauthorized report exception' },
  '220': { pt: 'Solicitação de exceção de solicitação desconhecida', en: 'Unknown request exception' },
  '250': { pt: 'Exceção de fatura desconhecida', en: 'Unknown invoice exception' },
  '251': { pt: 'Exceção de fatura já cancelada', en: 'Invoice already cancelled exception' },
  '252': { pt: 'Exceção de fatura não pode ser revertida', en: 'Invoice cannot be reversed exception' },
  '260': { pt: 'Exceção de produto desconhecido', en: 'Unknown product exception' },
  '261': { pt: 'O preço inicial do produto deve ser maior que 0 exceção', en: 'Product initial price must be greater than 0 exception' },
  '262': { pt: 'O produto para assinatura de autocuidado não pode ter duração em minutos, exceto', en: 'Product for self-care subscription cannot have duration in minutes exception' },
  '263': { pt: 'Exceção desconhecida do produto TVOD', en: 'Unknown TVOD product exception' },
  '264': { pt: 'Exceção de preço de produto desconhecido nesta moeda', en: 'Unknown product price in this currency exception' },
  '265': { pt: 'Exceção do produto não pode ser removido', en: 'Product cannot be removed exception' },
  '270': { pt: 'Buquê desconhecido exceção de buquê', en: 'Unknown bouquet exception' },
  '271': { pt: 'Exceção de duplicata de buquê do cliente', en: 'Customer bouquet duplicate exception' },
  '272': { pt: 'Exceção: o buquê não pode ser removido', en: 'Bouquet cannot be removed exception' },
  '280': { pt: 'Exceção de grupo desconhecido', en: 'Unknown group exception' },
  '290': { pt: 'Modelo de exceção de modelo desconhecido', en: 'Unknown template exception' },
  '291': { pt: 'Erro de modelo preenchendo exceção', en: 'Template filling error exception' },
  '300': { pt: 'Exceção de bilhete desconhecido', en: 'Unknown ticket exception' },
  '301': { pt: 'Exceção de erro de status do tíquete', en: 'Ticket status error exception' },
  '302': { pt: 'Exceção de arquivo de ticket desconhecido', en: 'Unknown ticket file exception' },
  '310': { pt: 'Categoria de ingresso desconhecida exceção de categoria de ingresso', en: 'Unknown ticket category exception' },
  '311': { pt: 'Exceção pai circular da categoria de ingresso', en: 'Ticket category circular parent exception' },
  '320': { pt: 'Departamento de ingressos desconhecido exceção do departamento de ingressos', en: 'Unknown ticket department exception' },
  '325': { pt: 'Exceção de status de tíquete desconhecido', en: 'Unknown ticket status exception' },
  '330': { pt: 'Prioridade do tíquete desconhecida exceção de prioridade do tíquete', en: 'Unknown ticket priority exception' },
  '360': { pt: 'Ação de grupo desconhecida exceção de ação de grupo', en: 'Unknown group action exception' },
  '361': { pt: 'Exceção de ação de grupo não autorizada', en: 'Unauthorized group action exception' },
  '362': { pt: 'Exceção de erro de tradução de ação de grupo', en: 'Group action translation error exception' },
  '363': { pt: 'Apenas uma exceção da Ação de grupo ou Ação de grupo predefinida deve ser preenchida', en: 'Only one group action or predefined group action should be filled exception' },
  '364': { pt: 'Ação de grupo ou ação de grupo predefinida deve ser preenchida exceção', en: 'Group action or predefined group action must be filled exception' },
  '380': { pt: 'Agendar exceção de agendamento desconhecida', en: 'Unknown schedule exception' },
  '382': { pt: 'Exceção de token de agendamento não definido', en: 'Schedule token not defined exception' },
  '400': { pt: 'Exceção do revendedor de crédito insuficiente na fatura', en: 'Insufficient credit reseller in invoice exception' },
  '401': { pt: 'Exceção de seleção de produto na fatura', en: 'Product selection in invoice exception' },
  '403': { pt: 'Exceção de cliente com crédito insuficiente na fatura', en: 'Customer with insufficient credit in invoice exception' },
  '404': { pt: 'Exceção de produto faturado não permitido', en: 'Billed product not allowed exception' },
  '420': { pt: 'Exceção de valor desconhecido de configuração', en: 'Unknown configuration value exception' },
  '421': { pt: 'Exceção de servidor smtp desconhecida de configuração', en: 'Unknown SMTP server configuration exception' },
  '422': { pt: 'Exceção de servidor IMAP desconhecida', en: 'Unknown IMAP server exception' },
  '430': { pt: 'Exceção de log desconhecida', en: 'Unknown log exception' },
  '431': { pt: 'Exceção de modelo de log desconhecido', en: 'Unknown log template exception' },
  '454': { pt: 'Exceção de erro do sistema rabbitmq', en: 'RabbitMQ system error exception' },
  '455': { pt: 'Exceção de supervisor de sistema não habilitado', en: 'System supervisor not enabled exception' },
  '456': { pt: 'Exceção de backup do sistema não habilitado', en: 'System backup not enabled exception' },
  '457': { pt: 'Exceção de backup do sistema não encontrado', en: 'System backup not found exception' },
  '458': { pt: 'Exceção de falha do supervisor do sistema', en: 'System supervisor failure exception' },
  '480': { pt: 'Exceção de dispositivo desconhecido', en: 'Unknown device exception' },
  '481': { pt: 'Exceção de produto incompatível com dispositivo', en: 'Device incompatible product exception' },
  '482': { pt: 'Exceção de dispositivo nenhum dispositivo encontrado', en: 'Device no device found exception' },
  '483': { pt: 'Exceção de muitos dispositivos encontrados no dispositivo', en: 'Too many devices found on device exception' },
  '484': { pt: 'Exceção de dispositivo incompatível', en: 'Incompatible device exception' },
  '500': { pt: 'Exceção de assinatura desconhecida', en: 'Unknown subscription exception' },
  '501': { pt: 'Exceção de suspensão de assinatura desconhecida', en: 'Unknown subscription suspension exception' },
  '502': { pt: 'A assinatura não pode suspender a exceção', en: 'Subscription cannot suspend exception' },
  '503': { pt: 'A assinatura não pode ser cancelada (já cancelada)', en: 'Subscription cannot be cancelled (already cancelled)' },
  '520': { pt: 'Exceção de erro de venda', en: 'Sale error exception' },
  '550': { pt: 'Notificações de tickets exceção de notificação desconhecida', en: 'Unknown ticket notification exception' },
  '551': { pt: 'Exceção de erro de e-mail de notificação de tickets', en: 'Ticket notification email error exception' },
  '600': { pt: 'Exceção de notificação desconhecida de notificações do usuário', en: 'Unknown user notification exception' },
  '1100': { pt: 'Papel desconhecido', en: 'Unknown role' },
  '1101': { pt: 'Nome da função duplicada', en: 'Duplicate role name' },
  '1500': { pt: 'Exceção epg desconhecida epg', en: 'Unknown EPG exception' },
  '1501': { pt: 'Exceção de formato de data não suportado pelo EPG', en: 'EPG unsupported date format exception' },
  '1502': { pt: 'Exceção de arquivo não suportado do EPG', en: 'EPG unsupported file exception' },
  '1503': { pt: 'Exceção de conjunto de exceção do Epg', en: 'EPG exception set exception' },
  '1504': { pt: 'Exceção de erro fatal do EPG XML', en: 'EPG XML fatal error exception' },
  '1505': { pt: 'Exceção de arquivo inválido do EPG', en: 'EPG invalid file exception' },
  '1506': { pt: 'Exceção de erro do Excel EPG', en: 'EPG Excel error exception' },
  '1507': { pt: 'Exceção de erro de inserção de EPG', en: 'EPG insertion error exception' },
  '1508': { pt: 'Exceção de evento desconhecido Epg', en: 'Unknown EPG event exception' },
  '1509': { pt: 'Exceção de serviço desconhecida do EPG', en: 'Unknown EPG service exception' },
  '1510': { pt: 'Exceção de transponder desconhecido EPG', en: 'Unknown EPG transponder exception' },
  '1511': { pt: 'Exceção de download de software desconhecido do EPG', en: 'Unknown EPG software download exception' },
  '1512': { pt: 'Exceção de coluna desconhecida do Epg', en: 'Unknown EPG column exception' },
  '1517': { pt: 'Exceção de imagem de evento desconhecido do Epg', en: 'Unknown EPG event image exception' },
  '1518': { pt: 'Exceção de inserção desconhecida do Epg', en: 'Unknown EPG insertion exception' },
  '1519': { pt: 'Exceção de rede desconhecida EPG', en: 'Unknown EPG network exception' },
  '1520': { pt: 'Exceção de erro de download do EPG SW', en: 'EPG SW download error exception' },
  '1522': { pt: 'Exceção de valor ausente na configuração do EPG', en: 'Missing value in EPG configuration exception' },
  '1524': { pt: 'Exceção de categoria desconhecida Epg', en: 'Unknown EPG category exception' },
  '1800': { pt: 'Usuário desconhecido', en: 'Unknown user' },
  '1801': { pt: 'E-mail de usuário duplicado', en: 'Duplicate user email' },
  '3000': { pt: 'Exceção de fornecedor desconhecido', en: 'Unknown vendor exception' },
  '4400': { pt: 'Entidade fornecida não encontrada', en: 'Provided entity not found' },
  '4401': { pt: 'Documentação exceção de nome de API desconhecida', en: 'Unknown API name documentation exception' },
  '4402': { pt: 'Enum fornecido não encontrado', en: 'Provided enum not found' },
  '4403': { pt: 'Modelo fornecido não encontrado', en: 'Provided model not found' },
  '5500': { pt: 'Exceção da API do Conselho', en: 'Council API exception' },
  '12529': { pt: 'Exceção de zona desconhecida', en: 'Unknown zone exception' },
  '12530': { pt: 'Bloqueia exceção desconhecida', en: 'Unknown block exception' },
  '12531': { pt: 'Exceção desconhecida do Amplifire', en: 'Unknown Amplifire exception' },
  '12532': { pt: 'Exceção de nó desconhecido', en: 'Unknown node exception' },
  '12533': { pt: 'Exceção desconhecida de acompanhamento de ticket', en: 'Unknown ticket tracking exception' },
  '12534': { pt: 'Comentário de tickets exceção desconhecida', en: 'Unknown ticket comment exception' },
  '12535': { pt: 'Plano de preços exceção desconhecida', en: 'Unknown pricing plan exception' },
  '12536': { pt: 'Exceção desconhecida de limite de sessão', en: 'Unknown session limit exception' },
  '12537': { pt: 'Exceção desconhecida de limite de dispositivo', en: 'Unknown device limit exception' },
  '13000': { pt: 'Exceção de ordem desconhecida PSM', en: 'Unknown PSM order exception' },
  '13001': { pt: 'Exceção de pedido PSM já processado', en: 'PSM order already processed exception' },
  '13002': { pt: 'Exceção de falha do PSM Ooredoo', en: 'PSM Ooredoo failure exception' },
  '13200': { pt: 'Exceção de cartão inteligente duplicado Cryptoguard', en: 'Cryptoguard duplicate smart card exception' },
  '13201': { pt: 'Exceção de set-topbox duplicado do Cryptoguard', en: 'Cryptoguard duplicate set-top box exception' },
  '13202': { pt: 'Exceção de cartão inteligente duplicado Cryptoguard sem cartão', en: 'Cryptoguard duplicate smart card without card exception' },
  '13203': { pt: 'Exceção de cartão inteligente inválido Cryptoguard', en: 'Cryptoguard invalid smart card exception' },
  '14000': { pt: 'Exceção de login duplicado da conta Motv', en: 'Motv account duplicate login exception' },
  '14001': { pt: 'Exceção de nome de usuário e senha incorretos do Motv', en: 'Motv incorrect username and password exception' },
  '14003': { pt: 'Exceção de token de registro desconhecido do Motv', en: 'Motv unknown registration token exception' },
  '14004': { pt: 'Exceção de login desconhecida do Motv', en: 'Motv unknown login exception' },
  '14005': { pt: 'Exceção de token de senha perdida desconhecida do Motv', en: 'Motv unknown lost password token exception' },
  '14006': { pt: 'Exceção de erro de validação do Motv', en: 'Motv validation error exception' },
  '14007': { pt: 'Exceção de portal desconhecido Motv', en: 'Motv unknown portal exception' },
  '14008': { pt: 'Exceção de formato de senha inválida do Motv', en: 'Motv invalid password format exception' },
  '14009': { pt: 'Exceção de acesso ao portal de usuário duplicado do Motv', en: 'Motv duplicate user portal access exception' },
  '14011': { pt: 'Exceção de erro desconhecido do Motv', en: 'Motv unknown error exception' },
  '14012': { pt: 'Exceção de dispositivo desconhecido Motv', en: 'Motv unknown device exception' },
  '14013': { pt: 'Motv erro desconhecido tente novamente exceção', en: 'Motv unknown error try again exception' },
  '14014': { pt: 'Exceção de VOD desconhecido Motv', en: 'Motv unknown VOD exception' },
  '16000': { pt: 'Exceção de token desconhecido do Google', en: 'Google unknown token exception' },
  '16001': { pt: 'Exceção de login desconhecido do Google', en: 'Google unknown login exception' },
  '16002': { pt: 'Exceção de dispositivo desconhecido do Google', en: 'Google unknown device exception' },
  '16501': { pt: 'Exceção de página desconhecida do Motv', en: 'Motv unknown page exception' },
  '17500': { pt: 'Exceção de resposta desconhecida do Facebook', en: 'Facebook unknown response exception' },
  '17502': { pt: 'Exceção de login desconhecido do Facebook', en: 'Facebook unknown login exception' },
  '17503': { pt: 'Exceção de dispositivo desconhecido do Facebook', en: 'Facebook unknown device exception' },
  '18000': { pt: 'Exceção serial duplicada Irdeto', en: 'Irdeto duplicate serial exception' },
  '19000': { pt: 'Exceção de login desconhecido da Apple', en: 'Apple unknown login exception' },
  '19001': { pt: 'Exceção de e-mail ausente no registro da Apple', en: 'Apple missing email in registration exception' },
  '19002': { pt: 'Exceção de decodificação de token de identidade com falha no registro da Apple', en: 'Apple identity token decoding failed in registration exception' },
  '19003': { pt: 'Exceção de dispositivo desconhecido da Apple', en: 'Apple unknown device exception' },
  '20000': { pt: 'Exceção Digicel', en: 'Digicel exception' },
  '20100': { pt: 'Exceção da GUI', en: 'GUI exception' },
  '20200': { pt: 'Exceção de parada de cancelamento do gerador de solicitação', en: 'Request generator cancellation stop exception' },
  '20300': { pt: 'Exceção de árvore', en: 'Tree exception' },
  '20500': { pt: 'Exceção de país desconhecido', en: 'Unknown country exception' },
  '20600': { pt: 'Ordem de autocuidado exceção desconhecida', en: 'Unknown self-care order exception' },
  '20601': { pt: 'Exceção de falha na ordem de autocuidado', en: 'Self-care order failure exception' },
  '20602': { pt: 'Autocuidado não é permitido em exceção', en: 'Self-care not allowed exception' },
  '20603': { pt: 'Gateway de pagamento desconhecido para autocuidado', en: 'Unknown payment gateway for self-care' },
  '20604': { pt: 'Exceção desconhecida do gateway de pagamento de autoatendimento', en: 'Unknown self-service payment gateway exception' },
  '20605': { pt: 'Exceção desconhecida de assinatura de autoatendimento', en: 'Unknown self-service subscription exception' },
  '20606': { pt: 'Exceção de produto não permitido para autocuidado', en: 'Product not allowed for self-care exception' },
  '20607': { pt: 'Clientes gerados automaticamente não podem usar a exceção de autoatendimento', en: 'Automatically generated customers cannot use self-service exception' },
  '20608': { pt: 'A ordem de autocuidado não pode ser criada como exceção', en: 'Self-care order cannot be created exception' },
  '20609': { pt: 'Exceção de duplicata de assinatura de autoatendimento', en: 'Self-service subscription duplicate exception' },
  '20700': { pt: 'Exceção de moeda desconhecida', en: 'Unknown currency exception' },
  '20701': { pt: 'Exceção de moeda não pode ser desativada', en: 'Currency cannot be disabled exception' },
  '20800': { pt: 'Exceção desconhecida do pacote de dados', en: 'Unknown data package exception' },
  '20900': { pt: 'formulário de inscrição moTV tipo de endereço desconhecido exceção', en: 'moTV registration form unknown address type exception' },
  '20901': { pt: 'Tipo de controle duplicado do formulário de registro do moTV.', en: 'moTV registration form duplicate control type' },
  '20902': { pt: 'formulário de inscrição moTV exceção desconhecida', en: 'moTV registration form unknown exception' },
  '20903': { pt: 'formulário de registro moTV controle exceção desconhecida', en: 'moTV registration form unknown control exception' },
  '20904': { pt: 'O tipo de contato do formulário de inscrição do moTV não pode ser excluído, exceção', en: 'moTV registration form contact type cannot be deleted exception' },
  '20905': { pt: 'O tipo de endereço do formulário de registro do moTV não pode ser excluído, exceção', en: 'moTV registration form address type cannot be deleted exception' }
};

const getErrorDescription = (code: number | string): { code: string, pt: string, en: string } | null => {
  if (code === null || code === undefined) {
    return null;
  }
  
  const errorCode = ERROR_CODES[code.toString()];
  if (errorCode) {
    return {
      code: code.toString(),
      pt: errorCode.pt,
      en: errorCode.en
    };
  }
  return null;
};

interface IntegrationSettings {
  id?: string;
  api_base_url: string;
  api_login: string;
  api_secret: string;
  vendor_id?: number;
}

interface IntegrationJob {
  id: string;
  job_type: string;
  entity_type: string;
  entity_id: string;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  created_at: string;
  processed_at?: string;
  user_id?: string;
  user_email?: string;
  integration_logs: Array<{
    id: string;
    endpoint: string;
    status_code: number;
    success: boolean;
    error_message?: string;
    created_at: string;
  }>;
}

interface TestResult {
  id: string;
  endpoint: string;
  method: string;
  requestData: any;
  response: any;
  statusCode: number;
  success: boolean;
  timestamp: string;
  user_id?: string;
  user_email?: string;
}

export default function AdminIntegration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processingJobs, setProcessingJobs] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<IntegrationSettings>({
    api_base_url: '',
    api_login: '',
    api_secret: '',
    vendor_id: 6843842,
  });
  const [jobs, setJobs] = useState<IntegrationJob[]>([]);
  const [testingCustomerCreate, setTestingCustomerCreate] = useState(false);
  const [testingSubscribe, setTestingSubscribe] = useState(false);
  const [testingCancel, setTestingCancel] = useState(false);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  // Load saved test data from localStorage
  const loadSavedTestData = () => {
    const savedCustomerData = localStorage.getItem('motv-test-customerData');
    const savedSubscribeData = localStorage.getItem('motv-test-subscribeData');
    const savedCancelData = localStorage.getItem('motv-test-cancelData');
    const savedCustomerFindData = localStorage.getItem('motv-test-customerFindData');
    const savedPlanHistoryData = localStorage.getItem('motv-test-planHistoryData');
    const savedPlanListData = localStorage.getItem('motv-test-planListData');
    const savedAuthenticateData = localStorage.getItem('motv-test-authenticateData');

    return {
      customerData: savedCustomerData ? JSON.parse(savedCustomerData) : {
        login: "Alexandre22",
        password: "123456",
        profileName: "Nome Completo",
        email: "alexandre22@alexandre22.comm",
        firstname: "Alexandre22",
        lastname: "Sobrenome"
      },
      subscribeData: savedSubscribeData ? JSON.parse(savedSubscribeData) : {
        viewers_id: 6869950,
        products_id: 118
      },
      cancelData: savedCancelData ? JSON.parse(savedCancelData) : {
        viewers_id: 6843842,
        products_id: 1
      },
      customerFindData: savedCustomerFindData ? JSON.parse(savedCustomerFindData) : {
        viewers_id: 7073359
      },
      planHistoryData: savedPlanHistoryData ? JSON.parse(savedPlanHistoryData) : {
        viewers_id: 7073359
      },
      planListData: savedPlanListData ? JSON.parse(savedPlanListData) : {
        viewers_id: 7073359
      },
      authenticateData: savedAuthenticateData ? JSON.parse(savedAuthenticateData) : {
        vendors_id: 6843842,
        login: "alexandre4564@alexandre.com",
        password: "a@123454655"
      }
    };
  };

  // Save test data to localStorage
  const saveTestDataToStorage = (dataType: string, data: any) => {
    localStorage.setItem(`motv-test-${dataType}`, JSON.stringify(data));
  };

  const savedTestData = loadSavedTestData();
  
  const [customerData, setCustomerData] = useState(savedTestData.customerData);
  const [subscribeData, setSubscribeData] = useState(savedTestData.subscribeData);
  const [cancelData, setCancelData] = useState(savedTestData.cancelData);
  const [customerFindData, setCustomerFindData] = useState(savedTestData.customerFindData);
  const [planHistoryData, setPlanHistoryData] = useState(savedTestData.planHistoryData);
  const [planListData, setPlanListData] = useState(savedTestData.planListData);
  const [authenticateData, setAuthenticateData] = useState(savedTestData.authenticateData);
  const [testingCustomerFind, setTestingCustomerFind] = useState(false);
  const [testingPlanHistory, setTestingPlanHistory] = useState(false);
  const [testingPlanList, setTestingPlanList] = useState(false);
  const [testingAuthenticate, setTestingAuthenticate] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [selectedJsonData, setSelectedJsonData] = useState<{request: any, response: any} | null>(null);
  const [errorCodesModalOpen, setErrorCodesModalOpen] = useState(false);
  const [errorCodeSearch, setErrorCodeSearch] = useState('');

  // Sync vendor_id from settings to authenticateData
  useEffect(() => {
    if (settings.vendor_id) {
      setAuthenticateData(prev => ({ ...prev, vendors_id: settings.vendor_id }));
    }
  }, [settings.vendor_id]);

  useEffect(() => {
    loadSettings();
    loadJobsHistory();
    loadPersistedTestHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await MotvIntegrationService.getIntegrationSettings();
      if (data) {
        setSettings({
          id: data.id,
          api_base_url: data.api_base_url,
          api_login: data.api_login,
          api_secret: data.api_secret,
          vendor_id: data.vendor_id || 6843842,
        });
      }
    } catch (error) {
      console.error('Error loading integration settings:', error);
    }
  };

  const loadJobsHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_jobs')
        .select(`
          *,
          profiles(email),
          integration_logs(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading jobs history:', error);
        return;
      }

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        job_type: row.job_type,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        status: row.status,
        attempts: row.attempts,
        max_attempts: row.max_attempts,
        last_error: row.last_error,
        created_at: row.created_at,
        processed_at: row.processed_at,
        user_id: row.user_id,
        user_email: row.profiles?.email || 'Sistema',
        integration_logs: row.integration_logs || [],
      }));

      setJobs(mapped);
    } catch (error) {
      console.error('Error loading jobs history:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await MotvIntegrationService.updateIntegrationSettings({
        api_base_url: settings.api_base_url,
        api_login: settings.api_login,
        api_secret: settings.api_secret,
        vendor_id: settings.vendor_id,
      });

      toast({
        title: "Configurações salvas",
        description: "As configurações de integração foram atualizadas com sucesso.",
      });

      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPendingJobs = async () => {
    setProcessingJobs(true);
    try {
      const success = await MotvIntegrationService.triggerJobProcessing();
      if (success) {
        toast({
          title: "Jobs processados",
          description: "Os jobs pendentes foram processados com sucesso.",
        });
        loadJobsHistory();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao processar os jobs pendentes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing jobs:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar os jobs pendentes.",
        variant: "destructive",
      });
    } finally {
      setProcessingJobs(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-api-connection');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: data.message,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: data.message || data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a conexão da API. Verifique se as configurações foram salvas.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const generateAuthToken = (login?: string, secret?: string) => {
    const apiLogin = login || settings.api_login || "gentv.api";
    const apiSecret = secret || settings.api_secret || "cvehyx0cx43kmqmcwiclq4ajroe2ar0yt10q6y3n";
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToHash = timestamp + apiLogin + apiSecret;
    const tokenHash = CryptoJS.SHA1(stringToHash).toString();
    return apiLogin + ":" + timestamp + ":" + tokenHash;
  };

  // Persist a single test result to Supabase
  const saveTestResultToDb = async (
    endpoint: string,
    method: string,
    requestData: any,
    response: any,
    statusCode: number,
    success: boolean,
    timestamp: string
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('integration_test_results')
        .insert([{ 
          endpoint,
          method,
          request_payload: requestData,
          response_payload: response,
          status_code: statusCode || null,
          success,
          created_at: timestamp,
          user_id: userData?.user?.id || null,
        }]);
      if (error) {
        console.error('Error saving test result:', error);
      }
    } catch (err) {
      console.error('Unexpected error saving test result:', err);
    }
  };

  // Load persisted test history from Supabase
  const loadPersistedTestHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_test_results')
        .select(`
          *,
          profiles(email)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Error loading test history:', error);
        return;
      }

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        endpoint: row.endpoint,
        method: row.method,
        requestData: row.request_payload,
        response: row.response_payload,
        statusCode: row.status_code,
        success: row.success,
        timestamp: row.created_at,
        user_id: row.user_id,
        user_email: row.profiles?.email || 'Sistema',
      })) as TestResult[];

      setTestHistory(mapped);
    } catch (err) {
      console.error('Unexpected error loading test history:', err);
    }
  };

  const addToTestHistory = (endpoint: string, method: string, requestData: any, response: any, statusCode: number, success: boolean) => {
    const testResult: TestResult = {
      id: Date.now().toString(),
      endpoint,
      method,
      requestData,
      response,
      statusCode,
      success,
      timestamp: new Date().toISOString()
    };
    setTestHistory(prev => [testResult, ...prev]);
    // Persist asynchronously (fire-and-forget)
    saveTestResultToDb(endpoint, method, requestData, response, statusCode, success, testResult.timestamp);
  };

  const handleTestCustomerCreate = async () => {
    setTestingCustomerCreate(true);
    // Save current test data to localStorage
    saveTestDataToStorage('customerData', customerData);
    
    try {
      const authToken = generateAuthToken();
      const requestData = { data: customerData };
      
      const response = await fetch(`${settings.api_base_url}/api/integration/createMotvCustomer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      // Verifica o status da API MOTV ao invés do status HTTP
      const apiSuccess = result.status === 1 || result.status === '1';
      
      // Adicionar ao histórico
      addToTestHistory('api/integration/createMotvCustomer', 'POST', requestData, result, response.status, apiSuccess);

      if (apiSuccess) {
        toast({
          title: "Usuário criado com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        const errorCode = result.status || result.code || result.status_code || result.error_code;
        const errorInfo = getErrorDescription(errorCode);
        const errorMessage = errorInfo 
          ? `Código ${errorCode}: ${errorInfo.pt}` 
          : `Erro ${errorCode || 'desconhecido'}: ${result.message || 'Erro desconhecido'}`;
        
        toast({
          title: "Erro ao criar usuário",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      addToTestHistory('api/integration/createMotvCustomer', 'POST', { data: customerData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a criação do usuário. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingCustomerCreate(false);
    }
  };

  const handleTestSubscribe = async () => {
    setTestingSubscribe(true);
    // Save current test data to localStorage
    saveTestDataToStorage('subscribeData', subscribeData);
    
    try {
      const authToken = generateAuthToken();
      const requestData = { data: subscribeData };
      
      const response = await fetch(`${settings.api_base_url}/api/integration/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      // Verifica o status da API MOTV ao invés do status HTTP
      const apiSuccess = result.status === 1 || result.status === '1';
      
      // Adicionar ao histórico
      addToTestHistory('api/integration/subscribe', 'POST', requestData, result, response.status, apiSuccess);

      if (apiSuccess) {
        toast({
          title: "Plano criado com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        const errorCode = result.status || result.code || result.status_code || result.error_code;
        const errorInfo = getErrorDescription(errorCode);
        const errorMessage = errorInfo 
          ? `Código ${errorCode}: ${errorInfo.pt}` 
          : `Erro ${errorCode || 'desconhecido'}: ${result.message || 'Erro desconhecido'}`;
        
        toast({
          title: "Erro ao criar plano",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      addToTestHistory('api/integration/subscribe', 'POST', { data: subscribeData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a criação do plano. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingSubscribe(false);
    }
  };

  const handleTestCancel = async () => {
    setTestingCancel(true);
    // Save current test data to localStorage
    saveTestDataToStorage('cancelData', cancelData);
    
    try {
      const authToken = generateAuthToken();
      const requestData = { data: cancelData };
      
      const response = await fetch(`${settings.api_base_url}/api/integration/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      // Adicionar ao histórico
      addToTestHistory('api/integration/cancel', 'POST', requestData, result, response.status, response.ok);

      if (response.ok) {
        toast({
          title: "Plano cancelado com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        const errorInfo = getErrorDescription(result.code || result.status_code || result.error_code);
        const errorMessage = errorInfo 
          ? `Código ${errorInfo.code}: ${errorInfo.pt}` 
          : `Erro ${response.status}: ${result.message || 'Erro desconhecido'}`;
        
        toast({
          title: "Erro ao cancelar plano",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      addToTestHistory('api/integration/cancel', 'POST', { data: cancelData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar o cancelamento do plano. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingCancel(false);
    }
  };

  const handleTestCustomerFind = async () => {
    setTestingCustomerFind(true);
    // Save current test data to localStorage
    saveTestDataToStorage('customerFindData', customerFindData);
    
    try {
      const authToken = generateAuthToken();
      const requestData = { data: customerFindData };
      
      const response = await fetch(`${settings.api_base_url}/api/customer/getDataV2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      addToTestHistory('api/customer/getDataV2', 'POST', requestData, result, response.status, response.ok);

      if (response.ok) {
        toast({
          title: "Dados do cliente obtidos com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        const errorInfo = getErrorDescription(result.code || result.status_code || result.error_code);
        const errorMessage = errorInfo 
          ? `Código ${errorInfo.code}: ${errorInfo.pt}` 
          : `Erro ${response.status}: ${result.message || 'Erro desconhecido'}`;
        
        toast({
          title: "Erro ao obter dados do cliente",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error getting customer data:', error);
      addToTestHistory('api/customer/getDataV2', 'POST', { data: customerFindData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a obtenção dos dados do cliente. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingCustomerFind(false);
    }
  };

  const handleTestPlanHistory = async () => {
    setTestingPlanHistory(true);
    // Save current test data to localStorage
    saveTestDataToStorage('planHistoryData', planHistoryData);
    
    try {
      const authToken = generateAuthToken();
      const requestData = { data: planHistoryData };
      
      const response = await fetch(`${settings.api_base_url}/api/subscription/getCustomerSubscriptionInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      addToTestHistory('api/subscription/getCustomerSubscriptionInfo', 'POST', requestData, result, response.status, response.ok);

      if (response.ok) {
        toast({
          title: "Histórico de planos obtido com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        const errorInfo = getErrorDescription(result.code || result.status_code || result.error_code);
        const errorMessage = errorInfo 
          ? `Código ${errorInfo.code}: ${errorInfo.pt}` 
          : `Erro ${response.status}: ${result.message || 'Erro desconhecido'}`;
        
        toast({
          title: "Erro ao obter histórico de planos",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error getting plan history:', error);
      addToTestHistory('api/subscription/getCustomerSubscriptionInfo', 'POST', { data: planHistoryData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a obtenção do histórico de planos. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingPlanHistory(false);
    }
  };

  const handleTestPlanList = async () => {
    setTestingPlanList(true);
    // Save current test data to localStorage
    saveTestDataToStorage('planListData', planListData);
    
    try {
      const authToken = generateAuthToken();
      const requestData = { data: planListData };
      
      const response = await fetch(`${settings.api_base_url}/api/sales/getAllowedProductsForCustomer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      addToTestHistory('api/sales/getAllowedProductsForCustomer', 'POST', requestData, result, response.status, response.ok);

      if (response.ok) {
        toast({
          title: "Lista de planos obtida com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        const errorInfo = getErrorDescription(result.code || result.status_code || result.error_code);
        const errorMessage = errorInfo 
          ? `Código ${errorInfo.code}: ${errorInfo.pt}` 
          : `Erro ${response.status}: ${result.message || 'Erro desconhecido'}`;
        
        toast({
          title: "Erro ao obter lista de planos",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error getting plan list:', error);
      addToTestHistory('api/sales/getAllowedProductsForCustomer', 'POST', { data: planListData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a obtenção da lista de planos. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingPlanList(false);
    }
  };

  const handleTestAuthenticate = async () => {
    setTestingAuthenticate(true);
    // Save current test data to localStorage
    saveTestDataToStorage('authenticateData', authenticateData);
    
    try {
      const authToken = generateAuthToken();
      const requestData = { data: authenticateData };
      
      const response = await fetch(`${settings.api_base_url}/api/devices/motv/apiLoginV2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      addToTestHistory('api/devices/motv/apiLoginV2', 'POST', requestData, result, response.status, response.ok);

      if (response.ok) {
        toast({
          title: "Autenticação realizada com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        const errorInfo = getErrorDescription(result.code || result.status_code || result.error_code);
        const errorMessage = errorInfo 
          ? `Código ${errorInfo.code}: ${errorInfo.pt}` 
          : `Erro ${response.status}: ${result.message || 'Erro desconhecido'}`;
        
        toast({
          title: "Erro na autenticação",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error authenticating:', error);
      addToTestHistory('api/devices/motv/apiLoginV2', 'POST', { data: authenticateData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a autenticação. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingAuthenticate(false);
    }
  };

  const generateRandomCustomerData = () => {
    const randomId = Math.floor(Math.random() * 10000);
    const randomName = `Usuario${randomId}`;
    const randomEmail = `usuario${randomId}@teste.com`;
    
    setCustomerData({
      login: randomName,
      password: "123456",
      profileName: `${randomName} Completo`,
      email: randomEmail,
      firstname: randomName,
      lastname: "Teste"
    });

    toast({
      title: "Dados gerados!",
      description: "Os dados foram preenchidos automaticamente.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Integração MOTV</h1>
        <Button
          onClick={loadJobsHistory}
          variant="outline"
          size="sm"
          className="gap-2 border-admin-border text-black hover:bg-black hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-admin-card border-admin-border">
          <TabsTrigger value="settings" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <User className="h-4 w-4" />
            Testes de API
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <Eye className="h-4 w-4" />
            Histórico de Testes
          </TabsTrigger>
          <TabsTrigger value="error-codes" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <BookOpen className="h-4 w-4" />
            Códigos de Erro
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <History className="h-4 w-4" />
            Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground">Configurações da API</CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Configure as credenciais para integração com a API MOTV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api_base_url" className="text-admin-foreground">URL Base da API</Label>
                  <Input
                    id="api_base_url"
                    type="url"
                    placeholder="https://api.exemplo.com"
                    value={settings.api_base_url}
                    onChange={(e) => setSettings(prev => ({
                      ...prev, 
                      api_base_url: e.target.value
                    }))}
                    required
                    className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_login" className="text-admin-foreground">Login da API</Label>
                  <Input
                    id="api_login"
                    type="text"
                    placeholder="usuario_api"
                    value={settings.api_login}
                    onChange={(e) => setSettings(prev => ({
                      ...prev, 
                      api_login: e.target.value
                    }))}
                    required
                    className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_secret" className="text-admin-foreground">Chave Secreta</Label>
                  <div className="relative">
                    <Input
                      id="api_secret"
                      type={showPassword ? "text" : "password"}
                      placeholder="chave_secreta_api"
                      value={settings.api_secret}
                      onChange={(e) => setSettings(prev => ({
                        ...prev, 
                        api_secret: e.target.value
                      }))}
                      required
                      className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute inset-y-0 right-0 px-3 flex items-center hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-admin-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-admin-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vendor_id" className="text-admin-foreground">Vendor ID</Label>
                  <Input
                    id="vendor_id"
                    type="number"
                    placeholder="6843842"
                    value={settings.vendor_id || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev, 
                      vendor_id: parseInt(e.target.value) || 0
                    }))}
                    className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90">
                    {loading ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={handleTestConnection} 
                    disabled={testingConnection || !settings.api_base_url || !settings.api_login || !settings.api_secret}
                    variant="outline"
                    className="gap-2 border-admin-border text-black hover:bg-admin-foreground hover:text-admin-card"
                  >
                    <Wifi className="h-4 w-4" />
                    {testingConnection ? "Testando..." : "Testar Conexão"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <div className="space-y-6">
            {/* Customer Create Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Customer Create (Criar usuário)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de criação de usuário via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="login" className="text-admin-foreground">Login</Label>
                      <Input
                        id="login"
                        value={customerData.login}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, login: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-admin-foreground">Password</Label>
                      <Input
                        id="password"
                        value={customerData.password}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profileName" className="text-admin-foreground">Nome do Perfil</Label>
                    <Input
                      id="profileName"
                      value={customerData.profileName}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, profileName: e.target.value }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-admin-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname" className="text-admin-foreground">Primeiro Nome</Label>
                      <Input
                        id="firstname"
                        value={customerData.firstname}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, firstname: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname" className="text-admin-foreground">Sobrenome</Label>
                      <Input
                        id="lastname"
                        value={customerData.lastname}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, lastname: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      onClick={generateRandomCustomerData}
                      variant="outline"
                      className="gap-2 border-admin-border text-black hover:bg-admin-foreground hover:text-admin-card"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Gerar Dados
                    </Button>
                    
                    <Button
                      onClick={handleTestCustomerCreate}
                      disabled={testingCustomerCreate || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <User className="h-4 w-4" />
                      {testingCustomerCreate ? "Criando usuário..." : "Testar Criação de Usuário"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscribe Plan Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Subscribe Plan (Criar Plano)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de criação de plano via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscribe_viewers_id" className="text-admin-foreground">Viewers ID</Label>
                      <Input
                        id="subscribe_viewers_id"
                        type="number"
                        value={subscribeData.viewers_id}
                        onChange={(e) => setSubscribeData(prev => ({ ...prev, viewers_id: parseInt(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscribe_products_id" className="text-admin-foreground">Products ID</Label>
                      <Input
                        id="subscribe_products_id"
                        type="number"
                        value={subscribeData.products_id}
                        onChange={(e) => setSubscribeData(prev => ({ ...prev, products_id: parseInt(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleTestSubscribe}
                      disabled={testingSubscribe || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <Play className="h-4 w-4" />
                      {testingSubscribe ? "Criando plano..." : "Testar Criação de Plano"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancel Plan Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Cancel Plan (Cancelar Plano)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de cancelamento de plano via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cancel_viewers_id" className="text-admin-foreground">Viewers ID</Label>
                      <Input
                        id="cancel_viewers_id"
                        type="number"
                        value={cancelData.viewers_id}
                        onChange={(e) => setCancelData(prev => ({ ...prev, viewers_id: parseInt(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cancel_products_id" className="text-admin-foreground">Products ID</Label>
                      <Input
                        id="cancel_products_id"
                        type="number"
                        value={cancelData.products_id}
                        onChange={(e) => setCancelData(prev => ({ ...prev, products_id: parseInt(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleTestCancel}
                      disabled={testingCancel || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {testingCancel ? "Cancelando plano..." : "Testar Cancelamento de Plano"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Find Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Customer Find (Buscar Cliente)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de busca de dados do cliente via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_find_viewers_id" className="text-admin-foreground">Viewers ID</Label>
                    <Input
                      id="customer_find_viewers_id"
                      type="number"
                      value={customerFindData.viewers_id}
                      onChange={(e) => setCustomerFindData(prev => ({ ...prev, viewers_id: parseInt(e.target.value) || 0 }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleTestCustomerFind}
                      disabled={testingCustomerFind || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <User className="h-4 w-4" />
                      {testingCustomerFind ? "Buscando cliente..." : "Testar Busca de Cliente"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan History Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Plan History (Histórico de Planos)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de obtenção do histórico de planos do cliente via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan_history_viewers_id" className="text-admin-foreground">Viewers ID</Label>
                    <Input
                      id="plan_history_viewers_id"
                      type="number"
                      value={planHistoryData.viewers_id}
                      onChange={(e) => setPlanHistoryData(prev => ({ ...prev, viewers_id: parseInt(e.target.value) || 0 }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleTestPlanHistory}
                      disabled={testingPlanHistory || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <History className="h-4 w-4" />
                      {testingPlanHistory ? "Obtendo histórico..." : "Testar Histórico de Planos"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan List Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Plan List (Lista de Planos)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de obtenção da lista de produtos permitidos para o cliente via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan_list_viewers_id" className="text-admin-foreground">Viewers ID</Label>
                    <Input
                      id="plan_list_viewers_id"
                      type="number"
                      value={planListData.viewers_id}
                      onChange={(e) => setPlanListData(prev => ({ ...prev, viewers_id: parseInt(e.target.value) || 0 }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleTestPlanList}
                      disabled={testingPlanList || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <Play className="h-4 w-4" />
                      {testingPlanList ? "Obtendo lista..." : "Testar Lista de Planos"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Authenticate Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Authenticate (Autenticar)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de autenticação via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="auth_vendors_id" className="text-admin-foreground">Vendors ID</Label>
                    <Input
                      id="auth_vendors_id"
                      type="number"
                      value={authenticateData.vendors_id}
                      onChange={(e) => setAuthenticateData(prev => ({ ...prev, vendors_id: parseInt(e.target.value) || 0 }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="auth_login" className="text-admin-foreground">Login</Label>
                      <Input
                        id="auth_login"
                        value={authenticateData.login}
                        onChange={(e) => setAuthenticateData(prev => ({ ...prev, login: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auth_password" className="text-admin-foreground">Password</Label>
                      <Input
                        id="auth_password"
                        type="password"
                        value={authenticateData.password}
                        onChange={(e) => setAuthenticateData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleTestAuthenticate}
                      disabled={testingAuthenticate || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <Wifi className="h-4 w-4" />
                      {testingAuthenticate ? "Autenticando..." : "Testar Autenticação"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground">Histórico de Testes de API</CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Visualize o histórico completo de todos os testes realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="bg-admin-table-bg border-admin-border">
                  <TableHeader>
                    <TableRow className="bg-admin-table-header border-admin-border">
                      <TableHead className="text-admin-foreground">Endpoint</TableHead>
                      <TableHead className="text-admin-foreground">Método</TableHead>
                      <TableHead className="text-admin-foreground">Status</TableHead>
                      <TableHead className="text-admin-foreground">Código</TableHead>
                      <TableHead className="text-admin-foreground">Data/Hora</TableHead>
                      <TableHead className="text-admin-foreground">Executado por</TableHead>
                      <TableHead className="text-admin-foreground">Login/Viewers ID</TableHead>
                      <TableHead className="text-admin-foreground">Email/Products ID</TableHead>
                      <TableHead className="text-admin-foreground">Código de Erro</TableHead>
                      <TableHead className="text-admin-foreground">Response Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testHistory.map((test) => {
                      const requestData = test.requestData?.data || {};
                      const responseData = test.response || {};
                      
                      return (
                        <TableRow key={test.id} className="border-admin-border hover:bg-admin-muted/20">
                          <TableCell className="font-medium text-admin-table-text">
                            {test.endpoint}
                          </TableCell>
                          <TableCell className="text-admin-table-text">
                            <Badge variant="outline" className="text-xs border-admin-border text-admin-foreground bg-admin-muted/10">
                              {test.method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {test.success ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Sucesso</Badge>
                            ) : (
                              <Badge variant="destructive">Falha</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-admin-table-text">
                            {test.statusCode || 'N/A'}
                          </TableCell>
                          <TableCell className="text-admin-table-text">
                            {formatDate(test.timestamp)}
                          </TableCell>
                          <TableCell className="text-admin-table-text">
                            {test.user_email || 'Sistema'}
                          </TableCell>
                          <TableCell className="text-admin-table-text">
                            {requestData.login || requestData.viewers_id || '-'}
                          </TableCell>
                          <TableCell className="text-admin-table-text">
                            {requestData.email || requestData.products_id || '-'}
                          </TableCell>
                          <TableCell className="text-admin-table-text">
                            {(() => {
                              const errorInfo = getErrorDescription(responseData.code || responseData.status_code || responseData.error_code);
                              if (errorInfo) {
                                return (
                                  <div className="space-y-1">
                                    <Badge variant="outline" className="border-admin-border text-admin-foreground bg-admin-muted/10">
                                      {errorInfo.code}
                                    </Badge>
                                    <div className="text-xs text-admin-muted-foreground">{errorInfo.pt}</div>
                                  </div>
                                );
                              }
                              return '-';
                            })()}
                          </TableCell>
                          <TableCell className="text-admin-table-text max-w-xs">
                            <button 
                              className="text-left w-full hover:bg-admin-muted/10 p-1 rounded cursor-pointer flex items-center gap-1"
                              onClick={() => {
                                setSelectedJsonData({
                                  request: test.requestData,
                                  response: test.response
                                });
                                setJsonModalOpen(true);
                              }}
                            >
                              <div className="truncate flex-1">
                                {JSON.stringify(test.response)}
                              </div>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {testHistory.length === 0 && (
                  <div className="text-center py-8 text-admin-muted-foreground">
                    Nenhum teste realizado ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="error-codes">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground">Códigos de Erro da API MOTV</CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Consulte os códigos de erro retornados pela API MOTV e suas descrições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Buscar por código ou descrição..."
                  value={errorCodeSearch}
                  onChange={(e) => setErrorCodeSearch(e.target.value)}
                  className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary"
                />
              </div>
              <div className="overflow-x-auto">
                <Table className="bg-admin-table-bg border-admin-border">
                  <TableHeader>
                    <TableRow className="bg-admin-table-header border-admin-border">
                      <TableHead className="text-admin-foreground">Código</TableHead>
                      <TableHead className="text-admin-foreground">Descrição (Português)</TableHead>
                      <TableHead className="text-admin-foreground">Description (English)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(ERROR_CODES)
                      .filter(([code, descriptions]) => {
                        if (!errorCodeSearch) return true;
                        const search = errorCodeSearch.toLowerCase();
                        return (
                          code.includes(search) ||
                          descriptions.pt.toLowerCase().includes(search) ||
                          descriptions.en.toLowerCase().includes(search)
                        );
                      })
                      .map(([code, descriptions]) => (
                      <TableRow key={code} className="border-admin-border hover:bg-admin-muted/20">
                        <TableCell className="font-medium text-admin-table-text">
                          <Badge variant="outline" className="border-admin-border text-admin-foreground bg-admin-muted/10">
                            {code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-admin-table-text max-w-md">
                          {descriptions.pt}
                        </TableCell>
                        <TableCell className="text-admin-table-text max-w-md">
                          {descriptions.en}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {Object.entries(ERROR_CODES).filter(([code, descriptions]) => {
                  if (!errorCodeSearch) return true;
                  const search = errorCodeSearch.toLowerCase();
                  return (
                    code.includes(search) ||
                    descriptions.pt.toLowerCase().includes(search) ||
                    descriptions.en.toLowerCase().includes(search)
                  );
                }).length === 0 && errorCodeSearch && (
                  <div className="text-center py-8 text-admin-muted-foreground">
                    Nenhum código de erro encontrado para "{errorCodeSearch}"
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-admin-foreground">
                Histórico de Jobs de Integração
                <Button
                  onClick={handleProcessPendingJobs}
                  disabled={processingJobs}
                  size="sm"
                  className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                >
                  <Play className="h-4 w-4" />
                  {processingJobs ? "Processando..." : "Processar Pendentes"}
                </Button>
              </CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Visualize o status dos jobs de integração com a API MOTV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="bg-admin-table-bg border-admin-border">
                  <TableHeader>
                    <TableRow className="bg-admin-table-header border-admin-border">
                      <TableHead className="text-admin-foreground">Tipo</TableHead>
                      <TableHead className="text-admin-foreground">Entidade</TableHead>
                      <TableHead className="text-admin-foreground">Status</TableHead>
                      <TableHead className="text-admin-foreground">Tentativas</TableHead>
                      <TableHead className="text-admin-foreground">Executado por</TableHead>
                      <TableHead className="text-admin-foreground">Criado em</TableHead>
                      <TableHead className="text-admin-foreground">Processado em</TableHead>
                      <TableHead className="text-admin-foreground">Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id} className="border-admin-border hover:bg-admin-muted/20">
                        <TableCell className="font-medium text-admin-table-text">
                          {job.job_type.replace('_', ' ').toUpperCase()}
                        </TableCell>
                        <TableCell className="text-admin-table-text">{job.entity_type}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-admin-table-text">
                          {job.attempts}/{job.max_attempts}
                        </TableCell>
                        <TableCell className="text-admin-table-text">
                          {job.user_email || 'Sistema'}
                        </TableCell>
                        <TableCell className="text-admin-table-text">{formatDate(job.created_at)}</TableCell>
                        <TableCell className="text-admin-table-text">
                          {job.processed_at ? formatDate(job.processed_at) : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {job.last_error && (
                            <div className="text-sm text-red-400 truncate" title={job.last_error}>
                              {job.last_error}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {jobs.length === 0 && (
                  <div className="text-center py-8 text-admin-muted-foreground">
                    Nenhum job encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* JSON Modal */}
      <Dialog open={jsonModalOpen} onOpenChange={setJsonModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-admin-card border-admin-border">
          <DialogHeader>
            <DialogTitle className="text-admin-foreground">Detalhes da Requisição</DialogTitle>
            <DialogDescription className="text-admin-muted-foreground">
              Visualize os dados completos da requisição e resposta
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
            <div className="space-y-2">
              <h4 className="font-semibold text-admin-foreground">Request Data:</h4>
              <pre className="bg-admin-input p-3 rounded-md text-sm text-admin-foreground overflow-auto max-h-60 border border-admin-border">
                {JSON.stringify(selectedJsonData?.request || {}, null, 2)}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-admin-foreground">Response Data:</h4>
              <pre className="bg-admin-input p-3 rounded-md text-sm text-admin-foreground overflow-auto max-h-60 border border-admin-border">
                {JSON.stringify(selectedJsonData?.response || {}, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}