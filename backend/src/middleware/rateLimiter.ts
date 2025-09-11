import rateLimit from "express-rate-limit";

// General rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    error: "Too many requests",
    message: "Please try again later",
  },
  standardHeaders: true, // return rate limit info in headers
  legacyHeaders: false,  // disable the `X-RateLimit-*` headers
});
