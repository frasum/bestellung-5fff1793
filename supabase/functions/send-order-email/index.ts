import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sku?: string;
  packaging_unit?: number;
  order_unit?: string;
}

interface OrderEmailRequest {
  orderId: string;
  orderNumber: string;
  supplierEmail: string;
  supplierName: string;
  restaurantName: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  confirmationToken?: string;
  customerNumber?: string;
}

interface EmailTemplate {
  subject_template: string;
  greeting: string;
  introduction: string;
  closing: string;
  signature: string;
  article_list_format: string;
  design_style: 'modern' | 'classic' | 'minimalist';
  footer_text: string;
  footer_logo_url: string | null;
  show_powered_by: boolean;
}

const defaultTemplate: EmailTemplate = {
  subject_template: 'Neue Bestellung von {restaurant_name}{customer_number_suffix}',
  greeting: 'Guten Tag,',
  introduction: 'hiermit senden wir Ihnen unsere Bestellung:',
  closing: 'Vielen Dank für Ihre Zusammenarbeit.',
  signature: 'Mit freundlichen Grüßen,\n{restaurant_name}',
  article_list_format: '- {article_name}{sku_suffix}: {quantity} {unit} à €{unit_price} = €{total_price}',
  design_style: 'modern',
  footer_text: 'Diese Bestellung wurde über Bestellung.pro aufgegeben.',
  footer_logo_url: null,
  show_powered_by: true,
};

// Generate subject line from template
const generateSubject = (template: EmailTemplate, data: OrderEmailRequest): string => {
  const customerNumberSuffix = data.customerNumber ? ` (Kd-Nr: ${data.customerNumber})` : '';
  return template.subject_template
    .replace('{restaurant_name}', data.restaurantName)
    .replace('{customer_number_suffix}', customerNumberSuffix);
};

// Generate signature with variables replaced
const generateSignature = (template: EmailTemplate, restaurantName: string): string => {
  return template.signature.replace('{restaurant_name}', restaurantName);
};

