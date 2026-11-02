# MedClinic API — Etapa 2

API REST para apoiar a operação de uma clínica, cobrindo cadastro de pacientes e médicos, escalas de trabalho, agendamentos e prontuários. O projeto foi desenvolvido em TypeScript com NestJS, TypeORM e PostgreSQL.

## Publicação

- **API:** http://163.176.159.88:3000
- **Health check:** http://163.176.159.88:3000/api/v1/health
- **Prefixo das rotas:** `/api/v1`
- **Repositório:** https://github.com/CleberCW/sctec-clinica-nestjs
- **Board do projeto:** TODO — adicionar o link público do GitHub Projects ou Trello.

O health check retorna `{ "status": "ok" }` quando a aplicação está disponível.

## Escopo

A API implementa os seguintes recursos:

- autenticação por JWT e autorização baseada nos perfis `admin`, `secretary` e `doctor`;
- cadastro, consulta, atualização e remoção lógica de pacientes, identificados por CPF;
- cadastro de médicos com usuário de acesso associado;
- cadastro e consulta de escalas de trabalho por turno;
- consulta à agenda de um médico em um intervalo;
- criação de agendamentos com validação da escala e prevenção de conflitos de horário;
- transições de status dos agendamentos;
- registro e consulta de prontuários com autorização baseada no vínculo entre médico e paciente;
- validação de entrada e tratamento centralizado de erros.

## Tecnologias

- Node.js e TypeScript
- NestJS 11
- PostgreSQL 18
- TypeORM
- JWT (`jsonwebtoken`) e criptografia AES-256-GCM
- bcrypt para hash de senhas
- Zod para validação das variáveis de ambiente
- class-validator e class-transformer para DTOs
- Jest para testes automatizados
- Docker e Docker Compose
- GitHub Actions e GitHub Container Registry (GHCR)
- Oracle Cloud Infrastructure (OCI) para hospedagem

## Arquitetura e decisões de projeto

A aplicação segue uma arquitetura em camadas e módulos por recurso:

- **Controllers:** recebem requisições HTTP, validam os parâmetros e encaminham a operação.
- **Services:** concentram as regras de negócio e os casos de uso.
- **Repositories:** isolam o acesso a dados, implementado com TypeORM.
- **Entities:** representam as tabelas e relacionamentos do PostgreSQL.
- **DTOs:** definem os contratos de entrada e saída da API.
- **Guards, decorators e filters:** concentram autenticação, autorização e tratamento de erros.
- **Database:** mantém o DataSource e as migrations do TypeORM.

As dependências entre camadas são injetadas pelo construtor. O `HttpExceptionFilter` centraliza a tradução dos erros para respostas HTTP.

### Modelagem e integridade

- CPF, CRM e e-mail possuem restrições de unicidade no banco.
- Instantes de agendamento são armazenados com fuso horário (`timestamptz`).
- A duração da consulta é definida pelo turno da escala e o intervalo final é persistido no agendamento.
- A prevenção de sobreposição de agendamentos utiliza constraints de exclusão com GiST e a extensão `btree_gist`, além das verificações transacionais da aplicação.
- `synchronize: false` permanece desabilitado em produção. A estrutura é versionada por migrations.
- As migrations ficam em `src/@common/database/migrations` e são executadas pelo TypeORM durante a inicialização do DataSource (`migrationsRun: true`).
- O `AdminSeedService` cria o primeiro administrador na inicialização, caso o e-mail configurado ainda não exista. As credenciais vêm de variáveis de ambiente.

### Convenções de nomenclatura

- Diretórios são organizados por recurso, em nomes minúsculos: `appointments/`, `doctors/`, `patients/`, `users/` e `auth/`.
- Os arquivos identificam o recurso e a camada pelo sufixo: `.controller.ts`, `.service.ts`, `.repository.ts`, `.providers.ts`, `.module.ts` e `.entity.ts`. DTOs ficam em diretórios `dto/`.
- Classes e tipos usam **PascalCase** (por exemplo, `AppointmentsService`).
- Variáveis, propriedades e métodos usam **camelCase** (por exemplo, `startsAt`, `getCalendar`).
- Constantes e identificadores de roles usam nomes em maiúsculas, como `ROLES` e `ERROR_CODE`.
- Rotas e campos JSON seguem os nomes em minúsculas e camelCase definidos pelo contrato da API.

### Estrutura principal

```text
src/
├── @common/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   ├── data-source.ts
│   │   ├── database.modules.ts
│   │   └── database.providers.ts
│   ├── decorators/
│   ├── entities/
│   ├── errors/
│   ├── filters/
│   ├── guards/
│   ├── tools/
│   └── utils/
├── appointments/
│   └── dto/
├── auth/
│   └── dtos/
├── doctors/
│   └── dto/
├── patients/
│   └── dto/
├── roles/
├── users/
│   └── dto/
├── app.controller.ts
├── app.module.ts
└── main.ts

test/
.github/
└── workflows/
```

## Configuração por variáveis de ambiente

O arquivo `.env` não deve ser versionado. Crie-o a partir do exemplo:

