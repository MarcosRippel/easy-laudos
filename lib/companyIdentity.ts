import type { AdminSetting } from '@prisma/client';

/**
 * Linha de cabecalho com a identidade da empresa emissora.
 *
 * A identidade vem sempre de `AdminSetting` — nao existe fallback com nome,
 * endereco ou telefone embutido no codigo. Campo vazio simplesmente nao
 * aparece na linha.
 */
export function companyHeaderLine(settings: Pick<AdminSetting, 'companyName' | 'companyAddress' | 'companyPhone'>): string {
  return [
    settings.companyName,
    settings.companyAddress,
    settings.companyPhone ? `Fone: ${settings.companyPhone}` : '',
  ]
    .filter(Boolean)
    .join(' - ');
}
