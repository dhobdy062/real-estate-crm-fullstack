# Real Estate CRM Search Functionality

This document explains the search functionality implemented in the Real Estate CRM backend.

## Overview

The search functionality provides a global search across multiple entities in the CRM system, including:

- Contacts
- Leads
- Properties
- Transactions
- Tasks
- Communications

The search system consists of three main components:

1. **Global Search**: Search across all entities at once
2. **Entity-Specific Search**: Search within a specific entity type
3. **Search Suggestions**: Real-time suggestions as users type

## API Endpoints

The search functionality exposes the following REST API endpoints:

### GET /api/search

Global search across multiple entities.

**Query Parameters:**
- `query`: Search query (required, minimum 2 characters)
- `entities`: Comma-separated list of entities to search (default: 'all')
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)

**Response:**
```json
{
  "status": "success",
  "data": {
    "query": "smith",
    "total_results": 15,
    "results": {
      "contacts": [
        {
          "id": 123,
          "first_name": "John",
          "last_name": "Smith",
          "email": "john@example.com",
          "phone_primary": "555-123-4567",
          "entity_type": "Contact",
          "display_name": "John Smith"
        }
      ],
      "leads": [
        {
          "id": 456,
          "first_name": "Jane",
          "last_name": "Smith",
          "email": "jane@example.com",
          "entity_type": "Lead",
          "display_name": "Jane Smith"
        }
      ],
      "properties": [
        {
          "id": 789,
          "address_street": "123 Smith Ave",
          "address_city": "New York",
          "address_state": "NY",
          "address_zip": "10001",
          "entity_type": "Property",
          "display_name": "123 Smith Ave, New York, NY 10001"
        }
      ]
    }
  }
}
```

### GET /api/search/:entity

Search within a specific entity type.

**URL Parameters:**
- `entity`: Entity type to search (contacts, leads, properties, transactions, tasks, communications)

**Query Parameters:**
- `query`: Search query (required, minimum 2 characters)
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)

**Response:**
```json
{
  "status": "success",
  "data": {
    "query": "smith",
    "entity": "contacts",
    "total": 10,
    "results": [
      {
        "id": 123,
        "first_name": "John",
        "last_name": "Smith",
        "email": "john@example.com",
        "phone_primary": "555-123-4567",
        "entity_type": "Contact",
        "display_name": "John Smith"
      },
      {
        "id": 124,
        "first_name": "Sarah",
        "last_name": "Smith",
        "email": "sarah@example.com",
        "phone_primary": "555-987-6543",
        "entity_type": "Contact",
        "display_name": "Sarah Smith"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### GET /api/search/suggestions

Get search suggestions as user types.

**Query Parameters:**
- `query`: Search query (required, minimum 2 characters)
- `limit`: Maximum number of suggestions to return (default: 10)

**Response:**
```json
{
  "status": "success",
  "data": {
    "query": "smith",
    "suggestions": [
      {
        "id": 123,
        "text": "John Smith",
        "subtext": "john@example.com",
        "entity_type": "Contact",
        "url": "/contacts/123"
      },
      {
        "id": 456,
        "text": "Jane Smith",
        "subtext": "jane@example.com",
        "entity_type": "Lead",
        "url": "/leads/456"
      },
      {
        "id": 789,
        "text": "123 Smith Ave",
        "subtext": "New York, NY 10001",
        "entity_type": "Property",
        "url": "/properties/789"
      }
    ]
  }
}
```

## Search Implementation Details

### Search Fields

The search functionality searches across the following fields for each entity:

#### Contacts
- First name
- Last name
- Email
- Phone number
- Address (street, city, state, zip)

#### Leads
- First name
- Last name
- Email
- Phone number
- Inquiry details

#### Properties
- Address (street, city, state, zip)
- MLS number
- Property type
- Listing status

#### Transactions
- Transaction name
- Property address
- Transaction type
- Status name

#### Tasks
- Task title
- Description

#### Communications
- Subject
- Message content

### Search Algorithm

The search uses SQL LIKE queries with wildcards to find matches in the specified fields. For example:

```sql
WHERE LOWER(first_name) LIKE '%smith%'
   OR LOWER(last_name) LIKE '%smith%'
   OR LOWER(email) LIKE '%smith%'
```

In a production environment, you might want to consider using a more sophisticated search solution like Elasticsearch or PostgreSQL's full-text search capabilities for better performance and more advanced search features.

## Frontend Integration

The search functionality can be integrated into the frontend using the provided example components:

- `GlobalSearch`: A search input with real-time suggestions
- `SearchResults`: A page to display search results

See the example files in the `examples` directory:

- `search-component.js`: React components for search functionality
- `search-component.css`: CSS styles for the search components

### Usage Example

```jsx
import { GlobalSearch, SearchResults } from './components/search';
import './styles/search.css';

// In your header component
function Header() {
  return (
    <header>
      <div className="logo">Real Estate CRM</div>
      <GlobalSearch />
      <div className="user-menu">...</div>
    </header>
  );
}

// In your routes configuration
function AppRoutes() {
  return (
    <Routes>
      <Route path="/search" element={<SearchResults />} />
      {/* Other routes */}
    </Routes>
  );
}
```

## Performance Considerations

For large datasets, consider the following optimizations:

1. **Indexing**: Ensure that all searchable fields are properly indexed in the database
2. **Pagination**: Always use pagination to limit the number of results returned
3. **Debouncing**: Implement debouncing on the frontend to avoid excessive API calls as users type
4. **Caching**: Consider caching frequent search results
5. **Advanced Search**: For production use, consider implementing a dedicated search engine like Elasticsearch

## Future Enhancements

Potential enhancements to the search functionality:

1. **Full-Text Search**: Implement PostgreSQL's full-text search capabilities for better relevance ranking
2. **Fuzzy Matching**: Add support for fuzzy matching to handle typos and misspellings
3. **Filters**: Add support for advanced filters (e.g., property type, price range, status)
4. **Sorting**: Allow users to sort search results by different fields
5. **Search History**: Track and display user's recent searches
6. **Saved Searches**: Allow users to save and name their searches
7. **Search Analytics**: Track popular search terms and patterns
