export const normalizeEvent = (data) => {
  return {
    title: data.name,
    date: data.date,
    category: data.category,
    location: data.location,
    source: data.source,
  };
};