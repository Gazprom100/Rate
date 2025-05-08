# Decimal Token Analytics

A web application for tracking and analyzing tokens on the Decimal blockchain. The application provides real-time data visualization and analytics for various token metrics including price, reserve, CRR, wallet count, and delegation percentage.

## Features

- Real-time token data from Decimal blockchain
- Multiple time frame views (24h, 7d, 30d, 1y, all time)
- Sortable token metrics
- Interactive charts and visualizations
- Responsive design

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Chart.js
- Supabase
- Decimal API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/decimal-rate.git
cd decimal-rate
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DECIMAL_API_URL=https://api.decimalchain.com/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

1. Create a new project in Supabase
2. Create the following tables:

```sql
-- tokens table
create table tokens (
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

-- token_history table
create table token_history (
  id uuid default uuid_generate_v4() primary key,
  token_id text references tokens(id) not null,
  price numeric not null,
  reserve numeric not null,
  crr numeric not null,
  wallets_count integer not null,
  delegation_percentage numeric not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index idx_token_history_token_id on token_history(token_id);
create index idx_token_history_timestamp on token_history(timestamp);
```

## Deployment

The application is configured for deployment on Render.com. Follow these steps:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Add all variables from `.env.local`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 