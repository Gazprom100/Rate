-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create indexer_state table to track indexing progress
create table if not exists indexer_state (
  chain_id text primary key,
  last_processed_block integer not null default 0,
  last_update_timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chain_stats table for blockchain statistics
create table if not exists chain_stats (
  chain_id text primary key,
  total_wallets integer not null default 0,
  active_wallets integer not null default 0,
  delegating_wallets integer,
  total_transactions integer,
  average_tx_per_day numeric,
  last_day_transactions integer,
  last_update_timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create wallets table if not exists
create table if not exists wallets (
  address text not null,
  chain_id text not null,
  first_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  balance text,
  tx_count integer not null default 0,
  is_active boolean not null default true,
  first_funding_tx text,
  first_funding_block integer,
  first_funding_from text,
  first_funding_timestamp timestamp with time zone,
  first_funding_amount text,
  funded_by_address text,
  funded_by_chain_id text,
  primary key (address, chain_id)
);

-- Create wallet_origins table to specifically track first funding
create table if not exists wallet_origins (
  id uuid default uuid_generate_v4() primary key,
  from_address text not null,
  from_chain_id text not null,
  to_address text not null,
  to_chain_id text not null,
  block_number integer not null,
  tx_hash text not null,
  amount text not null,
  timestamp timestamp with time zone not null,
  unique(to_address, to_chain_id)
);

-- Create indexes for efficient queries
create index if not exists idx_wallets_chain_active on wallets(chain_id, is_active);
create index if not exists idx_wallets_funded_by on wallets(funded_by_address, funded_by_chain_id);
create index if not exists idx_wallet_origins_from on wallet_origins(from_address, from_chain_id);
create index if not exists idx_wallet_origins_block on wallet_origins(block_number);

-- Create RLS policies for the new tables
alter table indexer_state enable row level security;
alter table chain_stats enable row level security;
alter table wallets enable row level security;
alter table wallet_origins enable row level security;

-- Public read access policies
create policy "Allow public read access to indexer_state"
  on indexer_state for select
  to public
  using (true);

create policy "Allow public read access to chain_stats"
  on chain_stats for select
  to public
  using (true);

create policy "Allow public read access to wallets"
  on wallets for select
  to public
  using (true);

create policy "Allow public read access to wallet_origins"
  on wallet_origins for select
  to public
  using (true);

-- Service role access policies
create policy "Allow service role to manage indexer_state"
  on indexer_state for all
  to service_role
  using (true)
  with check (true);

create policy "Allow service role to manage chain_stats"
  on chain_stats for all
  to service_role
  using (true)
  with check (true);

create policy "Allow service role to manage wallets"
  on wallets for all
  to service_role
  using (true)
  with check (true);

create policy "Allow service role to manage wallet_origins"
  on wallet_origins for all
  to service_role
  using (true)
  with check (true); 