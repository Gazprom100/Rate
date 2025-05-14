import { ethers } from 'ethers';
import { supabaseAdmin } from '../lib/supabase';

// EVM RPC URL для Decimal блокчейна из переменных окружения
const EVM_RPC_URL = process.env.DECIMAL_RPC_URL || 'https://node.decimalchain.com/web3/';

// Инициализация провайдера
const getEvmProvider = () => {
  return new ethers.JsonRpcProvider(EVM_RPC_URL, undefined, {
    polling: true,
    pollingInterval: 4000,
    cacheTimeout: 10000
  });
};

interface IndexerConfig {
  batchSize: number;       // Количество блоков для обработки за один раз
  startBlock?: number;     // Начальный блок (если не указан, используется Genesis блок)
  endBlock?: number;       // Конечный блок (если не указан, используется последний блок)
  concurrency: number;     // Количество параллельных задач
  saveInterval: number;    // Интервал сохранения прогресса (в блоках)
}

/**
 * Класс индексатора Decimal блокчейна, использующий Supabase
 */
export class DecimalIndexer {
  private provider: ethers.JsonRpcProvider;
  private config: IndexerConfig;
  private isRunning: boolean = false;
  private lastProcessedBlock: number = 0;
  private uniqueAddresses: Set<string> = new Set();
  private processedWallets: Set<string> = new Set(); // Для отслеживания кошельков, у которых уже найдено первое пополнение

  constructor(config: Partial<IndexerConfig> = {}) {
    this.provider = getEvmProvider();
    
    // Используем переменные окружения для конфигурации, если доступны
    this.config = {
      batchSize: config.batchSize || parseInt(process.env.INDEXER_BATCH_SIZE || '100'),
      startBlock: config.startBlock || parseInt(process.env.INDEXER_START_BLOCK || '0'),
      endBlock: config.endBlock || parseInt(process.env.INDEXER_END_BLOCK || '0'),
      concurrency: config.concurrency || parseInt(process.env.INDEXER_CONCURRENCY || '5'),
      saveInterval: config.saveInterval || parseInt(process.env.INDEXER_SAVE_INTERVAL || '1000')
    };
  }

  /**
   * Запуск процесса индексации
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Индексатор уже запущен');
      return;
    }

    this.isRunning = true;
    console.log('Запуск индексатора Decimal (Supabase version)...');
    console.log(`Конфигурация: batch=${this.config.batchSize}, concurrency=${this.config.concurrency}, saveInterval=${this.config.saveInterval}`);

    try {
      // Получаем последний обработанный блок из Supabase
      const { data: indexState, error: indexStateError } = await supabaseAdmin
        .from('indexer_state')
        .select('last_processed_block')
        .eq('chain_id', 'decimal')
        .single();

      if (indexStateError && indexStateError.code !== 'PGRST116') { // PGRST116 = не найдено, это нормально при первом запуске
        console.error('Ошибка при получении состояния индексатора:', indexStateError);
      }

      let startBlock = this.config.startBlock || 0;
      if (indexState && indexState.last_processed_block > startBlock) {
        startBlock = indexState.last_processed_block + 1;
        console.log(`Продолжаем индексацию с блока ${startBlock}`);
      }

      // Получаем текущий блок сети
      const latestBlock = this.config.endBlock || await this.provider.getBlockNumber();
      console.log(`Последний блок в сети: ${latestBlock}`);

      if (startBlock > latestBlock) {
        console.log('Индексация завершена: нет новых блоков');
        this.isRunning = false;
        return;
      }

      // Предзагрузка кошельков, для которых уже определены первые пополнения
      await this.preloadProcessedWallets();

      // Запускаем индексацию
      await this.indexBlockRange(startBlock, latestBlock);
      
      console.log('Индексация успешно завершена');
    } catch (error) {
      console.error('Ошибка при индексации:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Предзагрузка кошельков, для которых уже отслежены первые пополнения
   */
  private async preloadProcessedWallets(): Promise<void> {
    try {
      console.log('Загрузка списка кошельков с уже определенными первыми пополнениями...');
      
      // Получаем все кошельки, у которых уже есть первое пополнение
      const { data: walletsWithFunding, error } = await supabaseAdmin
        .from('wallets')
        .select('address, chain_id')
        .not('first_funding_tx', 'is', null);
      
      if (error) {
        console.error('Ошибка при загрузке кошельков с первыми пополнениями:', error);
        return;
      }
      
      if (walletsWithFunding) {
        for (const wallet of walletsWithFunding) {
          this.processedWallets.add(`${wallet.address.toLowerCase()}_${wallet.chain_id}`);
        }
      }
      
      console.log(`Загружено ${this.processedWallets.size} кошельков с определенными первыми пополнениями`);
    } catch (error) {
      console.error('Ошибка при загрузке списка обработанных кошельков:', error);
    }
  }