```bash
cp .env.example .env
```

O `.env.example` lista as variáveis usadas pela aplicação e pelo Compose local, sem credenciais reais.

| Variável | Finalidade |
|---|---|
| `PORT` | Porta HTTP da API. Padrão: `3000`. |
| `DB_HOST` | Host do PostgreSQL. Local: `localhost`; produção: IP privado da VM do banco (`10.0.0.23`). |
| `DB_PORT` | Porta do PostgreSQL. Padrão: `5432`. |
| `DB_USER` | Usuário utilizado pela API. |
| `DB_PASSWORD` | Senha do usuário da aplicação no PostgreSQL. |
| `DB_NAME` | Nome do banco utilizado pela API. |
| `JWT_SECRET` | Segredo usado para assinar os JWTs. |
| `JWT_ENCRYPTION_KEY` | Chave hexadecimal de 32 bytes (64 caracteres hex) usada pelo AES-256-GCM. |
| `JWT_ISSUER` | Emissor informado no JWT. |
| `INITIAL_ADMIN_EMAIL` | E-mail do administrador inicial. |
| `INITIAL_ADMIN_PASSWORD` | Senha do administrador inicial. |
| `POSTGRES_USER` | Usuário inicial do container PostgreSQL local. |
| `POSTGRES_PASSWORD` | Senha inicial do container PostgreSQL local. |
| `POSTGRES_DB` | Banco inicial do container PostgreSQL local. |
| `POSTGRES_PORT` | Porta publicada pelo Compose local. |

Para gerar os segredos, use valores novos:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Use uma saída para `JWT_SECRET` e outra para `JWT_ENCRYPTION_KEY`. A chave de criptografia precisa ter exatamente 64 caracteres hexadecimais.

No ambiente local, mantenha `POSTGRES_USER` igual a `DB_USER`, `POSTGRES_DB` igual a `DB_NAME` e `POSTGRES_PASSWORD` igual a `DB_PASSWORD`. Em produção, a API usa as credenciais do usuário de aplicação `admin`; a senha do superusuário `postgres` não deve ser usada pela API.

## Execução local

### Pré-requisitos

- Node.js e npm
- Docker Engine e Docker Compose
- Git

### 1. Configurar o ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`, substitua os placeholders e configure `DB_HOST=localhost`.

### 2. Iniciar o PostgreSQL

```bash
docker compose -f docker-compose.db.yml up -d
```

Verifique o container:

```bash
docker compose -f docker-compose.db.yml ps
```

### 3. Instalar dependências, aplicar migrations e iniciar a API

```bash
npm ci
npm run migration:run
npm run start:dev
```

O DataSource da aplicação também está configurado com `migrationsRun: true`; portanto, migrations pendentes são aplicadas na inicialização da API. O comando `npm run migration:run` pode ser usado para executá-las explicitamente durante o desenvolvimento.

A API local fica disponível em:

```text
http://localhost:3000
http://localhost:3000/api/v1/health
```

### Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run build` | Compila a aplicação TypeScript. |
| `npm run start:dev` | Inicia em modo de desenvolvimento. |
| `npm run start:prod` | Inicia o código compilado. |
| `npm run migration:run` | Executa migrations pendentes via DataSource. |
| `npm run migration:revert` | Reverte a última migration aplicada. |
| `npm test` | Executa os testes Jest. |
| `npm run test:cov` | Executa testes e gera cobertura. |
| `npm run test:e2e` | Executa a suíte e2e configurada. |
| `npm run lint` | Executa o ESLint. |
| `npm run format` | Formata os arquivos TypeScript. |

Para encerrar o banco local sem apagar os dados:

```bash
docker compose -f docker-compose.db.yml down
```

O volume `pgdata` mantém os dados. **Não use `docker compose down -v`**, a menos que queira apagar o banco local.

## Ambiente publicado na Oracle Cloud

A implantação atual utiliza duas VMs na mesma VCN:

| Componente | Endereço privado | Responsabilidade |
|---|---|---|
| VM da API | `10.0.0.135` | Container NestJS e publicação HTTP na porta `3000`. |
| VM do PostgreSQL | `10.0.0.23` | PostgreSQL 18.6 em Docker Compose, porta privada `5432`. |

A API conecta-se ao banco pelo endereço privado `10.0.0.23:5432`. A regra de entrada do banco permite a porta 5432 somente a partir de `10.0.0.135/32`; a porta do PostgreSQL não é destinada ao acesso público.

O arquivo de ambiente de produção fica na VM da API em `/home/ubuntu/sctec-clinica/.env`, fora do repositório e da imagem Docker. Na VM do banco, as credenciais do container e do usuário de aplicação ficam no arquivo de ambiente do Compose do PostgreSQL.

### Publicação contínua

Os workflows ficam em `.github/workflows/`:

