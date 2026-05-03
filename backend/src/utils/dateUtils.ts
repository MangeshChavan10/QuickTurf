export const parseSlotTime = (dateStr: string, timeStr: string): Date => {
  const startTime = (timeStr || '').split(' - ')[0].trim();
  const friendlyDate = dateStr.match(/(\d{1,2})\s+([A-Z]{3})/i);
  const months: Record<string, string> = {
    JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
    JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'
  };
  
  let resolvedDate: string;
  if (dateStr === 'Today' || !dateStr) {
    resolvedDate = new Date().toISOString().split('T')[0];
  } else if (friendlyDate) {
    const year = new Date().getFullYear();
    resolvedDate = `${year}-${months[friendlyDate[2].toUpperCase()] || '01'}-${friendlyDate[1].padStart(2,'0')}`;
  } else {
    resolvedDate = dateStr;
  }
  
  const h12 = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const h24 = startTime.match(/^(\d{1,2}):(\d{2})$/);
  
  if (h12) {
    let hr = parseInt(h12[1]);
    if (h12[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (h12[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
    return new Date(`${resolvedDate}T${String(hr).padStart(2,'0')}:${h12[2]}:00+05:30`);
  } else if (h24) {
    return new Date(`${resolvedDate}T${h24[1].padStart(2,'0')}:${h24[2]}:00+05:30`);
  }
  return new Date(NaN);
};
