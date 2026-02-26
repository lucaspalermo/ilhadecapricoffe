# Deploy Cafeteria PDV - Vercel + Neon (GRATIS)

Guia passo a passo para colocar o sistema online.

---

## PASSO 1 - Criar o Banco de Dados (Neon)

1. Acesse **https://neon.tech** e crie uma conta (pode usar Google)
2. Clique em **"Create a project"**
3. Coloque o nome: `cafeteria-pdv`
4. Regiao: escolha **South America (Sao Paulo)** se disponivel, senao **US East**
5. Clique em **"Create project"**
6. Na tela seguinte, copie a **Connection String** (comeca com `postgresql://...`)
   - GUARDE ESSA URL! Voce vai precisar dela no Passo 3

---

## PASSO 2 - Subir o Codigo no GitHub

1. Acesse **https://github.com** e faca login (ou crie uma conta)
2. Clique no **"+"** no canto superior direito > **"New repository"**
3. Nome: `cafeteria-pdv`
4. Marque como **Private** (privado)
5. NAO marque "Add README" (ja temos)
6. Clique **"Create repository"**
7. No seu PC, abra o terminal na pasta do projeto e execute:

```bash
cd C:\Users\lsimp\cafeteria-pdv
git remote add origin https://github.com/SEU-USUARIO/cafeteria-pdv.git
git branch -M main
git push -u origin main
```

(Substitua `SEU-USUARIO` pelo seu usuario do GitHub)

---

## PASSO 3 - Deploy na Vercel

1. Acesse **https://vercel.com** e faca login com sua conta GitHub
2. Clique em **"Add New Project"**
3. Encontre o repositorio `cafeteria-pdv` e clique **"Import"**
4. Em **"Environment Variables"**, adicione:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | A URL do Neon que voce copiou no Passo 1 |
| `NEXT_PUBLIC_APP_NAME` | `Cafeteria PDV` |

5. Clique **"Deploy"** e aguarde (leva ~2 minutos)

---

## PASSO 4 - Criar as Tabelas e Dados Iniciais

Apos o deploy, execute estes comandos no seu PC:

```bash
cd C:\Users\lsimp\cafeteria-pdv

# Coloque a URL do Neon no .env local
# Edite o arquivo .env e cole a URL do Neon no DATABASE_URL

# Criar as tabelas no banco
npx prisma db push

# Inserir dados iniciais (categorias, produtos, operadores)
npx tsx prisma/seed.ts
```

---

## PASSO 5 - Pronto!

Seu sistema estara online no endereco que a Vercel mostrar, algo como:
**https://cafeteria-pdv.vercel.app**

### PINs de acesso:
- **Admin**: 1234
- **Maria**: 5678

---

## Atualizacoes Futuras

Sempre que quiser atualizar o sistema:

```bash
cd C:\Users\lsimp\cafeteria-pdv
git add -A
git commit -m "descricao da mudanca"
git push
```

A Vercel faz deploy automatico a cada `git push`!

---

## Limites do Plano Gratuito

| Servico | Limite Gratis |
|---------|---------------|
| **Vercel** | 100GB bandwidth/mes, builds ilimitados |
| **Neon** | 512MB de banco, 1 projeto |

Para uma cafeteria, esses limites sao mais que suficientes.
