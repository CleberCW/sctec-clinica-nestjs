import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MedicalRecordsService } from '../../src/patients/medical-records.service';

jest.mock(
  'src/@common/entities/role.entity',
  () => ({
    ROLES: {
      ADMIN: 'admin',
      SECRETARY: 'secretary',
      DOCTOR: 'doctor',
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/@common/entities/appointment.entity',
  () => ({
    APPOINTMENT_STATUSES: {
      SCHEDULED: 'scheduled',
      IN_PROGRESS: 'in_progress',
      DONE: 'done',
      CANCELLED: 'cancelled',
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/@common/errors/domain.error',
  () => jest.requireActual('../../src/@common/errors/domain.error'),
  { virtual: true },
);

jest.mock(
  'src/doctors/doctors.service',
  () => ({ DoctorsService: class DoctorsService {} }),
  { virtual: true },
);

jest.mock(
  'src/patients/patients.service',
  () => ({ PatientsService: class PatientsService {} }),
  { virtual: true },
);

jest.mock('../../src/patients/medical-records.repository', () => ({
  MedicalRecordsRepository: class MedicalRecordsRepository {},
}));

describe(MedicalRecordsService.name, () => {
  const medicalRecordsRepository = {
    createMedicalRecord: jest.fn<() => Promise<unknown>>(),
    getMedicalRecordsByPatient: jest.fn<() => Promise<unknown>>(),
  };
  const doctorService = {
    getOne: jest.fn<() => Promise<unknown>>(),
  };
  const patientService = {
    getOne: jest.fn<() => Promise<unknown>>(),
  };

  let service: MedicalRecordsService;

  const doctorUser = {
    sub: '30',
    data: {
      email: 'medico@medclinic.com',
      roles: ['doctor'],
    },
  };
  const adminUser = {
    sub: '1',
    data: {
      email: 'admin@medclinic.com',
      roles: ['admin'],
    },
  };
  const secretaryUser = {
    sub: '90',
    data: {
      email: 'secretaria@medclinic.com',
      roles: ['secretary'],
    },
  };

  const doctor = { id: 3, userId: 30 };
  const patientWithDoctorLink = {
    id: 10,
    appointments: [
      {
        id: 41,
        doctorId: 3,
        status: 'in_progress',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MedicalRecordsService(
      medicalRecordsRepository as never,
      doctorService as never,
      patientService as never,
    );

    patientService.getOne.mockResolvedValue(patientWithDoctorLink);
    doctorService.getOne.mockResolvedValue(doctor);
    medicalRecordsRepository.createMedicalRecord.mockResolvedValue({
      id: 5,
      patientId: 10,
      doctorId: 3,
      appointmentId: 41,
      text: 'Anotação clínica',
    });
    medicalRecordsRepository.getMedicalRecordsByPatient.mockResolvedValue([]);
  });

  it('permite que médico com vínculo em consulta em andamento crie prontuário', async () => {
    const result = await service.createMedicalRecord(
      10,
      { text: 'Anotação clínica' } as never,
      doctorUser as never,
    );

    expect(patientService.getOne).toHaveBeenCalledWith(10);
    expect(doctorService.getOne).toHaveBeenCalledWith({ userId: 30 });
    expect(medicalRecordsRepository.createMedicalRecord).toHaveBeenCalledWith({
      patientId: 10,
      doctorId: 3,
      appointmentId: 41,
      text: 'Anotação clínica',
    });
    expect(result).toMatchObject({
      patientId: 10,
      doctorId: 3,
      appointmentId: 41,
    });
  });

  it('permite que médico com vínculo em consulta concluída crie prontuário', async () => {
    patientService.getOne.mockResolvedValue({
      id: 10,
      appointments: [
        {
          id: 41,
          doctorId: 3,
          status: 'done',
        },
      ],
    });

    await expect(
      service.createMedicalRecord(
        10,
        { text: 'Registro após consulta' } as never,
        doctorUser as never,
      ),
    ).resolves.toBeDefined();
  });

  it('usa o id da consulta vinculada quando não há appointmentId no DTO', async () => {
    patientService.getOne.mockResolvedValue({
      id: 10,
      appointments: [
        { id: 20, doctorId: 3, status: 'done' },
        { id: 41, doctorId: 3, status: 'in_progress' },
      ],
    });

    await service.createMedicalRecord(
      10,
      { text: 'Anotação' } as never,
      doctorUser as never,
    );

    expect(medicalRecordsRepository.createMedicalRecord).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: 41 }),
    );
  });

  it('usa appointmentId informado quando fornecido', async () => {
    await service.createMedicalRecord(
      10,
      { text: 'Anotação', appointmentId: 41 } as never,
      doctorUser as never,
    );

    expect(medicalRecordsRepository.createMedicalRecord).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: 41 }),
    );
  });

  it('retira o médico do corpo e sempre usa o médico autenticado', async () => {
    await service.createMedicalRecord(
      10,
      {
        text: 'Anotação',
        doctorId: 999,
      } as never,
      doctorUser as never,
    );

    expect(medicalRecordsRepository.createMedicalRecord).toHaveBeenCalledWith(
      expect.objectContaining({ doctorId: 3 }),
    );
  });

  it('recusa gravação quando token não contém identificador numérico', async () => {
    await expect(
      service.createMedicalRecord(
        10,
        { text: 'Anotação' } as never,
        { ...doctorUser, sub: 'invalid' } as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });

    expect(patientService.getOne).not.toHaveBeenCalled();
  });

  it('recusa identificador de paciente inválido', async () => {
    await expect(
      service.createMedicalRecord(
        Number.NaN,
        { text: 'Anotação' } as never,
        doctorUser as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });

  it('retorna 404 quando paciente não existe', async () => {
    patientService.getOne.mockRejectedValue({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    await expect(
      service.createMedicalRecord(
        999,
        { text: 'Anotação' } as never,
        doctorUser as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    expect(doctorService.getOne).not.toHaveBeenCalled();
  });

  it('retorna 404 quando o usuário autenticado não possui cadastro de médico', async () => {
    doctorService.getOne.mockRejectedValue({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    await expect(
      service.createMedicalRecord(
        10,
        { text: 'Anotação' } as never,
        doctorUser as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });
  });

  it('recusa prontuário para médico que não possui vínculo com o paciente', async () => {
    patientService.getOne.mockResolvedValue({
      id: 10,
      appointments: [
        { id: 41, doctorId: 3, status: 'scheduled' },
        { id: 42, doctorId: 3, status: 'cancelled' },
      ],
    });

    await expect(
      service.createMedicalRecord(
        10,
        { text: 'Anotação' } as never,
        doctorUser as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });

    expect(medicalRecordsRepository.createMedicalRecord).not.toHaveBeenCalled();
  });

  it('recusa vínculo de consulta concluída pertencente a outro médico', async () => {
    patientService.getOne.mockResolvedValue({
      id: 10,
      appointments: [
        { id: 42, doctorId: 99, status: 'done' },
      ],
    });

    await expect(
      service.createMedicalRecord(
        10,
        { text: 'Anotação' } as never,
        doctorUser as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });
  });

  it('permite médico com vínculo consultar o prontuário do paciente', async () => {
    await expect(
      service.getMedicalRecordsByPatientId(10, doctorUser as never),
    ).resolves.toEqual([]);

    expect(medicalRecordsRepository.getMedicalRecordsByPatient).toHaveBeenCalledWith(
      10,
      3,
    );
  });

  it('permite admin consultar prontuário para auditoria sem filtro de médico', async () => {
    await expect(
      service.getMedicalRecordsByPatientId(10, adminUser as never),
    ).resolves.toEqual([]);

    expect(medicalRecordsRepository.getMedicalRecordsByPatient).toHaveBeenCalledWith(
      10,
    );
    expect(doctorService.getOne).not.toHaveBeenCalled();
  });

  it('nega leitura a médico sem vínculo', async () => {
    patientService.getOne.mockResolvedValue({
      id: 10,
      appointments: [
        { id: 41, doctorId: 99, status: 'done' },
      ],
    });

    await expect(
      service.getMedicalRecordsByPatientId(10, doctorUser as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });

    expect(medicalRecordsRepository.getMedicalRecordsByPatient).not.toHaveBeenCalled();
  });

  it('nega leitura à secretaria', async () => {
    await expect(
      service.getMedicalRecordsByPatientId(10, secretaryUser as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });

    expect(patientService.getOne).not.toHaveBeenCalled();
  });

  it('retorna 404 ao ler prontuário de paciente inexistente', async () => {
    patientService.getOne.mockRejectedValue({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    await expect(
      service.getMedicalRecordsByPatientId(999, adminUser as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });
  });

  it('recusa leitura quando token de usuário está sem sub', async () => {
    await expect(
      service.getMedicalRecordsByPatientId(
        10,
        { ...adminUser, sub: undefined } as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });

  it('recusa leitura quando id do paciente é inválido', async () => {
    await expect(
      service.getMedicalRecordsByPatientId(
        Number.NaN,
        adminUser as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });
});
