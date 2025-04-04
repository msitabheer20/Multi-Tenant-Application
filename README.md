This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Multi-Tenant Application

## Docker Deployment

This application can be deployed using Docker and Docker Compose.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Make (optional, for using the provided Makefile)

### Environment Setup

The application uses a single `.env` file following Next.js conventions:
- Server-side variables: Regular names (e.g., `DATABASE_URL`)
- Client-side variables: Prefixed with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_API_URL`)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required environment variables in the `.env` file, ensuring you follow the naming conventions:
   - Variables accessible only on the server should have regular names
   - Variables that need to be accessible in the browser should be prefixed with `NEXT_PUBLIC_`
   
3. Important: Update the `DATABASE_URL` for Docker deployment:
   ```
   # Use this for Docker deployment (postgres is the service name in docker-compose.yml)
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mydb?schema=public
   ```

### Using Docker Compose

To start the application and PostgreSQL database:

```bash
docker compose up -d
```

To rebuild the application after code changes:

```bash
docker compose up -d --build
```

To stop the application:

```bash
docker compose down
```

To stop the application and remove volumes:

```bash
docker compose down -v
```

### Database Migrations

The Docker setup is configured to automatically run Prisma migrations when the container starts up, ensuring your database schema is always up to date.

If you need to run migrations manually, you can use:

```bash
# Connect to the running container
docker compose exec app sh

# Inside the container, run migrations
npx prisma migrate deploy
```

### Using the Makefile

For convenience, a Makefile is provided with common commands:

```bash
# Set up the environment, build and start the application
make setup

# Start the application
make up

# Stop the application
make down

# View logs
make logs

# Clean up (remove containers and volumes)
make clean
```

### Accessing the Application

Once the containers are running, the application will be available at:

```
http://localhost:3000
```

## Development Environment

### Prerequisites

- Node.js 20+
- npm

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   For local development, use:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb?schema=public
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## License

[MIT License](LICENSE)
