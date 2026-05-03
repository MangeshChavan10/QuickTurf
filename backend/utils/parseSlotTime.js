/**
 * Parses a booking slot date + time string into a JavaScript Date object (IST).
 *
 * @param {string} dateStr  e.g. "FRI 25 APR", "2026-04-25", "Today"
 * @param {string} timeStr  e.g. "10:00 PM", "10:00 PM - 11:00 PM"
 * @returns {Date}
 */
export function parseSlotTime(dateStr, timeStr) {
  // Extract just the start time (handles single slots and ranges)
  const startTime = timeStr.split(" - ")[0].trim();

  // Parse date: handle "FRI 25 APR", "25 APR", "2026-04-25", or "Today"
  let resolvedDate;
  const friendlyDate = dateStr.match(/(\d{1,2})\s+([A-Z]{3})/i);

  if (dateStr === "Today" || !dateStr) {
    resolvedDate = new Date().toISOString().split("T")[0];
  } else if (friendlyDate) {
    const day = friendlyDate[1].padStart(2, "0");
    const monthStr = friendlyDate[2].toUpperCase();
    const months = {
      JAN: "01", FEB: "02", MAR: "03", APR: "04",
      MAY: "05", JUN: "06", JUL: "07", AUG: "08",
      SEP: "09", OCT: "10", NOV: "11", DEC: "12",
    };
    const year = new Date().getFullYear();
    resolvedDate = `${year}-${months[monthStr] || "01"}-${day}`;
  } else {
    resolvedDate = dateStr; // assume ISO already
  }

  // Parse time: "10:00 PM" or "22:00"
  const h12 = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const h24 = startTime.match(/^(\d{1,2}):(\d{2})$/);

  if (h12) {
    let hr = parseInt(h12[1]);
    const mn = h12[2];
    if (h12[3].toUpperCase() === "PM" && hr !== 12) hr += 12;
    if (h12[3].toUpperCase() === "AM" && hr === 12) hr = 0;
    return new Date(`${resolvedDate}T${String(hr).padStart(2, "0")}:${mn}:00+05:30`);
  } else if (h24) {
    return new Date(`${resolvedDate}T${h24[1].padStart(2, "0")}:${h24[2]}:00+05:30`);
  }

  return new Date(NaN);
}
