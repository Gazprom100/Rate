# Decimal Token Analytics

Веб-приложение для отслеживания и анализа токенов в блокчейне Decimal. Приложение предоставляет визуализацию данных и аналитику различных метрик токенов, включая цену, резерв, CRR, количество кошельков и процент делегирования.

## Функциональность

- Данные токенов в реальном времени из блокчейна Decimal
- Просмотр данных за разные периоды (24ч, 7д, 30д, 1г, всё время)
- Сортировка по различным метрикам
- Интерактивные графики и визуализации
- Адаптивный дизайн

## Технологии

- Next.js 14
- TypeScript
- Tailwind CSS
- Chart.js
- Supabase
- Decimal API

## Начало работы

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/decimal-rate.git
cd decimal-rate
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env.local` в корневой директории со следующими переменными:
```
NEXT_PUBLIC_SUPABASE_URL=https://utveqjpbshxppokhvzda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_публичный_ключ
SUPABASE_SERVICE_ROLE_KEY=ваш_сервисный_ключ
NEXT_PUBLIC_DECIMAL_API_URL=https://api.decimalchain.com/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Настройка базы данных Supabase:
   - Откройте панель управления Supabase
   - Перейдите в раздел SQL Editor
   - Скопируйте и выполните содержимое файла `supabase/schema.sql`

5. Запустите сервер разработки:
```bash
npm run dev
```

6. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Настройка базы данных

1. Создайте новый проект в Supabase
2. Выполните следующий SQL-скрипт:

```sql
-- Включение расширения UUID
create extension if not exists "uuid-ossp";

-- Создание таблицы токенов
create table if not exists tokens (
  id text primary key,
  symbol text not null,
  name text not null,
  price numeric not null,
  reserve numeric not null,
  crr numeric not null,
  wallets_count integer not null,
  delegation_percentage numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создание таблицы истории токенов
create table if not exists token_history (
  id uuid default uuid_generate_v4() primary key,
  token_id text references tokens(id) not null,
  price numeric not null,
  reserve numeric not null,
  crr numeric not null,
  wallets_count integer not null,
  delegation_percentage numeric not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создание индексов
create index if not exists idx_token_history_token_id on token_history(token_id);
create index if not exists idx_token_history_timestamp on token_history(timestamp);
```

## Развертывание

Приложение настроено для развертывания на Render.com. Выполните следующие шаги:

1. Создайте новый Web Service на Render
2. Подключите ваш GitHub репозиторий
3. Настройте следующие параметры:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Добавьте все переменные из `.env.local`
   - Node Version: 18.x (или выше)

4. Дополнительные настройки:
   - Auto-Deploy: Включено
   - Branch: main (или ваша основная ветка)
   - Health Check Path: /api/health

5. После настройки нажмите "Create Web Service"

## Безопасность

- Сервисный ключ Supabase используется только на сервере
- Публичный ключ используется для клиентских операций
- Настроены политики безопасности (RLS)
- Переменные окружения правильно разделены

## Поддержка

Если у вас возникли вопросы или проблемы, создайте issue в репозитории проекта. 