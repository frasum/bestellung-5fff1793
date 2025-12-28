import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface MergeOrdersRequest {
  targetOrderId: string;
  sourceOrderIds: string[];
  combineNotes?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { targetOrderId, sourceOrderIds, combineNotes = true }: MergeOrdersRequest = await req.json();

    console.log('🔀 Merge orders request:', { targetOrderId, sourceOrderIds, combineNotes });

    // Validate input
    if (!targetOrderId || !sourceOrderIds?.length) {
      return errorResponse('Target order ID and source order IDs are required', 400);
    }

    // Fetch target order
    const { data: targetOrder, error: targetError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', targetOrderId)
      .single();

    if (targetError || !targetOrder) {
      console.error('Target order not found:', targetError);
      return errorResponse('Target order not found', 404);
    }

    // Fetch source orders
    const { data: sourceOrders, error: sourceError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('id', sourceOrderIds);

    if (sourceError || !sourceOrders?.length) {
      console.error('Source orders not found:', sourceError);
      return errorResponse('Source orders not found', 404);
    }

    // Validate all orders belong to same supplier
    const allOrders = [targetOrder, ...sourceOrders];
    const supplierId = targetOrder.supplier_id;
    const allSameSupplier = allOrders.every(o => o.supplier_id === supplierId);

    if (!allSameSupplier) {
      return errorResponse('All orders must belong to the same supplier', 400);
    }

    // Validate all orders belong to same organization
    const orgId = targetOrder.organization_id;
    const allSameOrg = allOrders.every(o => o.organization_id === orgId);

    if (!allSameOrg) {
      return errorResponse('All orders must belong to the same organization', 400);
    }

    console.log('✅ Validation passed. Moving order items...');

    // Move all order_items from source orders to target order
    let totalItemsMoved = 0;
    for (const sourceOrder of sourceOrders) {
      if (sourceOrder.order_items?.length) {
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ order_id: targetOrderId })
          .eq('order_id', sourceOrder.id);

        if (updateError) {
          console.error('Error moving order items:', updateError);
          return errorResponse('Failed to move order items', 500);
        }

        totalItemsMoved += sourceOrder.order_items.length;
        console.log(`📦 Moved ${sourceOrder.order_items.length} items from ${sourceOrder.order_number}`);
      }
    }

    // Calculate new total amount
    const sourceTotal = sourceOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const newTotalAmount = Number(targetOrder.total_amount) + sourceTotal;

    // Combine notes if requested
    let combinedNotes = targetOrder.notes || '';
    if (combineNotes) {
      const sourceNotes = sourceOrders
        .filter(o => o.notes)
        .map(o => `[${o.order_number}] ${o.notes}`)
        .join('\n');
      
      if (sourceNotes) {
        combinedNotes = combinedNotes 
          ? `${combinedNotes}\n---\n${sourceNotes}`
          : sourceNotes;
      }
    }

    // Update target order with new total and notes
    const { error: updateTargetError } = await supabase
      .from('orders')
      .update({
        total_amount: newTotalAmount,
        notes: combinedNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetOrderId);

    if (updateTargetError) {
      console.error('Error updating target order:', updateTargetError);
      return errorResponse('Failed to update target order', 500);
    }

    console.log(`💰 Updated target order total: €${newTotalAmount.toFixed(2)}`);

    // Delete confirmation tokens for source orders
    const { error: tokensError } = await supabase
      .from('order_confirmation_tokens')
      .delete()
      .in('order_id', sourceOrderIds);

    if (tokensError) {
      console.warn('Warning: Could not delete confirmation tokens:', tokensError);
    }

    // Delete communication logs for source orders
    const { error: logsError } = await supabase
      .from('communication_logs')
      .delete()
      .in('order_id', sourceOrderIds);

    if (logsError) {
      console.warn('Warning: Could not delete communication logs:', logsError);
    }

    // Delete source orders
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .in('id', sourceOrderIds);

    if (deleteError) {
      console.error('Error deleting source orders:', deleteError);
      return errorResponse('Failed to delete source orders', 500);
    }

    console.log(`🗑️ Deleted ${sourceOrders.length} source orders`);

    return jsonResponse({
      success: true,
      targetOrderId,
      mergedOrderCount: sourceOrders.length + 1,
      totalItemsMoved,
      newTotalAmount,
    });

  } catch (error) {
    console.error('Merge orders error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
