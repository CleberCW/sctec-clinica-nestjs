import { describe, expect, it } from '@jest/globals';
import { isValidCpf } from '../../src/@common/tools/validate.cpf';

describe(isValidCpf.name, () => {
  it('aceita CPF válido sem pontuação', () => {
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('aceita CPF válido com pontuação ao normalizar os caracteres', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(isValidCpf('5299822472')).toBe(false);
  });

  it('rejeita CPF com mais de 11 dígitos', () => {
    expect(isValidCpf('529982247250')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
  });

  it('rejeita CPF com primeiro dígito verificador incorreto', () => {
    expect(isValidCpf('52998224735')).toBe(false);
  });

  it('rejeita CPF com segundo dígito verificador incorreto', () => {
    expect(isValidCpf('52998224724')).toBe(false);
  });
});
