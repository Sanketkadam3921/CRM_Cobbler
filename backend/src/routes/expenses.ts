import { Router } from 'express';
import { ExpenseController } from '../controllers/ExpenseController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';  

const router = Router();
router.use(authenticateToken);

/* ---------- EXPENSES ---------- */
router.get('/', ExpenseController.getAll);
router.get('/stats', ExpenseController.getStats);
router.get('/:id', ExpenseController.getById);

/* ➜ form-data creation */
router.post('/', upload.single('bill'), ExpenseController.create);   // changed

/*  update route – now handles form-data as well  */
router.put('/:id', upload.single('bill'), ExpenseController.update);
router.delete('/:id', ExpenseController.delete);

/* ---------- EMPLOYEES ---------- */
router.get('/employees/all', ExpenseController.getEmployees);
router.post('/employees', ExpenseController.createEmployee);
router.put('/employees/:id', ExpenseController.updateEmployee);
router.delete('/employees/:id', ExpenseController.deleteEmployee);

export default router;