  /**
   * Индексация диапазона блоков
   */
  private async indexBlockRange(startBlock: number, endBlock: number): Promise<void> {
    console.log(`Индексация блоков с ${startBlock} по ${endBlock}`);
    
    for (let currentBlock = startBlock; currentBlock <= endBlock; currentBlock += this.config.batchSize) {
      if (!this.isRunning) {
        console.log('Индексация остановлена пользователем');
        break;
      }
      
      // Определяем конец текущего батча
      const batchEnd = Math.min(currentBlock + this.config.batchSize - 1, endBlock);
      
      // Создаем задачи для обработки блоков
      const tasks = [];
      for (let i = 0; i < this.config.concurrency && currentBlock + i <= batchEnd; i++) {
        tasks.push(this.processBlocksSequentially(currentBlock + i, batchEnd, this.config.concurrency));
      }
      
      // Запускаем задачи параллельно
      await Promise.all(tasks);
      
      // Сохраняем прогресс
      if (batchEnd % this.config.saveInterval === 0 || batchEnd === endBlock) {
        await this.saveProgress(batchEnd);
      }
      
      this.lastProcessedBlock = batchEnd;
      const progress = Math.floor((batchEnd - startBlock) / (endBlock - startBlock) * 100);
      console.log(`Прогресс: ${progress}% (блок ${batchEnd}/${endBlock})`);
    }
    
    // Финальное сохранение всех данных
    await this.saveAllData();
  }

