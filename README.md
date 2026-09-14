# Clínica NestJS

API para gerenciamento de usuários de uma clínica.

Este projeto é uma refatoração da versão em Express para NestJS, mantendo a mesma proposta da aplicação e reorganizando a estrutura para utilizar os recursos do framework.

## Tecnologias

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- TypeORM
- JWT
- bcrypt
- class-validator

## Estrutura

A aplicação é organizada em módulos e segue a estrutura do NestJS, separando controllers, services, repositories, entidades, DTOs e recursos compartilhados.

O acesso ao banco é feito através de providers e injeção de dependências. Os repositories são definidos por abstrações e implementados com TypeORM.

## Autenticação e autorização

A autenticação utiliza JWT.

Os tokens são assinados com `jsonwebtoken` e também são criptografados com AES-256-GCM antes de serem enviados ao cliente. O `JwtGuard` é responsável por extrair, descriptografar e validar o token nas rotas protegidas.

A autorização utiliza roles e permissions. O projeto possui as roles `admin`, `user` e `owner`, com diferentes níveis de acesso.

## Validação e tratamento de erros

A validação dos DTOs é feita globalmente através do `ValidationPipe` do NestJS.

Também foram implementados exception filters para centralizar o tratamento das exceções HTTP e controlar as respostas de erros da aplicação.

## Banco de dados

O projeto utiliza PostgreSQL com TypeORM e migrations.

As migrations são responsáveis por criar e atualizar a estrutura do banco. Os dados iniciais necessários para o funcionamento da aplicação são inseridos separadamente através do seed.

### Configuração inicial do banco

Antes de iniciar a API, configure o arquivo `.env`, execute as migrations e, **obrigatoriamente, execute o seed**:

```bash
npm install
npm run migration:run
npm run seed
```

O seed cria as permissions, roles e o usuário administrador inicial. **A API deve ser inicializada somente após a execução do seed**, pois o sistema de autenticação e autorização depende desses dados.

O usuário administrador inicial utiliza:

```env
INITIAL_ADMIN_EMAIL=admin@email.com
INITIAL_ADMIN_PASSWORD=sua_senha
```

Essas variáveis devem estar definidas antes da execução de `npm run seed`.

## PostgreSQL com Docker

O projeto possui um `docker-compose.yml` para subir o PostgreSQL:

```bash
docker compose up -d
```

## Configuração

Copie o `.env.example` para `.env` e ajuste os valores:

```env
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=clinica
JWT_SECRET=sua_chave
INITIAL_ADMIN_EMAIL=admin@email.com
INITIAL_ADMIN_PASSWORD=sua_senha
```

## Execução

Após concluir a configuração do banco e executar as migrations e o seed, inicie a aplicação.

Desenvolvimento:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Produção:

```bash
npm run start:prod
```

## Rotas

Módulo de usuários:

```text
POST /users/login
POST /users/register
GET  /users/me
```

O cadastro de usuários é protegido por autenticação e autorização.

## Testes

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Comandos úteis

```bash
npm run format
npm run lint
npm run start:debug
```
