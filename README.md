# Menday Orders

A focused order management app for a custom manufacturing business.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Prisma 5** (ORM)
- **PostgreSQL** (Supabase recommended)
- **Anthropic Claude** (`claude-sonnet-4-5`) for AI order parsing
- **dnd-kit** for drag-and-drop

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
ANTHROPIC_API_KEY="sk-ant-..."
```

**Supabase:** Go to your project → Settings → Database → Connection String (URI mode).

**Anthropic:** Get your key at https://console.anthropic.com/

### 3. Run database migration

```bash
npx prisma migrate dev --name init
```

This creates the `Order` table with all required fields.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

### Kanban Board
- 7 columns: New → Needs Clarification → Waiting for Files → In Progress → Printing → Packed → Completed
- Drag and drop cards between columns — status saves automatically
- Each card shows customer name, project type, quantity, due date, priority

### AI Order Parser
- Paste any WhatsApp message or freeform note
- Claude extracts: customer name, project type, quantity, color, deadline, files expected, priority
- Preview and edit the parsed data before creating the order
- Human must click "Create Order" — AI never auto-creates

### Manual Order Form
- Full form with all fields
- Dropdown for project type and priority
- Status defaults to "New"

### Order Detail Page
- Click any card to open full detail view
- Quick status change buttons
- Edit all fields inline
- Delete order with confirmation

---

## Database Schema

```sql
Order {
  id            String   -- cuid
  customerName  String
  projectType   String   -- Magnet | Stand | Mug | Keychain | Other
  quantity      Int?
  color         String?
  deadline      DateTime?
  filesExpected Boolean
  notes         String?
  priority      Enum     -- Low | Medium | High | Urgent
  status        Enum     -- New | NeedsClarification | WaitingForFiles | InProgress | Printing | Packed | Completed
  createdAt     DateTime
  updatedAt     DateTime
}
```

---

## Project Structure

```
menday-app/
├── app/
│   ├── api/
│   │   ├── orders/          # GET all, POST create
│   │   │   └── [id]/        # GET one, PATCH update, DELETE
│   │   └── parse/           # POST AI parse
│   ├── orders/[id]/         # Order detail page
│   ├── page.tsx             # Main kanban board
│   └── layout.tsx           # Root layout (Nunito font)
├── components/
│   ├── KanbanBoard.tsx      # DnD context + board
│   ├── KanbanColumn.tsx     # Single column with droppable
│   ├── OrderCard.tsx        # Draggable order card
│   ├── AIParser.tsx         # AI parse panel
│   ├── NewOrderModal.tsx    # Manual order form modal
│   ├── PriorityBadge.tsx
│   └── StatusBadge.tsx
├── lib/
│   ├── prisma.ts            # Prisma singleton
│   └── types.ts             # Shared TypeScript types
└── prisma/
    └── schema.prisma
```