- **`pr-workflow.yml`:** executado em pull requests para `main`; faz checkout, configura Node.js 22, executa `npm ci`, build e testes com cobertura.
- **`deploy.yml`:** executado em push para `main`; constrói a imagem multi-stage, publica as tags SHA e `latest` no GHCR e acessa a VM da API por SSH para atualizar o container.
- **`test-oci-deploy.yml`:** workflow manual para testar uma imagem já publicada em um container temporário, sem substituir o container principal.
- **`test-oci-ssh.yml`:** workflow de diagnóstico da conectividade SSH.

O deploy utiliza os GitHub Secrets `OCI_VM_HOST`, `OCI_VM_USER`, `OCI_VM_SSH_PRIVATE_KEY` e `OCI_VM_KNOWN_HOSTS`. Os segredos da aplicação são configurados diretamente no arquivo `.env` da VM e não são incluídos no workflow, no repositório ou na imagem.

As migrations pendentes são executadas pelo TypeORM durante a inicialização do DataSource da aplicação. Se uma migration falhar, a inicialização da API falha.

## Endpoints

Todas as rotas usam o prefixo `/api/v1`, recebem e devolvem JSON e utilizam campos em camelCase. Exceto as rotas públicas, é necessário enviar o token no cabeçalho `Authorization: Bearer <accessToken>`.

A tabela abaixo resume o contrato definido para a avaliação:

| Método | Rota | Acesso |
|---|---|---|
| GET | `/health` | Público |
| POST | `/auth/login` | Público |
| GET | `/users/me` | Autenticado |
| POST | `/users` | `admin` |
| POST | `/patients` | `admin`, `secretary` |
| GET | `/patients` | Autenticado |
| GET | `/patients/{id}` | Autenticado |
| PATCH | `/patients/{id}` | `admin`, `secretary` |
| DELETE | `/patients/{id}` | `admin` |
| POST | `/doctors` | `admin` |
| GET | `/doctors` | Autenticado |
| GET | `/doctors/{id}` | Autenticado |
| PUT | `/doctors/{doctorId}/work-schedule` | `admin` |
| GET | `/doctors/{doctorId}/work-schedule` | Autenticado |
| GET | `/doctors/{doctorId}/calendar?from=&to=` | Autenticado |
| POST | `/appointments` | `admin`, `secretary` |
| GET | `/appointments` | Autenticado; filtrado pelo perfil |
| GET | `/appointments/{id}` | Autenticado, sujeito à posse |
| PATCH | `/appointments/{id}/status` | Conforme a transição de status |
| POST | `/patients/{patientId}/medical-records` | `doctor` com vínculo |
| GET | `/patients/{patientId}/medical-records` | `doctor` com vínculo ou `admin` |

### Divergências de rota/perfil a revisar

Na revisão dos controllers atuais, foram identificadas diferenças em relação ao contrato acima:

- O controller de usuários expõe `POST /users/register` com autenticação JWT; o contrato pede `POST /users` restrito ao perfil `admin`.
- A listagem e consulta individual de pacientes estão restritas a `admin` e `secretary` no controller atual; o contrato permite qualquer usuário autenticado.
- A listagem e consulta individual de médicos estão restritas a `admin` e `secretary` no controller atual; o contrato permite qualquer usuário autenticado.
- O cadastro da escala está implementado como `POST /doctors/{id}/work-schedule`; o contrato especifica `PUT`.

Esses pontos devem ser alinhados antes da avaliação automatizada, que verifica método, rota e autorização literalmente.

## Testes e cobertura

A suíte utiliza Jest. O recorte de cobertura considera os arquivos que concentram as regras de negócio:

- `src/appointments/appointments.service.ts`
- `src/auth/auth.service.ts`
- `src/doctors/doctors.service.ts`
- `src/patients/medical-records.service.ts`
- `src/patients/patients.service.ts`
- `src/users/user.service.ts`

O `package.json` estabelece cobertura mínima global de **80%** para `lines`, `branches`, `functions` e `statements`. Controllers, DTOs, entidades, módulos, providers e migrations ficam fora do recorte porque não concentram as regras de negócio avaliadas.

Os testes unitários usam dublês das dependências/repositórios, sem exigir banco de dados, rede ou variáveis de ambiente.

## Versionamento e gestão

O fluxo de desenvolvimento utiliza branches por funcionalidade ou correção, commits semânticos e pull requests para `main`. O workflow de validação executa build e testes com cobertura antes do merge; a publicação é disparada pelo push resultante na branch `main`.

O board deve ser mantido público no GitHub Projects ou Trello e vinculado aos pull requests correspondentes. **Link pendente:** adicionar aqui a URL pública do board.

## Observações sobre a infraestrutura em relação à especificação

A implantação atualmente funcional utiliza VMs na Oracle Cloud: PostgreSQL autogerenciado em Docker Compose numa VM dedicada e API NestJS em outra VM. A especificação do módulo descreve PostgreSQL gerenciado com SSL e cita Render ou Google Cloud Run como destinos de publicação. Portanto, a arquitetura OCI atual é uma decisão de implantação diferente da plataforma indicada no documento, e a conexão PostgreSQL atual ainda deve ser avaliada quanto ao requisito de SSL. Esta seção registra a configuração real, sem declarar conformidade que ainda não foi implementada.
