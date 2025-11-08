# API Integration Guide - Admin Panel

## Overview

This document outlines the API endpoints needed to complete the admin panel integration.

## Status

- ✅ Store actions implemented
- 🔄 API endpoints need implementation in `apiService.ts`
- 📋 Mock data currently used for development

---

## Required API Endpoints

### 1. Event Templates

#### GET /api/admin/event-templates
**Purpose**: Load all event templates  
**Returns**: `EventTemplate[]`

```typescript
interface EventTemplate {
  id: string;
  name: string;
  description: string;
  type: EventType;
  doorsOpen: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  allowedArrangements: Arrangement[];
  customPricing?: { BWF?: number; BWFM?: number };
  notes?: string;
  createdAt: Date;
}
```

#### POST /api/admin/event-templates
**Purpose**: Create new template  
**Body**: `Omit<EventTemplate, 'id' | 'createdAt'>`  
**Returns**: `EventTemplate`

#### PUT /api/admin/event-templates/:id
**Purpose**: Update existing template  
**Body**: `Partial<EventTemplate>`  
**Returns**: `EventTemplate`

#### DELETE /api/admin/event-templates/:id
**Purpose**: Delete template  
**Returns**: `{ success: boolean }`

#### POST /api/admin/event-templates/:id/create-event
**Purpose**: Create event from template  
**Body**: `{ date: Date }`  
**Returns**: `Event`

---

### 2. Promotions

#### GET /api/admin/promotions
**Purpose**: Load all promotion codes  
**Returns**: `PromotionCode[]`

```typescript
interface PromotionCode {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minBookingAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableTo?: {
    eventTypes?: EventType[];
    arrangements?: Arrangement[];
  };
}
```

#### POST /api/admin/promotions
**Purpose**: Create new promotion  
**Body**: `Omit<PromotionCode, 'id' | 'usedCount'>`  
**Returns**: `PromotionCode`

#### PUT /api/admin/promotions/:id
**Purpose**: Update promotion  
**Body**: `Partial<PromotionCode>`  
**Returns**: `PromotionCode`

#### DELETE /api/admin/promotions/:id
**Purpose**: Delete promotion  
**Returns**: `{ success: boolean }`

---

### 3. Email Reminders

#### GET /api/admin/email-reminders/config
**Purpose**: Load email reminder configuration  
**Returns**: `EmailReminderConfig`

```typescript
interface EmailReminderConfig {
  enabled: boolean;
  daysBefore: number;
  subject: string;
  template: string; // HTML template with placeholders
}
```

#### PUT /api/admin/email-reminders/config
**Purpose**: Update email reminder configuration  
**Body**: `EmailReminderConfig`  
**Returns**: `EmailReminderConfig`

#### POST /api/admin/email-reminders/test
**Purpose**: Send test email  
**Body**: `{ email: string }`  
**Returns**: `{ success: boolean }`

---

### 4. Enhanced Reservation Management

#### POST /api/admin/reservations/:id/communication-log
**Purpose**: Add communication log entry  
**Body**: `Omit<CommunicationLog, 'id' | 'timestamp'>`  
**Returns**: `CommunicationLog`

```typescript
interface CommunicationLog {
  id: string;
  timestamp: Date;
  type: 'email' | 'phone' | 'note' | 'status_change';
  subject?: string;
  message: string;
  author: string;
}
```

#### PUT /api/admin/reservations/:id/tags
**Purpose**: Update reservation tags  
**Body**: `{ tags: string[] }`  
**Returns**: `Reservation`

#### PUT /api/admin/reservations/:id/notes
**Purpose**: Update admin notes  
**Body**: `{ notes: string }`  
**Returns**: `Reservation`

#### POST /api/admin/reservations/bulk-update
**Purpose**: Bulk status update  
**Body**: `{ ids: string[], status: ReservationStatus }`  
**Returns**: `{ updated: number, failed: number }`

---

### 5. Customer Management

#### GET /api/admin/customers/:id
**Purpose**: Load full customer profile  
**Returns**: `CustomerProfile`

```typescript
interface CustomerProfile {
  customer: Customer;
  bookings: Reservation[];
  stats: {
    totalSpent: number;
    bookingCount: number;
    avgGroupSize: number;
    lastBooking?: Date;
  };
  tags: string[];
  notes: string;
}
```

#### PUT /api/admin/customers/:id/tags
**Purpose**: Update customer tags  
**Body**: `{ tags: string[] }`  
**Returns**: `CustomerProfile`

#### PUT /api/admin/customers/:id/notes
**Purpose**: Update customer notes  
**Body**: `{ notes: string }`  
**Returns**: `CustomerProfile`

---

## Implementation Steps

### Phase 1: Core Endpoints (Priority: HIGH)
1. ✅ Existing endpoints already working
2. 🔄 Event Templates endpoints
3. 🔄 Promotions endpoints
4. 🔄 Email Reminders config

