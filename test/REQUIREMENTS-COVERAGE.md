# Rastreabilidade da bateria de testes

A suíte automatizada usa Jest e dublês das portas de repositório/serviços. Os testes unitários não inicializam PostgreSQL, não fazem chamadas de rede e não dependem de segredos de ambiente.

## Casos cobertos

| Requisito do documento | Arquivo de teste |
| --- | --- |
| Sobreposição: antes, depois, encostados, contido e cruzamento | `test/appointments/appointment-period.rules.spec.ts` |
| Criação: sucesso, recurso inexistente, fora da escala, desalinhado, não cabe no turno, conflito do médico e do paciente | `test/appointments/appointments.service.spec.ts` |
| Transições de status e permissões por perfil | `test/appointments/appointments.service.spec.ts` |
| Escala: sobreposição recusada e turnos encostados aceitos | `test/doctors/doctors.service.spec.ts` |
| Prontuário: autorização por vínculo | **Pendente: o repositório não contém módulo/service/controller/repository de prontuário para exercitar** |
| Login: usuário ausente, senha incorreta, comparação por hash e retorno do token | `test/auth/auth.service.spec.ts` |

Também foram adicionados testes complementares para CRUD e validação de CPF, criação atômica do médico na porta de repositório e filtros/escopo da agenda do médico.

## Cobertura

O Jest coleta cobertura somente de:
- `src/auth/auth.service.ts`
- `src/appointments/appointments.service.ts`
- `src/doctors/doctors.service.ts`
- `src/patients/patients.service.ts`

O limiar configurado é 80% para statements, branches, functions e lines. A regra de sobreposição e a extração de dia/horário UTC são funções puras testadas sem infraestrutura.

## Limitações importantes

1. O documento pede dois casos de prontuário, mas a branch principal disponível não contém a funcionalidade de prontuário. Não foi criado um teste falso contra classes inexistentes. Esses casos devem ser implementados assim que existir a camada de regra de negócio.
2. O teste unitário com mocks não comprova concorrência real entre conexões PostgreSQL. A verificação de concorrência do enunciado é de aceitação: duas requisições simultâneas, exatamente um HTTP 201 e uma resposta 409 `HORARIO_INDISPONIVEL`.
3. O limiar é uma barreira efetiva do comando `npm run test:cov`; portanto, a suíte precisa passar localmente e na CI antes do merge.

## Execução

```bash
npm ci
npm test
npm run test:cov
npm run build
```

## Última execução de CI

No commit testado pelo GitHub Actions:
- `npm ci`: aprovado;
- `npm run build`: aprovado;
- `npm run test:cov -- --runInBand`: aprovado;
- 5 suítes aprovadas, 64 testes aprovados.

Cobertura medida:
| Métrica | Resultado | Exigido |
| --- | ---: | ---: |
| Statements | 97,54% | 80% |
| Branches | 88,60% | 80% |
| Functions | 100% | 80% |
| Lines | 97,43% | 80% |

## Pendências de aceite que os testes unitários não cobrem

A suíte da seção 4.5 não substitui os testes de aceitação do contrato da seção 4.9. Na revisão estática do código disponível também foram identificadas diferenças que precisam ser tratadas antes da avaliação externa:
- `main.ts` habilita versionamento URI (`/v1`), mas não configura o prefixo global `/api` previsto no contrato.
- O controller de escala declara `POST /doctors/:id/work-schedule`, enquanto o contrato exige `PUT /doctors/{doctorId}/work-schedule`; também permite `secretary` na escrita, embora o contrato exija `admin`.
- O controller de usuários expõe `POST /users/register`, não `POST /users`, e sua proteção atual não restringe a criação ao perfil admin.
- Os módulos/controllers de prontuário ainda não existem.
- A resposta envelope de paginação (`data` e `meta`) precisa ser conferida nas rotas de listagem, conforme a seção 4.9.1.

A constraint PostgreSQL de exclusão para consultas ativas de médico e paciente foi restaurada na migration que recria o enum de status. Ainda assim, a corrida concorrente descrita na RN10 deve ser confirmada contra PostgreSQL com duas requisições HTTP realmente simultâneas; não é simulada pela suíte unitária.


## Convenção temporal adotada pela aplicação

A aplicação opera integralmente em UTC. Os timestamps recebidos pela API devem usar ISO 8601 com sufixo `Z`; datas persistidas e retornadas são instantes UTC serializados em ISO 8601. Os dias da semana e os horários `HH:mm` configurados na escala também são interpretados em UTC. Nenhuma conversão para fuso horário local é aplicada.

A suíte inclui testes de contrato que aceitam timestamps UTC com `Z` e rejeitam timestamps com offset diferente de UTC ou sem indicação explícita de UTC.
