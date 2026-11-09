// Public catalog metadata only, newest first. 01–04 are the published entries, byte for byte as
// in ../tengu-chaos-kb-release/episodes.mjs; build.mjs proves the catalog generator still
// reproduces the live catalogs (revision 6, d19c7d06-0851-432f-b55a-354fcfde01eb) from them
// before it adds 05.
export const published = [
  {
    id: '04', slug: 'chaos-kb', kind: 'memory',
    ru: {title: 'Агент, который помнит вас', topic: 'ПАМЯТЬ / CHAOS-KB', description: 'Личная база знаний для агентов: как её установить и подключить — и что изменилось, когда агент прочитал заметки о пользователе.', cta: 'Открыть инструкцию'},
    en: {title: 'An agent that remembers you', topic: 'MEMORY / CHAOS-KB', description: 'A personal knowledge base for agents: how to install and connect it, and what changed when an agent read its notes about the user.', cta: 'Open the guide'}
  },
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
// 05 is a presentation again, so its links use the default "Open presentation".
export const added = {
  id: '05', slug: 'chaos-substrate', kind: 'code',
  ru: {title: 'Chaos Substrate: память кода и дерево Меркла', topic: 'ИНДЕКС / CHAOS SUBSTRATE', description: 'Как агент отвечает на вопросы о коде по индексу, а не перечитывая файлы, — и как дерево Меркла показывает, что изменилось и что уже известно.'},
  en: {title: 'Chaos Substrate: code memory and the Merkle tree', topic: 'INDEX / CHAOS SUBSTRATE', description: 'How an agent answers questions about code from an index instead of rereading files, and how a Merkle tree shows what changed and what is already known.'}
};
export const episodes = [added, ...published];
export const route = (lang, slug = '') => `${lang === 'en' ? '/en' : ''}/${slug ? `episodes/${slug}/` : ''}`;
