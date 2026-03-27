export async function sendDangerEmail({ title, description }: { title: string; description: string }) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send email');
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to send danger email:', err);
    return null;
  }
}
