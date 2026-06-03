# Configuração de Favicon e Logo para Compartilhamento

## Objetivo

Configurar o favicon e metadados Open Graph para que o logo do **General Truck System Inspetor** apareça corretamente quando o link do site (generalinspetor.terpens.com.br) for compartilhado em redes sociais, mensagens ou outros aplicativos.

## Implementação Realizada

### 1. Atualização do Layout Principal (`app/layout.tsx`)

Foi adicionada configuração completa de metadados incluindo:

#### Ícones e Favicon
- **Favicon padrão**: `/favicon.ico` (já existente)
- **Logo PNG**: `/logo.png` como ícone alternativo (512x512)
- **Apple Touch Icon**: `/logo.png` para dispositivos iOS (180x180)

#### Metadados Open Graph
Configurado para aparecer quando o link for compartilhado:
- **Título**: "GTS - General Truck System Inspetor"
- **Descrição**: "Sistema de Emissão de Laudos - General Truck System Inspetor"
- **Imagem**: `/logo.png` (512x512)
- **Tipo**: website
- **Site Name**: "General Truck System Inspetor"

#### Twitter Card
- **Card Type**: summary_large_image
- **Título e Descrição**: Mesmos do Open Graph
- **Imagem**: `/logo.png`

#### URL Base
- Configurado para usar `https://generalinspetor.terpens.com.br` como base
- Pode ser sobrescrito pela variável de ambiente `NEXT_PUBLIC_BASE_URL`

## Arquivos Necessários

### Logo Principal
- **Localização**: `public/logo.png`
- **Tamanho recomendado**: 512x512 pixels (ou maior, mantendo proporção quadrada)
- **Formato**: PNG com fundo transparente (preferencial) ou com fundo

### Favicon
- **Localização**: `app/favicon.ico`
- **Formato**: ICO (já existe no projeto)

## Como Funciona

### 1. Favicon no Navegador
O favicon aparece automaticamente na aba do navegador quando o usuário acessa o site.

### 2. Compartilhamento de Links
Quando alguém compartilha o link `https://generalinspetor.terpens.com.br` em:
- **WhatsApp**: Mostra o logo, título e descrição
- **Facebook**: Mostra o logo, título e descrição
- **Twitter/X**: Mostra o logo, título e descrição
- **LinkedIn**: Mostra o logo, título e descrição
- **Telegram**: Mostra o logo, título e descrição
- **Outros apps**: Mostram conforme suporte a Open Graph

### 3. Metadados Aplicados
Os metadados são lidos automaticamente pelos serviços de compartilhamento através das tags HTML geradas pelo Next.js:
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta property="og:image">`
- `<meta property="og:type">`
- `<meta name="twitter:card">`
- `<link rel="icon">`
- `<link rel="apple-touch-icon">`

## Verificação

### Testar o Favicon
1. Acesse `https://generalinspetor.terpens.com.br`
2. Verifique se o favicon aparece na aba do navegador

### Testar Compartilhamento
1. Use ferramentas de validação:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

2. Ou teste diretamente:
   - Compartilhe o link no WhatsApp
   - Compartilhe o link no Telegram
   - Compartilhe o link no Facebook

### Verificar HTML Gerado
1. Acesse o site
2. Visualize o código-fonte da página (Ctrl+U)
3. Procure pelas tags `<meta>` e `<link>` no `<head>`

## Personalização

### Alterar Logo
1. Substitua o arquivo `public/logo.png`
2. Mantenha proporção quadrada (recomendado: 512x512 ou maior)
3. Use PNG com fundo transparente para melhor resultado

### Alterar Favicon
1. Substitua o arquivo `app/favicon.ico`
2. Use um gerador online de ICO se necessário

### Alterar Metadados
Edite o arquivo `app/layout.tsx` na seção `export const metadata`:
- Altere `title` para mudar o título
- Altere `description` para mudar a descrição
- Altere `images[0].url` para usar outro logo
- Altere `metadataBase` para mudar a URL base

## Variáveis de Ambiente (Opcional)

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_BASE_URL=https://generalinspetor.terpens.com.br
```

Isso permite configurar a URL base dinamicamente sem alterar o código.

## Notas Técnicas

- O Next.js 13+ (App Router) processa automaticamente os metadados definidos em `layout.tsx`
- Os ícones em `app/` são servidos automaticamente pelo Next.js
- Os arquivos em `public/` são servidos estaticamente
- O `metadataBase` é usado para resolver URLs relativas de imagens
- Os metadados são gerados no servidor (SSR) para melhor SEO

## Troubleshooting

### Logo não aparece ao compartilhar
1. Verifique se `public/logo.png` existe
2. Verifique se a URL está acessível publicamente
3. Limpe o cache do serviço de compartilhamento (Facebook Debugger, etc.)
4. Verifique se o `metadataBase` está correto

### Favicon não aparece
1. Verifique se `app/favicon.ico` existe
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Reinicie o servidor Next.js

### Metadados não atualizam
1. Limpe o cache do Next.js: `rm -rf .next`
2. Reinicie o servidor
3. Limpe o cache do serviço de compartilhamento

## Data de Implementação

Implementado em: Janeiro 2025

## Status

✅ Configuração completa e funcional

