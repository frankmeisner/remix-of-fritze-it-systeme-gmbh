// Shared validation schemas and utilities for security
import { z } from 'zod';

// German-friendly error messages
const germanMessages = {
  required: 'Pflichtfeld',
  email: 'Ungültige E-Mail-Adresse',
  minLength: (min: number) => `Mindestens ${min} Zeichen`,
  maxLength: (max: number) => `Maximal ${max} Zeichen`,
  invalidPhone: 'Ungültige Telefonnummer',
  invalidName: 'Ungültige Zeichen im Namen',
  positiveNumber: 'Muss eine positive Zahl sein',
};

// Name validation - allows German characters
const nameRegex = /^[a-zA-ZäöüÄÖÜß\s\-']+$/;

// Phone validation - allows common phone formats
const phoneRegex = /^\+?[0-9\s\-()]+$/;

// User creation validation schema
export const userCreationSchema = z.object({
  email: z
    .string()
    .min(1, germanMessages.required)
    .email(germanMessages.email)
    .max(255, germanMessages.maxLength(255)),
  password: z
    .string()
    .min(8, germanMessages.minLength(8))
    .max(72, germanMessages.maxLength(72)), // bcrypt max
  first_name: z
    .string()
    .min(1, germanMessages.required)
    .max(100, germanMessages.maxLength(100))
    .regex(nameRegex, germanMessages.invalidName),
  last_name: z
    .string()
    .min(1, germanMessages.required)
    .max(100, germanMessages.maxLength(100))
    .regex(nameRegex, germanMessages.invalidName),
  role: z.enum(['admin', 'employee']).optional(),
});

// Task creation validation schema
export const taskCreationSchema = z.object({
  title: z
    .string()
    .min(1, germanMessages.required)
    .max(200, germanMessages.maxLength(200)),
  description: z
    .string()
    .max(5000, germanMessages.maxLength(5000))
    .optional()
    .nullable(),
  customer_name: z
    .string()
    .min(1, germanMessages.required)
    .max(100, germanMessages.maxLength(100)),
  customer_phone: z
    .string()
    .max(20, germanMessages.maxLength(20))
    .regex(phoneRegex, germanMessages.invalidPhone)
    .optional()
    .nullable()
    .or(z.literal('')),
  test_email: z
    .string()
    .email(germanMessages.email)
    .max(255, germanMessages.maxLength(255))
    .optional()
    .nullable()
    .or(z.literal('')),
  test_password: z
    .string()
    .max(255, germanMessages.maxLength(255))
    .optional()
    .nullable(),
  deadline: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  special_compensation: z
    .number()
    .min(0, germanMessages.positiveNumber)
    .max(99999, 'Maximal 99.999 €')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(5000, germanMessages.maxLength(5000))
    .optional()
    .nullable(),
});

// Chat message validation schema
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, germanMessages.required)
    .max(2000, germanMessages.maxLength(2000)),
});

// Vacation request validation schema
export const vacationRequestSchema = z.object({
  start_date: z.string().min(1, germanMessages.required),
  end_date: z.string().min(1, germanMessages.required),
  reason: z
    .string()
    .max(1000, germanMessages.maxLength(1000))
    .optional()
    .nullable(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'Enddatum muss nach Startdatum liegen',
  path: ['end_date'],
});

// Helper to validate and get first error message
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return { success: false, error: firstError?.message || 'Validierungsfehler' };
}

// Sanitize string for display (removes potential XSS vectors, though React handles this)
export function sanitizeString(str: string): string {
  return str.trim().slice(0, 10000); // Basic length limit
}
