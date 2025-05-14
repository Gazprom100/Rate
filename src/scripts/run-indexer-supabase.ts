import { DecimalIndexer } from '../indexer/decimal-indexer-supabase';

async function main() {
  console.log('Запуск Decimal индексатора (Supabase version) с отслеживанием структуры кошельков...');
  
  // Создаем экземпляр индексатора с настройками
  const indexer = new DecimalIndexer({
    batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '50'),
    concurrency: parseInt(process.env.INDEXER_CONCURRENCY || '5'),
    saveInterval: parseInt(process.env.INDEXER_SAVE_INTERVAL || '500'),
    startBlock: parseInt(process.env.INDEXER_START_BLOCK || '0'),
    endBlock: parseInt(process.env.INDEXER_END_BLOCK || '0')
  });
  
  // Обработка сигналов для корректного завершения
  process.on('SIGINT', () => {
    console.log('Получен сигнал SIGINT, останавливаем индексатор...');
    indexer.stop();
  });
  
  process.on('SIGTERM', () => {
    console.log('Получен сигнал SIGTERM, останавливаем индексатор...');
    indexer.stop();
  });
  
  // Запускаем процесс индексации
  await indexer.start();
  
  // Выводим статистику после завершения
  const stats = indexer.getStats();
  console.log('Индексация завершена. Статистика:');
  console.log(`- Обработано блоков: ${stats.processedBlocks}`);
  console.log(`- Найдено уникальных адресов: ${stats.uniqueAddresses}`);
  console.log(`- Кошельков с данными о первом пополнении: ${stats.walletsWithFunding}`);
}

// Запускаем скрипт
main().catch(error => {
  console.error('Ошибка при запуске индексатора:', error);
  process.exit(1);
}); 