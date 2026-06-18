export const timeDifference = (futureDate: number, currentDate: number) => {
  const diff = futureDate - currentDate;

  if (diff <= 0) {
    return { minutes: 0, seconds: 0 };
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { minutes, seconds };
};
