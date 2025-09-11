import { executeQuery } from '../config/database';

export class DashboardModel {
  /* ---------------  COUNTS  --------------- */
  static async totalEnquiries(): Promise<number> {
    const [r] = await executeQuery<{ total: number }>(`SELECT COUNT(*) AS total FROM enquiries`);
    return r.total ?? 0;
  }

  static async totalCompletedDelivered(): Promise<number> {
    const [r] = await executeQuery<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM delivery_details
       WHERE status = 'delivered'`
    );
    return r.total ?? 0;
  }

  static async pendingPickups(): Promise<number> {
    const [r] = await executeQuery<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM pickup_details
       WHERE status IN ('scheduled','assigned')`
    );
    return r.total ?? 0;
  }

  static async inService(): Promise<number> {
    const [r] = await executeQuery<{ total: number }>(
      `SELECT COUNT(DISTINCT enquiry_id) AS total
       FROM service_types
       WHERE status IN ('pending','in-progress')`
    );
    return r.total ?? 0;
  }

  static async completedToday(): Promise<number> {
    const [r] = await executeQuery<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM service_details
       WHERE DATE(completed_at) = CURDATE()`
    );
    return r.total ?? 0;
  }

  static async deliveredToday(): Promise<number> {
    const [r] = await executeQuery<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM delivery_details
       WHERE DATE(delivered_at) = CURDATE()`
    );
    return r.total ?? 0;
  }

  /* ---------------  RECENT ACTIVITY  --------------- */
  static async recentActivity(): Promise<{ text: string; time: string }[]> {
    const rows = await executeQuery<any>(`
      (SELECT CONCAT('New enquiry from ', inquiry_type,' - ', LEFT(message,35)) AS text,
              created_at AS time
       FROM enquiries ORDER BY created_at DESC LIMIT 3)
      UNION ALL
      (SELECT CONCAT('Pickup scheduled for ', customer_name,' - ', quantity,' items') AS text,
              p.created_at AS time
       FROM enquiries e JOIN pickup_details p ON e.id = p.enquiry_id
       ORDER BY p.created_at DESC LIMIT 3)
      UNION ALL
      (SELECT CONCAT('Service completed for Order #', enquiry_id) AS text,
              completed_at AS time
       FROM service_details
       WHERE completed_at IS NOT NULL
       ORDER BY completed_at DESC LIMIT 3)
      ORDER BY time DESC
      LIMIT 5
    `);
    return rows.map(r => ({ text: r.text, time: r.time }));
  }

  /* ---------------  LOW STOCK ALERTS  --------------- */
  static async lowStockAlerts(): Promise<{ item: string; stock: number }[]> {
    // if you have a real stock table use it; else fallback
    const rows = await executeQuery<any>(
      `SELECT item_name AS item, units_in_stock AS stock
       FROM stock_alerts
       WHERE units_in_stock <= 5
       ORDER BY units_in_stock ASC
       LIMIT 3`
    ).catch(() => []);
    if (!rows.length) return [      // demo fallback
      { item: 'Leather polish', stock: 2 },
      { item: 'Sole adhesive', stock: 1 }
    ];
    return rows;
  }
}