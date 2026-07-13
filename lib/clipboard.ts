export async function copyText(pending: Promise<string>) {
  // Safari revokes the user activation after a long await — hand the
  // pending promise to ClipboardItem instead of awaiting it first
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.write([
      new ClipboardItem({ 'text/plain': pending }),
    ])
  }

  // the Clipboard API only exists in secure contexts (HTTPS/localhost);
  // on plain-HTTP origins (LAN dev server) fall back to execCommand
  const textarea = document.createElement('textarea')
  textarea.value = await pending
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  try {
    if (!document.execCommand('copy')) throw new Error('execCommand failed')
  } finally {
    textarea.remove()
  }
}
