export class DuplicatePatientCpfError extends Error {
  constructor() {
    super('Patient CPF already exists');
    this.name = 'DuplicatePatientCpfError';
  }
}
