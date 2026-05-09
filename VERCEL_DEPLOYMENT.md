# VERCEL DEPLOYMENT GUIDE

## Pré-requisitos
1. Conta no Vercel (https://vercel.com)
2. Git instalado e repositório configurado
3. Vercel CLI (opcional mas recomendado)

## Opção A: Deploy via GitHub (Recomendado)

### 1. Push do código para GitHub
```bash
cd /Users/frankabreu/Documents/Claude/Projects/Apresentacao_Discovery
git add .
git commit -m "Setup para Vercel deployment"
git push origin main
```

### 2. Conectar no Vercel
- Acesse https://vercel.com/import
- Selecione "Import Git Repository"
- Selecione seu repositório `apresentacao-discovery`
- Configure as variáveis de ambiente:
  - `AUTH_PASSWORD` = sua senha (padrão: "lending2026")

### 3. Deploy automático
Vercel fará deploy automaticamente. URL será algo como:
```
https://apresentacao-discovery-frnkabreu78.vercel.app
```

## Opção B: Deploy via Vercel CLI

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
cd /Users/frankabreu/Documents/Claude/Projects/Apresentacao_Discovery
vercel
```

### 3. Seguir as instruções
- Fazer login na conta Vercel
- Confirmar configurações do projeto
- Adicionar variáveis de ambiente se necessário

## Ambiente de Produção vs Desenvolvimento

- **Desenvolvimento**: `server.py` (local com `python server.py`)
- **Produção**: `api/index.py` (Vercel serverless)

## Testar após deploy

1. Acesse a URL do seu projeto no Vercel
2. Teste a autenticação com a senha configurada
3. Verifique se todos os assets carregam corretamente

## Troubleshooting

**Erro de autenticação?**
- Verifique se `AUTH_PASSWORD` está definido nas variáveis de ambiente do Vercel

**Assets não carregam?**
- Verifique se todos os arquivos CSS, JS e imagens estão no repositório git

**Função serverless não funciona?**
- Verifique os logs no dashboard do Vercel
- Certifique-se de que `api/index.py` está no diretório correto
