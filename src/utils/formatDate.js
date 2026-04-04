export function formatDate(input) {
  if (!input) return ''
  let date
  if (input instanceof Date) {
    date = input
  } else {
    const s = String(input).trim()
    // For any string starting with YYYY-MM-DD (date-only or ISO datetime),
    // parse the date portion as local time to avoid UTC midnight timezone shift
    const dateOnlyMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateOnlyMatch) {
      const [, y, m, d] = dateOnlyMatch.map(Number)
      date = new Date(y, m - 1, d)
    } else {
      date = new Date(s)
    }
  }
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

