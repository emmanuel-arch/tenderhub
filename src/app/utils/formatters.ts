export const formatDate = (dateString: string, longMonth = false) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: longMonth ? 'long' : 'short',
    year: 'numeric',
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);
