import { Router } from "express";
import { db } from "../db";
import { invoices, invoice_items } from "../db/schema";
import { eq } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Get all invoices
router.get("/", authenticateUser, async (req, res) => {
  try {
    const allInvoices = await db.query.invoices.findMany({
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    return res.json(allInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

// Get a single invoice by ID
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({ message: "Failed to fetch invoice" });
  }
});

// Create a new invoice
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { contact_id, invoice_number, issue_date, due_date, status, notes, items } = req.body;
    
    // Insert the invoice
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        user_id: req.user!.id,
        contact_id,
        invoice_number,
        issue_date: new Date(issue_date),
        due_date: new Date(due_date),
        status,
        notes,
      })
      .returning();

    // Insert invoice items if provided
    if (items && items.length > 0) {
      await db.insert(invoice_items).values(
        items.map((item: any) => ({
          invoice_id: newInvoice.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          tax_rate: item.tax_rate || 0,
        }))
      );
    }

    // Fetch the complete invoice with items
    const completeInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, newInvoice.id),
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    return res.status(201).json(completeInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({ message: "Failed to create invoice" });
  }
});

// Update an invoice
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { contact_id, invoice_number, issue_date, due_date, status, notes } = req.body;
    
    // Update the invoice
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        contact_id,
        invoice_number,
        issue_date: issue_date ? new Date(issue_date) : undefined,
        due_date: due_date ? new Date(due_date) : undefined,
        status,
        notes,
        updated_at: new Date(),
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({ message: "Failed to update invoice" });
  }
});

// Delete an invoice
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the invoice (cascade will handle invoice items)
    const [deletedInvoice] = await db
      .delete(invoices)
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    if (!deletedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res.status(500).json({ message: "Failed to delete invoice" });
  }
});

export default router;