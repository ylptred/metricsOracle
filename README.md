# MetricsOracle

Инструмент для статистического анализа метрик с визуализацией и прогнозированием.

## Стек

| Слой | Технологии |
|------|-----------|
| Фреймворк | Next.js 14 (App Router) |
| Язык | TypeScript strict |
| Стили | Tailwind CSS |
| UI-компоненты | shadcn/ui (Button, Card, Badge, Alert, Progress, Tabs) |
| Графики | Recharts |
| Валидация | Zod |
| Парсинг Excel | xlsx |
| Тесты | Vitest + React Testing Library |

## Структура проекта

```
src/
├── app/
│   ├── page.tsx              — главная страница
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── analyze/
│           └── route.ts      — POST /api/analyze
├── components/
│   ├── ui/                   — shadcn/ui компоненты
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── progress.tsx
│   │   └── tabs.tsx
│   ├── upload/
│   │   └── UploadZone.tsx    — зона загрузки файла
│   ├── dashboard/
│   │   └── Dashboard.tsx     — результаты анализа
│   └── charts/
│       └── MetricChart.tsx   — линейный график метрики
├── lib/
│   ├── utils.ts              — cn() утилита
│   ├── parser.ts             — парсинг .txt и .xlsx
│   ├── validator.ts          — валидация через Zod
│   ├── analytics.ts          — Z-Score / IQR, выбор метода
│   ├── forecast.ts           — линейный тренд и прогноз
│   ├── trafficLight.ts       — логика светофора (green/yellow/red)
│   └── demoData.ts           — генератор синтетических данных
├── types/
│   └── index.ts              — все TypeScript-типы
└── __tests__/
    ├── setup.ts
    ├── analytics.test.ts
    ├── parser.test.ts
    └── forecast.test.ts
```

## Запуск

```bash
npm run dev       # dev-сервер
npm run build     # production build
npm test          # тесты (watch mode)
npm run test:run  # тесты (однократно)
```

## Алгоритмы

- **Z-Score**: применяется при нормальном распределении (|skewness| ≤ 1, n ≥ 8). Зоны: green < 1σ, yellow 1–2σ, red > 2σ.
- **IQR**: применяется при скошенном распределении или малых выборках. Выброс вне `[Q1 − 1.5·IQR, Q3 + 1.5·IQR]`. Причем метрика попадает в желтую зону, если ее значение выходит за границы не более, чем на 2 (то есть не более, чем на 2 меньше Q1 и не более, чем на 2 больше Q3). И метрика попадает в красную зону, если ее значение выходит за границы более, чем на 2.
- **Светофор**: red если >=3 метрик в красной зоне, yellow если >=3 метрик в желтой зоне и при этом <3 в красной зоне, иначе green, когда вообще нет выхода за границы.
- **Прогноз**: линейная регрессия (МНК) по исторической серии, экстраполяция на 3 периода.
