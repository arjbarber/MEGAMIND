export const getCerebellumReport = async (accuracy: number) => {
  const res = await fetch("http://localhost:3001/api/cerebellum", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ accuracy })
  });

  const data = await res.json();
  return data.report;
};
