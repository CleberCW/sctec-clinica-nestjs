import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MedicalRecordsService } from '../../src/patients/medical-records.service';

jest.mock(
  'src/@common/entities/role.entity',
  () => ({
    ROLES: { ADMIN: 'admin', SECRETARY: 'secretary', DOCTOR: 'doctor' },
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

describe('MedicalRecordsService - precedência do papel admin', () => {
  const medicalRecordsRepository = {
    createMedicalRecord: jest.fn<(...args: any[]) => any>(),
    getMedicalRecordsByPatient: jest.fn<(...args: any[]) => any>(),
  };
  const doctorService = {
    getOne: jest.fn<(...args: any[]) => any>(),
  };
  const patientService = {
    getOne: jest.fn<(...args: any[]) => any>(),
  };

  let service: MedicalRecordsService;

  const adminWhoIsAlsoDoctor = {
    sub: '30',
    data: {
      email: 'medico-admin@medclinic.com',
      roles: ['admin', 'doctor'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MedicalRecordsService(
      medicalRecordsRepository as never,
      doctorService as never,
      patientService as never,
    );
    patientService.getOne.mockResolvedValue({
      id: 10,
      appointments: [
        { id: 41, doctorId: 3, status: 'done' },
        { id: 42, doctorId: 99, status: 'done' },
      ],
    });
    medicalRecordsRepository.getMedicalRecordsByPatient.mockResolvedValue([]);
  });

  it('mantém acesso de auditoria do admin mesmo quando o usuário também tem perfil doctor', async () => {
    await expect(
      service.getMedicalRecordsByPatientId(
        10,
        adminWhoIsAlsoDoctor as never,
      ),
    ).resolves.toEqual([]);

    expect(doctorService.getOne).not.toHaveBeenCalled();
    expect(medicalRecordsRepository.getMedicalRecordsByPatient).toHaveBeenCalledWith(
      10,
    );
  });
});
