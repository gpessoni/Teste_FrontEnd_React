# Torneio Generator Frontend

Este projeto é uma interface de usuário desenvolvida em React para gerar chaveamentos de torneios com base no número de jogadores e no tipo de chaveamento selecionado. A aplicação oferece uma experiência de usuário intuitiva e é integrada com a API de backend.

## Funcionalidades

- **Inserção da quantidade de jogadores:** Permite ao usuário definir o número de participantes do torneio.
- **Seleção do modelo de chaveamento:** O usuário pode escolher entre chave eliminatória ou grupo único.
- **Geração de jogos:** Ao clicar no botão "Gerar Jogos", a aplicação envia os dados para o backend, que retorna o chaveamento gerado.
- **Exibição do chaveamento:** Mostra de forma clara e organizada os confrontos e rodadas para o modelo eliminatório ou a tabela de jogos para grupo único.
- **Boas práticas de UI/UX:** A interface é projetada para ser intuitiva e fácil de usar.

## Tecnologias Utilizadas

- **React:** Biblioteca JavaScript para construção da interface de usuário.
- **Vite:** Ferramenta para desenvolvimento rápido de projetos em React, proporcionando uma experiência de desenvolvimento ágil e eficiente.
- **CSS:** Utilizado para estilizar a interface e garantir uma boa experiência visual.

## Pré-requisitos

- [Node.js](https://nodejs.org/) instalado.
- Backend e banco de dados configurados e rodando.

## Configuração do Projeto

1. **Renomeie o arquivo `.env_example` para `.env`.**

   - Neste arquivo, você deve configurar a URL onde o backend está rodando, para que o frontend consiga se comunicar corretamente com a API.

2. **Instale as dependências:**

   ```bash
   npm install
   ```

   - Esse comando instala todas as dependências necessárias para o projeto.

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   - Esse comando inicia o servidor de desenvolvimento, permitindo que você visualize e interaja com a interface de usuário no navegador.

## Uso

- **Acesse a aplicação:** Após iniciar o servidor, você pode acessar a interface em `http://localhost:5174` .
- **Gerar chaveamento:** Insira o número de jogadores, selecione o tipo de chaveamento e clique em "Gerar Jogos" para visualizar o chaveamento gerado.

## Licença

Este projeto é licenciado sob a [MIT License](LICENSE).
