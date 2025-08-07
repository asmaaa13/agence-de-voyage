/**
 * @fileoverview Async handler utility for Express route error handling
 * @module AsyncHandler
 * @version 1.0.0
 */

/**
 * Wraps async route handlers to catch errors automatically
 * 
 * This utility eliminates the need for try-catch blocks in every async route handler.
 * It catches any errors and passes them to Express error handling middleware.
 * 
 * @function asyncHandler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function that handles errors
 * 
 * @example
 * // Without asyncHandler (manual error handling)
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * 
 * @example
 * // With asyncHandler (automatic error handling)
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 * 
 * @example
 * // Using with route parameters
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) {
 *     return res.status(404).json({ error: 'User not found' });
 *   }
 *   res.json(user);
 * }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};