export const increaseStreak = async (taskName: string) => {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  try {
    const response = await fetch("https://megamindapi.andrewbarber.dev/increase-streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "user-id": userId, "task": taskName }),
    });
    return await response.json();
  } catch (err) {
    console.error("Error updating task progress:", err);
  }
};

export const getUserStats = async () => {
  const userId = localStorage.getItem("user_id");
  if (!userId) return null;

  try {
    const response = await fetch("https://megamindapi.andrewbarber.dev/get-user-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "user-id": userId }),
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return null;
  }
};
