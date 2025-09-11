import { Request, Response } from 'express';
import { DashboardModel } from '../models/DashboardModel';
import { logApi } from '../utils/logger';

export class DashboardController {
  /* ----  headline widgets  ---- */
  static async getCountWidgets(_req: Request, res: Response): Promise<void> {
    const start = Date.now();
    try {
      const [totalEnquiries, totalCompleted, pendingPickups, inService] = await Promise.all([
        DashboardModel.totalEnquiries(),
        DashboardModel.totalCompletedDelivered(),
        DashboardModel.pendingPickups(),
        DashboardModel.inService()
      ]);

      logApi.response('GET', '/api/dashboard/counts', 200, Date.now() - start);
      res.json({ success: true, data: { totalEnquiries, totalCompleted, pendingPickups, inService } });
    } catch (e) {
      logApi.error('GET', '/api/dashboard/counts', e);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  /* ----  full dashboard  ---- */
  static async getDashboard(_req: Request, res: Response): Promise<void> {
    const start = Date.now();
    try {
      const [
        totalEnquiries,
        totalCompleted,
        pendingPickups,
        inService,
        completedToday,
        deliveredToday,
        recentActivity,
        lowStockAlerts
      ] = await Promise.all([
        DashboardModel.totalEnquiries(),
        DashboardModel.totalCompletedDelivered(),
        DashboardModel.pendingPickups(),
        DashboardModel.inService(),
        DashboardModel.completedToday(),
        DashboardModel.deliveredToday(),
        DashboardModel.recentActivity(),
        DashboardModel.lowStockAlerts()
      ]);

      const completedDeliveredRatio = `${completedToday}/${deliveredToday}`;

      logApi.response('GET', '/api/dashboard', 200, Date.now() - start);
      res.json({
        success: true,
        data: {
          totalEnquiries,
          totalCompleted,
          pendingPickups,
          inService,
          completedDeliveredRatio,
          recentActivity,
          lowStockAlerts
        }
      });
    } catch (e) {
      logApi.error('GET', '/api/dashboard', e);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
}