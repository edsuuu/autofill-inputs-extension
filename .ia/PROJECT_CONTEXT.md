# AutoFill Inputs Extension - Contexto & Arquitetura Detalhada

Este documento serve como a base de conhecimento definitiva para o projeto **AutoFill**. Ele detalha a arquitetura, fluxos de dados, componentes e padrões de design estabelecidos.

---

## 🏗 Arquitetura do Sistema

### 1. Gestão de Estado Global (`src/context/AutofillContext.tsx`)
- **Mecanismo de Sincronização**: Utiliza `browser.storage.onChanged` para propagar alterações (como mudança de perfil ou ativação/desativação) entre o Popup, a página de Opções e todas as abas abertas simultaneamente.
- **Responsabilidades**: Centraliza perfis, configurações globais, notificações (toasts) e o estado de carregamento inicial.

### 2. Camada de Serviços (Lógica de Negócio)
- **`AutofillService.ts`**:
  - **Preenchimento Inteligente**: Detecta campos dinamicamente, ignorando estritamente qualquer campo com o atributo `disabled`.
  - **Faker Integration**: Capaz de gerar dados fictícios realistas para testes rápidos.
  - **Shadow DOM UI**: Responsável por injetar a interface na página do usuário sem conflitos de CSS.
- **`AutofillSaver.ts`**: Camada de persistência que gerencia o esquema de dados no `chrome.storage.local`:
  - `__site_data__`: Dicionário de URLs para configurações de campos.
  - `__profiles__`: Lista de nomes de perfis de usuário.
  - `__settings__`: Preferências globais do usuário.
- **`AutofillMatcher.ts`**: Resolve qual configuração de dados deve ser aplicada a uma URL específica, permitindo suporte a subdomínios e caminhos variáveis.

---

## 🎨 Componentes e Design System

### 1. Componentes Unificados (DRY - Don't Repeat Yourself)
Para manter o código limpo, componentes redundantes foram fundidos:
- **`InputModal.tsx`**: Componente genérico para todas as entradas de texto em modais (Criação de Perfil, Renomeação, Clonagem de URL).
- **`Switch.tsx`**: Componente de toggle padronizado para todas as configurações de ligar/desligar.
- **`Modal.tsx`**: Para diálogos de confirmação ou informativos.

### 2. Design Aesthetics
- **Visual**: Design "Glassmorphism" suave, bordas ultra-arredondadas (`rounded-3xl`), sombras profundas e micro-animações.
- **Paleta**: Indigo-600 (Ação), Slate-900 (Texto Principal), Emerald-500 (Sucesso), Rose-500 (Erro/Perigo).

---

## 📏 Regras de Ouro para Desenvolvimento

1.  **Isolamento Absoluto**: Toda interface injetada em sites externos **deve** residir dentro de um Shadow DOM.
2.  **CSS Determinístico**: Estilos para o Script de Conteúdo devem ser importados com `?inline` para garantir que o CSS compilado esteja disponível para o Shadow Root.
3.  **Respeito ao DOM**: Nunca tentar interagir ou preencher campos `disabled`.
4.  **UX consistente**: Nunca use `alert()`, `confirm()` ou `prompt()`. Use sempre os componentes internos `Modal`, `InputModal` ou `Toast`.
5.  **Build Workflow**: O comando `pnpm build` limpa o diretório `dist` e gera automaticamente o `extension.zip` com o manifesto na raiz, pronto para publicação.

---

## 📂 Organização de Pastas
- `.ia/`: Documentação de contexto e regras para assistentes de IA.
- `src/components/`: UI components modulares e reutilizáveis.
- `src/services/`: Lógica pura de processamento e dados.
- `src/pages/`: Pontos de entrada das telas da extensão.
- `src/hooks/`: Lógica de UI extraída (drag, scroll, detecção).
- `dist/`: Output de build (ignorado pelo git).
- `extension.zip`: Pacote final de distribuição (ignorado pelo git).
