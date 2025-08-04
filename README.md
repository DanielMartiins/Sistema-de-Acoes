# Sistema de Ações
  Último trabalho da disciplina de **Desenvolvimento de Servidor Web** no curso de **Bacharelado em Sistemas de Informação na UNIRIO**, 5° Período, com foco no aprendizado prático de desenvolvimento de uma aplicação web completa(frontend e backend). 
  
  A aplicação é um sistema que simula uma corretora eletrônica para negociação de ações. O sistema inclui funcionalidades como autenticação com JWT, visualização de carteira e mecanismos de compra e venda de ações
### 📄[Enunciado do Trabalho](./EnunciadoTrabalho.pdf)

## Como rodar a aplicação
### Pré-requisitos
[Node.JS](https://nodejs.org/en) e [MySQL](https://dev.mysql.com/downloads/mysql/)
### Passos
#### 1. Definir o usuário do MySQL como "root" e a senha como "admin"
#### 2. Rodar o script SQL localizado em ./sistema-de-acoes/sql/script.sql
#### 3. Rodar o back-end da aplicação
- Abra um terminal na pasta api (./sistema-de-acoes/api)
- Rode o comando `npm install` para instalar as dependências do back-end
- Rode o comando `npx nodemon` para rodar o servidor back-end
 
OBS: Mantenha esse terminal aberto!
#### 4. Rodar o front-end da aplicação
- **Mantenha o terminal anterior aberto** e abra um novo terminal na pasta front-end (./sistema-de-acoes/front-end)
- Rode o comando `npm install` para instalar as dependências do front-end
- Rode o comando `npm run serve` para rodar o servidor front-end

OBS: Também mantenha esse terminal aberto!

### 5. Abrir a aplicação no link a seguir:
`http://localhost:8080/`

## Tecnologias utilizadas

### Backend
  ![Tecnologias](https://skillicons.dev/icons?i=expressjs,js,mysql)

### Frontend
  ![Tecnologias](https://skillicons.dev/icons?i=html,css,js,vue,vuetify)

### Ambiente de execução do servidor web
![Tecnologias](https://skillicons.dev/icons?i=nodejs)
