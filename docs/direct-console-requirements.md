# Direct Console Requirements

## Objetivo

O `direct-console` é a superfície operacional da DIRECT para leitura, organização e uso do contexto unificado do cliente. Ele não é um construtor de sites. Ele existe para operar a visão consolidada de vendas, finanças, operação, digital, documentos e IA contextual.

## Escopo funcional inicial

1. Exibir visão executiva do tenant com métricas, sinais e recomendações acionáveis.
2. Operar registry de conectores com status, cadência, latência e sinal de negócio.
3. Mostrar o modelo canônico que desacopla a IA dos schemas das ferramentas externas.
4. Ler o website como fonte de contexto e expor achados de posicionamento, CTAs e prova social.
5. Exibir a knowledge base preparada para chunking, embeddings e retrieval por tenant.
6. Expor o AI copilot como camada de recomendação orientada a evidência.
7. Documentar a arquitetura da plataforma na própria interface.

## Requisitos funcionais

### Navegação

- Navegação lateral persistente entre `overview`, `sources`, `context`, `website`, `knowledge`, `ai` e `architecture`.
- URL própria por área para permitir deep link e expansão futura.
- Troca de idioma na interface.

### Dados

- Leitura assíncrona de métricas e conectores.
- Cache de dados de leitura para reduzir refetch desnecessário.
- Estados de loading, vazio e erro preparados para integração real com API.

### Operação de fontes

- Busca textual por nome, resumo e sinal.
- Filtro por status e grupo de conector.
- Destaque do conector selecionado com visão de cadência, latência e sinal.

### Visualização

- Cards executivos para KPIs principais.
- Gráfico de tendência para evolução de contexto, sinais e ações.
- Cartões de recomendação, retrieval e arquitetura.

## Requisitos não funcionais

- Responsivo para desktop e mobile.
- Acessibilidade básica com navegação por teclado e contraste suficiente.
- Internacionalização pronta para expansão.
- Separação entre shell visual, dados mockados e futura camada de API.
- Pronto para multi-tenant e integração com observabilidade.

## Arquitetura frontend

- `React + TypeScript + Vite`
- `BrowserRouter` para navegação
- `TanStack Query` para cache e consumo de dados
- `Axios` para cliente HTTP
- `React Hook Form + Zod` para formulários e validação
- `react-i18next + i18next` para i18n
- `Framer Motion` para transições
- `Recharts` para gráficos
- `Lucide React` para ícones
- `clsx` para composição de classes

## Bibliotecas base instaladas

### Runtime

- `react`
- `react-dom`
- `react-router-dom`
- `@tanstack/react-query`
- `axios`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `i18next`
- `react-i18next`
- `framer-motion`
- `recharts`
- `lucide-react`
- `clsx`

### Build

- `vite`
- `typescript`
- `@vitejs/plugin-react`
- `@types/react`
- `@types/react-dom`

## Próximos passos

1. Ligar `TanStack Query` ao backend real da DIRECT.
2. Trocar mocks por endpoints versionados por tenant.
3. Introduzir autenticação, feature flags e telemetria de produto.
4. Quebrar o `App.tsx` em módulos por domínio à medida que a superfície crescer.
