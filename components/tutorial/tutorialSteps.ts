export interface TutorialStep {
    target: string; // data-tutorial attribute value → selector: [data-tutorial="xxx"]
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

// ─── 🏠 Dashboard ──────────────────────────────────────────────────────────
export const dashboardSteps: TutorialStep[] = [
    {
        target: 'stats',
        title: '📊 Painel de Estatísticas',
        content: 'Aqui você vê em tempo real o total de Clientes, Veículos e Laudos registrados no sistema.',
        position: 'bottom',
    },
    {
        target: 'equipment-notifications',
        title: '🔔 Alertas de Equipamentos',
        content: 'O sistema avisa automaticamente quando equipamentos estão próximos do vencimento. Nunca perca um prazo!',
        position: 'bottom',
    },
    {
        target: 'filters',
        title: '🔍 Filtros Avançados',
        content: 'Filtre laudos por tipo (CHECKLIST, LIT, RUÍDO, etc.), cliente, período de datas ou faça uma busca livre por OS, placa ou nome.',
        position: 'bottom',
    },
    {
        target: 'table',
        title: '📋 Tabela de Laudos',
        content: 'Lista completa de todos os laudos emitidos. Cada linha mostra a OS, cliente, veículo (placa + modelo), tipo, e datas de emissão e vencimento.',
        position: 'top',
    },
    {
        target: 'pdf-btn',
        title: '📄 Baixar PDF',
        content: 'Clique aqui para gerar e baixar instantaneamente o PDF oficial do laudo. O arquivo é nomeado automaticamente com o tipo e número da OS.',
        position: 'left',
    },
    {
        target: 'delete-btn',
        title: '🗑️ Excluir Laudo',
        content: 'Remove permanentemente um laudo do sistema. Uma confirmação será solicitada antes da exclusão. Atenção: esta ação não pode ser desfeita!',
        position: 'left',
    },
    {
        target: 'pagination',
        title: '📑 Paginação',
        content: 'Navegue entre as páginas de laudos usando os botões de anterior e próximo, ou clique diretamente no número da página.',
        position: 'top',
    },
];

// ─── 📋 Emitir Laudo ────────────────────────────────────────────────────────
export const emitirLaudoSteps: TutorialStep[] = [
    {
        target: 'laudo-cards',
        title: '📋 Tipos de Laudo',
        content: 'Escolha o tipo de laudo a ser emitido. Cada card corresponde a um tipo específico de inspeção veicular.',
        position: 'bottom',
    },
    {
        target: 'laudo-checklist',
        title: '✅ Laudo CHECKLIST',
        content: 'Inspeção completa com checklist de itens do veículo. Verifica carroceria, pneus, sistema elétrico, documentação e muito mais.',
        position: 'bottom',
    },
    {
        target: 'laudo-lit',
        title: '📝 Laudo LIT',
        content: 'Laudo de Inspeção de Tacógrafo (LIT). Documenta a verificação e calibração do tacógrafo, obrigatório para veículos de transporte de carga.',
        position: 'bottom',
    },
    {
        target: 'laudo-ruido',
        title: '🔊 Laudo de Ruído',
        content: 'Medição e laudo de ruído do veículo. Registra os decibéis medidos e emite o certificado de conformidade.',
        position: 'bottom',
    },
    {
        target: 'laudo-pino-rei',
        title: '🔧 Laudo Pino Rei',
        content: 'Inspeção do Pino Rei do semi-reboque. Verifica condições, medições e estado de conservação do acoplamento.',
        position: 'bottom',
    },
    {
        target: 'laudo-quinta-roda',
        title: '🔩 Laudo Quinta Roda',
        content: 'Inspeção da Quinta Roda do cavalo-mecânico. Avalia o sistema de engate e acoplamento entre trator e semi-reboque.',
        position: 'bottom',
    },
    {
        target: 'active-form',
        title: '📝 Preenchimento do Formulário',
        content: 'Após selecionar um tipo, o formulário aparece aqui. Preencha os dados do cliente, veículo, OS e as informações específicas da inspeção.',
        position: 'top',
    },
];

// ─── 👥 Clientes ─────────────────────────────────────────────────────────────
export const clientsSteps: TutorialStep[] = [
    {
        target: 'cnpj-search',
        title: '🔍 Busca Automática por CNPJ',
        content: 'Digite o CNPJ da empresa e clique em "Buscar". O sistema consulta automaticamente a Receita Federal e preenche nome, endereço e outros dados.',
        position: 'bottom',
    },
    {
        target: 'client-form',
        title: '📋 Formulário de Cliente',
        content: 'Preencha os dados do cliente. Campos marcados com * são obrigatórios. Os dados do CNPJ podem ser preenchidos automaticamente pela busca acima.',
        position: 'bottom',
    },
    {
        target: 'whatsapp-field',
        title: '📱 WhatsApp',
        content: 'Informe o WhatsApp do cliente. Este contato será usado para comunicações sobre os laudos emitidos.',
        position: 'right',
    },
    {
        target: 'client-list',
        title: '📑 Lista de Clientes',
        content: 'Todos os clientes cadastrados aparecem aqui. Clique em um cliente para editar seus dados ou ver os laudos associados.',
        position: 'top',
    },
];

// ─── 🚛 Veículos ─────────────────────────────────────────────────────────────
export const vehiclesSteps: TutorialStep[] = [
    {
        target: 'client-select',
        title: '1️⃣ Selecione o Cliente',
        content: 'Primeiro escolha a qual cliente pertence o veículo. Os veículos são sempre vinculados a um cliente.',
        position: 'bottom',
    },
    {
        target: 'doc-processor',
        title: '📄 Importar CRLV (OCR)',
        content: 'Tire uma foto ou escaneie o CRLV do veículo. O sistema usa Inteligência Artificial para ler automaticamente placa, chassi, marca, modelo e ano.',
        position: 'bottom',
    },
    {
        target: 'vehicle-form',
        title: '🚛 Formulário do Veículo',
        content: 'Preencha os dados do veículo manualmente ou use o OCR para preencher automaticamente. Informe placa, chassi, marca/modelo e ano de fabricação.',
        position: 'top',
    },
];

// ─── 👨‍💼 Admin ────────────────────────────────────────────────────────────────
export const adminSteps: TutorialStep[] = [
    {
        target: 'admin-header',
        title: '👨‍💼 Painel do Inspetor',
        content: 'Esta é a área administrativa. Aqui você gerencia equipamentos de inspeção e usuários do sistema.',
        position: 'bottom',
    },
    {
        target: 'equipment-section',
        title: '🔧 Gestão de Equipamentos',
        content: 'Cadastre e gerencie os equipamentos usados nas inspeções (tacômetros, sonômetros, etc.) com suas datas de calibração e vencimento.',
        position: 'bottom',
    },
    {
        target: 'users-link',
        title: '👤 Gerenciar Usuários',
        content: 'Acesse o gerenciamento de usuários para criar e editar contas de inspetores. Disponível apenas para administradores.',
        position: 'right',
    },
];

// ─── 🔧 Admin Users ───────────────────────────────────────────────────────────
export const adminUsersSteps: TutorialStep[] = [
    {
        target: 'users-list',
        title: '👥 Lista de Usuários',
        content: 'Todos os usuários do sistema são listados aqui. Você pode ver seu papel (admin/user) e status de cada conta.',
        position: 'bottom',
    },
    {
        target: 'create-user-btn',
        title: '➕ Criar Usuário',
        content: 'Cria uma nova conta de inspetor. Defina nome de usuário, senha e nível de permissão (admin ou usuário comum).',
        position: 'left',
    },
    {
        target: 'edit-user-btn',
        title: '✏️ Editar Usuário',
        content: 'Modifica os dados de um usuário existente, incluindo redefinição de senha e alteração de permissões.',
        position: 'left',
    },
];

// ─── Mapa de rotas → steps ────────────────────────────────────────────────────
export const routeToSteps: Record<string, TutorialStep[]> = {
    '/': dashboardSteps,
    '/emitirlaudo': emitirLaudoSteps,
    '/clients/create': clientsSteps,
    '/vehicles': vehiclesSteps,
    '/admin': adminSteps,
    '/admin/users': adminUsersSteps,
};
