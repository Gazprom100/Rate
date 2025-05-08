# Настройка периодического обновления данных

## Вариант 1: Использование Supabase Edge Functions

1. **Установка Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Инициализация проекта**:
   ```bash
   supabase init
   ```

3. **Логин в Supabase**:
   ```bash
   supabase login
   ```

4. **Создание Edge Function**:
   ```bash
   supabase functions new update-tokens
   ```

5. **Настройка переменных окружения**:
   В панели управления Supabase:
   - Перейдите в Settings > API
   - Найдите секцию "Project API keys"
   - Скопируйте `service_role` ключ
   - Перейдите в Settings > Functions
   - Добавьте следующие переменные:
     ```
     SUPABASE_URL=https://utveqjpbshxppokhvzda.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=ваш_сервисный_ключ
     ```

6. **Деплой функции**:
   ```bash
   supabase functions deploy update-tokens
   ```

7. **Настройка расписания**:
   В панели управления Supabase:
   - Перейдите в Database > Functions
   - Найдите функцию `update-tokens`
   - Нажмите "Schedule"
   - Настройте расписание:
     - Для обновления каждые 5 минут: `*/5 * * * *`
     - Для обновления каждый час: `0 * * * *`
     - Для обновления раз в день: `0 0 * * *`

## Вариант 2: Использование Render.com Cron Jobs

1. **Создание Cron Job**:
   - В панели управления Render.com
   - Перейдите в раздел "Cron Jobs"
   - Нажмите "New Cron Job"

2. **Настройка Cron Job**:
   - Name: `update-tokens`
   - URL: `https://ваш-домен.onrender.com/api/cron/update-tokens`
   - Schedule:
     - Каждые 5 минут: `*/5 * * * *`
     - Каждый час: `0 * * * *`
     - Раз в день: `0 0 * * *`

3. **Настройка переменных окружения**:
   - Добавьте все необходимые переменные окружения в настройках сервиса

## Проверка работы

1. **Проверка Edge Function**:
   ```bash
   curl https://utveqjpbshxppokhvzda.supabase.co/functions/v1/update-tokens
   ```

2. **Проверка через API**:
   ```bash
   curl https://ваш-домен.onrender.com/api/cron/update-tokens
   ```

3. **Проверка в базе данных**:
   ```sql
   -- Проверка последних обновлений
   SELECT * FROM tokens ORDER BY updated_at DESC LIMIT 5;
   
   -- Проверка исторических данных
   SELECT * FROM token_history 
   ORDER BY timestamp DESC 
   LIMIT 5;
   ```

## Мониторинг

1. **Логи Supabase**:
   - В панели управления Supabase
   - Перейдите в Database > Logs
   - Фильтруйте по функции `update-tokens`

2. **Логи Render.com**:
   - В панели управления Render.com
   - Перейдите в раздел "Logs"
   - Фильтруйте по сервису и эндпоинту

## Устранение неполадок

1. **Проверка статуса функции**:
   ```bash
   supabase functions status update-tokens
   ```

2. **Проверка логов**:
   ```bash
   supabase functions logs update-tokens
   ```

3. **Проверка переменных окружения**:
   ```bash
   supabase functions env list update-tokens
   ```

4. **Общие проблемы**:
   - Убедитесь, что все переменные окружения установлены
   - Проверьте права доступа к базе данных
   - Проверьте доступность API Decimal
   - Проверьте квоты и лимиты Supabase 