// ============== MODERN DESIGN ==============
const generateModernEmail = (data: OrderEmailRequest, template: EmailTemplate): string => {
  const itemRows = data.items.map((item, index) => {
    const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
    const skuDisplay = item.sku ? `<span style="display: inline-block; background: #e5e7eb; color: #374151; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-left: 8px;">${item.sku}</span>` : '';
    const vpeDisplay = item.packaging_unit && item.packaging_unit > 1 ? `<span style="color: #2563eb; font-weight: 600;"> (${item.packaging_unit}er)</span>` : '';
    const orderUnitDisplay = item.order_unit ? `<div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">📦 ${item.order_unit}</div>` : '';
    return `
    <tr style="background: ${bgColor};">
      <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${item.article_name}</div>
        ${skuDisplay}
        ${orderUnitDisplay}
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; vertical-align: middle;">
        <span style="display: inline-block; background: #dbeafe; color: #1e40af; font-weight: 700; padding: 6px 14px; border-radius: 6px; font-size: 15px;">${item.quantity}</span>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${item.unit}${vpeDisplay}</div>
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle; color: #6b7280; font-size: 13px;">€${item.unit_price.toFixed(2)}</td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle; font-weight: 700; color: #1f2937; font-size: 15px;">€${item.total_price.toFixed(2)}</td>
    </tr>
  `;
  }).join('');

  const signature = generateSignature(template, data.restaurantName).replace(/\n/g, '<br>');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bestellung von ${data.restaurantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 650px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">📦 Neue Bestellung</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">${data.restaurantName}</p>
        </div>
        
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          
          <!-- Greeting & Introduction -->
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">${template.greeting}</p>
            <p style="margin: 0; font-size: 15px; color: #374151;">${template.introduction}</p>
          </div>

          <!-- Quick Summary -->
          <div style="display: flex; margin-bottom: 28px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 1px solid #bae6fd;">
            <div style="flex: 1; text-align: center; border-right: 1px solid #bae6fd;">
              <div style="font-size: 28px; font-weight: 700; color: #0369a1;">${data.items.length}</div>
              <div style="font-size: 12px; color: #0c4a6e; text-transform: uppercase; letter-spacing: 0.5px;">Positionen</div>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #0369a1;">€${data.totalAmount.toFixed(2)}</div>
              <div style="font-size: 12px; color: #0c4a6e; text-transform: uppercase; letter-spacing: 0.5px;">Gesamtsumme</div>
            </div>
          </div>

          <!-- Order Info -->
          <div style="margin-bottom: 28px; padding: 20px; background: #fafafa; border-radius: 12px;">
            <h2 style="color: #1f2937; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Bestelldetails</h2>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; width: 120px;">Besteller:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 500;">${data.restaurantName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Lieferant:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 500;">${data.supplierName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Datum:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 500;">${new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            </table>
          </div>

          <!-- Delivery Address -->
          <div style="margin-bottom: 28px; padding: 20px; background: #fafafa; border-radius: 12px;">
            <h2 style="color: #1f2937; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">📍 Lieferadresse</h2>
            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.7;">${data.deliveryAddress.replace(/\n/g, '<br>')}</p>
          </div>

          ${data.notes ? `
            <div style="margin-bottom: 28px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border: 1px solid #f59e0b;">
              <h2 style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">📝 Hinweise</h2>
              <p style="margin: 0; color: #78350f; font-size: 14px; white-space: pre-line;">${data.notes}</p>
            </div>
          ` : ''}

          ${data.confirmationToken ? `
          <!-- Confirmation Button -->
          <div style="margin-bottom: 28px; text-align: center;">
            <a href="${Deno.env.get("SUPABASE_URL")}/functions/v1/confirm-order?token=${data.confirmationToken}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 700; font-size: 18px; padding: 18px 48px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
              ✅ Bestellung bestätigen
            </a>
            <p style="margin-top: 12px; color: #6b7280; font-size: 13px;">
              Mit Klick auf den Button bestätigen Sie den Eingang dieser Bestellung.
            </p>
          </div>
          ` : ''}

          <!-- Items Table -->
          <div style="margin-bottom: 28px;">
            <h2 style="color: #1f2937; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">🛒 Bestellte Artikel</h2>
            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #1e3a5f;">
                  <th style="padding: 14px 12px; text-align: left; font-weight: 600; color: white; font-size: 13px;">Artikel</th>
                  <th style="padding: 14px 12px; text-align: center; font-weight: 600; color: white; font-size: 13px;">Menge</th>
                  <th style="padding: 14px 12px; text-align: right; font-weight: 600; color: white; font-size: 13px;">Stückpreis</th>
                  <th style="padding: 14px 12px; text-align: right; font-weight: 600; color: white; font-size: 13px;">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
              <tfoot>
                <tr style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
                  <td colspan="3" style="padding: 18px 12px; color: white; font-weight: 700; font-size: 16px;">Gesamtbetrag</td>
                  <td style="padding: 18px 12px; text-align: right; color: white; font-weight: 800; font-size: 20px;">€${data.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Closing & Signature -->
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">${template.closing}</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937;">${signature}</p>
          </div>

          ${(template.footer_text || template.show_powered_by) ? `
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            ${template.footer_logo_url ? `<img src="${template.footer_logo_url}" alt="Logo" style="max-height: 40px; margin-bottom: 12px;" />` : ''}
            ${template.footer_text ? `<p style="color: #9ca3af; font-size: 12px; margin: 0;">${template.footer_text}</p>` : ''}
            ${template.show_powered_by ? `<p style="color: #d1d5db; font-size: 10px; margin: 8px 0 0 0;">Powered by Bestellung.pro</p>` : ''}
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
};

// ============== CLASSIC DESIGN ==============
const generateClassicEmail = (data: OrderEmailRequest, template: EmailTemplate): string => {
  const itemRows = data.items.map((item) => {
    const skuDisplay = item.sku ? ` (${item.sku})` : '';
    const vpeDisplay = item.packaging_unit && item.packaging_unit > 1 ? ` (${item.packaging_unit}er)` : '';
    const orderUnitDisplay = item.order_unit ? `<div style="font-size: 11px; color: #059669; font-weight: 500;">📦 ${item.order_unit}</div>` : '';
    return `
    <tr>
      <td style="padding: 12px 8px; border: 1px solid #d1d5db; vertical-align: top;">${item.article_name}${skuDisplay}${orderUnitDisplay}</td>
      <td style="padding: 12px 8px; border: 1px solid #d1d5db; text-align: center;">${item.quantity} ${item.unit}${vpeDisplay}</td>
      <td style="padding: 12px 8px; border: 1px solid #d1d5db; text-align: right;">€${item.unit_price.toFixed(2)}</td>
      <td style="padding: 12px 8px; border: 1px solid #d1d5db; text-align: right; font-weight: 600;">€${item.total_price.toFixed(2)}</td>
    </tr>
  `;
  }).join('');

  const signature = generateSignature(template, data.restaurantName).replace(/\n/g, '<br>');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bestellung von ${data.restaurantName}</title>
      </head>
      <body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1f2937; max-width: 650px; margin: 0 auto; padding: 20px; background: #ffffff;">
        
        <!-- Header -->
        <div style="background: #1e3a5f; padding: 24px 32px; border-bottom: 4px solid #b45309;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 1px;">BESTELLUNG</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">${data.restaurantName}</p>
        </div>
        
        <div style="padding: 32px; border: 1px solid #d1d5db; border-top: none;">
          
          <!-- Greeting & Introduction -->
          <p style="margin: 0 0 8px 0; font-size: 15px;">${template.greeting}</p>
          <p style="margin: 0 0 24px 0; font-size: 15px;">${template.introduction}</p>

          <!-- Order Details -->
          <table style="width: 100%; margin-bottom: 24px; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; width: 140px; color: #6b7280;">Bestelldatum:</td>
              <td style="padding: 4px 0;">${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Lieferant:</td>
              <td style="padding: 4px 0;">${data.supplierName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Lieferadresse:</td>
              <td style="padding: 4px 0;">${data.deliveryAddress.replace(/\n/g, ', ')}</td>
            </tr>
          </table>

          ${data.notes ? `
            <div style="margin-bottom: 24px; padding: 16px; background: #fef9c3; border-left: 4px solid #eab308;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #854d0e;">Hinweise:</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #713f12; white-space: pre-line;">${data.notes}</p>
            </div>
          ` : ''}

          ${data.confirmationToken ? `
          <div style="margin-bottom: 24px; text-align: center; padding: 20px; background: #f0fdf4; border: 2px solid #16a34a;">
            <a href="${Deno.env.get("SUPABASE_URL")}/functions/v1/confirm-order?token=${data.confirmationToken}" 
               style="display: inline-block; background: #16a34a; color: white; font-weight: 600; font-size: 16px; padding: 14px 32px; text-decoration: none;">
              Bestellung bestätigen
            </a>
          </div>
          ` : ''}

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #374151;">
                <th style="padding: 12px 8px; text-align: left; color: white; font-size: 13px; border: 1px solid #374151;">Artikel</th>
                <th style="padding: 12px 8px; text-align: center; color: white; font-size: 13px; border: 1px solid #374151;">Menge</th>
                <th style="padding: 12px 8px; text-align: right; color: white; font-size: 13px; border: 1px solid #374151;">Einzelpreis</th>
                <th style="padding: 12px 8px; text-align: right; color: white; font-size: 13px; border: 1px solid #374151;">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr style="background: #f3f4f6;">
                <td colspan="3" style="padding: 14px 8px; border: 1px solid #d1d5db; font-weight: 700; font-size: 15px;">Gesamtbetrag</td>
                <td style="padding: 14px 8px; border: 1px solid #d1d5db; text-align: right; font-weight: 700; font-size: 16px;">€${data.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Closing & Signature -->
          <p style="margin: 0 0 16px 0; font-size: 15px;">${template.closing}</p>
          <p style="margin: 0; font-size: 15px;">${signature}</p>

          ${(template.footer_text || template.show_powered_by) ? `
          <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #e5e7eb;">
          <div style="text-align: center;">
            ${template.footer_logo_url ? `<img src="${template.footer_logo_url}" alt="Logo" style="max-height: 40px; margin-bottom: 12px;" />` : ''}
            ${template.footer_text ? `<p style="color: #9ca3af; font-size: 11px; margin: 0;">${template.footer_text}</p>` : ''}
            ${template.show_powered_by ? `<p style="color: #d1d5db; font-size: 10px; margin: 8px 0 0 0;">Powered by Bestellung.pro</p>` : ''}
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
};

// ============== MINIMALIST DESIGN ==============
const generateMinimalistEmail = (data: OrderEmailRequest, template: EmailTemplate): string => {
  const itemList = data.items.map((item) => {
    const skuDisplay = item.sku ? ` [${item.sku}]` : '';
    const vpeDisplay = item.packaging_unit && item.packaging_unit > 1 ? ` (${item.packaging_unit}er)` : '';
    const orderUnitDisplay = item.order_unit ? ` 📦${item.order_unit}` : '';
    return `<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${item.quantity}× ${item.article_name}${skuDisplay} (${item.unit}${vpeDisplay})${orderUnitDisplay} — €${item.total_price.toFixed(2)}</li>`;
  }).join('');

  const signature = generateSignature(template, data.restaurantName).replace(/\n/g, '<br>');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bestellung von ${data.restaurantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #374151; max-width: 550px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        
        <h1 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">Bestellung</h1>
        <p style="font-size: 13px; color: #6b7280; margin: 0 0 32px 0;">${data.restaurantName} · ${new Date().toLocaleDateString('de-DE')}</p>
        
        <p style="margin: 0 0 8px 0; font-size: 15px;">${template.greeting}</p>
        <p style="margin: 0 0 24px 0; font-size: 15px;">${template.introduction}</p>

        <div style="margin-bottom: 24px; padding: 16px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Lieferadresse</p>
          <p style="margin: 0; font-size: 14px; color: #374151;">${data.deliveryAddress.replace(/\n/g, ', ')}</p>
        </div>

        ${data.notes ? `
          <p style="margin: 0 0 24px 0; padding: 12px 16px; background: #fffbeb; font-size: 14px; color: #92400e; border-radius: 4px;">${data.notes}</p>
        ` : ''}

        ${data.confirmationToken ? `
        <div style="margin-bottom: 24px; text-align: center;">
          <a href="${Deno.env.get("SUPABASE_URL")}/functions/v1/confirm-order?token=${data.confirmationToken}" 
             style="display: inline-block; background: #111827; color: white; font-size: 14px; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Bestellung bestätigen →
          </a>
        </div>
        ` : ''}

        <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; font-size: 14px;">
          ${itemList}
        </ul>

        <div style="padding: 16px 0; border-top: 2px solid #111827;">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
            Gesamt: €${data.totalAmount.toFixed(2)}
          </p>
        </div>

        <div style="margin-top: 32px;">
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">${template.closing}</p>
          <p style="margin: 0; font-size: 15px; color: #374151;">${signature}</p>
        </div>

        ${(template.footer_text || template.show_powered_by) ? `
        <div style="margin-top: 48px; text-align: center;">
          ${template.footer_logo_url ? `<img src="${template.footer_logo_url}" alt="Logo" style="max-height: 40px; margin-bottom: 8px;" />` : ''}
          ${template.footer_text ? `<p style="font-size: 11px; color: #9ca3af; margin: 0;">${template.footer_text}</p>` : ''}
          ${template.show_powered_by ? `<p style="font-size: 10px; color: #d1d5db; margin: 4px 0 0 0;">Powered by Bestellung.pro</p>` : ''}
        </div>
        ` : ''}
      </body>
    </html>
  `;
};

// Template router
const generateEmailHtml = (data: OrderEmailRequest, template: EmailTemplate): string => {
  switch (template.design_style) {
    case 'classic':
      return generateClassicEmail(data, template);
    case 'minimalist':
      return generateMinimalistEmail(data, template);
    case 'modern':
    default:
      return generateModernEmail(data, template);
  }
};

const generatePlainText = (data: OrderEmailRequest, template: EmailTemplate): string => {
  const signature = generateSignature(template, data.restaurantName);
  
  const itemLines = data.items.map(item => {
    const skuPart = item.sku ? ` (SKU: ${item.sku})` : '';
    return `- ${item.article_name}${skuPart}: ${item.quantity} ${item.unit} x €${item.unit_price.toFixed(2)} = €${item.total_price.toFixed(2)}`;
  }).join('\n');

  return `
${template.greeting}

${template.introduction}

BESTELLDETAILS
--------------
Von: ${data.restaurantName}
An: ${data.supplierName}
Datum: ${new Date().toLocaleDateString('de-DE')}

LIEFERADRESSE
-------------
${data.deliveryAddress}

${data.notes ? `HINWEISE\n--------\n${data.notes}\n` : ''}

BESTELLTE ARTIKEL
-----------------
${itemLines}

GESAMT: €${data.totalAmount.toFixed(2)}

${template.closing}

${signature}

---
Gesendet über Bestellung.pro
  `.trim();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderEmailRequest = await req.json();
    
    console.log(`Processing order email for order ${data.orderNumber}`);
    
    // Create Supabase client to fetch organization settings and email template
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch order and organization info
    const { data: order } = await supabaseClient
      .from("orders")
      .select("organization_id")
      .eq("id", data.orderId)
      .single();

    let isTestMode = false;
    let testEmail: string | null = null;
    let originalSupplierEmail = data.supplierEmail;
    let template: EmailTemplate = defaultTemplate;

    if (order?.organization_id) {
      // Fetch organization settings
      const { data: org } = await supabaseClient
        .from("organizations")
        .select("test_mode_enabled, test_email")
        .eq("id", order.organization_id)
        .single();

      if (org?.test_mode_enabled && org?.test_email) {
        isTestMode = true;
        testEmail = org.test_email;
        console.log(`Test mode enabled - redirecting email from ${data.supplierEmail} to ${testEmail}`);
      }

      // Fetch email template
      const { data: emailTemplateData } = await supabaseClient
        .from("email_templates")
        .select("*")
        .eq("organization_id", order.organization_id)
        .eq("template_type", "order")
        .maybeSingle();

      if (emailTemplateData) {
        template = {
          subject_template: emailTemplateData.subject_template || defaultTemplate.subject_template,
          greeting: emailTemplateData.greeting || defaultTemplate.greeting,
          introduction: emailTemplateData.introduction || defaultTemplate.introduction,
          closing: emailTemplateData.closing || defaultTemplate.closing,
          signature: emailTemplateData.signature || defaultTemplate.signature,
          article_list_format: emailTemplateData.article_list_format || defaultTemplate.article_list_format,
          design_style: emailTemplateData.design_style || defaultTemplate.design_style,
          footer_text: emailTemplateData.footer_text || defaultTemplate.footer_text,
          footer_logo_url: emailTemplateData.footer_logo_url || defaultTemplate.footer_logo_url,
          show_powered_by: emailTemplateData.show_powered_by ?? defaultTemplate.show_powered_by,
        };
        console.log(`Using email template with design_style: ${template.design_style}`);
      } else {
        console.log(`No email template found, using defaults`);
      }
    }

    const recipientEmail = isTestMode && testEmail ? testEmail : data.supplierEmail;
    const subjectPrefix = isTestMode ? "[TEST] " : "";
    
    // Generate subject from template
    const subject = subjectPrefix + generateSubject(template, data);
    
    // Generate email content with template
    let emailHtml = generateEmailHtml(data, template);
    let emailText = generatePlainText(data, template);
    
    if (isTestMode) {
      const testNotice = `
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-weight: 600;">🧪 TESTMODUS</p>
          <p style="margin: 8px 0 0 0; color: #78350f; font-size: 14px;">
            Dies ist eine Test-E-Mail. Im Produktivmodus würde diese an <strong>${originalSupplierEmail}</strong> gesendet werden.
          </p>
        </div>
      `;
      // Insert test notice at the beginning of body content
      emailHtml = emailHtml.replace('<body', '<body').replace(/<body[^>]*>/, (match) => match + testNotice);
      emailText = `[TESTMODUS] Diese E-Mail würde im Produktivmodus an ${originalSupplierEmail} gesendet werden.\n\n` + emailText;
    }
    
    console.log(`Sending order email to ${recipientEmail}${isTestMode ? ' (TEST MODE)' : ''}`);

    const emailResponse = await resend.emails.send({
      from: "Bestellung.pro <bestellung@bestellung.pro>",
      to: [recipientEmail],
      subject: subject,
      html: emailHtml,
      text: emailText,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update the order to mark email as sent
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ 
        email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq("id", data.orderId);

    if (updateError) {
      console.error("Error updating order email status:", updateError);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});