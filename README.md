# LibraFlow — Library Management System (LMS)

A modern, responsive, high-performance Library Management System built with React 19, Tailwind CSS v4, Lucide React, and the Open Library Global API.

## Features

- **Authentication & Role Access**:
  - Secure institutional login and member registration.
  - Role-based profiles (Admin, Student/Scholar, Faculty).
  - Password recovery workflow with 2-step verification.
  - Persistent auth session via LocalStorage.

- **Real-Time Dashboard**:
  - High-level metric cards: Total Books, Total Members, Books Issued, Available Books, Overdue Books, Subject Classifications, and Fine Collected.
  - Quick action shortcuts for catalog and desk operations.
  - Live activity feed tracking book additions, updates, and inventory changes.

- **Book Catalog Management**:
  - Direct integration with Open Library API fetching 20 curated technical and study volumes (Python, Java, C++, DSA, OS, DBMS).
  - Instant single-letter autocomplete search and live Open Library database lookup.
  - Multi-criteria filtering by category, author, and sorting (recently added, title, year, availability).
  - Full CRUD operations: Add new volumes, update details, delete books, and adjust stock quantities.
  - Responsive pagination and grid presentation.

- **Book Volume Inspection**:
  - Detailed book overview page with ISBN-13 copy shortcut, shelf placement mapping, stock progress visualization, and verified edition badge.
  - Full-screen high-definition cover lightbox modal.
  - External links directly to Open Library Index and Google Books preview.

## Tech Stack

- **Frontend**: React 19, React Router DOM v7, React Hook Form
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **Data Source**: Open Library API (`https://openlibrary.org`) & LocalStorage Cache
- **Build Tool**: Vite 8 with Rolldown Babel React Compiler

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```