**Estimated Time**: 4-6 hours

### Phase 2: Enhanced Features (Priority: MEDIUM)
1. 🔄 Communication log
2. 🔄 Tags management
3. 🔄 Bulk operations
4. 🔄 Customer profiles

**Estimated Time**: 3-4 hours

### Phase 3: Testing & Optimization (Priority: HIGH)
1. ⏳ Error handling
2. ⏳ Rate limiting
3. ⏳ Caching strategy
4. ⏳ Performance optimization

**Estimated Time**: 2-3 hours

---

## Error Handling

All endpoints should return standardized error responses:

```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Common Error Codes**:
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Resource conflict (e.g., duplicate code)
- `SERVER_ERROR` - Internal server error

---

## Authentication

All admin endpoints require authentication:

```typescript
Headers: {
  'Authorization': 'Bearer <admin_token>',
  'Content-Type': 'application/json'
}
```

---

## Rate Limiting

Recommended limits:
- **GET requests**: 100 per minute
- **POST/PUT/DELETE**: 30 per minute
- **Bulk operations**: 10 per minute

---

## Mock Data (Development)

Current mock data in `adminStore.ts`:

```typescript
// Event Templates
const mockTemplates: EventTemplate[] = [];

// Promotions
const mockPromotions: PromotionCode[] = [];

// Email Config
const mockEmailConfig: EmailReminderConfig = {
  enabled: false,
  daysBefore: 3,
  subject: 'Herinnering: Je reservering bij Inspiration Point',
  template: 'Beste {{contactPerson}},...'
};
```

**Note**: Replace with actual API calls in production.

---

## Testing Checklist

### Event Templates
- [ ] Create template
- [ ] Update template
- [ ] Delete template
- [ ] Create event from template
- [ ] List all templates
- [ ] Handle validation errors
- [ ] Handle conflicts

### Promotions
- [ ] Create promotion
- [ ] Update promotion
- [ ] Delete promotion
- [ ] Toggle active status
- [ ] Track usage count
- [ ] Validate date ranges
- [ ] Check applicability filters

### Email Reminders
- [ ] Load configuration
- [ ] Update configuration
- [ ] Send test email
- [ ] Validate template placeholders
- [ ] Handle email failures

### Reservations
- [ ] Add communication log
- [ ] Update tags
- [ ] Update notes
- [ ] Bulk status update
- [ ] Handle concurrent updates

### Customers
- [ ] Load customer profile
- [ ] Update tags
- [ ] Update notes
- [ ] Calculate statistics correctly
- [ ] Handle missing customers

---

## Database Schema Suggestions

### event_templates
```sql
CREATE TABLE event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  doors_open TIME NOT NULL,
  starts_at TIME NOT NULL,
  ends_at TIME NOT NULL,
  capacity INTEGER NOT NULL,
  allowed_arrangements JSONB NOT NULL,
  custom_pricing JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### promotion_codes
```sql
CREATE TABLE promotion_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_booking_amount DECIMAL(10,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applicable_to JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promotion_codes_code ON promotion_codes(code);
CREATE INDEX idx_promotion_codes_active ON promotion_codes(is_active);
```

### email_reminder_config
```sql
CREATE TABLE email_reminder_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT false,
  days_before INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### communication_logs
```sql
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_communication_logs_reservation ON communication_logs(reservation_id);
```

### customer_tags
```sql
CREATE TABLE customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_email, tag)
);

CREATE INDEX idx_customer_tags_email ON customer_tags(customer_email);
```

### customer_notes
```sql
CREATE TABLE customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) UNIQUE NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security Considerations

1. **Input Validation**: Sanitize all user inputs
2. **SQL Injection**: Use parameterized queries
3. **XSS Protection**: Escape output in templates
4. **CSRF Protection**: Use tokens for state-changing operations
5. **Rate Limiting**: Prevent abuse
6. **Audit Logging**: Track all admin actions

---

## Performance Optimization

1. **Caching**:
   - Cache templates and promotions (5 min TTL)
   - Invalidate on updates
   
2. **Pagination**:
   - Implement for large result sets
   - Default page size: 50 items

3. **Eager Loading**:
   - Load related data in single query
   - Reduce N+1 query problems

4. **Indexes**:
   - Add indexes on frequently queried columns
   - Monitor slow queries

---

## Next Steps

1. **Implement Core Endpoints** - Event Templates & Promotions
2. **Test with Mock Data** - Verify functionality
3. **Add Error Handling** - Graceful failure handling
4. **Performance Testing** - Load testing
5. **Security Audit** - Review security measures
6. **Documentation** - API documentation
7. **Deployment** - Production deployment

---

**Last Updated**: October 22, 2025  
**Status**: Integration In Progress  
**Priority**: Phase 1 endpoints
