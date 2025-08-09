/**
 * Example search component for the Real Estate CRM
 * 
 * This is a simple React component that demonstrates how to implement
 * the search functionality in a frontend application.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Global Search Component
 */
const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const response = await axios.get(`${API_BASE_URL}/search/suggestions`, {
          params: { query },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        setSuggestions(response.data.data.suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce the search to avoid too many requests
    const timeoutId = setTimeout(fetchSuggestions, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query]);
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle search form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (query.length >= 2) {
      navigate(`/search?query=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    navigate(suggestion.url);
    setShowSuggestions(false);
  };
  
  return (
    <div className="global-search" ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search contacts, properties, leads..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            <span>🔍</span>
          </button>
        </div>
        
        {showSuggestions && query.length >= 2 && (
          <div className="search-suggestions">
            {isLoading ? (
              <div className="suggestion-loading">Loading...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div
                  key={`${suggestion.entity_type}-${suggestion.id}`}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-icon">
                    {suggestion.entity_type === 'Contact' && '👤'}
                    {suggestion.entity_type === 'Lead' && '🎯'}
                    {suggestion.entity_type === 'Property' && '🏠'}
                    {suggestion.entity_type === 'Transaction' && '💰'}
                    {suggestion.entity_type === 'Task' && '✓'}
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-text">{suggestion.text}</div>
                    <div className="suggestion-subtext">
                      <span className="suggestion-entity-type">{suggestion.entity_type}</span>
                      {suggestion.subtext && <span> • {suggestion.subtext}</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="suggestion-no-results">No results found</div>
            )}
            
            <div className="suggestion-footer">
              <button
                onClick={handleSubmit}
                className="search-all-button"
              >
                Search for "{query}" in all records
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

/**
 * Search Results Page Component
 */
const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        let url = `${API_BASE_URL}/search`;
        
        // If a specific entity tab is selected
        if (activeTab !== 'all') {
          url = `${API_BASE_URL}/search/${activeTab}`;
        }
        
        const response = await axios.get(url, {
          params: {
            query,
            page,
            limit,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        setResults(response.data.data);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [query, activeTab, page, limit]);
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };
  
  // Render entity result
  const renderEntityResult = (entity, item) => {
    switch (entity) {
      case 'contacts':
        return (
          <div className="search-result-item" key={`contact-${item.id}`}>
            <div className="result-icon">👤</div>
            <div className="result-content">
              <h3>
                <a href={`/contacts/${item.id}`}>{item.display_name}</a>
              </h3>
              <div className="result-details">
                <span>{item.email}</span>
                {item.phone_primary && <span> • {item.phone_primary}</span>}
                {item.address_city && <span> • {item.address_city}, {item.address_state}</span>}
              </div>
              <div className="result-meta">
                <span className="result-type">Contact</span>
                {item.owner_name && <span> • Owner: {item.owner_name}</span>}
              </div>
            </div>
          </div>
        );
      
      case 'leads':
        return (
          <div className="search-result-item" key={`lead-${item.id}`}>
            <div className="result-icon">🎯</div>
            <div className="result-content">
              <h3>
                <a href={`/leads/${item.id}`}>{item.display_name}</a>
              </h3>
              <div className="result-details">
                <span>{item.email}</span>
                {item.phone_number && <span> • {item.phone_number}</span>}
                {item.status_name && <span> • Status: {item.status_name}</span>}
              </div>
              <div className="result-meta">
                <span className="result-type">Lead</span>
                {item.source_name && <span> • Source: {item.source_name}</span>}
                {item.assigned_user_name && <span> • Assigned to: {item.assigned_user_name}</span>}
              </div>
            </div>
          </div>
        );
      
      case 'properties':
        return (
          <div className="search-result-item" key={`property-${item.id}`}>
            <div className="result-icon">🏠</div>
            <div className="result-content">
              <h3>
                <a href={`/properties/${item.id}`}>{item.display_name}</a>
              </h3>
              <div className="result-details">
                {item.property_type && <span>{item.property_type}</span>}
                {item.bedrooms && <span> • {item.bedrooms} bed</span>}
                {item.bathrooms && <span> • {item.bathrooms} bath</span>}
                {item.square_footage && <span> • {item.square_footage} sq ft</span>}
              </div>
              <div className="result-meta">
                <span className="result-type">Property</span>
                {item.listing_status && <span> • {item.listing_status}</span>}
                {item.mls_number && <span> • MLS: {item.mls_number}</span>}
              </div>
            </div>
          </div>
        );
      
      case 'transactions':
        return (
          <div className="search-result-item" key={`transaction-${item.id}`}>
            <div className="result-icon">💰</div>
            <div className="result-content">
              <h3>
                <a href={`/transactions/${item.id}`}>{item.display_name}</a>
              </h3>
              <div className="result-details">
                <span>{item.transaction_type}</span>
                {item.status_name && <span> • Status: {item.status_name}</span>}
                {item.price && <span> • ${item.price.toLocaleString()}</span>}
              </div>
              <div className="result-meta">
                <span className="result-type">Transaction</span>
                {item.agent_name && <span> • Agent: {item.agent_name}</span>}
              </div>
            </div>
          </div>
        );
      
      case 'tasks':
        return (
          <div className="search-result-item" key={`task-${item.id}`}>
            <div className="result-icon">✓</div>
            <div className="result-content">
              <h3>
                <a href={`/tasks/${item.id}`}>{item.display_name}</a>
              </h3>
              <div className="result-details">
                <span>Status: {item.status}</span>
                {item.due_date && <span> • Due: {new Date(item.due_date).toLocaleDateString()}</span>}
                {item.priority && <span> • Priority: {item.priority}</span>}
              </div>
              <div className="result-meta">
                <span className="result-type">Task</span>
                {item.assigned_user_name && <span> • Assigned to: {item.assigned_user_name}</span>}
              </div>
            </div>
          </div>
        );
      
      case 'communications':
        return (
          <div className="search-result-item" key={`communication-${item.id}`}>
            <div className="result-icon">✉️</div>
            <div className="result-content">
              <h3>
                <a href={`/communications/${item.id}`}>{item.display_name}</a>
              </h3>
              <div className="result-details">
                <span>{item.communication_type}</span>
                {item.direction && <span> • {item.direction}</span>}
                {item.timestamp && <span> • {new Date(item.timestamp).toLocaleString()}</span>}
              </div>
              <div className="result-meta">
                <span className="result-type">Communication</span>
                {item.contact_name && <span> • Contact: {item.contact_name}</span>}
                {item.lead_name && <span> • Lead: {item.lead_name}</span>}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Render pagination
  const renderPagination = () => {
    if (!results) return null;
    
    const totalPages = Math.ceil(
      activeTab === 'all'
        ? results.total_results / limit
        : results.pagination.pages
    );
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="search-pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="pagination-button"
        >
          Previous
        </button>
        
        <span className="pagination-info">
          Page {page} of {totalPages}
        </span>
        
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    );
  };
  
  if (query.length < 2) {
    return (
      <div className="search-results-container">
        <div className="search-message">
          Please enter at least 2 characters to search.
        </div>
      </div>
    );
  }
  
  return (
    <div className="search-results-container">
      <h1>Search Results for "{query}"</h1>
      
      <div className="search-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All
        </button>
        <button
          className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => handleTabChange('contacts')}
        >
          Contacts
        </button>
        <button
          className={`tab-button ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => handleTabChange('leads')}
        >
          Leads
        </button>
        <button
          className={`tab-button ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => handleTabChange('properties')}
        >
          Properties
        </button>
        <button
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => handleTabChange('transactions')}
        >
          Transactions
        </button>
        <button
          className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => handleTabChange('tasks')}
        >
          Tasks
        </button>
        <button
          className={`tab-button ${activeTab === 'communications' ? 'active' : ''}`}
          onClick={() => handleTabChange('communications')}
        >
          Communications
        </button>
      </div>
      
      {isLoading ? (
        <div className="search-loading">Loading results...</div>
      ) : results ? (
        <div className="search-results">
          {activeTab === 'all' ? (
            // Global search results
            Object.entries(results.results).map(([entity, items]) => (
              items.length > 0 && (
                <div key={entity} className="entity-results">
                  <h2>{entity.charAt(0).toUpperCase() + entity.slice(1)}</h2>
                  <div className="results-list">
                    {items.map(item => renderEntityResult(entity, item))}
                  </div>
                  {items.length > 5 && (
                    <div className="view-more">
                      <button
                        onClick={() => handleTabChange(entity)}
                        className="view-more-button"
                      >
                        View all {entity} results
                      </button>
                    </div>
                  )}
                </div>
              )
            ))
          ) : (
            // Entity-specific results
            <div className="entity-results">
              <div className="results-list">
                {results.results.map(item => renderEntityResult(activeTab, item))}
              </div>
              {results.results.length === 0 && (
                <div className="no-results">
                  No {activeTab} found matching "{query}"
                </div>
              )}
            </div>
          )}
          
          {renderPagination()}
        </div>
      ) : (
        <div className="search-error">
          Error loading search results. Please try again.
        </div>
      )}
    </div>
  );
};

export { GlobalSearch, SearchResults };
