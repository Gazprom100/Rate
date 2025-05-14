-- Функция для получения статистики по происхождению кошельков
create or replace function get_wallet_origins_stats()
returns table (
  unique_funding_sources bigint,
  unique_funded_wallets bigint,
  avg_funding_amount numeric
) as $$
begin
  return query
  select
    count(distinct from_address)::bigint as unique_funding_sources,
    count(distinct to_address)::bigint as unique_funded_wallets,
    avg(cast(amount as numeric) / 1000000000000000000) as avg_funding_amount
  from
    wallet_origins;
end;
$$ language plpgsql security definer;

-- Функция для получения цепочки происхождения кошелька
create or replace function get_wallet_origin_chain(target_address text, max_depth int default 5)
returns json as $$
declare
  result json;
  current_address text := target_address;
  current_depth int := 0;
  wallet_record record;
  parent_json json := null;
begin
  -- Получаем данные о целевом кошельке
  select row_to_json(w) into result
  from (
    select
      address,
      chain_id,
      first_funding_tx,
      first_funding_block,
      first_funding_from,
      first_funding_timestamp,
      first_funding_amount
    from
      wallets
    where
      address = target_address
      and chain_id = 'decimal'
  ) w;
  
  -- Если кошелек не найден, возвращаем null
  if result is null then
    return null;
  end if;
  
  -- Получаем информацию о цепочке родительских кошельков
  current_address := (result->>'first_funding_from');
  
  while current_address is not null and current_depth < max_depth loop
    select
      row_to_json(w) into wallet_record
    from (
      select
        address,
        chain_id,
        first_funding_tx,
        first_funding_block,
        first_funding_from,
        first_funding_timestamp,
        first_funding_amount
      from
        wallets
      where
        address = current_address
        and chain_id = 'decimal'
    ) w;
    
    if wallet_record is null then
      exit;
    end if;
    
    if parent_json is null then
      parent_json := wallet_record;
      result := jsonb_set(result::jsonb, '{parent}', wallet_record::jsonb);
    else
      parent_json := jsonb_set(parent_json::jsonb, '{parent}', wallet_record::jsonb);
      result := jsonb_set(result::jsonb, '{parent}', parent_json::jsonb);
    end if;
    
    current_address := (wallet_record->>'first_funding_from');
    current_depth := current_depth + 1;
  end loop;
  
  return result;
end;
$$ language plpgsql security definer; 