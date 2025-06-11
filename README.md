# Skill Share Marketplace

A full-stack web application for connecting people who need help with tasks to skilled providers.  
Built with React, Next.js, TypeScript, and Node.js.

---

## Features

- User authentication (Requester & Provider roles)
- Post, browse, and manage tasks
- Make and manage offers on tasks
- Track task progress and completion
- Responsive, modern UI

---

## Tech Stack

- **Frontend:** React, Next.js, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Testing:** Jest, React Testing Library

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm 
- psql

### Installation

```bash
git clone https://github.com/sweshisj/skill-share-marketplace.git
cd skill-share-marketplace
```

### Running the App

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
npm install
npm run dev
```
#### DB
```bash
cd backend
psql -U postgres -d skillshare_db -f src/config/init.sql
```

### Running Tests

```bash
npm test
```

---

## Project Structure

```
frontend/
  src/
    app/
    components/
    context/
    types/
    ...
backend/
  src/
    ...
```

---

## Contributing

Pull requests are welcome!  

---

## Contact

For questions or support, please contact [sweshisj@gmail.com](mailto:sweshisj@gmail.com).
