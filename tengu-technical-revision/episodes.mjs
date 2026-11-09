// Public catalog metadata only. Narration, plans and release records are not inputs.
export const episodes = [
  {
    id: '03', slug: 'emudhra-ca-compromise', kind: 'security',
    ru: {title: 'Когда сертификату нельзя верить', topic: 'БЕЗОПАСНОСТЬ / EMUDHRA', description: 'Что произошло с eMudhra, почему браузер и приложение могут принять разные решения и как проверить защиту.'},
    en: {title: 'When a certificate cannot be trusted', topic: 'SECURITY / EMUDHRA', description: 'What happened with eMudhra, why browsers and apps can make different decisions, and how to check the protection.'}
  },
  {
    id: '02', slug: 'tengu-cluster', kind: 'cluster',
    ru: {title: 'Tengu Cluster: от ответа к работе', topic: 'АГЕНТЫ / HARNESS', description: 'Как наш harness распределяет задачи между агентами, ограничивает действия и помогает проверить результат.'},
    en: {title: 'Tengu Cluster: from answers to work', topic: 'AGENTS / HARNESS', description: 'How our harness distributes tasks between agents, limits their actions and helps verify the result.'}
  },
  {
    id: '01', slug: 'agent-context', kind: 'context',
    ru: {title: 'Почему агент отвечает не то', topic: 'ИИ / КОНТЕКСТ', description: 'Как просьба, навыки и правила проекта влияют на ответ модели — и откуда берутся конфликты инструкций.'},
    en: {title: 'Why your agent misses the point', topic: 'AI / CONTEXT', description: 'How your request, skills and project rules shape the model’s answer — and where instruction conflicts come from.'}
  }
];
export const route = (lang, slug = '') => `${lang === 'en' ? '/en' : ''}/${slug ? `episodes/${slug}/` : ''}`;
