const twelveHourFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
})

export function formatTimestamp12Hour(value?: string | number | Date | null) {
  if (value === null || value === undefined || value === '') {
    return 'Unknown time'
  }

  const date =
    value instanceof Date
      ? value
      : typeof value === 'number'
        ? new Date(value)
        : new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time'
  }

  return twelveHourFormatter.format(date)
}
