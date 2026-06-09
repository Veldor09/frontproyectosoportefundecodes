const API = process.env.NEXT_PUBLIC_API_URL!;

export async function getProjects(published = true) {
  const res = await fetch(`${API}/projects?published=${published}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getProject(slug: string) {
  const res = await fetch(`${API}/projects/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function getNews(published = true) {
  const res = await fetch(`${API}/news?published=${published}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

export async function sendContact(form: { name: string; email: string; message: string }) {
  const res = await fetch(`${API}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}
