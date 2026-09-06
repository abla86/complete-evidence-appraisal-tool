export interface PrismaCounts {
  identified: number;
  screened: number;
  eligible: number;
  included: number;
}

export function calculatePrismaCounts(data?: unknown): PrismaCounts {
  if (!data || typeof data !== 'object') {
    return { identified: 0, screened: 0, eligible: 0, included: 0 };
  }

  const value = data as Partial<Record<keyof PrismaCounts, unknown>>;
  return {
    identified: typeof value.identified === 'number' ? value.identified : 0,
    screened: typeof value.screened === 'number' ? value.screened : 0,
    eligible: typeof value.eligible === 'number' ? value.eligible : 0,
    included: typeof value.included === 'number' ? value.included : 0,
  };
}