  /**
   * Последовательная обработка блоков с шагом concurrency
   */
  private async processBlocksSequentially(startBlock: number, endBlock: number, step: number): Promise<void> {
    for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber += step) {
      if (!this.isRunning) break;
      await this.processBlock(blockNumber);
    }
  }

  /**
   * Обработка отдельного блока
   */
  private async processBlock(blockNumber: number): Promise<void> {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      
      if (!block || !block.transactions) {
        console.warn(`Блок ${blockNumber} не содержит транзакций или не найден`);
        return;
      }
      
      const blockDate = new Date(Number(block.timestamp) * 1000);
      
      // Обрабатываем транзакции
      for (const tx of block.transactions) {
        const transaction = tx as unknown as ethers.TransactionResponse;
        
        if (transaction.from) {
          this.uniqueAddresses.add(transaction.from.toLowerCase());
        }
        
        if (transaction.to) {
          this.uniqueAddresses.add(transaction.to.toLowerCase());
        }
        
        // Проверяем, является ли это передачей валюты
        if (transaction.to && transaction.value && BigInt(transaction.value) > BigInt(0)) {
          await this.processPotentialFirstFunding(
            transaction.from.toLowerCase(),
            transaction.to.toLowerCase(),
            transaction.hash,
            blockNumber,
            transaction.value.toString(),
            blockDate
          );
        }
      }
    } catch (error) {
      console.error(`Ошибка при обработке блока ${blockNumber}:`, error);
    }
  }

  /**
   * Обработка потенциального первого пополнения
   */
  private async processPotentialFirstFunding(
    fromAddress: string,
    toAddress: string,
    txHash: string,
    blockNumber: number,
    amount: string,
    timestamp: Date
  ): Promise<void> {
    // Пропускаем, если мы уже обработали первое пополнение для этого кошелька
    const walletKey = `${toAddress}_decimal`;
    if (this.processedWallets.has(walletKey)) {
      return;
    }
    
    try {
      // Проверяем, есть ли уже запись о первом пополнении для этого кошелька
      const { data: existingWallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('first_funding_tx')
        .eq('address', toAddress)
        .eq('chain_id', 'decimal')
        .single();
      
      if (walletError && walletError.code !== 'PGRST116') { // PGRST116 = не найдено
        console.error(`Ошибка при проверке кошелька ${toAddress}:`, walletError);
        return;
      }
      
      // Если у кошелька еще нет записи о первом пополнении, создаем ее
      if (!existingWallet || !existingWallet.first_funding_tx) {
        console.log(`Найдено первое пополнение для кошелька ${toAddress} от ${fromAddress} в блоке ${blockNumber}`);
        
        // Обновляем запись о кошельке или создаем новую
        const { error: upsertError } = await supabaseAdmin
          .from('wallets')
          .upsert({
            address: toAddress,
            chain_id: 'decimal',
            first_seen_at: timestamp,
            last_seen_at: timestamp,
            first_funding_tx: txHash,
            first_funding_block: blockNumber,
            first_funding_from: fromAddress,
            first_funding_timestamp: timestamp,
            first_funding_amount: amount,
            funded_by_address: fromAddress,
            funded_by_chain_id: 'decimal'
          });
        
        if (upsertError) {
          console.error(`Ошибка при обновлении кошелька ${toAddress}:`, upsertError);
          return;
        }
        
        // Проверяем, существует ли адрес отправителя, и создаем если нет
        const { error: fromAddressError } = await supabaseAdmin
          .from('wallets')
          .upsert({
            address: fromAddress,
            chain_id: 'decimal',
            first_seen_at: timestamp,
            last_seen_at: timestamp
          });
        
        if (fromAddressError) {
          console.error(`Ошибка при создании кошелька отправителя ${fromAddress}:`, fromAddressError);
        }
        
        // Добавляем запись в таблицу wallet_origins для быстрого доступа и аналитики
        const { error: originsError } = await supabaseAdmin
          .from('wallet_origins')
          .insert({
            from_address: fromAddress,
            from_chain_id: 'decimal',
            to_address: toAddress,
            to_chain_id: 'decimal',
            block_number: blockNumber,
            tx_hash: txHash,
            amount: amount,
            timestamp: timestamp
          });
        
        if (originsError) {
          console.error(`Ошибка при добавлении записи о происхождении кошелька ${toAddress}:`, originsError);
          return;
        }
        
        // Помечаем кошелек как обработанный
        this.processedWallets.add(walletKey);
      }
    } catch (error) {
      console.error(`Ошибка при обработке первого пополнения для ${toAddress}:`, error);
    }
  }

  /**
   * Сохранение прогресса индексации
   */
  private async saveProgress(blockNumber: number): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('indexer_state')
        .upsert({
          chain_id: 'decimal',
          last_processed_block: blockNumber,
          last_update_timestamp: new Date()
        });
      
      if (error) {
        console.error('Ошибка при сохранении прогресса:', error);
        return;
      }
      
      console.log(`Прогресс сохранен: блок ${blockNumber}, найдено ${this.uniqueAddresses.size} уникальных адресов, ${this.processedWallets.size} кошельков с первым пополнением`);
    } catch (error) {
      console.error('Ошибка при сохранении прогресса:', error);
    }
  }

  /**
   * Сохранение всех собранных данных
   */
  private async saveAllData(): Promise<void> {
    try {
      // Сохраняем количество уникальных адресов в статистику
      const { error: statsError } = await supabaseAdmin
        .from('chain_stats')
        .upsert({
          chain_id: 'decimal',
          total_wallets: this.uniqueAddresses.size,
          active_wallets: 0, // Это можно вычислить отдельно
          last_update_timestamp: new Date()
        });
      
      if (statsError) {
        console.error('Ошибка при сохранении статистики:', statsError);
      }
      
      // Опционально: сохраняем все уникальные адреса в базу
      console.log(`Сохранение ${this.uniqueAddresses.size} адресов в базу данных...`);
      
      // Разбиваем на партии по 1000 адресов для более эффективной вставки
      const addressArray = Array.from(this.uniqueAddresses);
      const batchSize = 1000;
      
      for (let i = 0; i < addressArray.length; i += batchSize) {
        const batch = addressArray.slice(i, i + batchSize);
        const wallets = batch.map(address => ({
          address,
          chain_id: 'decimal',
          first_seen_at: new Date(),
          last_seen_at: new Date()
        }));
        
        const { error: walletsError } = await supabaseAdmin
          .from('wallets')
          .upsert(wallets);
        
        if (walletsError) {
          console.error(`Ошибка при сохранении партии кошельков:`, walletsError);
        } else {
          console.log(`Сохранено ${i + batch.length}/${addressArray.length} адресов`);
        }
      }
      
      console.log('Все данные успешно сохранены');
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
    }
  }

  /**
   * Получение статистики по сканированию
   */
  public getStats(): { processedBlocks: number, uniqueAddresses: number, walletsWithFunding: number } {
    return {
      processedBlocks: this.lastProcessedBlock,
      uniqueAddresses: this.uniqueAddresses.size,
      walletsWithFunding: this.processedWallets.size
    };
  }

  /**
   * Остановка процесса индексации
   */
  public stop(): void {
    this.isRunning = false;
    console.log('Индексатор остановлен');
  }
} 