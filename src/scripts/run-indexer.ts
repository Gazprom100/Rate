import { DecimalIndexer } from '../indexer/decimal-indexer';

async function main() {
  console.log('Запуск Decimal индексатора с отслеживанием структуры кошельков...');
  
  // Создаем экземпляр индексатора с настройками
  const indexer = new DecimalIndexer({
    batchSize: 50,         // Обрабатываем по 50 блоков за раз
    concurrency: 5,        // 5 параллельных задач
    saveInterval: 500,     // Сохраняем прогресс каждые 500 блоков
    // Опционально можно указать startBlock и endBlock
    // startBlock: 0,      // Начать с блока Genesis
    // endBlock: 1000000,  // Остановиться на блоке 1,000,000
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