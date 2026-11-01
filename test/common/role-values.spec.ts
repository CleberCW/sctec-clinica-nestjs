import { describe, expect, it } from '@jest/globals';
import { ROLES } from '../../src/@common/entities/role.entity';

describe('Perfis de acesso definidos pelo contrato MedClinic', () => {
  it('usa exatamente os nomes minúsculos admin, secretary e doctor', () => {
    expect(ROLES).toEqual({
      ADMIN: 'admin',
      SECRETARY: 'secretary',
      DOCTOR: 'doctor',
    });
  });
});
