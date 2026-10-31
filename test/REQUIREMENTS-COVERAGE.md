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

O limiar configurado é 80% para statements, branches, functions e lines. A regra de sobreposição e a conversão para o fuso da clínica são funções puras testadas sem infraestrutura.

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
