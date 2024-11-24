'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status} = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  
  try{
    // Test it out:
    // console.log(rawFormData);
    // console.log(typeof rawFormData.amount);
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    }catch(e){
      return {
        message: 'Database Error: Failed to Create Invoice.',
      };
    }
    
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
 
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
 
  try{
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  }catch(e){
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');//Elimino la cache del cliente
  redirect('/dashboard/invoices');//redirigo al usuario a la pagina de facturas
}
//Tenga en cuenta que redirectse llama fuera del try/catchbloque. Esto se debe a que redirectfunciona generando un error, que sería detectado por el catchbloque. Para evitarlo, puede llamar redirect después de que try/catch . redirectsolo sea accesible si trytiene éxito.
export async function deleteInvoice(id: string) {
  
  // throw new Error('Failed to Delete Invoice');
  try{
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');//activará una nueva solicitud de servidor y volverá a representar la tabla.
    return { message: 'Deleted Invoice.' };
  }catch(e){
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}