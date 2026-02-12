export const formatRSD = (value: number | string): string => {
  const num = Number(value);
  if (isNaN(num)) return '0 RSD';
  return num % 1 === 0 ? `${num} RSD` : `${num.toFixed(2)} RSD`;
};
