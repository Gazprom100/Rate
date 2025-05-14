import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

// Инициализация Prisma клиента для работы с базой данных
const prisma = new PrismaClient();

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
 * Класс индексатора Decimal блокчейна
 */
export class DecimalIndexer {
  private provider: ethers.JsonRpcProvider;
  private config: IndexerConfig;
  private isRunning: boolean = false;
  private lastProcessedBlock: number = 0;
  private uniqueAddresses: Set<string> = new Set();
  private tokenHolders: Map<string, Set<string>> = new Map(); // Для токенов: маппинг token -> Set<address>
  private processedWallets: Set<string> = new Set(); // Для отслеживания кошельков, у которых уже найдено первое пополнение

  constructor(config: Partial<IndexerConfig> = {}) {
    this.provider = getEvmProvider();
    
    // Используем переменные окружения для конфигурации, если доступны
    this.config = {
      batchSize: config.batchSize || parseInt(process.env.INDEXER_BATCH_SIZE || '100'),
      startBlock: config.startBlock || parseInt(process.env.INDEXER_START_BLOCK || '0'),
      endBlock: config.endBlock,
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
    console.log('Запуск индексатора Decimal...');
    console.log(`Конфигурация: batch=${this.config.batchSize}, concurrency=${this.config.concurrency}, saveInterval=${this.config.saveInterval}`);

    try {
      // Получаем последний обработанный блок из базы данных
      const indexState = await prisma.indexerState.findFirst({
        where: { chainId: 'decimal' }
      });

      let startBlock = this.config.startBlock || 0;
      if (indexState && indexState.lastProcessedBlock > startBlock) {
        startBlock = indexState.lastProcessedBlock + 1;
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
      const walletsWithFunding = await prisma.wallet.findMany({
        where: {
          firstFundingTx: { not: null }
        },
        select: {
          address: true,
          chainId: true
        }
      });
      
      for (const wallet of walletsWithFunding) {
        this.processedWallets.add(`${wallet.address.toLowerCase()}_${wallet.chainId}`);
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
      console.log(`Прогресс: ${Math.floor((batchEnd - startBlock) / (endBlock - startBlock) * 100)}% (блок ${batchEnd}/${endBlock})`);
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
      const existingWallet = await prisma.wallet.findUnique({
        where: { 
          address_chainId: { 
            address: toAddress, 
            chainId: 'decimal' 
          } 
        },
        select: { firstFundingTx: true }
      });
      
      // Если у кошелька еще нет записи о первом пополнении, создаем ее
      if (!existingWallet || !existingWallet.firstFundingTx) {
        console.log(`Найдено первое пополнение для кошелька ${toAddress} от ${fromAddress} в блоке ${blockNumber}`);
        
        // Обновляем запись о кошельке с информацией о первом пополнении
        await prisma.wallet.upsert({
          where: { 
            address_chainId: { 
              address: toAddress, 
              chainId: 'decimal' 
            } 
          },
          update: {
            firstFundingTx: txHash,
            firstFundingBlock: blockNumber,
            firstFundingFrom: fromAddress,
            firstFundingTimestamp: timestamp,
            firstFundingAmount: amount,
            fundedByAddress: fromAddress,
            fundedByChainId: 'decimal'
          },
          create: {
            address: toAddress,
            chainId: 'decimal',
            firstSeenAt: timestamp,
            lastSeenAt: timestamp,
            firstFundingTx: txHash,
            firstFundingBlock: blockNumber,
            firstFundingFrom: fromAddress,
            firstFundingTimestamp: timestamp,
            firstFundingAmount: amount,
            fundedByAddress: fromAddress,
            fundedByChainId: 'decimal'
          }
        });
        
        // Проверяем, существует ли адрес отправителя
        await prisma.wallet.upsert({
          where: { 
            address_chainId: { 
              address: fromAddress, 
              chainId: 'decimal' 
            } 
          },
          update: {
            lastSeenAt: timestamp
          },
          create: {
            address: fromAddress,
            chainId: 'decimal',
            firstSeenAt: timestamp,
            lastSeenAt: timestamp
          }
        });
        
        // Добавляем запись в таблицу FirstFunding для быстрого доступа и аналитики
        await prisma.firstFunding.create({
          data: {
            fromAddress,
            fromChainId: 'decimal',
            toAddress,
            toChainId: 'decimal',
            blockNumber,
            txHash,
            amount,
            timestamp
          }
        });
        
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
    await prisma.indexerState.upsert({
      where: { chainId: 'decimal' },
      update: { lastProcessedBlock: blockNumber },
      create: {
        chainId: 'decimal',
        lastProcessedBlock: blockNumber,
        lastUpdateTimestamp: new Date()
      }
    });
    
    console.log(`Прогресс сохранен: блок ${blockNumber}, найдено ${this.uniqueAddresses.size} уникальных адресов, ${this.processedWallets.size} кошельков с первым пополнением`);
  }

  /**
   * Сохранение всех собранных данных
   */
  private async saveAllData(): Promise<void> {
    try {
      // Сохраняем количество уникальных адресов
      await prisma.chainStats.upsert({
        where: { chainId: 'decimal' },
        update: { 
          totalWallets: this.uniqueAddresses.size,
          lastUpdateTimestamp: new Date()
        },
        create: {
          chainId: 'decimal',
          totalWallets: this.uniqueAddresses.size,
          lastUpdateTimestamp: new Date()
        }
      });
      
      // Опционально: сохраняем все уникальные адреса в базу
      console.log(`Сохранение ${this.uniqueAddresses.size} адресов в базу данных...`);
      
      // Разбиваем на партии по 1000 адресов для более эффективной вставки
      const addressArray = Array.from(this.uniqueAddresses);
      const batchSize = 1000;
      
      for (let i = 0; i < addressArray.length; i += batchSize) {
        const batch = addressArray.slice(i, i + batchSize);
        
        await prisma.$transaction(
          batch.map(address => prisma.wallet.upsert({
            where: { address_chainId: { address, chainId: 'decimal' } },
            update: { lastSeenAt: new Date() },
            create: {
              address,
              chainId: 'decimal',
              firstSeenAt: new Date(),
              lastSeenAt: new Date()
            }
          }))
        );
        
        console.log(`Сохранено ${i + batch.length}/${addressArray.length} адресов`);
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