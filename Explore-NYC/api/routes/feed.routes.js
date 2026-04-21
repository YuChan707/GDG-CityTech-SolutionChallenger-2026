router.get("/feed", async (req, res) => {
  const events = await getEventsData();
  const businesses = await getBusinessesData();

  res.json([...events, ...businesses]);
});