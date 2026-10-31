import { describe, expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import { CreateAppointmentDto } from '../../src/appointments/dto/create-appointment.dto';

function makeDto(startsAt: string): CreateAppointmentDto {
  return Object.assign(new CreateAppointmentDto(), {
    patientId: 20,
    doctorId: 3,
    startsAt,
  });
}

describe(CreateAppointmentDto.name, () => {
  it('accepts an ISO 8601 timestamp explicitly expressed in UTC with Z', async () => {
    const errors = await validate(
      makeDto('2026-11-02T11:00:00.000Z'),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects a timestamp expressed with a non-UTC offset', async () => {
    const errors = await validate(
      makeDto('2026-11-02T14:00:00.000+03:00'),
    );

    expect(errors.some((error) => error.property === 'startsAt')).toBe(true);
  });

  it('rejects a timestamp without an explicit UTC suffix', async () => {
    const errors = await validate(
      makeDto('2026-11-02T11:00:00.000'),
    );

    expect(errors.some((error) => error.property === 'startsAt')).toBe(true);
  });
});
