# 🌿 Alamedas Jardins - Hub do Condomínio

Sistema de diretório e comunicação para os condôminos do **Condomínio Alamedas de Aracaju – Jardins**. O projeto visa facilitar o acesso a prestadores de serviço, documentos técnicos, links de aplicativos e avisos da administração.

## 🚀 Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3 (Variáveis nativas, Flexbox, Animações) e JavaScript Vanilla.
* **Tipografia:** Fontes *Fraunces* e *DM Sans* (via Google Fonts).
* **Banco de Dados:** [Neon](https://neon.tech) (PostgreSQL Serverless).
* **Hospedagem & Backend:** [Cloudflare Pages](https://pages.cloudflare.com) (Hospedagem estática + Functions para API).
* **Integração:** GitHub para Deploy Contínuo.

## 🛠️ Arquitetura do Projeto

Originalmente desenvolvido no Supabase, o projeto foi migrado para uma arquitetura **Full-stack Serverless**:
1.  **Interface:** Um arquivo único `index.html` otimizado para dispositivos móveis.
2.  **API:** Cloudflare Functions (Node.js/Edge Runtime) que processam as requisições para o banco de dados.
3.  **Segurança:** A string de conexão com o banco de dados é mantida em variáveis de ambiente protegidas via Cloudflare.

## 📋 Funcionalidades

* **Busca em Tempo Real:** Filtragem de prestadores por nome ou categoria (ex: "água").
* **Menu Inferior (Tab Navigation):** Navegação fluida entre Prestadores, Documentos, Apps e Avisos.
* **Painel Administrativo Oculto:** Acesso via botão discreto no topo superior direito com proteção por senha.
* **Logo Dinâmico:** SVG embutido com animação de rotação contínua.
* **WhatsApp Integrado:** Links diretos para conversas com prestadores.

## ⚙️ Configuração para Deploy

Para rodar este projeto no Cloudflare Pages:
1.  Crie uma variável de ambiente chamada `DATABASE_URL` no painel do Cloudflare (Settings > Functions > Variables).
2.  Insira a string de conexão do seu projeto Neon nela.

---
*Desenvolvido por Alex - 2026*
