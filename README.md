# MeuGasto Pro

Controle financeiro pessoal — lançamentos, receitas, cartões de crédito, investimentos e contas fixas.

Desenvolvido com **Next.js 16 · React 19 · Tailwind 4 · shadcn/ui · Zustand**.  
Armazenamento 100% local no navegador (`localStorage`). Sem banco de dados próprio.

---

## Funcionalidades

- Dashboard com resumo mensal e gráficos
- Lançamentos de despesas com categorias e parcelamento
- Receitas recorrentes e avulsas
- Cartões de crédito com compras parceladas
- Investimentos com juros compostos
- Contas fixas mensais
- Backup e restauração em JSON / exportação em PDF
- Tema claro / escuro
- PWA (instalável no celular)
- Sistema de licença via Supabase (validação por código de ativação)
- Migração automática de dados do app v1 (MeuGasto original)

---

## Requisitos

- Node.js 20+ (ou Bun 1.x)
- Conta no GitHub + Vercel (para deploy gratuito)

---

## Rodar localmente

```bash
# Instalar dependências
npm install
# ou
bun install

# Iniciar em modo desenvolvimento
npm run dev
# ou
bun dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Deploy na Vercel (recomendado)

1. Faça o fork / push deste repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → selecione o repositório
3. Clique em **Deploy** — a Vercel detecta o Next.js e compila automaticamente

### Variáveis de ambiente (opcionais)

Se quiser usar seu **próprio** projeto Supabase, defina nas configurações da Vercel:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |

Sem essas variáveis, o app usa o projeto Supabase padrão já embutido no código.

---

## Hospedar em hospedagem comum (sem Node)

Gere o build estático:

```bash
npm run build
```

Suba o conteúdo da pasta `out/` (ou o `.next/standalone/`) no seu servidor.  
Consulte o arquivo **GUIA-DE-INSTALACAO.txt** para instruções detalhadas.

---

## Banco de dados / Supabase

Os scripts SQL para criar as tabelas de licença estão em:

- `SETUP-SUPABASE.sql` — criação inicial
- `ATUALIZACAO-SUPABASE.sql` — migrações para versões existentes

---

## Licença

Uso privado — não redistribuir sem autorização.
